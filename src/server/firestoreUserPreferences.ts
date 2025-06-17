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
}

/**
 * Singleton instance of the Firestore user preferences service
 */
export const firestoreUserPreferences = new FirestoreUserPreferencesService();

console.log('[UserPreferences] Firestore user preferences service initialized'); 