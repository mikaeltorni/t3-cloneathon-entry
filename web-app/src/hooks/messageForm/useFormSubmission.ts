/**
 * useFormSubmission.ts
 * 
 * Focused hook for form submission logic
 */
import { useCallback } from 'react';
import { useLogger } from '../useLogger';
import type { ImageAttachment, DocumentAttachment } from '../../../../src/shared/types';

export interface FormSubmissionConfig {
  onSendMessage: (content: string, images?: ImageAttachment[], documents?: DocumentAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  message: string;
  images: ImageAttachment[];
  documents: DocumentAttachment[];
  selectedModel: string;
  useReasoning: boolean;
  reasoningEffort: 'low' | 'medium' | 'high';
  useWebSearch: boolean;
  webSearchEffort: 'low' | 'medium' | 'high';
  isReasoningModel: boolean;
  canSubmit: boolean;
  resetMessage: () => void;
}

export interface UseFormSubmissionReturn {
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function useFormSubmission(config: FormSubmissionConfig): UseFormSubmissionReturn {
  const {
    onSendMessage,
    message,
    images,
    documents,
    selectedModel,
    useReasoning,
    reasoningEffort,
    useWebSearch,
    webSearchEffort,
    isReasoningModel,
    canSubmit,
    resetMessage
  } = config;
  
  const { debug, log } = useLogger('useFormSubmission');

  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (!canSubmit) {
      debug('Form submission blocked: invalid form state');
      return;
    }

    const trimmedMessage = message.trim();
    
    try {
      debug('Submitting message', { 
        messageLength: trimmedMessage.length, 
        imageCount: images.length,
        documentCount: documents.length,
        modelId: selectedModel,
        useReasoning: useReasoning && isReasoningModel,
        useWebSearch: useWebSearch
      });

      onSendMessage(
        trimmedMessage,
        images,
        documents,
        selectedModel,
        useReasoning && isReasoningModel,
        reasoningEffort,
        useWebSearch,
        webSearchEffort
      );

      resetMessage();
      log('Message sent successfully');
    } catch (error) {
      debug('Message submission failed', error);
    }
  }, [
    message,
    images,
    documents,
    selectedModel,
    useReasoning,
    isReasoningModel,
    reasoningEffort,
    useWebSearch,
    webSearchEffort,
    canSubmit,
    onSendMessage,
    resetMessage,
    debug,
    log
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return {
    handleSubmit,
    handleKeyDown
  };
} 