/**
 * DocumentPreview.tsx
 * 
 * Component for displaying document content preview
 * 
 * Components:
 *   DocumentPreview
 * 
 * Features:
 *   - Expandable content preview
 *   - Content truncation for large files
 *   - Styled code display with scrolling
 *   - Responsive design
 * 
 * Usage: <DocumentPreview content={doc.content} isExpanded={expanded} />
 */
import React from 'react';

interface DocumentPreviewProps {
  /** Document content to preview */
  content: string;
  /** Whether the preview is currently expanded */
  isExpanded: boolean;
}

/**
 * Document content preview component
 * 
 * @param content - Document content string
 * @param isExpanded - Whether preview should be shown
 * @returns React component displaying document content or null
 */
export const DocumentPreview: React.FC<DocumentPreviewProps> = React.memo(({
  content,
  isExpanded
}) => {
  if (!isExpanded) return null;

  // Truncate content if too long for preview
  const displayContent = content.length > 1000 
    ? `${content.slice(0, 1000)}...\n\n[Content truncated for preview]`
    : content;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-xs text-gray-500 mb-2">Content Preview:</div>
      <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
          {displayContent}
        </pre>
      </div>
    </div>
  );
});

DocumentPreview.displayName = 'DocumentPreview'; 