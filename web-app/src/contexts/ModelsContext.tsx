/**
 * ModelsContext.tsx
 * 
 * Context for AI models with simple infinite loop prevention
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { chatApiService } from '../services/chatApi';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelsContextType {
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
  modelsError: string | null;
  getModelConfig: (modelId: string) => ModelConfig | undefined;
  isReasoningModel: (modelId: string) => boolean;
  getReasoningMode: (modelId: string) => 'forced' | 'optional' | 'none';
  isWebSearchModel: (modelId: string) => boolean;
  getWebSearchMode: (modelId: string) => 'forced' | 'optional' | 'none';
  getWebSearchPricing: (modelId: string) => 'standard' | 'perplexity' | 'openai';
  getModelNames: () => string[];
  refetchModels: () => void;
}

const ModelsContext = createContext<ModelsContextType | undefined>(undefined);

interface ModelsProviderProps {
  children: ReactNode;
}

export const ModelsProvider: React.FC<ModelsProviderProps> = ({ children }) => {
  const [availableModels, setAvailableModels] = useState<Record<string, ModelConfig>>({});
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      setModelsLoading(true);
      setModelsError(null);
      console.log('🚀 Loading models...');

      const response = await chatApiService.getAvailableModels();
      
      setAvailableModels(response.models);
      setModelsLoading(false);

      console.log(`✅ Successfully loaded ${Object.keys(response.models).length} models`);
    } catch (error) {
      console.error('❌ Error loading models:', error);
    }
  };

  // Load models only once when component mounts
  useEffect(() => {
    loadModels();
  }, []); // Empty dependency array - only run once

  const getModelConfig = (modelId: string): ModelConfig | undefined => {
    return availableModels[modelId];
  };

  const isReasoningModel = (modelId: string): boolean => {
    const model = availableModels[modelId];
    return model?.hasReasoning || false;
  };

  const getReasoningMode = (modelId: string): 'forced' | 'optional' | 'none' => {
    const model = availableModels[modelId];
    return model?.reasoningMode || 'none';
  };

  const isWebSearchModel = (modelId: string): boolean => {
    const model = availableModels[modelId];
    return model?.hasWebSearch || false;
  };

  const getWebSearchMode = (modelId: string): 'forced' | 'optional' | 'none' => {
    const model = availableModels[modelId];
    return model?.webSearchMode || 'none';
  };

  const getWebSearchPricing = (modelId: string): 'standard' | 'perplexity' | 'openai' => {
    const model = availableModels[modelId];
    return model?.webSearchPricing || 'standard';
  };

  const getModelNames = (): string[] => {
    return Object.values(availableModels).map(model => model.name);
  };

  const refetchModels = () => {
    loadModels();
  };

  const value: ModelsContextType = {
    availableModels,
    modelsLoading,
    modelsError,
    getModelConfig,
    isReasoningModel,
    getReasoningMode,
    isWebSearchModel,
    getWebSearchMode,
    getWebSearchPricing,
    getModelNames,
    refetchModels,
  };

  return (
    <ModelsContext.Provider value={value}>
      {children}
    </ModelsContext.Provider>
  );
};

export const useModels = (): ModelsContextType => {
  const context = useContext(ModelsContext);
  if (context === undefined) {
    throw new Error('useModels must be used within a ModelsProvider');
  }
  return context;
};