/**
 * GlobalDragOverlay.tsx
 * 
 * Global drag overlay component for file drop feedback
 * Enhanced with comprehensive dark mode support
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
 * Usage: <GlobalDragOverlay isVisible={isDragging} />
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface GlobalDragOverlayProps {
  /** Whether the drag overlay should be visible */
  isVisible: boolean;
  className?: string;
}

/**
 * Global drag overlay for file drop feedback
 * Enhanced with dark mode support
 * 
 * @param isVisible - Whether overlay should be visible
 * @param className - Additional CSS classes
 * @returns React component
 */
export const GlobalDragOverlay: React.FC<GlobalDragOverlayProps> = ({
  isVisible,
  className
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'bg-blue-500 bg-opacity-20 backdrop-blur-sm',
      'dark:bg-blue-600 dark:bg-opacity-30',
      'animate-in fade-in duration-200',
      className
    )}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md mx-4 text-center border dark:border-slate-600">
        {/* Upload Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3">
          Drop files to upload
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
          Release to add images and documents to your message
        </p>

        {/* Supported formats */}
        <div className="space-y-2 text-xs text-gray-500 dark:text-slate-400">
          <div>📸 Images: JPG, PNG, GIF, WebP</div>
          <div>📄 Documents: PDF, TXT, MD, JSON, CSV</div>
        </div>
      </div>
    </div>
  );
};

GlobalDragOverlay.displayName = 'GlobalDragOverlay'; 