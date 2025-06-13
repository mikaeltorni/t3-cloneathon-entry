/**
 * rateLimit.ts
 * 
 * Simple Firebase rate limiting for all API requests
 */
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
const { FirebaseFunctionsRateLimiter } = require('firebase-functions-rate-limiter');
import { AuthenticatedRequest } from './auth';

/**
 * Single rate limiter for all requests
 */
const rateLimiter = FirebaseFunctionsRateLimiter.withFirestoreBackend(
  {
    name: 'rateLimits',
    periodSeconds: 1 * 60, // 1 minute
    maxCalls: 2, // 2 requests per 1 minute
  },
  admin.firestore()
);

/**
 * Generate rate limit key for user or IP
 */
function getRateLimitKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Use user ID if authenticated, otherwise use IP
  return authReq.user?.uid ? `user_${authReq.user.uid}` : `ip_${ip}`;
}

/**
 * Simple rate limiting middleware for all requests
 */
export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = getRateLimitKey(req);
  
  try {
    console.log(`[RateLimit] Checking ${key} for ${req.method} ${req.path}`);
    const isQuotaExceeded = await rateLimiter.isQuotaExceededOrRecordUsage(key);
    
    if (isQuotaExceeded) {
      console.warn(`[RateLimit] 🚫 BLOCKED: ${key} for ${req.method} ${req.path}`);
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait before trying again.',
        retryAfter: 60, // 1 minute
      });
    } else {
      console.log(`[RateLimit] ✅ ALLOWED: ${key} for ${req.method} ${req.path}`);
      // Rate limit passed, continue
      next();
    }
  } catch (error) {
    console.error(`[RateLimit] Error checking rate limit for ${key}:`, error);
    // Continue on error to avoid blocking legitimate requests
    next();
  }
} 