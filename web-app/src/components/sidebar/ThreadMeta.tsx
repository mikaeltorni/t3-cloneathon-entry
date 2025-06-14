/**
 * ThreadMeta.tsx
 * 
 * Component for displaying thread metadata (date and message count)
 * 
 * Components:
 *   ThreadMeta - Metadata display with formatted date and message count
 * 
 * Usage: <ThreadMeta date={thread.updatedAt} messageCount={thread.messages.length} />
 */

import React, { useCallback } from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the ThreadMeta component
 */
interface ThreadMetaProps {
  /** Thread update date */
  date: Date | string;
  /** Number of messages in thread */
  messageCount: number;
  /** Whether the thread is selected */
  isSelected?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component for displaying thread metadata with formatted date and message count
 * 
 * @param date - Thread update date
 * @param messageCount - Number of messages in thread
 * @param isSelected - Whether the thread is selected
 * @param className - Additional CSS classes
 * @returns JSX element containing the metadata
 */
export const ThreadMeta: React.FC<ThreadMetaProps> = ({
  date,
  messageCount,
  isSelected = false,
  className
}) => {
  /**
   * Format date for display with enhanced formatting
   */
  const formatDate = useCallback((date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}d ago`;
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }, []);

  return (
    <div className={cn('flex justify-between items-center text-xs', className)}>
      <span className={cn(
        'font-medium',
        isSelected ? 'text-blue-600' : 'text-gray-500'
      )}>
        {formatDate(date)}
      </span>
      <div className="flex items-center space-x-3">
        <span className={cn(
          'flex items-center',
          isSelected ? 'text-blue-600' : 'text-gray-500'
        )}>
          <svg 
            className="w-3 h-3 mr-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" 
              clipRule="evenodd" 
            />
          </svg>
          <span aria-label={`${messageCount} messages`}>
            {messageCount}
          </span>
        </span>
      </div>
    </div>
  );
}; 