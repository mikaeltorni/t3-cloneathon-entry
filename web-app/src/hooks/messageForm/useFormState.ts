/**
 * useFormState.ts
 * 
 * Focused hook for message form state management
 */
import { useState, useCallback, useEffect } from 'react';
import { useLogger } from '../useLogger';
import { DEFAULT_MODEL } from '../../../../src/shared/modelConfig';

export interface FormStateConfig {
  selectedModel?: string | null;
  onModelChange?: (model: string) => void;
  defaultModel?: string;
}

export interface UseFormStateReturn {
  message: string;
  setMessage: (message: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  useReasoning: boolean;
  setUseReasoning: (useReasoning: boolean) => void;
  reasoningEffort: 'low' | 'medium' | 'high';
  setReasoningEffort: (effort: 'low' | 'medium' | 'high') => void;
  useWebSearch: boolean;
  setUseWebSearch: (useWebSearch: boolean) => void;
  webSearchEffort: 'low' | 'medium' | 'high';
  setWebSearchEffort: (effort: 'low' | 'medium' | 'high') => void;
  resetMessage: () => void;
}

export function useFormState(config: FormStateConfig = {}): UseFormStateReturn {
  const { selectedModel: externalSelectedModel, onModelChange, defaultModel = DEFAULT_MODEL } = config;
  const { debug } = useLogger('useFormState');

  const [message, setMessage] = useState('');

  const selectedModel = externalSelectedModel !== undefined && externalSelectedModel !== null 
    ? externalSelectedModel 
    : defaultModel;
  
  const setSelectedModel = useCallback((model: string) => {
    if (onModelChange) {
      onModelChange(model);
    }
  }, [onModelChange]);

  const [useReasoning, setUseReasoning] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('high');

  const [useWebSearch, setUseWebSearch] = useState(() => {
    const saved = localStorage.getItem('useWebSearch');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [webSearchEffort, setWebSearchEffort] = useState<'low' | 'medium' | 'high'>(() => {
    const saved = localStorage.getItem('webSearchEffort');
    return saved ? saved as 'low' | 'medium' | 'high' : 'high';
  });

  const handleSetUseWebSearch = useCallback((value: boolean) => {
    debug(`Web search toggled: ${value}`);
    setUseWebSearch(value);
  }, [debug]);

  const resetMessage = useCallback(() => {
    setMessage('');
    debug('Message content reset');
  }, [debug]);

  useEffect(() => {
    debug('Model selection changed', {
      externalSelectedModel,
      selectedModel,
      defaultModel,
      fallbackUsed: externalSelectedModel === undefined || externalSelectedModel === null
    });
  }, [externalSelectedModel, selectedModel, defaultModel, debug]);

  useEffect(() => {
    localStorage.setItem('useWebSearch', JSON.stringify(useWebSearch));
  }, [useWebSearch]);

  useEffect(() => {
    localStorage.setItem('webSearchEffort', webSearchEffort);
  }, [webSearchEffort]);

  return {
    message,
    setMessage,
    selectedModel,
    setSelectedModel,
    useReasoning,
    setUseReasoning,
    reasoningEffort,
    setReasoningEffort,
    useWebSearch,
    setUseWebSearch: handleSetUseWebSearch,
    webSearchEffort,
    setWebSearchEffort,
    resetMessage
  };
} 