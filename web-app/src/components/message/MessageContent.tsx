/**
 * MessageContent.tsx
 * 
 * Component for rendering message content with markdown support
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   MessageContent
 * 
 * Usage: <MessageContent content={content} annotations={annotations} isUserMessage={isUserMessage} />
 */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyButton } from '../ui/CopyButton';
import type { WebSearchAnnotation } from '../../../../src/shared/types';

interface MessageContentProps {
  content: string;
  annotations?: WebSearchAnnotation[];
  isUserMessage?: boolean;
  hasReasoning?: boolean;
}

/**
 * Message content component with markdown support
 * Enhanced with comprehensive dark mode support
 * 
 * @param content - Message content
 * @param annotations - Message annotations for citations
 * @param isUserMessage - Whether this is a user message
 * @param hasReasoning - Whether the message has reasoning content
 * @returns React component
 */
export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  annotations,
  isUserMessage = false,
  hasReasoning = false
}) => {
  /**
   * Process message content to add brackets around citations
   */
  const processedContent = useMemo(() => {
    if (!annotations || annotations.length === 0) {
      return content;
    }

    let processedContent = content;
    const urlCitations = annotations.filter(
      (annotation): annotation is WebSearchAnnotation => 
        annotation.type === 'url_citation' && !!annotation.url_citation
    );

    // Sort citations by start_index in descending order to process from end to beginning
    // This prevents index shifting when inserting brackets
    urlCitations
      .sort((a, b) => b.url_citation.start_index - a.url_citation.start_index)
      .forEach(annotation => {
        const { start_index, end_index, url } = annotation.url_citation;
        const citedText = processedContent.slice(start_index, end_index);
        const bracketedCitation = `[${citedText}](${url})`;
        processedContent = processedContent.slice(0, start_index) + bracketedCitation + processedContent.slice(end_index);
      });

    return processedContent;
  }, [content, annotations]);

  const contentStyles = isUserMessage
    ? 'text-sm leading-relaxed whitespace-pre-wrap break-words'
    : `text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words ${
        hasReasoning ? 'mt-3 pt-3 border-t border-gray-100 dark:border-slate-600' : ''
      }`;

  return (
    <div className={contentStyles}>
      <ReactMarkdown
        components={{
          // Style markdown elements with dark mode support
          p: ({ children }) => <p className="mb-2">{children}</p>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-slate-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-slate-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-slate-100">{children}</h3>,
          strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-slate-100">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className, ...props }) => {
            const codeString = Array.isArray(children) ? children.join('') : String(children);
            
            // Check if this is inline code (no className means inline, className means block)
            const isInline = !className;
            
            if (isInline) {
              // Inline code - highlighted background, no copy button
              return (
                <code className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded font-mono text-sm border border-blue-200 dark:border-blue-700">
                  {children}
                </code>
              );
            }
            
            // Code blocks - minimal container with subtle outline and copy button
            return (
              <div className="relative group my-2">
                <CopyButton text={codeString} />
                <pre className="font-mono text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-3 overflow-x-auto">
                  {codeString}
                </pre>
              </div>
            );
          },
          // Style citation links to look like simple bracketed text with dark mode
          a: ({ href, children }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 no-underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}; 