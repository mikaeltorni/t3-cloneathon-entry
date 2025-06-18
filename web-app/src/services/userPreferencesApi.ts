/**
 * userPreferencesApi.ts
 * 
 * API service for user preferences management
 * 
 * Features:
 *   - User preferences CRUD operations
 *   - Model pinning functionality
 *   - Last selected model persistence
 *   - Tag management with Firebase Firestore
 *   - Authentication-aware requests
 *   - Error handling and logging
 * 
 * Usage: import { userPreferencesApi } from '../services/userPreferencesApi'
 */
import { logger } from '../utils/logger';
import type { ChatTag } from '../../../src/shared/types';

/**
 * App interface
 */
export interface App {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  pinnedModels: string[];
  lastSelectedModel?: string; // Last model selected by user (for new chats)
  theme?: 'light' | 'dark' | 'auto';
  defaultModel?: string;
  apps?: App[]; // User-created apps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API error class
 */
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * User preferences API service class
 */
class UserPreferencesApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Get Firebase Firestore instance
   */
  private async getFirestore() {
    const { getFirestore } = await import('../config/firebase');
    return await getFirestore();
  }

  /**
   * Get current user
   */
  private async getCurrentUser() {
    const { getAuth } = await import('../config/firebase');
    const auth = await getAuth();
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    return auth.currentUser;
  }

  /**
   * Get authentication token from Firebase
   */
  private async getAuthToken(): Promise<string> {
    const user = await this.getCurrentUser();
    return await user.getIdToken();
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      
      // Convert date strings back to Date objects
      if (data.createdAt) data.createdAt = new Date(data.createdAt);
      if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
      if (data.preferences?.createdAt) data.preferences.createdAt = new Date(data.preferences.createdAt);
      if (data.preferences?.updatedAt) data.preferences.updatedAt = new Date(data.preferences.updatedAt);
      
      // Convert app dates
      if (data.apps) {
        data.apps = data.apps.map((app: any) => ({
          ...app,
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt)
        }));
      }
      
      if (data.app) {
        data.app = {
          ...data.app,
          createdAt: new Date(data.app.createdAt),
          updatedAt: new Date(data.app.updatedAt)
        };
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('API request failed', error as Error);
      throw new Error('Network request failed. Please check your connection.');
    }
  }

  /**
   * Get user preferences
   * 
   * @returns User preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      logger.info('Getting user preferences');
      const preferences = await this.makeRequest<UserPreferences>('/preferences');
      logger.info('Successfully retrieved user preferences');
      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', error as Error);
      throw new Error('Failed to load user preferences. Please try again.');
    }
  }

  /**
   * Update user preferences
   * 
   * @param preferences - Partial preferences to update
   * @returns Updated preferences
   */
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      logger.info('Updating user preferences');
      const updatedPreferences = await this.makeRequest<UserPreferences>('/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      logger.info('Successfully updated user preferences');
      return updatedPreferences;
    } catch (error) {
      logger.error('Failed to update user preferences', error as Error);
      throw new Error('Failed to update preferences. Please try again.');
    }
  }

  /**
   * Toggle model pin status
   * 
   * @param modelId - Model ID to toggle
   * @returns Updated pin status and preferences
   */
  async toggleModelPin(modelId: string): Promise<{
    success: boolean;
    modelId: string;
    isPinned: boolean;
    preferences: UserPreferences;
  }> {
    if (!modelId.trim()) {
      throw new Error('Model ID is required');
    }

    try {
      logger.info(`Toggling pin for model: ${modelId}`);
      const result = await this.makeRequest<{
        success: boolean;
        modelId: string;
        isPinned: boolean;
        preferences: UserPreferences;
      }>(`/preferences/models/${encodeURIComponent(modelId)}/pin`, {
        method: 'POST',
      });
      
      logger.info(`Successfully ${result.isPinned ? 'pinned' : 'unpinned'} model: ${modelId}`);
      return result;
    } catch (error) {
      logger.error(`Failed to toggle model pin: ${modelId}`, error as Error);
      
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('Model not found');
      }
      
      throw new Error('Failed to update model pin status. Please try again.');
    }
  }

  /**
   * Get pinned models
   * 
   * @returns Array of pinned model IDs
   */
  async getPinnedModels(): Promise<string[]> {
    try {
      logger.info('Getting pinned models');
      const result = await this.makeRequest<{
        pinnedModels: string[];
        count: number;
      }>('/preferences/models/pinned');
      
      logger.info(`Successfully retrieved ${result.count} pinned models`);
      return result.pinnedModels;
    } catch (error) {
      logger.error('Failed to get pinned models', error as Error);
      // Return empty array on error to not break the UI
      return [];
    }
  }

  // ===== App Management Methods =====

  /**
   * Get user apps
   * 
   * @returns Array of user apps
   */
  async getUserApps(): Promise<App[]> {
    try {
      logger.info('Getting user apps');
      
      // Debug: Check authentication state
      const user = await this.getCurrentUser();
      logger.debug(`Making request to /preferences/apps for user: ${user.uid}`);
      
      const result = await this.makeRequest<{
        apps: App[];
        count: number;
      }>('/preferences/apps');
      
      logger.info(`Successfully retrieved ${result.count} apps:`, result.apps);
      return result.apps;
    } catch (error) {
      logger.error('Failed to get user apps', error as Error);
      // Return empty array on error to not break the UI
      return [];
    }
  }

  /**
   * Create a new app
   * 
   * @param name - App name
   * @param systemPrompt - App system prompt
   * @returns Created app
   */
  async createApp(name: string, systemPrompt: string): Promise<App> {
    if (!name.trim()) {
      throw new Error('App name is required');
    }

    if (!systemPrompt.trim()) {
      throw new Error('App system prompt is required');
    }

    try {
      logger.info(`Creating new app: ${name}`);
      const result = await this.makeRequest<{
        success: boolean;
        app: App;
      }>('/preferences/apps', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          systemPrompt: systemPrompt.trim()
        }),
      });
      
      logger.info(`Successfully created app: ${result.app.id}`);
      return result.app;
    } catch (error) {
      logger.error(`Failed to create app: ${name}`, error as Error);
      throw new Error('Failed to create app. Please try again.');
    }
  }

  /**
   * Update an existing app
   * 
   * @param appId - App ID to update
   * @param updates - Updates to apply
   * @returns Updated app
   */
  async updateApp(appId: string, updates: { name?: string; systemPrompt?: string }): Promise<App> {
    if (!appId.trim()) {
      throw new Error('App ID is required');
    }

    if (!updates.name?.trim() && !updates.systemPrompt?.trim()) {
      throw new Error('At least one field (name or systemPrompt) is required for update');
    }

    try {
      logger.info(`Updating app: ${appId}`);
      const result = await this.makeRequest<{
        success: boolean;
        app: App;
      }>(`/preferences/apps/${encodeURIComponent(appId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      logger.info(`Successfully updated app: ${appId}`);
      return result.app;
    } catch (error) {
      logger.error(`Failed to update app: ${appId}`, error as Error);
      
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('App not found');
      }
      
      throw new Error('Failed to update app. Please try again.');
    }
  }

  /**
   * Delete an app
   * 
   * @param appId - App ID to delete
   * @returns Success status
   */
  async deleteApp(appId: string): Promise<{ success: boolean }> {
    if (!appId.trim()) {
      throw new Error('App ID is required');
    }

    try {
      logger.info(`Deleting app: ${appId}`);
      const result = await this.makeRequest<{
        success: boolean;
        appId: string;
      }>(`/preferences/apps/${encodeURIComponent(appId)}`, {
        method: 'DELETE',
      });
      
      logger.info(`Successfully deleted app: ${appId}`);
      return { success: result.success };
    } catch (error) {
      logger.error(`Failed to delete app: ${appId}`, error as Error);
      
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('App not found');
      }
      
      throw new Error('Failed to delete app. Please try again.');
    }
  }

  // ===== Tag Management Methods =====

  /**
   * Create a new tag in Firebase settings/tags document
   * 
   * @param name - Tag name
   * @param color - Tag color in RGB format
   * @returns Created tag
   */
  async createTag(name: string, color: { r: number; g: number; b: number }): Promise<ChatTag> {
    if (!name.trim()) {
      throw new Error('Tag name is required');
    }

    try {
      logger.info(`Creating new tag: ${name}`);
      
      const db = await this.getFirestore();
      const user = await this.getCurrentUser();
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Generate a unique tag ID  
      const tagId = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const newTag: ChatTag = {
        id: tagId,
        name: name.trim(),
        color,
        createdAt: new Date()
      };
      
      const tagsRef = doc(db, 'users', user.uid, 'settings', 'tags');
      
      // Get existing tags
      const existingDoc = await getDoc(tagsRef);
      const existingTags: ChatTag[] = existingDoc.exists() ? (existingDoc.data().tags || []) : [];
      
      // Check for duplicate names
      if (existingTags.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('A tag with this name already exists');
      }
      
      // Add new tag to the array
      const updatedTags = [...existingTags, newTag];
      
      // Save to Firestore
      await setDoc(tagsRef, {
        tags: updatedTags,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      logger.info(`Successfully created tag: ${name}`);
      return newTag;
    } catch (error) {
      logger.error(`Failed to create tag: ${name}`, error as Error);
      throw error;
    }
  }

  /**
   * Update an existing tag in Firebase settings/tags document
   * 
   * @param tagId - Tag ID to update
   * @param updates - Partial tag updates
   * @returns Updated tag
   */
  async updateTag(tagId: string, updates: Partial<Pick<ChatTag, 'name' | 'color'>>): Promise<ChatTag> {
    if (!tagId.trim()) {
      throw new Error('Tag ID is required');
    }

    try {
      logger.info(`Updating tag: ${tagId}`);
      
      const db = await this.getFirestore();
      const user = await this.getCurrentUser();
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Get current tags
      const tagsRef = doc(db, 'users', user.uid, 'settings', 'tags');
      const tagsDoc = await getDoc(tagsRef);
      
      if (!tagsDoc.exists()) {
        throw new Error('Tags document not found');
      }

      const currentTags: ChatTag[] = tagsDoc.data().tags || [];
      const tagIndex = currentTags.findIndex(tag => tag.id === tagId);
      
      if (tagIndex === -1) {
        throw new Error('Tag not found');
      }

      // Update the tag
      const updatedTag: ChatTag = {
        ...currentTags[tagIndex],
        ...updates
      };

      currentTags[tagIndex] = updatedTag;

      // Save to Firestore
      await setDoc(tagsRef, { 
        tags: currentTags,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      logger.info(`Successfully updated tag: ${tagId}`);
      return updatedTag;
    } catch (error) {
      logger.error(`Failed to update tag: ${tagId}`, error as Error);
      throw new Error('Failed to update tag. Please try again.');
    }
  }

  /**
   * Delete a tag from Firebase settings/tags document
   * 
   * @param tagId - Tag ID to delete
   * @returns Success status
   */
  async deleteTag(tagId: string): Promise<{ success: boolean }> {
    if (!tagId.trim()) {
      throw new Error('Tag ID is required');
    }

    try {
      logger.info(`Deleting tag: ${tagId}`);
      
      const db = await this.getFirestore();
      const user = await this.getCurrentUser();
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Get current tags
      const tagsRef = doc(db, 'users', user.uid, 'settings', 'tags');
      const tagsDoc = await getDoc(tagsRef);
      
      if (!tagsDoc.exists()) {
        throw new Error('Tags document not found');
      }

      const currentTags: ChatTag[] = tagsDoc.data().tags || [];
      const filteredTags = currentTags.filter(tag => tag.id !== tagId);

      // Save updated tags to Firestore
      await setDoc(tagsRef, { 
        tags: filteredTags,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      logger.info(`Successfully deleted tag: ${tagId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to delete tag: ${tagId}`, error as Error);
      throw new Error('Failed to delete tag. Please try again.');
    }
  }

  /**
   * Get all user tags from Firebase settings/tags document
   * 
   * @returns Array of user tags
   */
  async getTags(): Promise<ChatTag[]> {
    try {
      logger.info('Getting user tags');
      
      const db = await this.getFirestore();
      const user = await this.getCurrentUser();
      const { doc, getDoc } = await import('firebase/firestore');
      
      const tagsRef = doc(db, 'users', user.uid, 'settings', 'tags');
      const tagsDoc = await getDoc(tagsRef);
      
      if (!tagsDoc.exists()) {
        logger.info('No tags document found, returning empty array');
        return [];
      }

      const docData = tagsDoc.data();
      const tags: ChatTag[] = docData.tags || [];
      
      // Convert Firestore timestamps to Date objects if needed
      const processedTags = tags.map(tag => ({
        ...tag,
        createdAt: tag.createdAt instanceof Date ? tag.createdAt : new Date(tag.createdAt)
      }));
      
      logger.info(`Successfully retrieved ${processedTags.length} tags`);
      return processedTags;
    } catch (error) {
      logger.error('Failed to get tags', error as Error);
      console.error('❌ [userPreferencesApi] Failed to get tags:', error);
      // Return empty array on error to not break the UI
      return [];
    }
  }
}

/**
 * Singleton instance of the user preferences API service
 */
export const userPreferencesApi = new UserPreferencesApiService();

logger.info('User preferences API service initialized'); 