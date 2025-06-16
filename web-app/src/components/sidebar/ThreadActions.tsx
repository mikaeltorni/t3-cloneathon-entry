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
import { isMobileScreen } from '../../utils/deviceUtils';
import { MobileThreadMenu } from './MobileThreadMenu';
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
  const isOnMobile = isMobileScreen();

  return (
    <div className={cn('flex items-center space-x-1 ml-2 flex-shrink-0', className)}>
      {isOnMobile ? (
        // Mobile layout: Pin left, Menu right
        <>
          {/* Pin button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin(thread.id, isPinned);
            }}
            disabled={isPinning}
            className={cn(
              'transition-all duration-200 p-2 rounded-lg',
              isPinned
                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 opacity-100'
                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50'
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
          
          {/* Mobile Menu */}
          <MobileThreadMenu
            thread={thread}
            isDeleting={isDeleting}
            isConfirmingDelete={isConfirmingDelete}
            onDelete={onDelete}
            getThreadTags={getThreadTags}
          />
        </>
      ) : (
        // Desktop layout: Delete left, Pin right (original)
        <>
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(thread.id);
            }}
            disabled={isDeleting}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg',
              isConfirmingDelete
                ? 'opacity-100 bg-red-100 text-red-600 hover:bg-red-200'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            )}
            title={isConfirmingDelete ? 'Click again to confirm delete' : 'Delete thread'}
            aria-label={isConfirmingDelete ? 'Confirm delete thread' : 'Delete thread'}
          >
            {isDeleting ? (
              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
          
          {/* Pin button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin(thread.id, isPinned);
            }}
            disabled={isPinning}
            className={cn(
              'transition-all duration-200 p-2 rounded-lg',
              isPinned
                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 opacity-100'
                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50'
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
        </>
      )}
    </div>
  );
}; 