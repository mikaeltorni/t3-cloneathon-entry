/**
 * auth.ts
 * 
 * Authentication middleware for Firebase token verification
 * 
 * Features:
 *   - Firebase ID token verification
 *   - User information extraction
 *   - Request authentication
 *   - Error handling for invalid tokens
 * 
 * Usage: app.use('/api/chats', authenticateUser, chatRoutes)
 */
import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase-admin';

/**
 * Extended request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };
}

/**
 * Authentication middleware that verifies Firebase ID tokens
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!idToken.trim()) {
      res.status(401).json({
        error: 'Invalid token format',
        message: 'Authorization token is empty',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify the ID token
    console.log(`[Auth] Verifying token for request: ${req.method} ${req.path}`);
    const decodedToken = await verifyIdToken(idToken);

    // Extract user information
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };

    console.log(`[Auth] User authenticated: ${req.user.uid} (${req.user.email})`);
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = 'Invalid authentication token';
    let statusCode = 401;

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Authentication token has expired. Please sign in again.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid authentication token. Please sign in again.';
      } else if (error.message.includes('revoked')) {
        errorMessage = 'Authentication token has been revoked. Please sign in again.';
        statusCode = 403;
      }
    }

    res.status(statusCode).json({
      error: 'Authentication failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional authentication middleware that doesn't fail if no token is provided
 * Useful for endpoints that work for both authenticated and anonymous users
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      console.log(`[Auth] No token provided for request: ${req.method} ${req.path}`);
      next();
      return;
    }

    const idToken = authHeader.substring(7);
    
    if (!idToken.trim()) {
      next();
      return;
    }

    // Try to verify the token
    const decodedToken = await verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };

    console.log(`[Auth] Optional auth successful: ${req.user.uid} (${req.user.email})`);
    next();
  } catch (error) {
    console.warn('[Auth] Optional auth failed, continuing without user:', error);
    // Continue without user info if token verification fails
    next();
  }
}

/**
 * Middleware to check if user is authenticated
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.uid) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'This endpoint requires authentication',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
} 