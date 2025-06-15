/**
 * useMessageForm.ts
 * 
 * Refactored message form hook using focused services
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
import {
  useFormState,
  useModelCapabilities,
  useFormValidation,
  useFormSubmission,
  useUIFocus,
  useStateEffects
} from './messageForm';
import type { ModelConfig, ImageAttachment, DocumentAttachment } from '../../../src/shared/types';

/**
 * Message form hook configuration
 */
interface UseMessageFormConfig {
  onSendMessage: (content: string, images?: ImageAttachment[], documents?: DocumentAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  availableModels: Record<string, ModelConfig>;
  loading: boolean;
  images: ImageAttachment[];
  documents: DocumentAttachment[];
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
 * Now uses focused services for:
 * - Form state management
 * - Model capability checking
 * - Form validation
 * - Form submission handling
 * - UI focus management
 * - State side effects
 * 
 * @param config - Form configuration options
 * @returns Form state and operations
 */
export const useMessageForm = (config: UseMessageFormConfig): UseMessageFormReturn => {
  const { onSendMessage, availableModels, loading, images, documents, selectedModel: externalSelectedModel, onModelChange, defaultModel } = config;

  // Use focused form state management
  const formState = useFormState({
    selectedModel: externalSelectedModel,
    onModelChange,
    defaultModel
  });

  // Use focused model capabilities checking
  const modelCapabilities = useModelCapabilities(availableModels, formState.selectedModel);

  // Use focused form validation
  const validation = useFormValidation({
    message: formState.message,
    images,
    documents,
    loading
  });

  // Use focused form submission
  const submission = useFormSubmission({
    onSendMessage,
    message: formState.message,
    images,
    documents,
    selectedModel: formState.selectedModel,
    useReasoning: formState.useReasoning,
    reasoningEffort: formState.reasoningEffort,
    useWebSearch: formState.useWebSearch,
    webSearchEffort: formState.webSearchEffort,
    isReasoningModel: modelCapabilities.isReasoningModel(),
    canSubmit: validation.canSubmit,
    resetMessage: formState.resetMessage
  });

  // Use focused UI focus management
  const uiFocus = useUIFocus(loading);

  // Use focused state effects management
  useStateEffects({
    selectedModel: formState.selectedModel,
    availableModels,
    useReasoning: formState.useReasoning,
    setUseReasoning: formState.setUseReasoning,
    useWebSearch: formState.useWebSearch,
    setUseWebSearch: formState.setUseWebSearch,
    isReasoningModel: modelCapabilities.isReasoningModel
  });

  return {
    // Form state
    message: formState.message,
    setMessage: formState.setMessage,
    selectedModel: formState.selectedModel,
    setSelectedModel: formState.setSelectedModel,
    useReasoning: formState.useReasoning,
    setUseReasoning: formState.setUseReasoning,
    reasoningEffort: formState.reasoningEffort,
    setReasoningEffort: formState.setReasoningEffort,
    useWebSearch: formState.useWebSearch,
    setUseWebSearch: formState.setUseWebSearch,
    webSearchEffort: formState.webSearchEffort,
    setWebSearchEffort: formState.setWebSearchEffort,
    
    // Helper functions
    isReasoningModel: modelCapabilities.isReasoningModel,
    supportsEffortControl: modelCapabilities.supportsEffortControl,
    supportsWebEffortControl: modelCapabilities.supportsWebEffortControl,
    
    // Form operations
    canSubmit: validation.canSubmit,
    handleSubmit: submission.handleSubmit,
    handleKeyDown: submission.handleKeyDown,
    
    // UI helpers
    textareaRef: uiFocus.textareaRef,
    focusTextarea: uiFocus.focusTextarea
  };
}; 