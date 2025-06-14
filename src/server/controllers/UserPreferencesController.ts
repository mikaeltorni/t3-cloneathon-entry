/**
 * UserPreferencesController.ts
 * 
 * Controller for user preferences management
 * 
 * Routes:
 *   GET /api/preferences - Get user preferences
 *   PUT /api/preferences - Update user preferences
 *   POST /api/preferences/models/:modelId/pin - Toggle model pin status
 *   GET /api/preferences/models/pinned - Get pinned models
 * 
 * Features:
 *   - User-specific preferences management
 *   - Model pinning functionality
 *   - Authentication-aware operations
 *   - Error handling and validation
 */
import express, { Request, Response, NextFunction } from 'express';
import { firestoreUserPreferences, type UserPreferences } from '../firestoreUserPreferences';
import { authenticateUser } from '../middleware/auth';

/**
 * Authenticated request interface
 */
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * User preferences controller class
 */
export class UserPreferencesController {
  /**
   * Get user preferences
   * 
   * @route GET /api/preferences
   */
  getUserPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`[UserPreferencesController] Getting preferences for user: ${req.user.uid}`);
      
      const preferences = await firestoreUserPreferences.getUserPreferences(req.user.uid);
      
      // If no preferences exist, return default preferences
      if (!preferences) {
        const defaultPreferences: UserPreferences = {
          pinnedModels: [],
          theme: 'auto',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        console.log(`[UserPreferencesController] No preferences found, returning defaults for user: ${req.user.uid}`);
        res.json(defaultPreferences);
        return;
      }
      
      console.log(`[UserPreferencesController] Successfully retrieved preferences for user: ${req.user.uid}`);
      res.json(preferences);
    } catch (error) {
      console.error('[UserPreferencesController] Error getting user preferences:', error);
      next(error);
    }
  };

  /**
   * Update user preferences
   * 
   * @route PUT /api/preferences
   */
  updateUserPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { pinnedModels, theme, defaultModel } = req.body;
      
      // Validate input
      if (pinnedModels && !Array.isArray(pinnedModels)) {
        res.status(400).json({ 
          error: 'pinnedModels must be an array',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (theme && !['light', 'dark', 'auto'].includes(theme)) {
        res.status(400).json({ 
          error: 'theme must be one of: light, dark, auto',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`[UserPreferencesController] Updating preferences for user: ${req.user.uid}`);
      
      const updatedPreferences = await firestoreUserPreferences.updateUserPreferences(req.user.uid, {
        pinnedModels,
        theme,
        defaultModel,
      });
      
      console.log(`[UserPreferencesController] Successfully updated preferences for user: ${req.user.uid}`);
      res.json(updatedPreferences);
    } catch (error) {
      console.error('[UserPreferencesController] Error updating user preferences:', error);
      next(error);
    }
  };

  /**
   * Toggle model pin status
   * 
   * @route POST /api/preferences/models/:modelId/pin
   */
  toggleModelPin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { modelId } = req.params;
      
      if (!modelId?.trim()) {
        res.status(400).json({ 
          error: 'Model ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`[UserPreferencesController] Toggling pin for model ${modelId} for user: ${req.user.uid}`);
      
      const updatedPreferences = await firestoreUserPreferences.toggleModelPin(req.user.uid, modelId);
      
      const isPinned = updatedPreferences.pinnedModels.includes(modelId);
      console.log(`[UserPreferencesController] Successfully ${isPinned ? 'pinned' : 'unpinned'} model: ${modelId}`);
      
      res.json({
        success: true,
        modelId,
        isPinned,
        preferences: updatedPreferences,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[UserPreferencesController] Error toggling model pin:', error);
      next(error);
    }
  };

  /**
   * Get pinned models
   * 
   * @route GET /api/preferences/models/pinned
   */
  getPinnedModels = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`[UserPreferencesController] Getting pinned models for user: ${req.user.uid}`);
      
      const pinnedModels = await firestoreUserPreferences.getPinnedModels(req.user.uid);
      
      console.log(`[UserPreferencesController] Successfully retrieved ${pinnedModels.length} pinned models for user: ${req.user.uid}`);
      res.json({
        pinnedModels,
        count: pinnedModels.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[UserPreferencesController] Error getting pinned models:', error);
      next(error);
    }
  };

  /**
   * Get Express router with all routes
   */
  getRoutes() {
    const router = express.Router();

    // Apply authentication middleware to all routes
    router.use(authenticateUser);

    // Define routes
    router.get('/', this.getUserPreferences);
    router.put('/', this.updateUserPreferences);
    router.post('/models/:modelId/pin', this.toggleModelPin);
    router.get('/models/pinned', this.getPinnedModels);

    console.log('[UserPreferencesController] Defining routes...');
    return router;
  }
}

/**
 * Create and configure user preferences controller
 */
export function createUserPreferencesController() {
  return new UserPreferencesController();
}

/**
 * Singleton instance of the user preferences controller
 */
export const userPreferencesController = new UserPreferencesController();

console.log('[UserPreferencesController] User preferences controller initialized'); 