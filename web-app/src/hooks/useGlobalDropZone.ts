/**
 * useGlobalDropZone.ts
 * 
 * Custom hook for global drag-and-drop functionality
 * 
 * Hook:
 *   useGlobalDropZone
 * 
 * Features:
 *   - Global drag-and-drop zone for images
 *   - Visual feedback during drag operations
 *   - File processing and validation
 *   - Excludes specific areas (like sidebar)
 * 
 * Usage: const { isDragOver, dropHandlers } = useGlobalDropZone(onImagesAdd);
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogger } from './useLogger';
import type { ImageAttachment } from '../../../src/shared/types';

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UseGlobalDropZoneProps {
  onImagesAdd: (images: ImageAttachment[]) => void;
  currentImageCount: number;
  maxImages?: number;
  excludeSelector?: string; // CSS selector for elements to exclude from drop zone
}

interface UseGlobalDropZoneReturn {
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
 * Custom hook for global drag-and-drop functionality
 */
export function useGlobalDropZone({
  onImagesAdd,
  currentImageCount,
  maxImages = 5,
  excludeSelector = '[data-no-drop="true"]'
}: UseGlobalDropZoneProps): UseGlobalDropZoneReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const { debug, warn } = useLogger('useGlobalDropZone');

  /**
   * Convert File to base64 data URL
   */
  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Check if the drop target should be excluded
   */
  const shouldExclude = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    
    // Check if target or any parent has the exclude selector
    const excludedElement = (target as Element).closest(excludeSelector);
    return !!excludedElement;
  }, [excludeSelector]);

  /**
   * Process dropped files
   */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    debug(`Processing ${fileArray.length} files`);

    // Check total count
    if (currentImageCount + fileArray.length > maxImages) {
      warn(`Maximum ${maxImages} images allowed. You can attach ${maxImages - currentImageCount} more.`);
      return;
    }

    const newImages: ImageAttachment[] = [];
    const unsupportedFiles: string[] = [];

    for (const file of fileArray) {
      // Check file type
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        unsupportedFiles.push(file.name);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
        continue;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const imageAttachment: ImageAttachment = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: dataUrl,
          name: file.name,
          size: file.size,
          type: file.type
        };
        newImages.push(imageAttachment);
        debug(`Processed image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      } catch (error) {
        warn(`Failed to process ${file.name}:`, error);
      }
    }

    // Show warning for unsupported files
    if (unsupportedFiles.length > 0) {
      const fileTypes = unsupportedFiles.map(name => {
        const ext = name.split('.').pop()?.toUpperCase();
        return ext || 'Unknown';
      });
      const uniqueTypes = [...new Set(fileTypes)];
      warn(`Unsupported file types: ${uniqueTypes.join(', ')}. Use JPG, PNG, GIF, or WebP instead.`);
    }

    // Add new images
    if (newImages.length > 0) {
      onImagesAdd(newImages);
      debug(`Added ${newImages.length} new images`);
    }
  }, [currentImageCount, maxImages, onImagesAdd, debug, warn, fileToDataUrl]);

  /**
   * Handle drag enter event
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we should exclude this target
    if (shouldExclude(e.target)) {
      return;
    }

    // Only handle drag events with files
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragOver(true);
        debug('Drag enter - starting drag operation');
      }
    }
  }, [shouldExclude, debug]);

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we should exclude this target
    if (shouldExclude(e.target)) {
      return;
    }

    // Set the drop effect to indicate we can drop here
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [shouldExclude]);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we should exclude this target
    if (shouldExclude(e.target)) {
      return;
    }

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
      debug('Drag leave - ending drag operation');
    }
  }, [shouldExclude, debug]);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we should exclude this target
    if (shouldExclude(e.target)) {
      return;
    }

    dragCounter.current = 0;
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      debug(`Dropped ${files.length} files`);
      processFiles(files);
    }
  }, [shouldExclude, processFiles, debug]);

  // Reset drag state on mount/unmount
  useEffect(() => {
    return () => {
      dragCounter.current = 0;
      setIsDragOver(false);
    };
  }, []);

  return {
    isDragOver,
    dragCounter: dragCounter.current,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  };
} 