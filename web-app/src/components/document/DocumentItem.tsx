/**
 * DocumentItem.tsx
 * 
 * Individual document item component
 * 
 * Components:
 *   DocumentItem
 * 
 * Features:
 *   - Document icon and metadata display
 *   - Preview toggle functionality
 *   - Remove document functionality
 *   - Hover effects and transitions
 *   - Responsive layout
 * 
 * Usage: <DocumentItem document={doc} onRemove={remove} onTogglePreview={toggle} isExpanded={expanded} />
 */
import React from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { getDocumentIcon, getFileTypeDisplay, formatFileSize } from '../../utils/documentUtils';
import { DocumentPreview } from './DocumentPreview';
import type { DocumentAttachment } from '../../../../src/shared/types';

interface DocumentItemProps {
  /** Document attachment data */
  document: DocumentAttachment;
  /** Whether the preview is currently expanded */
  isExpanded: boolean;
  /** Callback to remove the document */
  onRemove: (documentId: string) => void;
  /** Callback to toggle preview visibility */
  onTogglePreview: (documentId: string) => void;
}

/**
 * Individual document item component
 * 
 * @param document - Document attachment data
 * @param isExpanded - Whether preview is expanded
 * @param onRemove - Remove document callback
 * @param onTogglePreview - Toggle preview callback
 * @returns React component displaying document item
 */
export const DocumentItem: React.FC<DocumentItemProps> = React.memo(({
  document,
  isExpanded,
  onRemove,
  onTogglePreview
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
          {/* Preview Toggle */}
          <button
            onClick={() => onTogglePreview(document.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title={isExpanded ? "Hide preview" : "Show preview"}
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          
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
      
      {/* Content Preview */}
      <DocumentPreview 
        content={document.content}
        isExpanded={isExpanded}
      />
    </div>
  );
});

DocumentItem.displayName = 'DocumentItem'; 