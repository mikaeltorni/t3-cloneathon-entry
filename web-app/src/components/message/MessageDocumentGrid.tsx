/**
 * MessageDocumentGrid.tsx
 * 
 * Component for displaying document attachments in chat messages
 * 
 * Components:
 *   MessageDocumentGrid
 * 
 * Usage: <MessageDocumentGrid documents={documents} />
 */
import React, { useMemo } from 'react';
import { getDocumentIcon, getFileTypeDisplay, formatFileSize } from '../../utils/documentUtils';
import type { DocumentAttachment } from '../../../../src/shared/types';

interface MessageDocumentGridProps {
  /** Array of document attachments */
  documents?: DocumentAttachment[];
  /** Whether this is a user message (affects styling) */
  isUserMessage?: boolean;
}

/**
 * Document grid component for message attachments
 * 
 * @param documents - Array of document attachments
 * @returns React component
 */
export const MessageDocumentGrid: React.FC<MessageDocumentGridProps> = ({
  documents,
  isUserMessage = false
}) => {
  /**
   * Memoized document grid rendering
   */
  const documentGrid = useMemo(() => {
    if (!documents || documents.length === 0) return null;

    // Style based on message type
    const containerClasses = isUserMessage
      ? "mb-3 space-y-2"
      : "mb-3 space-y-2";
    
    const itemClasses = isUserMessage
      ? "flex items-center gap-3 p-3 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-300 border-opacity-50 transition-colors hover:bg-opacity-30"
      : "flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100";
    
    const nameClasses = isUserMessage
      ? "text-sm font-medium text-white truncate"
      : "text-sm font-medium text-gray-900 truncate";
    
    const detailsClasses = isUserMessage
      ? "text-xs text-blue-100"
      : "text-xs text-gray-500";

    return (
      <div className={containerClasses}>
        {documents.map((document, index) => (
          <div 
            key={`${document.id}-${index}`} 
            className={itemClasses}
          >
            {/* Document Icon */}
            <div className="flex-shrink-0">
              {getDocumentIcon(document.category, document.type)}
            </div>
            
            {/* Document Info */}
            <div className="min-w-0 flex-1">
              <div className={nameClasses}>
                {document.name}
              </div>
              <div className={detailsClasses}>
                {getFileTypeDisplay(document.type)} • {formatFileSize(document.size)}
              </div>
            </div>
            
            {/* Attachment Indicator */}
            <div className="flex-shrink-0">
              <div 
                className={`w-2 h-2 rounded-full ${isUserMessage ? 'bg-green-300' : 'bg-green-500'}`}
                title="Successfully attached"
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [documents]);

  return documentGrid;
}; 