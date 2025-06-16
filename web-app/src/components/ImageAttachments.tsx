/**
 * ImageAttachments.tsx
 * 
 * Simplified image attachments component - now just shows image previews
 * Drop functionality moved to global drop zone in ChatInterface
 * 
 * Components:
 *   ImageAttachments
 * 
 * Usage: <ImageAttachments images={images} onImagesChange={setImages} disabled={loading} />
 */

import React, { useCallback } from 'react';
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
 * Simplified image attachments component - previews only
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
        <h4 className="text-sm font-medium text-gray-700">
          Attached Images ({images.length}/{MAX_IMAGES})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
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
    </div>
  );
}; 