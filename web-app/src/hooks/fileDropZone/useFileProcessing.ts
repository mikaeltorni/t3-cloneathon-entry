/**
 * useFileProcessing.ts
 * 
 * Focused hook for file processing and attachment creation
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
  processImageFile: (file: File) => Promise<FileProcessingResult>;
  processDocumentFile: (file: File) => Promise<FileProcessingResult>;
  fileToDataUrl: (file: File) => Promise<string>;
  fileToText: (file: File) => Promise<string>;
}

export function useFileProcessing(): UseFileProcessingReturn {
  const { debug, warn } = useLogger('useFileProcessing');

  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const fileToText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  const processDocumentOnServer = useCallback(async (file: File): Promise<DocumentAttachment | null> => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }
      
      const result = await response.json();
      return result.document;
    } catch (error) {
      warn(`Server document processing failed for ${file.name}:`, error);
      return null;
    }
  }, [warn]);

  const processDocumentLocally = useCallback(async (file: File): Promise<DocumentAttachment | null> => {
    try {
      const content = await fileToText(file);
      const dataUrl = await fileToDataUrl(file);
      
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

  const processImageFile = useCallback(async (file: File): Promise<FileProcessingResult> => {
    try {
      debug(`Processing image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      
      const dataUrl = await fileToDataUrl(file);
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

  const processDocumentFile = useCallback(async (file: File): Promise<FileProcessingResult> => {
    try {
      debug(`Processing document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      
      let document: DocumentAttachment | null = null;
      
      if (file.type === 'application/pdf') {
        document = await processDocumentOnServer(file);
      } else {
        document = await processDocumentLocally(file);
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
    fileToText
  };
}
