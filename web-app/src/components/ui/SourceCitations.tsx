/**
 * SourceCitations.tsx
 * 
 * Component for displaying web search source citation buttons
 * 
 * Components:
 *   SourceCitations
 * 
 * Features:
 *   - Numbered citation buttons (1, 2, 3, etc.)
 *   - Opens URLs in new tabs
 *   - Hover tooltips showing source titles
 *   - Responsive layout with proper spacing
 *   - Accessible keyboard navigation
 * 
 * Usage: <SourceCitations annotations={message.annotations} />
 */
import React, { useCallback } from 'react';
import { cn } from '../../utils/cn';
import type { WebSearchAnnotation } from '../../../../src/shared/types';

interface SourceCitationsProps {
  annotations?: WebSearchAnnotation[];
  className?: string;
}

/**
 * SourceCitations component for displaying web search citation buttons
 * 
 * Renders numbered buttons for each unique URL citation from web search results.
 * Each button opens the source URL in a new tab when clicked.
 * 
 * @param annotations - Array of web search annotations with URL citations
 * @param className - Additional CSS classes
 * @returns React component
 */
export const SourceCitations: React.FC<SourceCitationsProps> = ({
  annotations,
  className
}) => {
  /**
   * Handle opening a source URL in a new tab
   */
  const handleOpenSource = useCallback((url: string, title: string) => {
    // Open in new tab with security measures
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // Fallback if popup was blocked
      console.warn('Failed to open source URL:', url);
    }
  }, []);

  // Filter and deduplicate URL citations
  const urlCitations = React.useMemo(() => {
    if (!annotations || annotations.length === 0) return [];
    
    const uniqueUrls = new Map<string, WebSearchAnnotation>();
    
    annotations.forEach(annotation => {
      if (annotation.type === 'url_citation' && annotation.url_citation) {
        const url = annotation.url_citation.url;
        if (!uniqueUrls.has(url)) {
          uniqueUrls.set(url, annotation);
        }
      }
    });
    
    return Array.from(uniqueUrls.values());
  }, [annotations]);

  // Don't render if no citations
  if (urlCitations.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100', className)}>
      <span className="text-xs font-medium text-gray-500 mr-1">Sources:</span>
      {urlCitations.map((annotation, index) => {
        const citation = annotation.url_citation;
        const citationNumber = index + 1;
        
        return (
          <button
            key={`${citation.url}-${index}`}
            onClick={() => handleOpenSource(citation.url, citation.title)}
            className={cn(
              'inline-flex items-center justify-center',
              'w-6 h-6 text-xs font-medium',
              'bg-blue-100 text-blue-700 border border-blue-200',
              'rounded-full hover:bg-blue-200 hover:border-blue-300',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'transition-all duration-150',
              'cursor-pointer'
            )}
            title={`Source ${citationNumber}: ${citation.title}`}
            aria-label={`Open source ${citationNumber}: ${citation.title}`}
          >
            {citationNumber}
          </button>
        );
      })}
    </div>
  );
}; 