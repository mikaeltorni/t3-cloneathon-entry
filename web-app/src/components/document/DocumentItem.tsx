/**
 * DocumentItem.tsx
 * 
 * Individual document item component for upload area with upload progress support
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   DocumentItem
 * 
 * Features:
 *   - Document icon and metadata display
 *   - Remove document functionality
 *   - Upload progress indicator with dark mode
 *   - Error state display with dark mode
 *   - Hover effects and transitions
 *   - Responsive layout
 * 
 * Usage: <DocumentItem document={doc} onRemove={remove} />
 */
import React from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { getDocumentIcon, getFileTypeDisplay, formatFileSize } from '../../utils/documentUtils';
import type { DocumentAttachment } from '../../../../src/shared/types';

interface DocumentItemProps {
  /** Document attachment data */
  document: DocumentAttachment;
  /** Callback to remove the document */
  onRemove: (documentId: string) => void;
}

/**
 * Individual document item component with upload state support and dark mode
 * 
 * @param document - Document attachment data
 * @param onRemove - Remove document callback
 * @returns React component displaying document item with upload progress
 */
export const DocumentItem: React.FC<DocumentItemProps> = React.memo(({
  document,
  onRemove
}) => {
  const { isUploading, progress = 0, error } = document;

  return (
    <div className={`border rounded-lg p-3 shadow-sm transition-shadow ${
      error ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : 
      isUploading ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' : 
      'border-gray-200 bg-white hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:shadow-slate-700/50'
    }`}>
      {/* Document Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* File Icon with Upload State */}
          <div className="flex-shrink-0 relative">
            {isUploading ? (
              <div className="relative">
                <Loader2 className="w-6 h-6 text-blue-500 dark:text-blue-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
                </div>
              </div>
            ) : error ? (
              <div className="relative">
                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
              </div>
            ) : (
              getDocumentIcon(document.category, document.type)
            )}
          </div>
          
          {/* File Info */}
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-medium truncate ${
              error ? 'text-red-700 dark:text-red-300' : 
              isUploading ? 'text-blue-700 dark:text-blue-300' : 
              'text-gray-900 dark:text-slate-100'
            }`}>
              {document.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <span>{getFileTypeDisplay(document.type)} • {formatFileSize(document.size)}</span>
              {isUploading && (
                <span className="text-blue-600 dark:text-blue-400">
                  {progress}% uploaded
                </span>
              )}
            </div>
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Remove Button */}
          <button
            onClick={() => onRemove(document.id)}
            className={`p-1.5 rounded-md transition-colors ${
              error ? 'text-red-500 hover:text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900' :
              isUploading ? 'text-blue-400 hover:text-blue-500 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-900' :
              'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900'
            }`}
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
            <div 
              className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

DocumentItem.displayName = 'DocumentItem'; 