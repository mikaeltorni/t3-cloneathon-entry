/**
 * useFileOrchestrator.ts
 * 
 * Focused hook for orchestrating file processing operations with progress tracking support
 */
import { useCallback } from 'react';
import { useLogger } from '../useLogger';
import { useFileValidation, type FileValidationConfig } from './useFileValidation';
import { useFileProcessing } from './useFileProcessing';
import type { ImageAttachment, DocumentAttachment } from '../../../../src/shared/types';

export interface FileOrchestrationResult {
  processedImages: ImageAttachment[];
  processedDocuments: DocumentAttachment[];
  temporaryImages: ImageAttachment[];
  temporaryDocuments: DocumentAttachment[];
  errors: string[];
  skippedFiles: string[];
}

export interface UseFileOrchestratorReturn {
  processFiles: (
    files: FileList | File[], 
    config: FileValidationConfig,
    onProgress?: (fileIndex: number, progress: number, fileName: string) => void
  ) => Promise<FileOrchestrationResult>;
}

export function useFileOrchestrator(): UseFileOrchestratorReturn {
  const { debug, warn } = useLogger('useFileOrchestrator');
  const { validateFile, getSupportedTypesMessage } = useFileValidation();
  const { 
    processImageFile, 
    processDocumentFile,
    createTemporaryImageAttachment,
    createTemporaryDocumentAttachment
  } = useFileProcessing();

  const processFiles = useCallback(async (
    files: FileList | File[], 
    config: FileValidationConfig,
    onProgress?: (fileIndex: number, progress: number, fileName: string) => void
  ): Promise<FileOrchestrationResult> => {
    const fileArray = Array.from(files);
    debug(`Processing ${fileArray.length} files`);

    const result: FileOrchestrationResult = {
      processedImages: [],
      processedDocuments: [],
      temporaryImages: [],
      temporaryDocuments: [],
      errors: [],
      skippedFiles: []
    };

    const unsupportedFiles: string[] = [];
    let imageCount = config.currentImageCount;
    let documentCount = config.currentDocumentCount;

    // First pass: Create temporary attachments for valid files
    const validFiles: { file: File; validation: any; index: number }[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validation = validateFile(file, {
        ...config,
        currentImageCount: imageCount,
        currentDocumentCount: documentCount
      });

      if (!validation.isValid) {
        if (validation.reason === 'type') {
          unsupportedFiles.push(file.name);
        } else {
          result.errors.push(validation.error || `Failed to validate ${file.name}`);
          result.skippedFiles.push(file.name);
        }
        continue;
      }

      validFiles.push({ file, validation, index: i });

      // Create temporary attachments for immediate UI feedback
      if (validation.fileType === 'image') {
        const tempAttachment = createTemporaryImageAttachment(file);
        result.temporaryImages.push(tempAttachment);
        imageCount++;
      } else if (validation.fileType === 'document') {
        const tempAttachment = createTemporaryDocumentAttachment(file);
        result.temporaryDocuments.push(tempAttachment);
        documentCount++;
      }
    }

    // Second pass: Process files with progress tracking
    for (const { file, validation, index } of validFiles) {
      try {
        if (validation.fileType === 'image') {
          const processingResult = await processImageFile(file, (progress) => {
            onProgress?.(index, progress, file.name);
          });
          
          if (processingResult.success && processingResult.attachment) {
            result.processedImages.push(processingResult.attachment as ImageAttachment);
          } else {
            result.errors.push(processingResult.error || `Failed to process image ${file.name}`);
            result.skippedFiles.push(file.name);
          }
        } else if (validation.fileType === 'document') {
          const processingResult = await processDocumentFile(file, (progress) => {
            onProgress?.(index, progress, file.name);
          });
          
          if (processingResult.success && processingResult.attachment) {
            result.processedDocuments.push(processingResult.attachment as DocumentAttachment);
          } else {
            result.errors.push(processingResult.error || `Failed to process document ${file.name}`);
            result.skippedFiles.push(file.name);
          }
        }
      } catch (error) {
        const errorMessage = `Unexpected error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        warn(errorMessage);
        result.errors.push(errorMessage);
        result.skippedFiles.push(file.name);
      }
    }

    // Handle unsupported files
    if (unsupportedFiles.length > 0) {
      const fileTypes = unsupportedFiles.map(name => {
        const ext = name.split('.').pop()?.toUpperCase();
        return ext || 'Unknown';
      });
      const uniqueTypes = [...new Set(fileTypes)];
      const errorMessage = `Unsupported file types: ${uniqueTypes.join(', ')}. ${getSupportedTypesMessage()}`;
      warn(errorMessage);
      result.errors.push(errorMessage);
      result.skippedFiles.push(...unsupportedFiles);
    }

    debug(`Processing complete: ${result.processedImages.length} images, ${result.processedDocuments.length} documents, ${result.errors.length} errors`);
    
    return result;
  }, [debug, warn, validateFile, getSupportedTypesMessage, processImageFile, processDocumentFile, createTemporaryImageAttachment, createTemporaryDocumentAttachment]);

  return {
    processFiles
  };
} 