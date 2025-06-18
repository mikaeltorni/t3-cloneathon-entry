/**
 * ImageAttachments.tsx
 * 
 * Simplified image attachments component with upload progress support
 * Enhanced with comprehensive dark mode support
 * Drop functionality moved to global drop zone in ChatInterface
 * 
 * Components:
 *   ImageAttachments
 * 
 * Usage: <ImageAttachments images={images} onImagesChange={setImages} disabled={loading} />
 */

import React, { useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { useLogger } from '../hooks/useLogger';
import type { ImageAttachment } from '../../../src/shared/types';

interface ImageAttachmentsProps {
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_IMAGES = 5;

/**
 * Simplified image attachments component with upload progress support and dark mode
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
  const { debug } = useLogger('ImageAttachments');

  /**
   * Remove image attachment
   * 
   * @param imageId - ID of image to remove
   */
  const removeImage = useCallback((imageId: string) => {
    debug(`Removing image: ${imageId}`);
    onImagesChange(images.filter(img => img.id !== imageId));
  }, [images, onImagesChange, debug]);

  // Don't render anything if no images
  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Image Previews */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Attached Images ({images.length}/{MAX_IMAGES})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {images.map((image) => {
            const { isUploading, progress = 0, error } = image;
            
            return (
              <div key={image.id} className="relative group">
                <div className={`aspect-square rounded-lg overflow-hidden border relative ${
                  error ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : 
                  isUploading ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' : 
                  'border-gray-200 bg-gray-100 dark:border-slate-600 dark:bg-slate-700'
                }`}>
                  {/* Image or Upload State */}
                  {isUploading && !image.url ? (
                    // Upload in progress - no image yet
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {progress}%
                        </div>
                      </div>
                    </div>
                  ) : error ? (
                    // Error state
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                        <div className="text-xs text-red-600 dark:text-red-400 text-center px-1">
                          Error
                        </div>
                      </div>
                    </div>
                  ) : image.url ? (
                    // Image loaded
                    <>
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Upload overlay for completed upload with progress animation */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 dark:bg-blue-600 dark:bg-opacity-30 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 dark:bg-slate-800 dark:bg-opacity-90 rounded-full p-1 flex items-center gap-1">
                            <Loader2 className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback state
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
                      <div className="text-xs text-gray-500 dark:text-slate-400">No preview</div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-200 dark:bg-slate-600 h-1">
                      <div 
                        className="bg-blue-500 dark:bg-blue-400 h-1 transition-all duration-300 ease-out"
                        style={{ width: `${Math.max(progress, 3)}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  disabled={disabled}
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-opacity ${
                    error ? 'bg-red-500 hover:bg-red-600 text-white opacity-100 dark:bg-red-600 dark:hover:bg-red-700' :
                    isUploading ? 'bg-blue-500 hover:bg-blue-600 text-white opacity-80 hover:opacity-100 dark:bg-blue-600 dark:hover:bg-blue-700' :
                    'bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 dark:bg-red-600 dark:hover:bg-red-700'
                  }`}
                  title="Remove image"
                >
                  ×
                </button>
                
                {/* Image Info */}
                <div className="mt-1 text-xs text-gray-500 dark:text-slate-400 truncate">
                  <p className={`truncate ${
                    error ? 'text-red-600 dark:text-red-400' : 
                    isUploading ? 'text-blue-600 dark:text-blue-400' : 
                    'text-gray-500 dark:text-slate-400'
                  }`}>
                    {image.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span>{(image.size / 1024).toFixed(1)}KB</span>
                    {error && (
                      <span className="text-red-600 dark:text-red-400 text-xs">Failed</span>
                    )}
                    {isUploading && (
                      <span className="text-blue-600 dark:text-blue-400 text-xs">Uploading...</span>
                    )}
                  </div>
                  {error && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1 truncate" title={error}>
                      {error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 