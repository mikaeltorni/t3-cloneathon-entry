/**
 * useApps.ts
 * 
 * Custom hook for managing user-created apps
 * 
 * Hook:
 *   useApps
 * 
 * Features:
 *   - App creation, editing, and deletion
 *   - App selection and state management
 *   - localStorage persistence
 *   - Error handling and logging
 * 
 * Usage: const apps = useApps();
 */

import { useState, useCallback, useEffect } from 'react';
import { useLogger } from './useLogger';
import { useErrorHandler } from './useErrorHandler';
import { useAuth } from './useAuth';
import { userPreferencesApi, type App } from '../services/userPreferencesApi';

interface UseAppsReturn {
  // State
  apps: App[];
  currentAppId: string | null;
  currentApp: App | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createApp: (name: string, systemPrompt: string) => Promise<App>;
  updateApp: (appId: string, updates: Partial<Pick<App, 'name' | 'systemPrompt'>>) => Promise<App>;
  deleteApp: (appId: string) => Promise<void>;
  selectApp: (appId: string | null) => void;
  loadApps: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing user-created apps
 * 
 * @returns Object containing app state and management functions
 */
export const useApps = (): UseAppsReturn => {
  const [apps, setApps] = useState<App[]>([]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { debug, log } = useLogger('useApps');
  const { handleError } = useErrorHandler();
  const { user, initialized } = useAuth();

  // Get current app
  const currentApp = apps.find(app => app.id === currentAppId) || null;

  /**
   * Load apps from server
   */
  const loadApps = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const serverApps = await userPreferencesApi.getUserApps();
      setApps(serverApps);
      debug(`Loaded ${serverApps.length} apps from server`);
    } catch (error) {
      const errorMessage = 'Failed to load apps from server';
      setError(errorMessage);
      handleError(error as Error, 'loadApps');
      debug(errorMessage, error);
    } finally {
      setIsLoading(false);
    }
  }, [debug, handleError]);

  /**
   * Create a new app
   */
  const createApp = useCallback(async (name: string, systemPrompt: string): Promise<App> => {
    try {
      setIsLoading(true);
      setError(null);

      const newApp = await userPreferencesApi.createApp(name, systemPrompt);
      
      // Update local state
      setApps(prev => [...prev, newApp]);
      
      log(`Created new app: ${newApp.name}`);
      debug('App created successfully', newApp);
      
      return newApp;
    } catch (error) {
      const errorMessage = 'Failed to create app';
      setError(errorMessage);
      handleError(error as Error, 'createApp');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [log, debug, handleError]);

  /**
   * Update an existing app
   */
  const updateApp = useCallback(async (appId: string, updates: Partial<Pick<App, 'name' | 'systemPrompt'>>): Promise<App> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedApp = await userPreferencesApi.updateApp(appId, updates);
      
      // Update local state
      setApps(prev => prev.map(app => 
        app.id === appId ? updatedApp : app
      ));
      
      log(`Updated app: ${updatedApp.name}`);
      debug('App updated successfully', updatedApp);
      
      return updatedApp;
    } catch (error) {
      const errorMessage = 'Failed to update app';
      setError(errorMessage);
      handleError(error as Error, 'updateApp');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [log, debug, handleError]);

  /**
   * Delete an app
   */
  const deleteApp = useCallback(async (appId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const appToDelete = apps.find(app => app.id === appId);
      const appName = appToDelete?.name || 'Unknown app';

      await userPreferencesApi.deleteApp(appId);
      
      // Update local state
      setApps(prev => prev.filter(app => app.id !== appId));
      
      // Clear selection if the deleted app was selected
      if (currentAppId === appId) {
        setCurrentAppId(null);
      }
      
      log(`Deleted app: ${appName}`);
      debug('App deleted successfully', { appId, appName });
    } catch (error) {
      const errorMessage = 'Failed to delete app';
      setError(errorMessage);
      handleError(error as Error, 'deleteApp');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apps, currentAppId, log, debug, handleError]);

  /**
   * Select an app (or deselect if null)
   */
  const selectApp = useCallback((appId: string | null) => {
    setCurrentAppId(appId);
    if (appId) {
      const selectedApp = apps.find(app => app.id === appId);
      if (selectedApp) {
        log(`Selected app: ${selectedApp.name}`);
        debug('App selected', { appId, appName: selectedApp.name });
      }
    } else {
      debug('App selection cleared');
    }
  }, [apps, log, debug]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load apps only when user is authenticated and auth is initialized
  useEffect(() => {
    if (initialized && user) {
      debug('User authenticated, loading apps...');
      loadApps();
    } else if (initialized && !user) {
      debug('User not authenticated, clearing apps');
      setApps([]);
      setCurrentAppId(null);
      setError(null);
    }
  }, [initialized, user, loadApps, debug]);

  return {
    // State
    apps,
    currentAppId,
    currentApp,
    isLoading,
    error,
    
    // Actions
    createApp,
    updateApp,
    deleteApp,
    selectApp,
    loadApps,
    clearError
  };
}; 