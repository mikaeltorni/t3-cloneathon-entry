/**
 * useModels.ts
 * 
 * Custom hook for managing AI model state and operations
 * Extracted from App.tsx to improve code organization and reusability
 * 
 * Hook:
 *   useModels
 * 
 * Features:
 *   - Model loading and configuration
 *   - Model selection and reasoning mode handling
 *   - Loading states and error handling
 *   - Model utility functions
 * 
 * Usage: const models = useModels();
 */
import { useState, useCallback } from 'react';
import { chatApiService } from '../services/chatApi';
import { useLogger } from './useLogger';
import { useErrorHandler } from './useErrorHandler';
import type { ModelConfig } from '../../../src/shared/types';

/**
 * Models hook return interface
 */
interface UseModelsReturn {
  // State
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
  
  // Actions
  loadModels: () => Promise<void>;
  
  // Utilities
  getModelConfig: (modelId: string) => ModelConfig | undefined;
  isReasoningModel: (modelId: string) => boolean;
  getReasoningMode: (modelId: string) => 'forced' | 'optional' | 'none';
  getModelNames: () => string[];
}

/**
 * Custom hook for AI model management
 * 
 * Provides comprehensive model functionality including:
 * - Model loading and configuration
 * - Model selection utilities
 * - Reasoning capability checking
 * 
 * @returns Model state and operations
 */
export const useModels = (): UseModelsReturn => {
  const [availableModels, setAvailableModels] = useState<Record<string, ModelConfig>>({});
  const [modelsLoading, setModelsLoading] = useState(true);

  const { log, debug, warn } = useLogger('useModels');
  const { handleError } = useErrorHandler();

  /**
   * Load available AI models from the server
   */
  const loadModels = useCallback(async () => {
    try {
      setModelsLoading(true);
      debug('Loading available models from server...');
      const response = await chatApiService.getAvailableModels();
      setAvailableModels(response.models);
      log(`Successfully loaded ${Object.keys(response.models).length} models`);
    } catch (err) {
      const errorMessage = 'Failed to load AI models.';
      handleError(err as Error, 'LoadModels');
      warn(errorMessage);
      
      // Set default model if loading fails
      setAvailableModels({
        'google/gemini-2.5-flash-preview-05-20': {
          name: 'Gemini 2.5 Flash',
          description: 'Fast and efficient multimodal model for general tasks',
          hasReasoning: true,
          reasoningType: 'thinking',
          reasoningMode: 'optional',
        }
      });
      log('Fallback to default model configuration');
    } finally {
      setModelsLoading(false);
    }
  }, [debug, log, warn, handleError]);

  /**
   * Get model configuration by ID
   * 
   * @param modelId - Model identifier
   * @returns Model configuration or undefined
   */
  const getModelConfig = useCallback((modelId: string): ModelConfig | undefined => {
    return availableModels[modelId];
  }, [availableModels]);

  /**
   * Check if a model supports reasoning
   * 
   * @param modelId - Model identifier
   * @returns Whether the model supports reasoning
   */
  const isReasoningModel = useCallback((modelId: string): boolean => {
    const model = availableModels[modelId];
    return model?.hasReasoning || false;
  }, [availableModels]);

  /**
   * Get the reasoning mode for a model
   * 
   * @param modelId - Model identifier
   * @returns Reasoning mode of the model
   */
  const getReasoningMode = useCallback((modelId: string): 'forced' | 'optional' | 'none' => {
    const model = availableModels[modelId];
    return model?.reasoningMode || 'none';
  }, [availableModels]);

  /**
   * Get all available model names
   * 
   * @returns Array of model names
   */
  const getModelNames = useCallback((): string[] => {
    return Object.values(availableModels).map(model => model.name);
  }, [availableModels]);

  return {
    // State
    availableModels,
    modelsLoading,
    
    // Actions
    loadModels,
    
    // Utilities
    getModelConfig,
    isReasoningModel,
    getReasoningMode,
    getModelNames
  };
}; 