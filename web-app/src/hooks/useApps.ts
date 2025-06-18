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
import type { App } from '../../../src/shared/types';

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

const STORAGE_KEY = 'user-apps';

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

  // Get current app
  const currentApp = apps.find(app => app.id === currentAppId) || null;

  /**
   * Load apps from localStorage
   */
  const loadApps = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedApps = localStorage.getItem(STORAGE_KEY);
      if (storedApps) {
        const parsedApps: App[] = JSON.parse(storedApps);
        // Convert date strings back to Date objects
        const appsWithDates = parsedApps.map(app => ({
          ...app,
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt)
        }));
        setApps(appsWithDates);
        debug(`Loaded ${appsWithDates.length} apps from storage`);
      }
    } catch (error) {
      const errorMessage = 'Failed to load apps from storage';
      setError(errorMessage);
      handleError(error as Error, 'loadApps');
      debug(errorMessage, error);
    } finally {
      setIsLoading(false);
    }
  }, [debug, handleError]);

  /**
   * Save apps to localStorage
   */
  const saveApps = useCallback((appsToSave: App[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appsToSave));
      debug(`Saved ${appsToSave.length} apps to storage`);
    } catch (error) {
      const errorMessage = 'Failed to save apps to storage';
      setError(errorMessage);
      handleError(error as Error, 'saveApps');
      debug(errorMessage, error);
    }
  }, [debug, handleError]);

  /**
   * Create a new app
   */
  const createApp = useCallback(async (name: string, systemPrompt: string): Promise<App> => {
    try {
      setIsLoading(true);
      setError(null);

      const newApp: App = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        systemPrompt: systemPrompt.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false
      };

      const updatedApps = [...apps, newApp];
      setApps(updatedApps);
      saveApps(updatedApps);
      
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
  }, [apps, saveApps, log, debug, handleError]);

  /**
   * Update an existing app
   */
  const updateApp = useCallback(async (appId: string, updates: Partial<Pick<App, 'name' | 'systemPrompt'>>): Promise<App> => {
    try {
      setIsLoading(true);
      setError(null);

      const appIndex = apps.findIndex(app => app.id === appId);
      if (appIndex === -1) {
        throw new Error(`App with id ${appId} not found`);
      }

      const updatedApp: App = {
        ...apps[appIndex],
        ...updates,
        updatedAt: new Date()
      };

      const updatedApps = [...apps];
      updatedApps[appIndex] = updatedApp;
      
      setApps(updatedApps);
      saveApps(updatedApps);
      
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
  }, [apps, saveApps, log, debug, handleError]);

  /**
   * Delete an app
   */
  const deleteApp = useCallback(async (appId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const appToDelete = apps.find(app => app.id === appId);
      if (!appToDelete) {
        throw new Error(`App with id ${appId} not found`);
      }

      const updatedApps = apps.filter(app => app.id !== appId);
      setApps(updatedApps);
      saveApps(updatedApps);
      
      // Clear selection if the deleted app was selected
      if (currentAppId === appId) {
        setCurrentAppId(null);
      }
      
      log(`Deleted app: ${appToDelete.name}`);
      debug('App deleted successfully', { appId, appName: appToDelete.name });
    } catch (error) {
      const errorMessage = 'Failed to delete app';
      setError(errorMessage);
      handleError(error as Error, 'deleteApp');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apps, currentAppId, saveApps, log, debug, handleError]);

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

  // Load apps on mount
  useEffect(() => {
    loadApps();
  }, [loadApps]);

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