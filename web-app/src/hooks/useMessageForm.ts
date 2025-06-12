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
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean) => Promise<void>;
  availableModels: Record<string, ModelConfig>;
  loading: boolean;
  images: ImageAttachment[];
  defaultModel?: string;
}

/**
 * Message form hook return interface
 */
interface UseMessageFormReturn {
  // Form state
  message: string;
  selectedModel: string;
  useReasoning: boolean;
  
  // Form handlers
  setMessage: (message: string) => void;
  setSelectedModel: (modelId: string) => void;
  setUseReasoning: (useReasoning: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  
  // Utilities
  isReasoningModel: (modelId?: string) => boolean;
  isSubmitDisabled: boolean;
  resetForm: () => void;
  
  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
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
  const { onSendMessage, availableModels, loading, images, defaultModel = 'google/gemini-2.5-flash-preview-05-20' } = config;
  
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [useReasoning, setUseReasoning] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { debug, log } = useLogger('useMessageForm');

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
   * Check if form submission should be disabled
   */
  const isSubmitDisabled = useCallback((): boolean => {
    return (!message.trim() && images.length === 0) || loading;
  }, [message, images.length, loading]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setMessage('');
    setUseReasoning(false);
    debug('Form reset to initial state');
  }, [debug]);

  /**
   * Handle form submission
   * 
   * @param e - Form event
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitDisabled()) {
      debug('Form submission blocked: invalid form state');
      return;
    }

    const trimmedMessage = message.trim();
    
    try {
      debug('Submitting message', { 
        messageLength: trimmedMessage.length, 
        imageCount: images.length,
        modelId: selectedModel,
        useReasoning: useReasoning && isReasoningModel()
      });

      await onSendMessage(
        trimmedMessage, 
        images, 
        selectedModel, 
        useReasoning && isReasoningModel() // Only use reasoning if model supports it
      );

      // Reset form after successful submission
      resetForm();
      log('Message sent successfully');
    } catch (error) {
      debug('Message submission failed', error);
      // Don't reset form on error so user can retry
    }
  }, [message, images, selectedModel, useReasoning, isReasoningModel, isSubmitDisabled, onSendMessage, resetForm, debug, log]);

  /**
   * Handle keyboard shortcuts
   * 
   * @param e - Keyboard event
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  /**
   * Handle textarea input changes
   * 
   * @param e - Change event
   */
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

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

  return {
    // Form state
    message,
    selectedModel,
    useReasoning,
    
    // Form handlers
    setMessage,
    setSelectedModel,
    setUseReasoning,
    handleSubmit,
    handleKeyPress,
    handleMessageChange,
    
    // Utilities
    isReasoningModel,
    isSubmitDisabled: isSubmitDisabled(),
    resetForm,
    
    // Refs
    textareaRef
  };
}; 