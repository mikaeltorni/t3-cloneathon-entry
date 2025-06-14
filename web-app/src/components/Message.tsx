/**
 * Message.tsx
 * 
 * Individual message component for displaying user and assistant messages
 * 
 * Components:
 *   Message
 * 
 * Features:
 *   - User and assistant message styling
 *   - Image rendering with responsive grid
 *   - Reasoning toggle and collapsible display
 *   - Web search source citations with numbered buttons
 *   - Timestamp formatting
 *   - Copy message functionality
 *   - Performance optimized with React.memo
 *   - Markdown rendering with react-markdown
 * 
 * Usage: <Message message={message} showReasoning={showReasoning} onToggleReasoning={handleToggle} />
 */
import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../../src/shared/types';
import { CopyButton } from './ui/CopyButton';
import { SourceCitations } from './ui/SourceCitations';

interface MessageProps {
  message: ChatMessage;
  showReasoning: boolean;
  onToggleReasoning: () => void;
}

/**
 * Individual message display component
 * 
 * @param {MessageProps} props - Message properties
 * @returns {JSX.Element} Rendered message component
 */
const Message: React.FC<MessageProps> = React.memo(({ 
  message, 
  showReasoning, 
  onToggleReasoning 
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  /**
   * Handle image loading errors
   */
  const handleImageError = useCallback((imageUrl: string) => {
    setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
  }, []);

  /**
   * Handle copying message content to clipboard
   */
  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, [message.content]);

  /**
   * Format timestamp for display
   */
  const formattedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.timestamp]);

  /**
   * Memoized image grid rendering - handles both single imageUrl and multiple images
   */
  const imageGrid = useMemo(() => {
    // Handle single image (backward compatibility)
    if (message.imageUrl && !message.images) {
      return (
        <div className="mb-3">
          <img
            src={message.imageUrl}
            alt="Shared image"
            className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            loading="lazy"
          />
        </div>
      );
    }

    // Handle multiple images
    if (!message.images || message.images.length === 0) return null;

    return (
      <div className={`mb-3 grid gap-2 ${
        message.images.length === 1 
          ? 'grid-cols-1' 
          : message.images.length === 2 
            ? 'grid-cols-2' 
            : 'grid-cols-2 sm:grid-cols-3'
      }`}>
        {message.images.map((image, index) => (
          <div key={`${image.id}-${index}`} className="relative group">
            {!imageErrors[image.url] ? (
              <img
                src={image.url}
                alt={image.name || `Attachment ${index + 1}`}
                className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                onError={() => handleImageError(image.url)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-32 sm:h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [message.imageUrl, message.images, imageErrors, handleImageError]);

  /**
   * Memoized reasoning content
   */
  const reasoningContent = useMemo(() => {
    if (!message.reasoning) return null;

    return (
      <div className="mb-3">
        <button
          onClick={onToggleReasoning}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-2 transition-colors duration-200"
          aria-expanded={showReasoning}
          aria-controls={`reasoning-${message.id}`}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showReasoning ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Reasoning {showReasoning ? '(Hide)' : '(Show)'}
        </button>
        
        {showReasoning && (
          <div 
            id={`reasoning-${message.id}`}
            className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-2 duration-200"
          >
            {message.reasoning}
          </div>
        )}
      </div>
    );
  }, [message.reasoning, message.id, showReasoning, onToggleReasoning]);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-blue-600 text-white p-3 rounded-lg rounded-br-sm shadow-sm">
            {imageGrid}
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              <ReactMarkdown
                components={{
                  // Style markdown elements
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children, inline }: any) => {
                    const codeString = Array.isArray(children) ? children.join('') : String(children);
                    if (inline) {
                      return (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative group">
                        <CopyButton value={codeString} />
                        <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4">
                          <code className="text-sm font-mono">{codeString}</code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopyMessage}
              className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors duration-200"
              title="Copy message"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <span className="text-xs text-gray-500">{formattedTime}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 group">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-sm shadow-sm">
          {reasoningContent}
          <div className={`text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words ${
            message.reasoning ? 'mt-3 pt-3 border-t border-gray-100' : ''
          }`}>
            <ReactMarkdown
              components={{
                // Style markdown elements
                p: ({ children }) => <p className="mb-2">{children}</p>,
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children, inline }: any) => {
                  const codeString = Array.isArray(children) ? children.join('') : String(children);
                  if (inline) {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="relative group">
                      <CopyButton value={codeString} />
                      <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4">
                        <code className="text-sm font-mono">{codeString}</code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {/* Web Search Source Citations */}
            <SourceCitations annotations={message.annotations} />
          </div>
        </div>
        <div className="flex items-center justify-start gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-xs text-gray-500">{formattedTime}</span>
          <button
            onClick={handleCopyMessage}
            className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors duration-200"
            title="Copy message"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export { Message }; 