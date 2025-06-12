/**
 * auth.ts
 * 
 * Authentication middleware for Firebase token verification
 * 
 * Features:
 *   - Firebase ID token verification
 *   - User information extraction
 *   - Request authentication
 *   - Enhanced security validation
 *   - User ID verification for resource access
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

    // Additional security validation
    if (!decodedToken.uid || decodedToken.uid.trim().length === 0) {
      console.error('[Auth] Token missing or invalid UID');
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token does not contain valid user identifier',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check token expiration with additional buffer
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp && decodedToken.exp < now) {
      console.error('[Auth] Token has expired');
      res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired. Please sign in again.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Extract user information
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };

    console.log(`[Auth] User authenticated: ${req.user.uid} (${req.user.email || 'no email'})`);
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
      } else if (error.message.includes('argument')) {
        errorMessage = 'Malformed authentication token. Please sign in again.';
        statusCode = 400;
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
    
    // Basic validation for optional auth
    if (decodedToken.uid && decodedToken.uid.trim().length > 0) {
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      };

      console.log(`[Auth] Optional auth successful: ${req.user.uid} (${req.user.email || 'no email'})`);
    }
    
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

/**
 * Middleware to validate that the requesting user owns the resource
 * Checks URL parameters for userId and ensures it matches authenticated user
 * 
 * @param paramName - Name of the parameter containing the user ID (default: 'userId')
 */
export function validateResourceOwnership(paramName: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.uid) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const resourceUserId = req.params[paramName];
    
    if (!resourceUserId) {
      // If no userId parameter, proceed (will be handled by controller)
      next();
      return;
    }

    if (req.user.uid !== resourceUserId) {
      console.warn(`[Auth] Access denied: User ${req.user.uid} attempted to access resource owned by ${resourceUserId}`);
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`[Auth] Resource ownership validated for user: ${req.user.uid}`);
    next();
  };
} 