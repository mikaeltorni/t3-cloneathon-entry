/**
 * MessageImageGrid.tsx
 * 
 * Component for displaying images in a message
 * 
 * Components:
 *   MessageImageGrid
 * 
 * Usage: <MessageImageGrid images={images} imageUrl={imageUrl} />
 */
import React, { useState, useCallback, useMemo } from 'react';
import type { ImageAttachment } from '../../../../src/shared/types';

interface MessageImageGridProps {
  images?: ImageAttachment[];
  imageUrl?: string; // For backward compatibility
}

/**
 * Image grid component for message attachments
 * 
 * @param images - Array of image attachments
 * @param imageUrl - Single image URL (backward compatibility)
 * @returns React component
 */
export const MessageImageGrid: React.FC<MessageImageGridProps> = ({
  images,
  imageUrl
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  /**
   * Handle image loading errors
   */
  const handleImageError = useCallback((url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  }, []);

  /**
   * Memoized image grid rendering - handles both single imageUrl and multiple images
   */
  const imageGrid = useMemo(() => {
    // Handle single image (backward compatibility)
    if (imageUrl && !images) {
      return (
        <div className="mb-3">
          <img
            src={imageUrl}
            alt="Shared image"
            className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            loading="lazy"
          />
        </div>
      );
    }

    // Handle multiple images
    if (!images || images.length === 0) return null;

    return (
      <div className={`mb-3 grid gap-2 ${
        images.length === 1 
          ? 'grid-cols-1' 
          : images.length === 2 
            ? 'grid-cols-2' 
            : 'grid-cols-2 sm:grid-cols-3'
      }`}>
        {images.map((image, index) => (
          <div key={`${image.id}-${index}`} className="relative group">
            {!imageErrors[image.url] ? (
              <img
                src={image.url}
                alt={image.name || `Attachment ${index + 1}`}
                className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                onError={() => handleImageError(image.url)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-32 sm:h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [imageUrl, images, imageErrors, handleImageError]);

  return imageGrid;
}; 