/**
 * useUserPreferences.ts
 * 
 * Custom hook for managing user preferences
 * 
 * Features:
 *   - User preferences state management
 *   - Model pinning functionality
 *   - Automatic loading and caching
 *   - Error handling and loading states
 * 
 * Usage: const { preferences, pinnedModels, toggleModelPin, loading } = useUserPreferences();
 */
import { useState, useEffect, useCallback } from 'react';
import { userPreferencesApi, type UserPreferences } from '../services/userPreferencesApi';
import { useAuth } from './useAuth';
import { useLogger } from './useLogger';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  pinnedModels: string[];
  loading: boolean;
  error: string | null;
  toggleModelPin: (modelId: string) => Promise<boolean>;
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
      
      log(`Loaded preferences with ${userPrefs.pinnedModels.length} pinned models`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      warn('Failed to load user preferences', err as Error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, debug, log, warn]);

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
  }, [user, debug, log, warn, loadPreferences]);

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

  return {
    preferences,
    pinnedModels,
    loading,
    error,
    toggleModelPin,
    updatePreferences,
    refreshPreferences,
  };
} 