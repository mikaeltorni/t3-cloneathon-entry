/**
 * useStateEffects.ts
 * 
 * Focused hook for managing form state side effects
 */
import { useEffect } from 'react';
import { useLogger } from '../useLogger';
import type { ModelConfig } from '../../../../src/shared/types';

export interface StateEffectsConfig {
  selectedModel: string;
  availableModels: Record<string, ModelConfig>;
  useReasoning: boolean;
  setUseReasoning: (use: boolean) => void;
  useWebSearch: boolean;
  setUseWebSearch: (use: boolean) => void;
  isReasoningModel: (modelId?: string) => boolean;
}

export function useStateEffects(config: StateEffectsConfig): void {
  const {
    selectedModel,
    availableModels,
    useReasoning,
    setUseReasoning,
    useWebSearch,
    setUseWebSearch,
    isReasoningModel
  } = config;
  
  const { debug } = useLogger('useStateEffects');

  useEffect(() => {
    if (useReasoning && !isReasoningModel()) {
      setUseReasoning(false);
      debug('Reasoning disabled: selected model does not support reasoning');
    }
  }, [selectedModel, useReasoning, isReasoningModel, setUseReasoning, debug]);

  useEffect(() => {
    if (useWebSearch && availableModels[selectedModel]?.webSearchMode === 'none') {
      setUseWebSearch(false);
      debug('Web search disabled: selected model does not support web search');
    }
  }, [selectedModel, useWebSearch, availableModels, setUseWebSearch, debug]);
} 