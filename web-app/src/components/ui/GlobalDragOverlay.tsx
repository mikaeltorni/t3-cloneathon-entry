/**
 * GlobalDragOverlay.tsx
 * 
 * Global drag-and-drop overlay component for file uploads
 * 
 * Components:
 *   GlobalDragOverlay
 * 
 * Features:
 *   - Visual feedback during drag operations
 *   - File type and size limit information
 *   - Responsive design with centered modal
 *   - Accessibility considerations
 * 
 * Usage: <GlobalDragOverlay isVisible={isDragOver} />
 */
import React from 'react';

interface GlobalDragOverlayProps {
  /** Whether the drag overlay should be visible */
  isVisible: boolean;
}

/**
 * Global drag overlay for file drop operations
 * 
 * @param isVisible - Whether the overlay should be shown
 * @returns React component displaying drag feedback
 */
export const GlobalDragOverlay: React.FC<GlobalDragOverlayProps> = React.memo(({
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-blue-500 bg-opacity-10">
        <div className="flex items-center justify-center h-full w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4 text-center">
            <div className="flex items-center justify-center gap-4 text-5xl mb-4">
              <span role="img" aria-label="Image">📸</span>
              <span role="img" aria-label="Document">📄</span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Drop Images & Documents Here
            </h3>
            
            <p className="text-sm text-gray-600 mb-3">
              Drop your files anywhere to attach them to your message
            </p>
            
            <div className="space-y-2 text-xs text-gray-500">
              <div>
                <p className="font-medium">Images:</p>
                <p>JPG, PNG, GIF, WebP • Max 5 images • 10MB each</p>
              </div>
              
              <div className="mt-3">
                <p className="font-medium">Documents:</p>
                <p>PDF, TXT, MD, JSON, CSV, XML, HTML, JS, TS, CSS, YAML</p>
                <p>Max 5 documents • 50MB each</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GlobalDragOverlay.displayName = 'GlobalDragOverlay'; 