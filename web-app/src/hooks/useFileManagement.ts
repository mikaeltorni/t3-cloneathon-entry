/**
 * useFileManagement.ts
 * 
 * Custom hook for managing file attachments in chat interface
 * 
 * Hooks:
 *   useFileManagement
 * 
 * Features:
 *   - Image attachment management
 *   - Document attachment management
 *   - Global drop zone integration
 *   - File validation and limits
 *   - Performance optimized callbacks
 * 
 * Usage: const { handleImagesAdd, handleDocumentsAdd, dropZone } = useFileManagement(options);
 */
import { useCallback } from 'react';
import { useLogger } from './useLogger';
import { useGlobalFileDropZone } from './useGlobalFileDropZone';
import type { ImageAttachment, DocumentAttachment } from '../../../src/shared/types';

interface UseFileManagementOptions {
  /** Current image attachments */
  images: ImageAttachment[];
  /** Current document attachments */
  documents: DocumentAttachment[];
  /** Callback when images change */
  onImagesChange: (images: ImageAttachment[]) => void;
  /** Callback when documents change */
  onDocumentsChange: (documents: DocumentAttachment[]) => void;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum number of documents allowed */
  maxDocuments?: number;
}

interface UseFileManagementReturn {
  /** Callback to add new images */
  handleImagesAdd: (newImages: ImageAttachment[]) => void;
  /** Callback to add new documents */
  handleDocumentsAdd: (newDocuments: DocumentAttachment[]) => void;
  /** Global drop zone properties */
  dropZone: {
    isDragOver: boolean;
    dropHandlers: Record<string, (event: any) => void>;
  };
}

/**
 * Custom hook for managing file attachments
 * 
 * @param options - Configuration options for file management
 * @returns Object containing file management functions and drop zone state
 */
export function useFileManagement({
  images,
  documents,
  onImagesChange,
  onDocumentsChange,
  maxImages = 5,
  maxDocuments = 5
}: UseFileManagementOptions): UseFileManagementReturn {
  const { debug } = useLogger('useFileManagement');

  /**
   * Add new images from global drop zone
   */
  const handleImagesAdd = useCallback((newImages: ImageAttachment[]) => {
    onImagesChange([...images, ...newImages]);
    debug(`Added ${newImages.length} images via global drop zone`);
  }, [images, onImagesChange, debug]);

  /**
   * Add new documents from global drop zone
   */
  const handleDocumentsAdd = useCallback((newDocuments: DocumentAttachment[]) => {
    onDocumentsChange([...documents, ...newDocuments]);
    debug(`Added ${newDocuments.length} documents via global drop zone`);
  }, [documents, onDocumentsChange, debug]);

  /**
   * Global file drop zone for the entire chat interface (excluding sidebar)
   */
  const { isDragOver, dropHandlers } = useGlobalFileDropZone({
    onImagesAdd: handleImagesAdd,
    onDocumentsAdd: handleDocumentsAdd,
    currentImageCount: images.length,
    currentDocumentCount: documents.length,
    maxImages,
    maxDocuments,
    excludeSelector: '[data-no-drop="true"]' // Sidebar will have this attribute
  });

  return {
    handleImagesAdd,
    handleDocumentsAdd,
    dropZone: {
      isDragOver,
      dropHandlers
    }
  };
} 