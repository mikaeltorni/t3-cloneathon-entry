/**
 * useFormValidation.ts
 * 
 * Focused hook for form validation logic
 */
import { useCallback } from 'react';
import type { ImageAttachment, DocumentAttachment } from '../../../../src/shared/types';

export interface FormValidationConfig {
  message: string;
  images: ImageAttachment[];
  documents: DocumentAttachment[];
  loading: boolean;
}

export interface UseFormValidationReturn {
  canSubmit: boolean;
  validateSubmission: () => boolean;
  getValidationErrors: () => string[];
}

export function useFormValidation(config: FormValidationConfig): UseFormValidationReturn {
  const { message, images, documents, loading } = config;

  const validateSubmission = useCallback((): boolean => {
    const hasContent = message.trim().length > 0;
    const hasAttachments = images.length > 0 || documents.length > 0;
    const isNotLoading = !loading;
    
    return (hasContent || hasAttachments) && isNotLoading;
  }, [message, images.length, documents.length, loading]);

  const canSubmit = validateSubmission();

  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (loading) {
      errors.push('Cannot submit while loading');
    }
    
    if (!message.trim() && images.length === 0 && documents.length === 0) {
      errors.push('Message content or attachments required');
    }
    
    return errors;
  }, [message, images.length, documents.length, loading]);

  return {
    canSubmit,
    validateSubmission,
    getValidationErrors
  };
}
