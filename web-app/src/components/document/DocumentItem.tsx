/**
 * DocumentItem.tsx
 * 
 * Individual document item component for upload area
 * 
 * Components:
 *   DocumentItem
 * 
 * Features:
 *   - Document icon and metadata display
 *   - Remove document functionality
 *   - Hover effects and transitions
 *   - Responsive layout
 * 
 * Usage: <DocumentItem document={doc} onRemove={remove} />
 */
import React from 'react';
import { X } from 'lucide-react';
import { getDocumentIcon, getFileTypeDisplay, formatFileSize } from '../../utils/documentUtils';
import type { DocumentAttachment } from '../../../../src/shared/types';

interface DocumentItemProps {
  /** Document attachment data */
  document: DocumentAttachment;
  /** Callback to remove the document */
  onRemove: (documentId: string) => void;
}

/**
 * Individual document item component
 * 
 * @param document - Document attachment data
 * @param onRemove - Remove document callback
 * @returns React component displaying document item
 */
export const DocumentItem: React.FC<DocumentItemProps> = React.memo(({
  document,
  onRemove
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Document Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* File Icon */}
          <div className="flex-shrink-0">
            {getDocumentIcon(document.category, document.type)}
          </div>
          
          {/* File Info */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {document.name}
            </div>
            <div className="text-xs text-gray-500">
              {getFileTypeDisplay(document.type)} • {formatFileSize(document.size)}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Remove Button */}
          <button
            onClick={() => onRemove(document.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

DocumentItem.displayName = 'DocumentItem'; 