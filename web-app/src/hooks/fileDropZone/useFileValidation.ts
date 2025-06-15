/**
 * useFileValidation.ts
 * 
 * Focused hook for file validation and type checking
 * 
 * Hook:
 *   useFileValidation
 * 
 * Features:
 *   - File type validation
 *   - Size limit enforcement
 *   - Count limit checking
 *   - Supported format detection
 * 
 * Usage: import { useFileValidation } from '../hooks/fileDropZone/useFileValidation'
 */
import { useCallback } from 'react';
import { useLogger } from '../useLogger';

/**
 * Supported file types configuration
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/json',
  'text/csv',
  'text/xml',
  'application/xml',
  'text/html',
  'application/javascript',
  'application/typescript',
  'text/css',
  'application/yaml',
  'text/yaml',
  'application/x-yaml',
] as const;

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB for images
  DOCUMENT_MAX_SIZE: 50 * 1024 * 1024, // 50MB for documents
} as const;

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  fileType: 'image' | 'document' | 'unsupported';
  error?: string;
  reason?: 'size' | 'type' | 'count';
}

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  currentImageCount: number;
  currentDocumentCount: number;
  maxImages?: number;
  maxDocuments?: number;
}

/**
 * Return interface for useFileValidation hook
 */
export interface UseFileValidationReturn {
  validateFile: (file: File, config: FileValidationConfig) => FileValidationResult;
  isImageType: (type: string) => boolean;
  isDocumentType: (type: string) => boolean;
  getFileTypeCategory: (type: string) => 'image' | 'document' | 'unsupported';
  formatFileSize: (bytes: number) => string;
  getSupportedTypesMessage: () => string;
}

/**
 * Hook for file validation and type checking
 * 
 * Provides comprehensive file validation including:
 * - File type detection and validation
 * - Size limit enforcement
 * - Count limit checking
 * - User-friendly error messages
 * 
 * @returns File validation operations
 */
export function useFileValidation(): UseFileValidationReturn {
  const { debug, error } = useLogger('useFileValidation');

  /**
   * Check if file type is a supported image
   */
  const isImageType = useCallback((type: string): boolean => {
    return SUPPORTED_IMAGE_TYPES.includes(type as any);
  }, []);

  /**
   * Check if file type is a supported document
   */
  const isDocumentType = useCallback((type: string): boolean => {
    return SUPPORTED_DOCUMENT_TYPES.includes(type as any);
  }, []);

  /**
   * Get file type category
   */
  const getFileTypeCategory = useCallback((type: string): 'image' | 'document' | 'unsupported' => {
    if (isImageType(type)) return 'image';
    if (isDocumentType(type)) return 'document';
    return 'unsupported';
  }, [isImageType, isDocumentType]);

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }, []);

  /**
   * Get supported file types message
   */
  const getSupportedTypesMessage = useCallback((): string => {
    return 'Supported: Images (JPG, PNG, GIF, WebP), Documents (PDF, TXT, MD, JSON, CSV, XML, HTML, JS, TS, CSS, YAML)';
  }, []);

  /**
   * Validate a single file
   */
  const validateFile = useCallback((
    file: File, 
    config: FileValidationConfig
  ): FileValidationResult => {
    const { currentImageCount, currentDocumentCount, maxImages = 5, maxDocuments = 5 } = config;
    const fileType = getFileTypeCategory(file.type);

    // Check if file type is supported
    if (fileType === 'unsupported') {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'Unknown';
      return {
        isValid: false,
        fileType,
        error: `Unsupported file type: ${ext}. ${getSupportedTypesMessage()}`,
        reason: 'type'
      };
    }

    // Validate images
    if (fileType === 'image') {
      // Check count limit
      if (currentImageCount >= maxImages) {
        return {
          isValid: false,
          fileType,
          error: `Maximum ${maxImages} images allowed. Remove some images before adding more.`,
          reason: 'count'
        };
      }

      // Check size limit
      if (file.size > FILE_SIZE_LIMITS.IMAGE_MAX_SIZE) {
        return {
          isValid: false,
          fileType,
          error: `Image ${file.name} is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`,
          reason: 'size'
        };
      }
    }

    // Validate documents
    if (fileType === 'document') {
      // Check count limit
      if (currentDocumentCount >= maxDocuments) {
        return {
          isValid: false,
          fileType,
          error: `Maximum ${maxDocuments} documents allowed. Remove some documents before adding more.`,
          reason: 'count'
        };
      }

      // Check size limit
      if (file.size > FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE) {
        return {
          isValid: false,
          fileType,
          error: `Document ${file.name} is too large (${formatFileSize(file.size)}). Maximum size is 50MB.`,
          reason: 'size'
        };
      }
    }

    return {
      isValid: true,
      fileType
    };
  }, [getFileTypeCategory, formatFileSize, getSupportedTypesMessage]);

  return {
    validateFile,
    isImageType,
    isDocumentType,
    getFileTypeCategory,
    formatFileSize,
    getSupportedTypesMessage
  };
} 