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
      const result = await processFiles(files, config);

      // Simply add processed files
      if (result.processedImages.length > 0) {
        onImagesAdd(result.processedImages);
        debug(`Added ${result.processedImages.length} processed images`);
      }

      if (result.processedDocuments.length > 0) {
        onDocumentsAdd(result.processedDocuments);
        debug(`Added ${result.processedDocuments.length} processed documents`);
      }

      // Log any errors
      if (result.errors.length > 0) {
        result.errors.forEach(error => warn(error));
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