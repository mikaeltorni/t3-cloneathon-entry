/**
 * MessageMeta.tsx
 * 
 * Component for displaying message metadata (timestamp, copy button)
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   MessageMeta
 * 
 * Usage: <MessageMeta timestamp={timestamp} content={content} isUserMessage={isUserMessage} />
 */
import React, { useCallback, useMemo } from 'react';

interface MessageMetaProps {
  timestamp: Date | string | number;
  content: string;
  isUserMessage?: boolean;
}

/**
 * Message metadata component (timestamp and copy functionality)
 * Enhanced with comprehensive dark mode support
 * 
 * @param timestamp - Message timestamp as Date object, string, or number
 * @param content - Message content for copying
 * @param isUserMessage - Whether this is a user message
 * @returns React component
 */
export const MessageMeta: React.FC<MessageMetaProps> = ({
  timestamp,
  content,
  isUserMessage = false
}) => {
  /**
   * Handle copying message content to clipboard
   */
  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, [content]);

  /**
   * Format timestamp for display
   */
  const formattedTime = useMemo(() => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [timestamp]);

  const justifyClass = isUserMessage ? 'justify-end' : 'justify-start';
  const orderClass = isUserMessage ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${justifyClass}`}>
      <div className={`flex items-center gap-2 ${orderClass}`}>
        <span className="text-xs text-gray-500 dark:text-slate-400">{formattedTime}</span>
        <button
          onClick={handleCopyMessage}
          className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
          title="Copy message"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}; 