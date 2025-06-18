/**
 * useGlobalFileDropZone.ts
 * 
 * Refactored global drag-and-drop hook using focused services with progress tracking
 * 
 * Hook:
 *   useGlobalFileDropZone
 * 
 * Features:
 *   - Global drag-and-drop zone for images and documents
 *   - Visual feedback during drag operations
 *   - File processing and validation for multiple types
 *   - PDF text extraction support
 *   - Progress tracking for upload operations
 *   - Excludes specific areas (like sidebar)
 * 
 * Usage: const { isDragOver, dropHandlers } = useGlobalFileDropZone(onFilesAdd);
 */
import { useCallback } from 'react';
import { useLogger } from './useLogger';
import { useDragDropState, useFileOrchestrator } from './fileDropZone';
import type { ImageAttachment, DocumentAttachment } from '../../../src/shared/types';

interface UseGlobalFileDropZoneProps {
  onImagesAdd: (images: ImageAttachment[]) => void;
  onDocumentsAdd: (documents: DocumentAttachment[]) => void;
  onImagesChange?: (images: ImageAttachment[]) => void;
  onDocumentsChange?: (documents: DocumentAttachment[]) => void;
  currentImages?: ImageAttachment[];
  currentDocuments?: DocumentAttachment[];
  currentImageCount: number;
  currentDocumentCount: number;
  maxImages?: number;
  maxDocuments?: number;
  excludeSelector?: string; // CSS selector for elements to exclude from drop zone
}

interface UseGlobalFileDropZoneReturn {
  isDragOver: boolean;
  dragCounter: number;
  dropHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Custom hook for global drag-and-drop functionality with document support and progress tracking
 * 
 * Now uses focused services for:
 * - File validation and type checking
 * - File processing and attachment creation
 * - Drag and drop state management
 * - File processing orchestration with progress tracking
 * 
 * @param props Configuration for file drop zone
 * @returns Drag and drop state and handlers
 */
export function useGlobalFileDropZone({
  onImagesAdd,
  onDocumentsAdd,
  onImagesChange,
  onDocumentsChange,
  currentImages = [],
  currentDocuments = [],
  currentImageCount,
  currentDocumentCount,
  maxImages = 5,
  maxDocuments = 5,
  excludeSelector = '[data-no-drop="true"]'
}: UseGlobalFileDropZoneProps): UseGlobalFileDropZoneReturn {
  const { debug, warn } = useLogger('useGlobalFileDropZone');
  const { processFiles } = useFileOrchestrator();

  /**
   * Handle files dropped on the zone with progress tracking
   */
  const handleFilesDropped = useCallback(async (files: FileList) => {
    debug(`Processing ${files.length} dropped files`);

    const config = {
      currentImageCount,
      currentDocumentCount,
      maxImages,
      maxDocuments
    };

    try {
      const result = await processFiles(files, config, (_, progress, fileName) => {
        debug(`File ${fileName} progress: ${progress}%`);
        
        // Update progress for specific attachments if change handlers are available
        if (onImagesChange && result.temporaryImages?.length > 0) {
          const updatedImages = currentImages.map((img: ImageAttachment) => {
            const tempImg = result.temporaryImages.find(temp => temp.name === fileName);
            if (tempImg && img.id === tempImg.id) {
              return { ...img, progress };
            }
            return img;
          });
          onImagesChange(updatedImages);
        }

        if (onDocumentsChange && result.temporaryDocuments?.length > 0) {
          const updatedDocuments = currentDocuments.map((doc: DocumentAttachment) => {
            const tempDoc = result.temporaryDocuments.find(temp => temp.name === fileName);
            if (tempDoc && doc.id === tempDoc.id) {
              return { ...doc, progress };
            }
            return doc;
          });
          onDocumentsChange(updatedDocuments);
        }
      });

      // Add temporary attachments immediately for instant UI feedback
      if (result.temporaryImages.length > 0) {
        onImagesAdd(result.temporaryImages);
        debug(`Added ${result.temporaryImages.length} temporary images for progress tracking`);
      }

      if (result.temporaryDocuments.length > 0) {
        onDocumentsAdd(result.temporaryDocuments);
        debug(`Added ${result.temporaryDocuments.length} temporary documents for progress tracking`);
      }

      // Replace temporary attachments with processed ones
      if (result.processedImages.length > 0 && onImagesChange) {
        const finalImages = currentImages.map((img: ImageAttachment) => {
          const processed = result.processedImages.find(proc => 
            result.temporaryImages.some(temp => temp.id === img.id && temp.name === proc.name)
          );
          if (processed) {
            return { ...processed, isUploading: false };
          }
          return img;
        });
        onImagesChange(finalImages);
        debug(`Replaced ${result.processedImages.length} temporary images with processed ones`);
      }

      if (result.processedDocuments.length > 0 && onDocumentsChange) {
        const finalDocuments = currentDocuments.map((doc: DocumentAttachment) => {
          const processed = result.processedDocuments.find(proc => 
            result.temporaryDocuments.some(temp => temp.id === doc.id && temp.name === proc.name)
          );
          if (processed) {
            return { ...processed, isUploading: false };
          }
          return doc;
        });
        onDocumentsChange(finalDocuments);
        debug(`Replaced ${result.processedDocuments.length} temporary documents with processed ones`);
      }

      // Handle errors by marking failed uploads
      if (result.errors.length > 0) {
        result.errors.forEach(error => warn(error));
        
        // Mark failed files in current attachments
        if (onImagesChange) {
          const failedImages = currentImages.map((img: ImageAttachment) => {
            const failed = result.skippedFiles.includes(img.name);
            if (failed && img.isUploading) {
              return { ...img, isUploading: false, error: 'Processing failed' };
            }
            return img;
          });
          onImagesChange(failedImages);
        }

        if (onDocumentsChange) {
          const failedDocuments = currentDocuments.map((doc: DocumentAttachment) => {
            const failed = result.skippedFiles.includes(doc.name);
            if (failed && doc.isUploading) {
              return { ...doc, isUploading: false, error: 'Processing failed' };
            }
            return doc;
          });
          onDocumentsChange(failedDocuments);
        }
      }

      // Log skipped files
      if (result.skippedFiles.length > 0) {
        debug(`Skipped files: ${result.skippedFiles.join(', ')}`);
      }
    } catch (error) {
      warn('Unexpected error during file processing:', error);
    }
  }, [
    currentImageCount,
    currentDocumentCount,
    maxImages,
    maxDocuments,
    onImagesAdd,
    onDocumentsAdd,
    onImagesChange,
    onDocumentsChange,
    currentImages,
    currentDocuments,
    processFiles,
    debug,
    warn
  ]);

  // Use focused drag and drop state management
  const { isDragOver, dragCounter, dropHandlers } = useDragDropState({
    excludeSelector,
    onFilesDropped: handleFilesDropped
  });

  return {
    isDragOver,
    dragCounter,
    dropHandlers
  };
} 