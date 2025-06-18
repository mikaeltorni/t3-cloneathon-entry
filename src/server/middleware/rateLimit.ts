/**
 * rateLimit.ts
 * 
 * Enhanced Firebase rate limiting with per-account tracking and database persistence
 */
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
const { FirebaseFunctionsRateLimiter } = require('firebase-functions-rate-limiter');
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

/**
 * Default rate limit configuration for all users
 */
const DEFAULT_RATE_LIMITS = {
  perMinute: Number(process.env.RATE_LIMIT_PER_MINUTE) || 120,
};

/**
 * Rate limiter for minute-based tracking
 */
const rateLimiter = FirebaseFunctionsRateLimiter.withFirestoreBackend(
  {
    name: 'rateLimits_minute',
    periodSeconds: 60,
    maxCalls: Number(process.env.RATE_LIMIT_PER_MINUTE) || 120, // Updated to match DEFAULT_RATE_LIMITS
  },
  admin.firestore()
);

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

    return {
      userId,
      maxCallsPerMinute: userData?.customRateLimit?.perMinute || DEFAULT_RATE_LIMITS.perMinute,
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
    const userLimiter = FirebaseFunctionsRateLimiter.withFirestoreBackend(
      {
        name: `rateLimits_minute_${userId}`,
        periodSeconds: 60,
        maxCalls: userConfig.maxCallsPerMinute,
      },
      admin.firestore()
    );
    
    const key = `${userId}_minute`;
    const isExceeded = await userLimiter.isQuotaExceededOrRecordUsage(key);
    const remaining = Math.max(0, userConfig.maxCallsPerMinute - (await getUserRequestCount(userId)));
    
    if (isExceeded) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for minute window (${userConfig.maxCallsPerMinute} requests)`,
        remainingRequests: remaining
      };
    }

    return {
      allowed: true,
      remainingRequests: remaining
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
    const stats: RateLimitStats = {
      userId,
      requestsInLastMinute: userConfig.maxCallsPerMinute - result.remainingRequests,
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
    
    console.log(`[RateLimit] ✅ ALLOWED: ${key} - Remaining: ${result.remainingRequests}`);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Remaining-Minute': result.remainingRequests.toString(),
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