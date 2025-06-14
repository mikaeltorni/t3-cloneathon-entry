/**
 * useGlobalFileDropZone.ts
 * 
 * Custom hook for global drag-and-drop functionality with document support
 * 
 * Hook:
 *   useGlobalFileDropZone
 * 
 * Features:
 *   - Global drag-and-drop zone for images and documents
 *   - Visual feedback during drag operations
 *   - File processing and validation for multiple types
 *   - PDF text extraction support
 *   - Excludes specific areas (like sidebar)
 * 
 * Usage: const { isDragOver, dropHandlers } = useGlobalFileDropZone(onFilesAdd);
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogger } from './useLogger';
import type { ImageAttachment, DocumentAttachment } from '../../../src/shared/types';

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const SUPPORTED_DOCUMENT_TYPES = [
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
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for documents, 10MB for images

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
 * Custom hook for global drag-and-drop functionality with document support
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
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const { debug, warn } = useLogger('useGlobalFileDropZone');

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
   * Read text content from file
   */
  const fileToText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  /**
   * Send document to backend for processing
   */
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

  /**
   * Process document locally (for text files)
   */
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
        content: content.slice(0, 100000), // Limit content length
        category: file.type.includes('markdown') ? 'markdown' : 'text'
      };
      
      return document;
    } catch (error) {
      warn(`Local document processing failed for ${file.name}:`, error);
      return null;
    }
  }, [fileToText, fileToDataUrl, warn]);

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

    const newImages: ImageAttachment[] = [];
    const newDocuments: DocumentAttachment[] = [];
    const unsupportedFiles: string[] = [];

    for (const file of fileArray) {
      // Check if it's an image
      if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        // Check image count limit
        if (currentImageCount + newImages.length >= maxImages) {
          warn(`Maximum ${maxImages} images allowed. Some images were skipped.`);
          continue;
        }

        // Check file size for images (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          warn(`Image ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
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
          warn(`Failed to process image ${file.name}:`, error);
        }
      }
      // Check if it's a document
      else if (SUPPORTED_DOCUMENT_TYPES.includes(file.type)) {
        // Check document count limit
        if (currentDocumentCount + newDocuments.length >= maxDocuments) {
          warn(`Maximum ${maxDocuments} documents allowed. Some documents were skipped.`);
          continue;
        }

        // Check file size for documents (50MB limit)
        if (file.size > MAX_FILE_SIZE) {
          warn(`Document ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`);
          continue;
        }

        try {
          let document: DocumentAttachment | null = null;
          
          // For PDFs, send to server for processing
          if (file.type === 'application/pdf') {
            document = await processDocumentOnServer(file);
          } else {
            // For text files, process locally
            document = await processDocumentLocally(file);
          }
          
          if (document) {
            newDocuments.push(document);
            debug(`Processed document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
          }
        } catch (error) {
          warn(`Failed to process document ${file.name}:`, error);
        }
      } else {
        unsupportedFiles.push(file.name);
      }
    }

    // Show warning for unsupported files
    if (unsupportedFiles.length > 0) {
      const fileTypes = unsupportedFiles.map(name => {
        const ext = name.split('.').pop()?.toUpperCase();
        return ext || 'Unknown';
      });
      const uniqueTypes = [...new Set(fileTypes)];
      warn(`Unsupported file types: ${uniqueTypes.join(', ')}. Supported: Images (JPG, PNG, GIF, WebP), Documents (PDF, TXT, MD, JSON, CSV, XML, HTML, JS, TS, CSS, YAML)`);
    }

    // Add new files
    if (newImages.length > 0) {
      onImagesAdd(newImages);
      debug(`Added ${newImages.length} new images`);
    }
    
    if (newDocuments.length > 0) {
      onDocumentsAdd(newDocuments);
      debug(`Added ${newDocuments.length} new documents`);
    }
  }, [
    currentImageCount, 
    currentDocumentCount, 
    maxImages, 
    maxDocuments, 
    onImagesAdd, 
    onDocumentsAdd, 
    debug, 
    warn, 
    fileToDataUrl,
    processDocumentOnServer,
    processDocumentLocally
  ]);

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