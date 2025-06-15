/**
 * useModelCapabilities.ts
 * 
 * Focused hook for model capability checking
 */
import { useCallback } from 'react';
import type { ModelConfig } from '../../../../src/shared/types';

export interface UseModelCapabilitiesReturn {
  isReasoningModel: (modelId?: string) => boolean;
  supportsEffortControl: (modelId?: string) => boolean;
  supportsWebEffortControl: (modelId?: string) => boolean;
}

export function useModelCapabilities(
  availableModels: Record<string, ModelConfig>,
  selectedModel: string
): UseModelCapabilitiesReturn {
  
  const isReasoningModel = useCallback((modelId?: string): boolean => {
    const targetModel = modelId || selectedModel;
    if (!targetModel || !availableModels[targetModel]) return false;
    return availableModels[targetModel].hasReasoning;
  }, [availableModels, selectedModel]);

  const supportsEffortControl = useCallback((modelId?: string): boolean => {
    const targetModel = modelId || selectedModel;
    if (!targetModel || !availableModels[targetModel]) return false;
    return availableModels[targetModel].supportsEffortControl === true;
  }, [availableModels, selectedModel]);

  const supportsWebEffortControl = useCallback((modelId?: string): boolean => {
    const targetModel = modelId || selectedModel;
    if (!targetModel || !availableModels[targetModel]) return false;
    return availableModels[targetModel].supportsWebEffortControl === true;
  }, [availableModels, selectedModel]);

  return {
    isReasoningModel,
    supportsEffortControl,
    supportsWebEffortControl
  };
}
