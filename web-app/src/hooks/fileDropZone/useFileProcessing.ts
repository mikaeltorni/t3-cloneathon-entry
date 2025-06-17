/**
 * useFileProcessing.ts
 * 
 * Focused hook for file processing and attachment creation with upload progress tracking
 */
import { useCallback } from 'react';
import { useLogger } from '../useLogger';
import type { ImageAttachment, DocumentAttachment } from '../../../../src/shared/types';

export interface FileProcessingResult {
  success: boolean;
  attachment?: ImageAttachment | DocumentAttachment;
  error?: string;
}

export interface UseFileProcessingReturn {
  processImageFile: (file: File, onProgress?: (progress: number) => void) => Promise<FileProcessingResult>;
  processDocumentFile: (file: File, onProgress?: (progress: number) => void) => Promise<FileProcessingResult>;
  fileToDataUrl: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  fileToText: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  createTemporaryImageAttachment: (file: File) => ImageAttachment;
  createTemporaryDocumentAttachment: (file: File) => DocumentAttachment;
}

export function useFileProcessing(): UseFileProcessingReturn {
  const { debug, warn } = useLogger('useFileProcessing');

  const fileToDataUrl = useCallback((file: File, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        onProgress?.(100);
        resolve(reader.result as string);
      };
      
      reader.onerror = reject;
      
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  const fileToText = useCallback((file: File, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        onProgress?.(100);
        resolve(reader.result as string);
      };
      
      reader.onerror = reject;
      
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      reader.readAsText(file);
    });
  }, []);

  const createTemporaryImageAttachment = useCallback((file: File): ImageAttachment => {
    return {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: '', // Will be set after processing
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true,
      progress: 0
    };
  }, []);

  const createTemporaryDocumentAttachment = useCallback((file: File): DocumentAttachment => {
    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: '', // Will be set after processing
      name: file.name,
      size: file.size,
      type: file.type,
      content: '', // Will be set after processing
      category: file.type.includes('markdown') ? 'markdown' : 
               file.type === 'application/pdf' ? 'pdf' : 
               'text',
      isUploading: true,
      progress: 0
    };
  }, []);

  const processDocumentOnServer = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<DocumentAttachment | null> => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      onProgress?.(10); // Starting upload
      
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData,
      });
      
      onProgress?.(80); // Upload complete, processing
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }
      
      const result = await response.json();
      onProgress?.(100); // Complete
      
      return result.document;
    } catch (error) {
      warn(`Server document processing failed for ${file.name}:`, error);
      return null;
    }
  }, [warn]);

  const processDocumentLocally = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<DocumentAttachment | null> => {
    try {
      onProgress?.(20); // Starting local processing
      
      const content = await fileToText(file, (textProgress) => {
        onProgress?.(20 + (textProgress * 0.4)); // 20-60% for text extraction
      });
      
      const dataUrl = await fileToDataUrl(file, (urlProgress) => {
        onProgress?.(60 + (urlProgress * 0.4)); // 60-100% for data URL
      });
      
      const document: DocumentAttachment = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: dataUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        content: content.slice(0, 100000),
        category: file.type.includes('markdown') ? 'markdown' : 'text'
      };
      
      return document;
    } catch (error) {
      warn(`Local document processing failed for ${file.name}:`, error);
      return null;
    }
  }, [fileToText, fileToDataUrl, warn]);

  const processImageFile = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<FileProcessingResult> => {
    try {
      debug(`Processing image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      
      onProgress?.(10); // Starting processing
      
      const dataUrl = await fileToDataUrl(file, (urlProgress) => {
        onProgress?.(10 + (urlProgress * 0.9)); // 10-100% for data URL
      });
      
      const imageAttachment: ImageAttachment = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: dataUrl,
        name: file.name,
        size: file.size,
        type: file.type
      };
      
      debug(`Successfully processed image: ${file.name}`);
      return {
        success: true,
        attachment: imageAttachment
      };
    } catch (error) {
      const errorMessage = `Failed to process image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      warn(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [fileToDataUrl, debug, warn]);

  const processDocumentFile = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<FileProcessingResult> => {
    try {
      debug(`Processing document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      
      let document: DocumentAttachment | null = null;
      
      if (file.type === 'application/pdf') {
        document = await processDocumentOnServer(file, onProgress);
      } else {
        document = await processDocumentLocally(file, onProgress);
      }
      
      if (document) {
        debug(`Successfully processed document: ${file.name}`);
        return {
          success: true,
          attachment: document
        };
      } else {
        const errorMessage = `Failed to process document ${file.name}: Processing returned null`;
        warn(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = `Failed to process document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      warn(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [processDocumentOnServer, processDocumentLocally, debug, warn]);

  return {
    processImageFile,
    processDocumentFile,
    fileToDataUrl,
    fileToText,
    createTemporaryImageAttachment,
    createTemporaryDocumentAttachment
  };
}
