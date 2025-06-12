/**
 * ChatSidebar.tsx
 * 
 * Fixed positioned sidebar component for chat thread management
 * Anchored to the left side of viewport with responsive behavior
 * 
 * Components:
 *   ChatSidebar
 * 
 * Features:
 *   - Fixed positioning that stays anchored during scrolling
 *   - Thread list with search and management
 *   - Thread deletion with confirmation
 *   - New chat creation
 *   - Loading states and empty states
 *   - Responsive design (hidden on mobile, fixed on desktop)
 *   - Real-time thread count and connection status
 */
import { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { UserProfile } from './UserProfile';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';
import type { ChatThread } from '../../../src/shared/types';

interface ChatSidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  loading: boolean;
}

/**
 * Sidebar component for chat thread management
 * 
 * @param threads - List of chat threads
 * @param currentThreadId - ID of currently selected thread
 * @param onThreadSelect - Callback for thread selection
 * @param onNewChat - Callback for new chat creation
 * @param onDeleteThread - Callback for thread deletion
 * @param loading - Loading state for threads
 * @returns React component
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewChat,
  onDeleteThread,
  loading
}) => {
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { debug, log } = useLogger('ChatSidebar');

  /**
   * Handle thread selection
   * 
   * @param threadId - ID of thread to select
   */
  const handleThreadSelect = useCallback((threadId: string) => {
    debug(`Thread selected: ${threadId}`);
    onThreadSelect(threadId);
  }, [onThreadSelect, debug]);

  /**
   * Handle new chat creation
   */
  const handleNewChat = useCallback(() => {
    debug('New chat requested');
    onNewChat();
    log('New chat created');
  }, [onNewChat, debug, log]);

  /**
   * Handle thread deletion with confirmation
   * 
   * @param threadId - ID of thread to delete
   */
  const handleDeleteThread = useCallback(async (threadId: string) => {
    if (confirmDeleteId !== threadId) {
      setConfirmDeleteId(threadId);
      debug(`Delete confirmation requested for thread: ${threadId}`);
      return;
    }

    try {
      setDeletingThreadId(threadId);
      debug(`Deleting thread: ${threadId}`);
      await onDeleteThread(threadId);
      log('Thread deleted successfully');
    } catch (error) {
      debug('Thread deletion failed', error);
    } finally {
      setDeletingThreadId(null);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, onDeleteThread, debug, log]);

  /**
   * Cancel delete confirmation
   */
  const cancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
    debug('Delete confirmation cancelled');
  }, [debug]);

  /**
   * Format date for display
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  const formatDate = useCallback((date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  }, []);

  /**
   * Truncate text to specified length
   * 
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  const truncateText = useCallback((text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  /**
   * Render individual thread item
   * 
   * @param thread - Thread to render
   * @returns React element
   */
  const renderThreadItem = useCallback((thread: ChatThread) => {
    const isSelected = thread.id === currentThreadId;
    const isDeleting = deletingThreadId === thread.id;
    const isConfirmingDelete = confirmDeleteId === thread.id;
    const lastMessage = thread.messages[thread.messages.length - 1];

    return (
      <div
        key={thread.id}
        className={cn(
          'group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border',
          isSelected
            ? 'bg-blue-50 border-blue-200 shadow-sm'
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        )}
        onClick={() => !isConfirmingDelete && handleThreadSelect(thread.id)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className={cn(
            'font-medium truncate pr-2',
            isSelected ? 'text-blue-900' : 'text-gray-900'
          )}>
            {truncateText(thread.title)}
          </h3>
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteThread(thread.id);
            }}
            disabled={isDeleting}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded',
              isConfirmingDelete
                ? 'opacity-100 bg-red-100 text-red-600'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            )}
            title={isConfirmingDelete ? 'Click again to confirm delete' : 'Delete thread'}
          >
            {isDeleting ? (
              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Last message preview */}
        {lastMessage && (
          <p className="text-sm text-gray-500 mb-2 truncate">
            {lastMessage.role === 'user' ? '👤 ' : '🤖 '}
            {truncateText(lastMessage.content, 60)}
          </p>
        )}

        {/* Thread metadata */}
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{formatDate(thread.updatedAt)}</span>
          <span>{thread.messages.length} messages</span>
        </div>

        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div className="absolute inset-0 bg-red-50 rounded-lg p-3 flex flex-col justify-center">
            <p className="text-sm text-red-800 mb-2 text-center">
              Delete this conversation?
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteThread(thread.id);
                }}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelDelete();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }, [
    currentThreadId,
    deletingThreadId,
    confirmDeleteId,
    handleThreadSelect,
    handleDeleteThread,
    cancelDelete,
    formatDate,
    truncateText
  ]);

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex justify-between">
              <div className="h-2 bg-gray-200 rounded w-16"></div>
              <div className="h-2 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <div className="text-4xl mb-3">💭</div>
      <p className="text-gray-500 text-sm mb-4">No conversations yet</p>
      <Button onClick={handleNewChat} size="sm">
        Start your first chat
      </Button>
    </div>
  );

  return (
    <div 
      className="hidden md:flex fixed left-0 top-0 w-80 bg-gray-50 border-r border-gray-200 flex-col h-full z-40"
      data-no-drop="true"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Chats</h1>
          <Button onClick={handleNewChat} size="sm">
            + New
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          OpenRouter Chat • Powered by Gemini 2.5 Flash
        </p>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          renderLoadingSkeleton()
        ) : threads.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-2">
            {threads.map(renderThreadItem)}
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <UserProfile />
    </div>
  );
}; 