/**
 * useUserPreferences.ts
 * 
 * Custom hook for managing user preferences
 * 
 * Features:
 *   - User preferences state management
 *   - Model pinning functionality
 *   - Last selected model persistence with localStorage cache
 *   - Automatic loading and caching
 *   - Error handling and loading states
 * 
 * Usage: const { preferences, pinnedModels, lastSelectedModel, updateLastSelectedModel, toggleModelPin, loading } = useUserPreferences();
 */
import { useState, useEffect, useCallback } from 'react';
import { userPreferencesApi, type UserPreferences } from '../services/userPreferencesApi';
import { useAuth } from './useAuth';
import { useLogger } from './useLogger';
import { DEFAULT_MODEL } from '../../../src/shared/modelConfig';

// localStorage key for immediate caching of last selected model
const LAST_SELECTED_MODEL_CACHE_KEY = 'lastSelectedModel';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  pinnedModels: string[];
  lastSelectedModel: string;
  loading: boolean;
  error: string | null;
  toggleModelPin: (modelId: string) => Promise<boolean>;
  updateLastSelectedModel: (modelId: string) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

/**
 * Custom hook for managing user preferences
 * 
 * @returns User preferences state and operations
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { debug, log, warn } = useLogger('useUserPreferences');

  /**
   * Get cached last selected model from localStorage
   */
  const getCachedLastSelectedModel = useCallback((): string => {
    try {
      const cached = localStorage.getItem(LAST_SELECTED_MODEL_CACHE_KEY);
      return cached || DEFAULT_MODEL;
    } catch (error) {
      warn('Failed to read cached last selected model', error as Error);
      return DEFAULT_MODEL;
    }
  }, [warn]);

  /**
   * Cache last selected model in localStorage
   */
  const setCachedLastSelectedModel = useCallback((modelId: string) => {
    try {
      localStorage.setItem(LAST_SELECTED_MODEL_CACHE_KEY, modelId);
      debug(`Cached last selected model: ${modelId}`);
    } catch (error) {
      warn('Failed to cache last selected model', error as Error);
    }
  }, [debug, warn]);

  /**
   * Load user preferences from API
   */
  const loadPreferences = useCallback(async () => {
    if (!user) {
      debug('No user authenticated, skipping preferences load');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      debug('Loading user preferences');
      
      const userPrefs = await userPreferencesApi.getUserPreferences();
      setPreferences(userPrefs);
      
      // Update localStorage cache with server value if available
      if (userPrefs.lastSelectedModel) {
        setCachedLastSelectedModel(userPrefs.lastSelectedModel);
      }
      
      log(`Loaded preferences with ${userPrefs.pinnedModels.length} pinned models and last selected model: ${userPrefs.lastSelectedModel || 'none'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      warn('Failed to load user preferences', err as Error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, debug, log, warn, setCachedLastSelectedModel]);

  /**
   * Toggle model pin status
   * 
   * @param modelId - Model ID to toggle
   * @returns New pin status (true if pinned, false if unpinned)
   */
  const toggleModelPin = useCallback(async (modelId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      debug(`Toggling pin for model: ${modelId}`);
      
      // Optimistic update
      const currentPinned = preferences?.pinnedModels || [];
      const isPinned = currentPinned.includes(modelId);
      const newPinnedModels = isPinned 
        ? currentPinned.filter(id => id !== modelId)
        : [modelId, ...currentPinned];

      setPreferences(prev => prev ? {
        ...prev,
        pinnedModels: newPinnedModels,
        updatedAt: new Date()
      } : null);

      // Make API call
      const result = await userPreferencesApi.toggleModelPin(modelId);
      
      // Update with server response
      setPreferences(result.preferences);
      setError(null);
      
      log(`Model ${result.isPinned ? 'pinned' : 'unpinned'}: ${modelId}`);
      return result.isPinned;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle model pin';
      warn(`Failed to toggle pin for model ${modelId}`, err as Error);
      setError(errorMessage);
      
      // Revert optimistic update
      await loadPreferences();
      throw err;
    }
  }, [user, preferences?.pinnedModels, debug, log, warn, loadPreferences]);

  /**
   * Update last selected model
   * 
   * @param modelId - Model ID to set as last selected
   */
  const updateLastSelectedModel = useCallback(async (modelId: string) => {
    debug(`Updating last selected model: ${modelId}`);
    
    // Always update localStorage cache immediately for responsive UI
    setCachedLastSelectedModel(modelId);
    
    if (!user) {
      debug('No user authenticated, only cached locally');
      return;
    }

    try {
      // Optimistic update
      setPreferences(prev => prev ? {
        ...prev,
        lastSelectedModel: modelId,
        updatedAt: new Date()
      } : null);

      // Make API call to persist to server
      const updatedPrefs = await userPreferencesApi.updateUserPreferences({
        lastSelectedModel: modelId
      });
      
      // Update with server response
      setPreferences(updatedPrefs);
      setError(null);
      
      log(`Successfully updated last selected model: ${modelId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update last selected model';
      warn(`Failed to update last selected model to ${modelId}`, err as Error);
      setError(errorMessage);
      
      // Don't revert cache on error - keep the user's selection locally
    }
  }, [user, debug, log, warn, setCachedLastSelectedModel]);

  /**
   * Update user preferences
   * 
   * @param updates - Partial preferences to update
   */
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      debug('Updating user preferences', updates);
      
      // Update localStorage cache for lastSelectedModel if included
      if (updates.lastSelectedModel) {
        setCachedLastSelectedModel(updates.lastSelectedModel);
      }
      
      // Optimistic update
      setPreferences(prev => prev ? {
        ...prev,
        ...updates,
        updatedAt: new Date()
      } : null);

      // Make API call
      const updatedPrefs = await userPreferencesApi.updateUserPreferences(updates);
      
      // Update with server response
      setPreferences(updatedPrefs);
      setError(null);
      
      log('Successfully updated user preferences');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      warn('Failed to update user preferences', err as Error);
      setError(errorMessage);
      
      // Revert optimistic update
      await loadPreferences();
      throw err;
    }
  }, [user, debug, log, warn, loadPreferences, setCachedLastSelectedModel]);

  /**
   * Refresh preferences from server
   */
  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  /**
   * Load preferences when user changes
   */
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      // Clear preferences when user logs out
      setPreferences(null);
      setError(null);
    }
  }, [user, loadPreferences]);

  /**
   * Get pinned models array
   */
  const pinnedModels = preferences?.pinnedModels || [];

  /**
   * Get last selected model with fallback chain:
   * 1. Server preferences
   * 2. localStorage cache
   * 3. DEFAULT_MODEL
   */
  const lastSelectedModel = preferences?.lastSelectedModel || getCachedLastSelectedModel();

  return {
    preferences,
    pinnedModels,
    lastSelectedModel,
    loading,
    error,
    toggleModelPin,
    updateLastSelectedModel,
    updatePreferences,
    refreshPreferences,
  };
} 