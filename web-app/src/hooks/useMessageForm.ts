/**
 * useMessageForm.ts
 * 
 * Custom hook for managing message form state and submission
 * Extracted from ChatInput to improve code organization and reusability
 * 
 * Hook:
 *   useMessageForm
 * 
 * Features:
 *   - Form state management
 *   - Message and model selection
 *   - Reasoning toggle handling
 *   - Form submission with validation
 *   - Auto-focus and reset functionality
 * 
 * Usage: const form = useMessageForm({ onSubmit, availableModels, loading });
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogger } from './useLogger';
import type { ModelConfig, ImageAttachment } from '../../../src/shared/types';

/**
 * Message form hook configuration
 */
interface UseMessageFormConfig {
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  availableModels: Record<string, ModelConfig>;
  loading: boolean;
  images: ImageAttachment[];
  selectedModel?: string; // External model selection
  onModelChange?: (modelId: string) => void; // External model change handler
  defaultModel?: string;
}

/**
 * Message form hook return interface
 */
export interface UseMessageFormReturn {
  // Form state
  message: string;
  setMessage: (message: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  useReasoning: boolean;
  setUseReasoning: (use: boolean) => void;
  reasoningEffort: 'low' | 'medium' | 'high';
  setReasoningEffort: (effort: 'low' | 'medium' | 'high') => void;
  useWebSearch: boolean;
  setUseWebSearch: (use: boolean) => void;
  webSearchEffort: 'low' | 'medium' | 'high';
  setWebSearchEffort: (effort: 'low' | 'medium' | 'high') => void;
  
  // Helper functions
  isReasoningModel: (modelId?: string) => boolean;
  supportsEffortControl: (modelId?: string) => boolean;
  supportsWebEffortControl: (modelId?: string) => boolean;
  
  // Form operations
  canSubmit: boolean;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  
  // UI helpers
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  focusTextarea: () => void;
}

/**
 * Custom hook for message form management
 * 
 * Provides comprehensive form functionality including:
 * - State management for message, model, and reasoning
 * - Form submission with validation
 * - Keyboard shortcuts and auto-focus
 * - Model capability checking
 * 
 * @param config - Form configuration options
 * @returns Form state and operations
 */
export const useMessageForm = (config: UseMessageFormConfig): UseMessageFormReturn => {
  const { onSendMessage, availableModels, loading, images, selectedModel: externalSelectedModel, onModelChange, defaultModel = 'google/gemini-2.5-flash-preview' } = config;
  
  const [message, setMessage] = useState('');
  // Use external model selection if provided, otherwise use internal state
  // IMPORTANT: Only fallback to defaultModel if externalSelectedModel is truly undefined/null
  // Empty string should be preserved as it might be intentional
  const selectedModel = externalSelectedModel !== undefined && externalSelectedModel !== null 
    ? externalSelectedModel 
    : defaultModel;
  
  const setSelectedModel = useCallback((model: string) => {
    if (onModelChange) {
      onModelChange(model);
    }
  }, [onModelChange]);

  // Debug logging to track model changes
  const { debug: formDebug } = useLogger('useMessageForm');
  
  useEffect(() => {
    formDebug('Model selection changed', {
      externalSelectedModel,
      selectedModel,
      defaultModel,
      fallbackUsed: externalSelectedModel === undefined || externalSelectedModel === null
    });
  }, [externalSelectedModel, selectedModel, defaultModel, formDebug]);
  const [useReasoning, setUseReasoning] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('high');
  const [useWebSearch, setUseWebSearch] = useState(() => {
    // Persist web search preference in localStorage
    const saved = localStorage.getItem('useWebSearch');
    return saved ? JSON.parse(saved) : false;
  });
  const [webSearchEffort, setWebSearchEffort] = useState<'low' | 'medium' | 'high'>(() => {
    // Persist web search effort preference in localStorage
    const saved = localStorage.getItem('webSearchEffort');
    return saved ? saved as 'low' | 'medium' | 'high' : 'high';
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { debug, log } = useLogger('useMessageForm');

  /**
   * Enhanced setUseWebSearch with logging
   */
  const handleSetUseWebSearch = useCallback((value: boolean) => {
    debug(`Web search toggled: ${value}`);
    setUseWebSearch(value);
  }, [debug]);

  /**
   * Check if a model supports reasoning based on model configuration
   * 
   * @param modelId - Model ID to check (uses selected model if not provided)
   * @returns Whether the model supports reasoning
   */
  const isReasoningModel = useCallback((modelId?: string): boolean => {
    const targetModel = modelId || selectedModel;
    if (!targetModel || !availableModels[targetModel]) return false;
    return availableModels[targetModel].hasReasoning;
  }, [availableModels, selectedModel]);

  /**
   * Check if a model supports reasoning effort control
   * 
   * @param modelId - Model ID to check (uses selected model if not provided)
   * @returns Whether the model supports effort level control
   */
  const supportsEffortControl = useCallback((modelId?: string): boolean => {
    const targetModel = modelId || selectedModel;
    if (!targetModel || !availableModels[targetModel]) return false;
    return availableModels[targetModel].supportsEffortControl === true;
  }, [availableModels, selectedModel]);

  /**
   * Check if a model supports web search effort control
   * 
   * @param modelId - Model ID to check (uses selected model if not provided)
   * @returns Whether the model supports web search effort control
   */
  const supportsWebEffortControl = useCallback((modelId?: string): boolean => {
    const targetModel = modelId || selectedModel;
    if (!targetModel || !availableModels[targetModel]) return false;
    return availableModels[targetModel].supportsWebEffortControl === true;
  }, [availableModels, selectedModel]);

  /**
   * Check if form submission should be disabled
   */
  const canSubmit = useCallback((): boolean => {
    return !((!message.trim() && images.length === 0) || loading);
  }, [message, images.length, loading]);

  /**
   * Focus the textarea
   */
  const focusTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
    }
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    // Prevent default form submission behavior
    if (e) {
      e.preventDefault();
    }

    if (!canSubmit()) {
      debug('Form submission blocked: invalid form state');
      return;
    }

    const trimmedMessage = message.trim();
    
    // // Log all variables above the try block using console.log
    // console.log('[useMessageForm] Form submission variables', {
    //   trimmedMessage,
    //   images,
    //   selectedModel,
    //   useReasoning,
    //   isReasoningModel: isReasoningModel(),
    //   reasoningEffort,
    //   useWebSearch,
    //   webSearchEffort
    // });

    try {
      debug('📤 Submitting message', { 
        messageLength: trimmedMessage.length, 
        imageCount: images.length,
        modelId: selectedModel,
        externalSelectedModel,
        useReasoning: useReasoning && isReasoningModel(),
        useWebSearch: useWebSearch,
        fallbackUsed: externalSelectedModel === undefined || externalSelectedModel === null
      });

      onSendMessage(
        trimmedMessage,
        images,
        selectedModel,
        useReasoning && isReasoningModel(),
        reasoningEffort,
        useWebSearch,
        webSearchEffort
      );

      // Reset form after successful submission
      setMessage('');
      log('Message sent successfully');
    } catch (error) {
      debug('Message submission failed', error);
      // Don't reset form on error so user can retry
    }
  }, [message, images, selectedModel, useReasoning, isReasoningModel, useWebSearch, canSubmit, onSendMessage, debug, log, reasoningEffort, webSearchEffort]);

  /**
   * Handle keyboard shortcuts
   * 
   * @param e - Keyboard event
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  /**
   * Auto-focus textarea after message is sent
   */
  useEffect(() => {
    if (!loading) {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height and focus
        textarea.style.height = '48px';
        setTimeout(() => {
          textarea.focus();
        }, 100);
      }
    }
  }, [loading]);

  /**
   * Reset reasoning if model doesn't support it
   */
  useEffect(() => {
    if (useReasoning && !isReasoningModel()) {
      setUseReasoning(false);
      debug('Reasoning disabled: selected model does not support reasoning');
    }
  }, [selectedModel, useReasoning, isReasoningModel, debug]);

  /**
   * Persist web search preference to localStorage
   */
  useEffect(() => {
    localStorage.setItem('useWebSearch', JSON.stringify(useWebSearch));
  }, [useWebSearch]);

  /**
   * Persist web search effort preference to localStorage
   */
  useEffect(() => {
    localStorage.setItem('webSearchEffort', webSearchEffort);
  }, [webSearchEffort]);

  /**
   * Reset web search if model doesn't support it (only for models with webSearchMode: 'none')
   */
  useEffect(() => {
    if (useWebSearch && availableModels[selectedModel]?.webSearchMode === 'none') {
      setUseWebSearch(false);
      debug('Web search disabled: selected model does not support web search');
    }
  }, [selectedModel, useWebSearch, availableModels, debug]);

  return {
    // Form state
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
    
    // Helper functions
    isReasoningModel,
    supportsEffortControl,
    supportsWebEffortControl,
    
    // Form operations
    canSubmit: canSubmit(),
    handleSubmit,
    handleKeyDown,
    
    // UI helpers
    textareaRef,
    focusTextarea
  };
}; 