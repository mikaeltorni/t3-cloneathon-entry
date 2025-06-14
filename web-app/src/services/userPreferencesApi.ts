/**
 * userPreferencesApi.ts
 * 
 * API service for user preferences management
 * 
 * Features:
 *   - User preferences CRUD operations
 *   - Model pinning functionality
 *   - Authentication-aware requests
 *   - Error handling and logging
 * 
 * Usage: import { userPreferencesApi } from '../services/userPreferencesApi'
 */
import { logger } from '../utils/logger';

/**
 * User preferences interface
 */
export interface UserPreferences {
  pinnedModels: string[];
  theme?: 'light' | 'dark' | 'auto';
  defaultModel?: string;
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
    public response?: any
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
   * Get authentication token from Firebase
   */
  private async getAuthToken(): Promise<string> {
    const { getAuth } = await import('../config/firebase');
    const auth = await getAuth();
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    return await auth.currentUser.getIdToken();
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
}

/**
 * Singleton instance of the user preferences API service
 */
export const userPreferencesApi = new UserPreferencesApiService();

logger.info('User preferences API service initialized'); 