/**
 * DocumentAttachments.tsx
 * 
 * Component for displaying and managing document attachments
 * 
 * Components:
 *   DocumentAttachments
 * 
 * Features:
 *   - Display document attachments with icons
 *   - Preview document content
 *   - Remove document functionality
 *   - Responsive design
 *   - File type-specific icons
 * 
 * Usage: <DocumentAttachments documents={documents} onDocumentsChange={setDocuments} />
 */
import React, { useState } from 'react';
import { FileText, File, FileCode, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn';
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
 * Get appropriate icon for document type
 */
const getDocumentIcon = (category: string, type: string) => {
  switch (category) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'markdown':
      return <FileCode className="w-5 h-5 text-blue-500" />;
    case 'text':
      if (type.includes('json')) {
        return <FileCode className="w-5 h-5 text-yellow-500" />;
      }
      if (type.includes('html') || type.includes('css') || type.includes('javascript')) {
        return <FileCode className="w-5 h-5 text-green-500" />;
      }
      return <FileText className="w-5 h-5 text-gray-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
};

/**
 * Get display name for file type
 */
const getFileTypeDisplay = (type: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'Text',
    'text/markdown': 'Markdown',
    'text/x-markdown': 'Markdown',
    'application/json': 'JSON',
    'text/csv': 'CSV',
    'text/xml': 'XML',
    'application/xml': 'XML',
    'text/html': 'HTML',
    'application/javascript': 'JavaScript',
    'application/typescript': 'TypeScript',
    'text/css': 'CSS',
    'application/yaml': 'YAML',
    'text/yaml': 'YAML',
  };
  
  return typeMap[type] || type.split('/').pop()?.toUpperCase() || 'Unknown';
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * DocumentAttachments component
 * 
 * Displays a list of document attachments with preview and removal functionality
 * 
 * @param documents - Array of document attachments
 * @param onDocumentsChange - Callback when documents are modified
 * @param className - Additional CSS classes
 * @returns React component
 */
export const DocumentAttachments: React.FC<DocumentAttachmentsProps> = ({
  documents,
  onDocumentsChange,
  className
}) => {
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null);

  /**
   * Remove a document from the list
   */
  const handleRemoveDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsChange(updatedDocuments);
  };

  /**
   * Toggle document content preview
   */
  const handleTogglePreview = (documentId: string) => {
    setExpandedDocument(expandedDocument === documentId ? null : documentId);
  };

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
          <div
            key={document.id}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
          >
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
                  onClick={() => handleTogglePreview(document.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title={expandedDocument === document.id ? "Hide preview" : "Show preview"}
                >
                  {expandedDocument === document.id ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveDocument(document.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Content Preview */}
            {expandedDocument === document.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Content Preview:</div>
                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {document.content.length > 1000 
                      ? `${document.content.slice(0, 1000)}...\n\n[Content truncated for preview]`
                      : document.content
                    }
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 