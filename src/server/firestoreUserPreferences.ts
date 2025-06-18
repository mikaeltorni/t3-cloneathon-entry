/**
 * firestoreUserPreferences.ts
 * 
 * Firestore-based user preferences service for persistent user settings
 * 
 * Features:
 *   - User-specific preferences storage
 *   - Model pinning functionality
 *   - Last selected model persistence
 *   - Real-time data synchronization
 *   - Authentication-aware storage
 * 
 * Collection Structure:
 *   users/{userId}/preferences/settings - User preferences document
 * 
 * Usage: import { firestoreUserPreferences } from './firestoreUserPreferences'
 */
import { db } from './config/firebase-admin';

/**
 * User preferences interface
 */
export interface UserPreferences {
  pinnedModels: string[]; // Array of pinned model IDs
  lastSelectedModel?: string; // Last model selected by user (for new chats)
  theme?: 'light' | 'dark' | 'auto';
  defaultModel?: string;
  apps?: Array<{
    id: string;
    name: string;
    systemPrompt: string;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean;
  }>; // User-created apps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore user preferences error class
 */
class FirestoreUserPreferencesError extends Error {
  constructor(message: string, public operation: string, public originalError?: any) {
    super(message);
    this.name = 'FirestoreUserPreferencesError';
  }
}

/**
 * User preferences storage service interface
 */
interface UserPreferencesService {
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  toggleModelPin(userId: string, modelId: string): Promise<UserPreferences>;
  getPinnedModels(userId: string): Promise<string[]>;
  // App management methods
  createApp(userId: string, name: string, systemPrompt: string): Promise<UserPreferences>;
  updateApp(userId: string, appId: string, updates: { name?: string; systemPrompt?: string }): Promise<UserPreferences>;
  deleteApp(userId: string, appId: string): Promise<UserPreferences>;
  getUserApps(userId: string): Promise<Array<{ id: string; name: string; systemPrompt: string; createdAt: Date; updatedAt: Date; isActive?: boolean }>>;
}

/**
 * Firestore-based user preferences service implementation
 */
class FirestoreUserPreferencesService implements UserPreferencesService {
  private readonly COLLECTION_NAME = 'users';
  private readonly PREFERENCES_DOC = 'preferences';

  /**
   * Get user preferences collection reference
   */
  private getUserPreferencesRef(userId: string) {
    return db.collection(this.COLLECTION_NAME).doc(userId).collection('settings').doc(this.PREFERENCES_DOC);
  }

  /**
   * Convert Firestore document to UserPreferences
   */
  private documentToUserPreferences(doc: FirebaseFirestore.DocumentSnapshot): UserPreferences | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    return {
      pinnedModels: data.pinnedModels || [],
      lastSelectedModel: data.lastSelectedModel || undefined,
      theme: data.theme || 'auto',
      defaultModel: data.defaultModel || undefined,
      apps: data.apps ? data.apps.map((app: any) => ({
        ...app,
        createdAt: app.createdAt?.toDate() || new Date(),
        updatedAt: app.updatedAt?.toDate() || new Date(),
      })) : [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Get user preferences
   * 
   * @param userId - User ID
   * @returns User preferences or null if not found
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      console.log(`[UserPreferences] Getting preferences for user: ${userId}`);

      const doc = await this.getUserPreferencesRef(userId).get();
      const preferences = this.documentToUserPreferences(doc);

      if (preferences) {
        console.log(`[UserPreferences] Found preferences for user: ${userId} (${preferences.pinnedModels.length} pinned models)`);
      } else {
        console.log(`[UserPreferences] No preferences found for user: ${userId}`);
      }

      return preferences;
    } catch (error) {
      console.error(`[UserPreferences] Error getting preferences for user ${userId}:`, error);
      throw new FirestoreUserPreferencesError(
        `Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getUserPreferences',
        error
      );
    }
  }

  /**
   * Update user preferences
   * 
   * @param userId - User ID
   * @param preferences - Partial preferences to update
   * @returns Updated preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      console.log(`[UserPreferences] Updating preferences for user: ${userId}`);

      const preferencesRef = this.getUserPreferencesRef(userId);
      const now = new Date();

      // Get existing preferences or create new ones
      const existingDoc = await preferencesRef.get();
      const existingPreferences = this.documentToUserPreferences(existingDoc);

      const updatedPreferences: UserPreferences = {
        pinnedModels: preferences.pinnedModels ?? existingPreferences?.pinnedModels ?? [],
              lastSelectedModel: preferences.lastSelectedModel ?? existingPreferences?.lastSelectedModel,
      theme: preferences.theme ?? existingPreferences?.theme ?? 'auto',
      defaultModel: preferences.defaultModel ?? existingPreferences?.defaultModel,
      apps: preferences.apps ?? existingPreferences?.apps ?? [],
      createdAt: existingPreferences?.createdAt ?? now,
      updatedAt: now,
      };

      await preferencesRef.set({
        ...updatedPreferences,
        createdAt: updatedPreferences.createdAt,
        updatedAt: updatedPreferences.updatedAt,
      });

      console.log(`[UserPreferences] Successfully updated preferences for user: ${userId}`);
      return updatedPreferences;
    } catch (error) {
      console.error(`[UserPreferences] Error updating preferences for user ${userId}:`, error);
      throw new FirestoreUserPreferencesError(
        `Failed to update user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateUserPreferences',
        error
      );
    }
  }

  /**
   * Toggle model pin status
   * 
   * @param userId - User ID
   * @param modelId - Model ID to toggle
   * @returns Updated preferences
   */
  async toggleModelPin(userId: string, modelId: string): Promise<UserPreferences> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!modelId?.trim()) {
        throw new Error('Model ID is required');
      }

      console.log(`[UserPreferences] Toggling pin for model ${modelId} for user: ${userId}`);

      // Get current preferences
      const currentPreferences = await this.getUserPreferences(userId);
      const currentPinnedModels = currentPreferences?.pinnedModels || [];

      // Toggle the model pin status
      const isPinned = currentPinnedModels.includes(modelId);
      let updatedPinnedModels: string[];

      if (isPinned) {
        // Remove from pinned models
        updatedPinnedModels = currentPinnedModels.filter(id => id !== modelId);
        console.log(`[UserPreferences] Unpinning model: ${modelId}`);
      } else {
        // Add to pinned models (at the beginning for most recent)
        updatedPinnedModels = [modelId, ...currentPinnedModels];
        console.log(`[UserPreferences] Pinning model: ${modelId}`);
      }

      // Update preferences
      const updatedPreferences = await this.updateUserPreferences(userId, {
        pinnedModels: updatedPinnedModels,
      });

      console.log(`[UserPreferences] Successfully ${isPinned ? 'unpinned' : 'pinned'} model: ${modelId}`);
      return updatedPreferences;
    } catch (error) {
      console.error(`[UserPreferences] Error toggling model pin for ${modelId}:`, error);
      throw new FirestoreUserPreferencesError(
        `Failed to toggle model pin: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'toggleModelPin',
        error
      );
    }
  }

  /**
   * Get pinned models for a user
   * 
   * @param userId - User ID
   * @returns Array of pinned model IDs
   */
  async getPinnedModels(userId: string): Promise<string[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences?.pinnedModels || [];
    } catch (error) {
      console.error(`[UserPreferences] Error getting pinned models for user ${userId}:`, error);
      return []; // Return empty array on error to not break the UI
    }
  }

  /**
   * Create a new app for a user
   * 
   * @param userId - User ID
   * @param name - App name
   * @param systemPrompt - App system prompt
   * @returns Updated preferences with new app
   */
  async createApp(userId: string, name: string, systemPrompt: string): Promise<UserPreferences> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!name?.trim()) {
        throw new Error('App name is required');
      }

      if (!systemPrompt?.trim()) {
        throw new Error('App system prompt is required');
      }

      console.log(`[UserPreferences] Creating new app for user: ${userId}, name: ${name}`);

      // Get current preferences
      const currentPreferences = await this.getUserPreferences(userId);
      const currentApps = currentPreferences?.apps || [];

      // Create new app
      const now = new Date();
      const newApp = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        systemPrompt: systemPrompt.trim(),
        createdAt: now,
        updatedAt: now,
        isActive: false
      };

      // Update preferences with new app
      const updatedPreferences = await this.updateUserPreferences(userId, {
        apps: [...currentApps, newApp]
      });

      console.log(`[UserPreferences] Successfully created app: ${newApp.id} for user: ${userId}`);
      return updatedPreferences;
    } catch (error) {
      console.error(`[UserPreferences] Error creating app for user ${userId}:`, error);
      throw new FirestoreUserPreferencesError(
        `Failed to create app: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'createApp',
        error
      );
    }
  }

  /**
   * Update an existing app
   * 
   * @param userId - User ID
   * @param appId - App ID to update
   * @param updates - Updates to apply
   * @returns Updated preferences
   */
  async updateApp(userId: string, appId: string, updates: { name?: string; systemPrompt?: string }): Promise<UserPreferences> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!appId?.trim()) {
        throw new Error('App ID is required');
      }

      console.log(`[UserPreferences] Updating app ${appId} for user: ${userId}`);

      // Get current preferences
      const currentPreferences = await this.getUserPreferences(userId);
      const currentApps = currentPreferences?.apps || [];

      // Find and update the app
      const appIndex = currentApps.findIndex(app => app.id === appId);
      if (appIndex === -1) {
        throw new Error(`App with ID ${appId} not found`);
      }

      const updatedApps = [...currentApps];
      updatedApps[appIndex] = {
        ...updatedApps[appIndex],
        ...updates,
        updatedAt: new Date()
      };

      // Update preferences
      const updatedPreferences = await this.updateUserPreferences(userId, {
        apps: updatedApps
      });

      console.log(`[UserPreferences] Successfully updated app: ${appId} for user: ${userId}`);
      return updatedPreferences;
    } catch (error) {
      console.error(`[UserPreferences] Error updating app ${appId} for user ${userId}:`, error);
      throw new FirestoreUserPreferencesError(
        `Failed to update app: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateApp',
        error
      );
    }
  }

  /**
   * Delete an app
   * 
   * @param userId - User ID
   * @param appId - App ID to delete
   * @returns Updated preferences
   */
  async deleteApp(userId: string, appId: string): Promise<UserPreferences> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!appId?.trim()) {
        throw new Error('App ID is required');
      }

      console.log(`[UserPreferences] Deleting app ${appId} for user: ${userId}`);

      // Get current preferences
      const currentPreferences = await this.getUserPreferences(userId);
      const currentApps = currentPreferences?.apps || [];

      // Filter out the app to delete
      const updatedApps = currentApps.filter(app => app.id !== appId);

      if (updatedApps.length === currentApps.length) {
        throw new Error(`App with ID ${appId} not found`);
      }

      // Update preferences
      const updatedPreferences = await this.updateUserPreferences(userId, {
        apps: updatedApps
      });

      console.log(`[UserPreferences] Successfully deleted app: ${appId} for user: ${userId}`);
      return updatedPreferences;
    } catch (error) {
      console.error(`[UserPreferences] Error deleting app ${appId} for user ${userId}:`, error);
      throw new FirestoreUserPreferencesError(
        `Failed to delete app: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deleteApp',
        error
      );
    }
  }

  /**
   * Get all apps for a user
   * 
   * @param userId - User ID
   * @returns Array of user apps
   */
  async getUserApps(userId: string): Promise<Array<{ id: string; name: string; systemPrompt: string; createdAt: Date; updatedAt: Date; isActive?: boolean }>> {
    try {
      console.log(`[UserPreferences] Getting apps for user: ${userId}`);
      const preferences = await this.getUserPreferences(userId);
      const apps = preferences?.apps || [];
      console.log(`[UserPreferences] Found ${apps.length} apps for user ${userId}:`, apps);
      return apps;
    } catch (error) {
      console.error(`[UserPreferences] Error getting apps for user ${userId}:`, error);
      return []; // Return empty array on error to not break the UI
    }
  }
}

/**
 * Singleton instance of the Firestore user preferences service
 */
export const firestoreUserPreferences = new FirestoreUserPreferencesService();

console.log('[UserPreferences] Firestore user preferences service initialized'); 