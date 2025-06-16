/**
 * ModelsContext.tsx
 * 
 * Context for AI models with efficient caching and batch operations
 */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { chatApiService } from '../services/chatApi';
import type { ModelConfig } from '../../../src/shared/types';

export interface ModelsContextType {
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
  modelsError: string | null;
  getModelConfig: (modelId: string) => ModelConfig | undefined;
  isReasoningModel: (modelId: string) => boolean;
  getReasoningMode: (modelId: string) => 'forced' | 'optional' | 'none';
  getWebSearchMode: (modelId: string) => 'forced' | 'optional' | 'none';
  getWebSearchPricing: (modelId: string) => 'standard' | 'perplexity' | 'openai';
  getModelNames: () => string[];
  refetchModels: () => void;
  // New efficient methods
  clearModelsCache: () => void;
  getModelsByProvider: (provider: string) => ModelConfig[];
  getCachedModelsTimestamp: () => number | null;
}

export const ModelsContext = createContext<ModelsContextType | undefined>(undefined);

const MODELS_CACHE_KEY = 'cached_models';
const MODELS_CACHE_TIMESTAMP_KEY = 'cached_models_timestamp';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache duration

interface ModelsProviderProps {
  children: ReactNode;
}

export const ModelsProvider: React.FC<ModelsProviderProps> = ({ children }) => {
  const [availableModels, setAvailableModels] = useState<Record<string, ModelConfig>>({});
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache helpers
  const getCachedModels = useCallback((): Record<string, ModelConfig> | null => {
    try {
      const cached = localStorage.getItem(MODELS_CACHE_KEY);
      const timestamp = localStorage.getItem(MODELS_CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const cacheTime = parseInt(timestamp, 10);
        const now = Date.now();
        
        if (now - cacheTime < CACHE_DURATION) {
          console.log('[ModelsContext] Loading models from cache');
          return JSON.parse(cached);
        } else {
          console.log('[ModelsContext] Cache expired, clearing...');
          localStorage.removeItem(MODELS_CACHE_KEY);
          localStorage.removeItem(MODELS_CACHE_TIMESTAMP_KEY);
        }
      }
      return null;
    } catch (error) {
      console.error('[ModelsContext] Error reading models cache:', error);
      return null;
    }
  }, []);

  const setCachedModels = useCallback((models: Record<string, ModelConfig>) => {
    try {
      const timestamp = Date.now().toString();
      localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(models));
      localStorage.setItem(MODELS_CACHE_TIMESTAMP_KEY, timestamp);
      console.log('[ModelsContext] Models cached successfully');
    } catch (error) {
      console.error('[ModelsContext] Error caching models:', error);
    }
  }, []);

  const clearModelsCache = useCallback(() => {
    try {
      localStorage.removeItem(MODELS_CACHE_KEY);
      localStorage.removeItem(MODELS_CACHE_TIMESTAMP_KEY);
      console.log('[ModelsContext] Models cache cleared');
    } catch (error) {
      console.error('[ModelsContext] Error clearing models cache:', error);
    }
  }, []);

  const getCachedModelsTimestamp = useCallback((): number | null => {
    try {
      const timestamp = localStorage.getItem(MODELS_CACHE_TIMESTAMP_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('[ModelsContext] Error reading cache timestamp:', error);
      return null;
    }
  }, []);

  const fetchModels = useCallback(async (forceRefresh: boolean = false) => {
    // Prevent rapid successive API calls
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 5000) {
      console.log('[ModelsContext] Skipping fetch - too recent');
      return;
    }

    try {
      setModelsLoading(true);
      setModelsError(null);

      // Try cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedModels = getCachedModels();
        if (cachedModels) {
          setAvailableModels(cachedModels);
          setModelsLoading(false);
          return;
        }
      }

      console.log('[ModelsContext] Fetching models from API...');
      setLastFetchTime(now);

      const response = await chatApiService.getAvailableModels();
      
      if (response?.models) {
        setAvailableModels(response.models);
        setCachedModels(response.models);
        setModelsError(null);
        
        console.log(`[ModelsContext] Successfully loaded ${Object.keys(response.models).length} models`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('[ModelsContext] Error fetching models:', error);
      setModelsError(error instanceof Error ? error.message : 'Failed to load models');
      
      // Fallback to cache on error if available
      const cachedModels = getCachedModels();
      if (cachedModels) {
        console.log('[ModelsContext] Using cached models as fallback');
        setAvailableModels(cachedModels);
        setModelsError('Using cached models (API temporarily unavailable)');
      }
    } finally {
      setModelsLoading(false);
    }
  }, [getCachedModels, setCachedModels, lastFetchTime]);

  const refetchModels = useCallback(() => {
    fetchModels(true);
  }, [fetchModels]);

  // Load models on mount
  useEffect(() => {
    fetchModels(false);
  }, [fetchModels]);

  // Model utility functions
  const getModelConfig = useCallback((modelId: string): ModelConfig | undefined => {
    return availableModels[modelId];
  }, [availableModels]);

  const isReasoningModel = useCallback((modelId: string): boolean => {
    const model = availableModels[modelId];
    return model?.hasReasoning || false;
  }, [availableModels]);

  const getReasoningMode = useCallback((modelId: string): 'forced' | 'optional' | 'none' => {
    const model = availableModels[modelId];
    return model?.reasoningMode || 'none';
  }, [availableModels]);

  const getWebSearchMode = useCallback((modelId: string): 'forced' | 'optional' | 'none' => {
    const model = availableModels[modelId];
    return model?.webSearchMode || 'none';
  }, [availableModels]);

  const getWebSearchPricing = useCallback((modelId: string): 'standard' | 'perplexity' | 'openai' => {
    const model = availableModels[modelId];
    return model?.webSearchPricing || 'standard';
  }, [availableModels]);

  const getModelNames = useCallback((): string[] => {
    return Object.keys(availableModels);
  }, [availableModels]);

  const getModelsByProvider = useCallback((provider: string): ModelConfig[] => {
    // Since ModelConfig doesn't have a provider field, we'll extract it from the modelId
    return Object.entries(availableModels)
      .filter(([modelId]) => modelId.startsWith(provider + '/'))
      .map(([, model]) => model);
  }, [availableModels]);

  const contextValue: ModelsContextType = {
    availableModels,
    modelsLoading,
    modelsError,
    getModelConfig,
    isReasoningModel,
    getReasoningMode,
    getWebSearchMode,
    getWebSearchPricing,
    getModelNames,
    refetchModels,
    clearModelsCache,
    getModelsByProvider,
    getCachedModelsTimestamp,
  };

  return (
    <ModelsContext.Provider value={contextValue}>
      {children}
    </ModelsContext.Provider>
  );
};

// useModels hook moved to separate file to fix react-refresh/only-export-components warning