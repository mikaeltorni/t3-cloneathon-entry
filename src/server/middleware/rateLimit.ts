/**
 * rateLimit.ts
 * 
 * Enhanced rate limiting with per-account tracking and database persistence
 * Now using express-rate-limit and custom Firestore implementation for security
 */
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import expressRateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from './auth';

interface UserRateLimitConfig {
  userId: string;
  maxCallsPerMinute: number;
  resetTimestamp?: number;
}

interface RateLimitStats {
  userId: string;
  requestsInLastMinute: number;
  lastRequestTimestamp: number;
  isBlocked: boolean;
  blockReason?: string;
}

interface RateLimitRecord {
  calls: number;
  windowStart: number;
  userId?: string;
  ip?: string;
}

/**
 * Default rate limit configuration for all users
 */
const DEFAULT_RATE_LIMITS = {
  perMinute: Number(process.env.RATE_LIMIT_PER_MINUTE) || 120,
};

/**
 * Custom Firestore-based rate limiter
 */
class FirestoreRateLimiter {
  private collection: string;
  private windowMs: number;
  private maxRequests: number;

  constructor(config: {
    collection: string;
    windowMs: number;
    maxRequests: number;
  }) {
    this.collection = config.collection;
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
  }

  async checkRateLimit(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    try {
      const db = admin.firestore();
      const docRef = db.collection(this.collection).doc(key);
      const now = Date.now();
      const windowStart = Math.floor(now / this.windowMs) * this.windowMs;

      const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const data = doc.data() as RateLimitRecord | undefined;

        // Check if we're in a new window or no data exists
        if (!data || !data.windowStart || data.windowStart < windowStart) {
          // Reset the counter for new window
          const newData: RateLimitRecord = {
            calls: 1,
            windowStart,
          };
          transaction.set(docRef, newData);
          return {
            allowed: true,
            remaining: Math.max(0, this.maxRequests - 1),
            resetTime: windowStart + this.windowMs,
          };
        }

        // Same window, increment counter
        const currentCalls = (typeof data.calls === 'number' && !isNaN(data.calls)) ? data.calls : 0;
        const newCalls = currentCalls + 1;
        
        if (newCalls > this.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: windowStart + this.windowMs,
          };
        }

        transaction.update(docRef, { calls: newCalls });
        return {
          allowed: true,
          remaining: Math.max(0, this.maxRequests - newCalls),
          resetTime: windowStart + this.windowMs,
        };
      });

      return result;
    } catch (error) {
      console.error(`[RateLimit] Error checking rate limit for ${key}:`, error);
      // Allow on error to prevent blocking legitimate requests
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs,
      };
    }
  }
}

/**
 * Rate limiter for minute-based tracking
 */
const rateLimiter = new FirestoreRateLimiter({
  collection: 'rateLimits_minute',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: DEFAULT_RATE_LIMITS.perMinute,
});

/**
 * Get user's rate limit configuration from database
 */
async function getUserRateLimitConfig(userId: string): Promise<UserRateLimitConfig> {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    const userData = userDoc.data();

    const maxCalls = userData?.customRateLimit?.perMinute || DEFAULT_RATE_LIMITS.perMinute;
    return {
      userId,
      maxCallsPerMinute: typeof maxCalls === 'number' && !isNaN(maxCalls) && maxCalls > 0 ? maxCalls : DEFAULT_RATE_LIMITS.perMinute,
      resetTimestamp: userData?.rateLimitResetTimestamp
    };
  } catch (error) {
    console.error(`[RateLimit] Error fetching user config for ${userId}:`, error);
    // Default to standard limits on error
    return {
      userId,
      maxCallsPerMinute: DEFAULT_RATE_LIMITS.perMinute,
    };
  }
}

/**
 * Generate rate limit key for user or IP
 */
function getRateLimitKey(req: Request): { key: string; isAuthenticated: boolean; userId?: string } {
  const authReq = req as AuthenticatedRequest;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (authReq.user?.uid) {
    return {
      key: `user_${authReq.user.uid}`,
      isAuthenticated: true,
      userId: authReq.user.uid
    };
  } else {
    return {
      key: `ip_${ip}`,
      isAuthenticated: false
    };
  }
}

/**
 * Save rate limit statistics to database
 */
async function saveRateLimitStats(stats: RateLimitStats): Promise<void> {
  try {
    await admin.firestore()
      .collection('rateLimitStats')
      .doc(stats.userId)
      .set({
        ...stats,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  } catch (error) {
    console.error(`[RateLimit] Error saving stats for ${stats.userId}:`, error);
  }
}

/**
 * Check rate limits for authenticated users
 */
async function checkUserRateLimit(userId: string, userConfig: UserRateLimitConfig): Promise<{
  allowed: boolean;
  reason?: string;
  remainingRequests: number;
}> {
  try {
    // Create a custom limiter with user-specific limits
    const userLimiter = new FirestoreRateLimiter({
      collection: `rateLimits_minute_${userId}`,
      windowMs: 60 * 1000,
      maxRequests: userConfig.maxCallsPerMinute,
    });
    
    const key = `${userId}_minute`;
    const result = await userLimiter.checkRateLimit(key);
    
    console.log(`[RateLimit] Rate limit check for ${userId}: maxRequests=${userConfig.maxCallsPerMinute}, remaining=${result.remaining}, allowed=${result.allowed}`);
    
    if (!result.allowed) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for minute window (${userConfig.maxCallsPerMinute} requests)`,
        remainingRequests: result.remaining
      };
    }

    return {
      allowed: true,
      remainingRequests: result.remaining
    };
  } catch (error) {
    console.error(`[RateLimit] Error checking minute limit for ${userId}:`, error);
    return {
      allowed: true,
      remainingRequests: userConfig.maxCallsPerMinute
    };
  }
}

/**
 * Get current request count for user
 */
async function getUserRequestCount(userId: string): Promise<number> {
  try {
    const doc = await admin.firestore()
      .collection(`rateLimits_minute_${userId}`)
      .doc(`${userId}_minute`)
      .get();
    
    return doc.data()?.calls || 0;
  } catch (error) {
    console.error(`[RateLimit] Error getting request count for ${userId}:`, error);
    return 0;
  }
}

/**
 * Enhanced rate limiting middleware with per-account database persistence
 */
export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const { key, isAuthenticated, userId } = getRateLimitKey(req);
  const startTime = Date.now();
  
  // Skip rate limiting for critical authentication and config endpoints
  const skipRateLimitPaths = [
    '/api/config/firebase',
    '/api/health',
    '/api/rate-limit-status',
    '/api/preferences/rate-limit-status',
    '/api/', // Root API info endpoint
    '/api/auth',
    '/api/login',
    '/api/logout',
    '/api/user'
  ];
  
  // Check if this path should skip rate limiting
  const shouldSkip = skipRateLimitPaths.some(path => {
    return req.path === path || (path.endsWith('/') ? req.path.startsWith(path) : req.path.startsWith(path + '/'));
  });
  
  if (shouldSkip) {
    console.log(`[RateLimit] ⏭️ SKIPPING: ${req.path} (critical endpoint)`);
    next();
    return;
  }
  
  // Only apply rate limiting to authenticated users - no IP-based limiting
  if (!isAuthenticated || !userId) {
    console.log(`[RateLimit] ⏭️ SKIPPING: ${key} (unauthenticated - no rate limiting for anonymous users)`);
    next();
    return;
  }
  
  try {
    console.log(`[RateLimit] Checking ${key} for ${req.method} ${req.path}`);

    // Enhanced per-account rate limiting for authenticated users only
    const userConfig = await getUserRateLimitConfig(userId);
    const result = await checkUserRateLimit(userId, userConfig);
    
    // Save statistics
    const requestsUsed = Math.max(0, userConfig.maxCallsPerMinute - (result.remainingRequests || 0));
    const stats: RateLimitStats = {
      userId,
      requestsInLastMinute: requestsUsed,
      lastRequestTimestamp: Date.now(),
      isBlocked: !result.allowed,
      blockReason: result.reason
    };
    
    await saveRateLimitStats(stats);
    
    if (!result.allowed) {
      console.warn(`[RateLimit] 🚫 BLOCKED: ${key} - ${result.reason}`);
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: result.reason || 'Too many requests. Please wait before trying again.',
        remainingRequests: result.remainingRequests,
        retryAfter: 60,
        resetTime: userConfig.resetTimestamp,
        // Don't force logout - let client handle gracefully
        type: 'rate_limit',
        preserveAuth: true
      });
      return;
    }
    
    // Add rate limit headers
    const remainingRequests = typeof result.remainingRequests === 'number' && !isNaN(result.remainingRequests) 
      ? result.remainingRequests 
      : userConfig.maxCallsPerMinute;
      
    console.log(`[RateLimit] ✅ ALLOWED: ${key} - Remaining: ${remainingRequests}`);
      
    res.set({
      'X-RateLimit-Remaining-Minute': remainingRequests.toString(),
      'X-RateLimit-Limit-Minute': userConfig.maxCallsPerMinute.toString()
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`[RateLimit] Processing completed in ${processingTime}ms`);
    
    next();
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[RateLimit] Error checking rate limit for ${key} (${processingTime}ms):`, error);
    // Continue on error to avoid blocking legitimate requests
    next();
  }
}

/**
 * Admin function to reset user's rate limit
 */
export async function resetUserRateLimit(userId: string): Promise<void> {
  try {
    const batch = admin.firestore().batch();
    
    // Clear rate limit collection
    const docRef = admin.firestore()
      .collection(`rateLimits_minute_${userId}`)
      .doc(`${userId}_minute`);
    batch.delete(docRef);
    
    // Update user document with reset timestamp
    const userRef = admin.firestore().collection('users').doc(userId);
    batch.update(userRef, {
      rateLimitResetTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await batch.commit();
    console.log(`[RateLimit] Successfully reset rate limits for user ${userId}`);
  } catch (error) {
    console.error(`[RateLimit] Error resetting rate limits for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user's current rate limit status
 */
export async function getUserRateLimitStatus(userId: string): Promise<RateLimitStats | null> {
  try {
    const doc = await admin.firestore()
      .collection('rateLimitStats')
      .doc(userId)
      .get();
    
    return doc.exists ? doc.data() as RateLimitStats : null;
  } catch (error) {
    console.error(`[RateLimit] Error fetching rate limit status for ${userId}:`, error);
    return null;
  }
} 