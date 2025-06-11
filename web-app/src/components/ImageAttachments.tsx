/**
 * ImageAttachments.tsx
 * 
 * Drag & drop image attachment component with multiple image support
 * 
 * Components:
 *   ImageAttachments
 * 
 * Usage: <ImageAttachments images={images} onImagesChange={setImages} disabled={loading} />
 */

import React, { useCallback, useState, useRef } from 'react';
import { cn } from '../utils/cn';
import { useLogger } from '../hooks/useLogger';
import type { ImageAttachment } from '../../../src/shared/types';

interface ImageAttachmentsProps {
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 5;

/**
 * Image attachments component with drag & drop support
 * 
 * @param images - Current image attachments
 * @param onImagesChange - Callback when images change
 * @param disabled - Whether component is disabled
 * @param className - Additional CSS classes
 * @returns React element
 */
export const ImageAttachments: React.FC<ImageAttachmentsProps> = ({
  images,
  onImagesChange,
  disabled = false,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { debug, warn } = useLogger('ImageAttachments');

  /**
   * Convert File to base64 data URL
   * 
   * @param file - File to convert
   * @returns Promise with data URL
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
   * Validate and process files
   * 
   * @param files - Files to process
   */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    debug(`Processing ${fileArray.length} files`);

    // Check total count
    if (images.length + fileArray.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You can attach ${MAX_IMAGES - images.length} more.`);
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

    // Show error for unsupported files
    if (unsupportedFiles.length > 0) {
      const fileTypes = unsupportedFiles.map(name => {
        const ext = name.split('.').pop()?.toUpperCase();
        return ext || 'Unknown';
      });
      const uniqueTypes = [...new Set(fileTypes)];
      
      if (uniqueTypes.includes('PDF')) {
        setError(`PDF files ain't supported yet! 📄 Stick to images for now (JPG, PNG, GIF, WebP).`);
      } else {
        setError(`${uniqueTypes.join(', ')} files ain't supported yet! 🚫 Try images instead (JPG, PNG, GIF, WebP).`);
      }
    }

    // Add new images
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      debug(`Added ${newImages.length} new images`);
    }
  }, [images, onImagesChange, debug, warn, fileToDataUrl]);

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  /**
   * Handle file input change
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [processFiles]);

  /**
   * Remove image attachment
   * 
   * @param imageId - ID of image to remove
   */
  const removeImage = useCallback((imageId: string) => {
    debug(`Removing image: ${imageId}`);
    onImagesChange(images.filter(img => img.id !== imageId));
    setError(null);
  }, [images, onImagesChange, debug]);

  /**
   * Open file picker
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drag & Drop Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">
            {isDragOver ? '⬇️' : '📸'}
          </div>
          <div className="text-sm text-gray-600">
            {isDragOver ? (
              <p className="font-medium text-blue-600">Drop your images here!</p>
            ) : (
              <>
                <p>Drag & drop images here or{' '}
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={disabled}
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports JPG, PNG, GIF, WebP • Max {MAX_IMAGES} images • 10MB each
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Attached Images ({images.length}/{MAX_IMAGES})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  ×
                </button>
                
                {/* Image Info */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  <p className="truncate">{image.name}</p>
                  <p>{(image.size / 1024).toFixed(1)}KB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 