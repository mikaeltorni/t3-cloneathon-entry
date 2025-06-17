/**
 * ThreadActions.tsx
 * 
 * Component for thread action buttons (pin and delete)
 * 
 * Components:
 *   ThreadActions - Action buttons with loading states and confirmations
 * 
 * Usage: <ThreadActions onPin={onPin} onDelete={onDelete} isPinned={isPinned} />
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { ThreadMenu } from './ThreadMenu';
import type { ChatThread, ChatTag } from '../../../../src/shared/types';

/**
 * Props for the ThreadActions component
 */
interface ThreadActionsProps {
  /** Thread data */
  thread: ChatThread;
  /** Whether the thread is pinned */
  isPinned: boolean;
  /** Whether the thread is being deleted */
  isDeleting: boolean;
  /** Whether the thread is being pinned/unpinned */
  isPinning: boolean;
  /** Whether delete confirmation is active */
  isConfirmingDelete: boolean;
  /** Callback for pin/unpin action */
  onPin: (threadId: string, currentPinStatus: boolean) => void;
  /** Callback for delete action */
  onDelete: (threadId: string) => void;
  /** Function to get tags for this thread */
  getThreadTags?: (threadId: string) => ChatTag[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Thread action buttons component with pin and delete functionality
 * 
 * @param thread - Thread data
 * @param isPinned - Whether the thread is pinned
 * @param isDeleting - Whether the thread is being deleted
 * @param isPinning - Whether the thread is being pinned/unpinned
 * @param isConfirmingDelete - Whether delete confirmation is active
 * @param onPin - Callback for pin/unpin action
 * @param onDelete - Callback for delete action
 * @param getThreadTags - Function to get tags for this thread
 * @param className - Additional CSS classes
 * @returns JSX element containing the action buttons
 */
export const ThreadActions: React.FC<ThreadActionsProps> = ({
  thread,
  isPinned,
  isDeleting,
  isPinning,
  isConfirmingDelete,
  onPin,
  onDelete,
  getThreadTags,
  className
}) => {
  return (
    <div className={cn('flex items-center space-x-1 ml-2 flex-shrink-0', className)}>
      {/* Pin button - now on the left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPin(thread.id, isPinned);
        }}
        disabled={isPinning}
        className={cn(
          'transition-all duration-200 p-2 rounded-lg',
          isPinned
            ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 opacity-100'
            : 'opacity-0 group-hover:opacity-100 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950'
        )}
        title={isPinned ? 'Unpin conversation' : 'Pin to top'}
        aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation to top'}
      >
        {isPinning ? (
          <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
        ) : isPinned ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,4V2H10V4H4V6H5.5L6.5,17H17.5L18.5,6H20V4H14M12,7.1L16.05,11.5L15.6,12.5L12,10.4L8.4,12.5L7.95,11.5L12,7.1Z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
      </button>
      
      {/* Thread Menu - replaces delete button */}
      <ThreadMenu
        thread={thread}
        isDeleting={isDeleting}
        isConfirmingDelete={isConfirmingDelete}
        onDelete={onDelete}
        getThreadTags={getThreadTags}
      />
    </div>
  );
}; 