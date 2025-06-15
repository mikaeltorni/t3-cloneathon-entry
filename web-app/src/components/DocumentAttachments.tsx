/**
 * DocumentAttachments.tsx
 * 
 * Component for displaying and managing document attachments - refactored with extracted components
 * Now uses smaller, focused components and utilities for better maintainability
 * 
 * Components:
 *   DocumentAttachments
 * 
 * Features:
 *   - Composed of smaller, focused components
 *   - Uses extracted document utilities
 *   - Clean separation of concerns
 *   - Performance optimized with React.memo
 *   - Document removal functionality
 *   - Responsive design
 * 
 * Usage: <DocumentAttachments documents={documents} onDocumentsChange={setDocuments} />
 */
import React, { useCallback } from 'react';
import { cn } from '../utils/cn';
import { DocumentItem } from './document/DocumentItem';
import type { DocumentAttachment } from '../../../src/shared/types';

/**
 * Props for the DocumentAttachments component
 */
interface DocumentAttachmentsProps {
  documents: DocumentAttachment[];
  onDocumentsChange: (documents: DocumentAttachment[]) => void;
  className?: string;
}

/**
 * DocumentAttachments component
 * 
 * Displays a list of document attachments with removal functionality
 * 
 * @param documents - Array of document attachments
 * @param onDocumentsChange - Callback when documents are modified
 * @param className - Additional CSS classes
 * @returns React component
 */
export const DocumentAttachments: React.FC<DocumentAttachmentsProps> = React.memo(({
  documents,
  onDocumentsChange,
  className
}) => {
  /**
   * Remove a document from the list
   */
  const handleRemoveDocument = useCallback((documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsChange(updatedDocuments);
  }, [documents, onDocumentsChange]);

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-medium text-gray-700 mb-2">
        Documents ({documents.length})
      </div>
      
      <div className="space-y-2">
        {documents.map((document) => (
          <DocumentItem
            key={document.id}
            document={document}
            onRemove={handleRemoveDocument}
          />
        ))}
      </div>
    </div>
  );
});

DocumentAttachments.displayName = 'DocumentAttachments'; 