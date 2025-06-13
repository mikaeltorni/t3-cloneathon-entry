/**
 * ChatSidebar.tsx
 * 
 * Enhanced fixed positioned sidebar component for chat thread management
 * Now includes model information, slick design, improved UX, and pinning functionality
 * 
 * Components:
 *   ChatSidebar
 * 
 * Features:
 *   - Fixed positioning that stays anchored during scrolling
 *   - Thread list with model information and slick design
 *   - Thread deletion with confirmation
 *   - Thread pinning/unpinning with server synchronization
 *   - Pinned threads sorted to the top with visual indicators
 *   - New chat creation
 *   - Model switching per thread with caching
 *   - Loading states and empty states
 *   - Responsive design (hidden on mobile, fixed on desktop)
 *   - Real-time thread count and connection status
 *   - Clean design without robot icons
 * 
 * Usage Example:
 * ```tsx
 * const handleTogglePinThread = async (threadId: string, isPinned: boolean) => {
 *   try {
 *     // Update local state immediately for responsive UI
 *     setThreads(prev => prev.map(thread => 
 *       thread.id === threadId ? { ...thread, isPinned } : thread
 *     ));
 *     
 *     // Send to server
 *     await apiClient.patch(`/api/threads/${threadId}/pin`, { isPinned });
 *   } catch (error) {
 *     // Revert on error
 *     setThreads(prev => prev.map(thread => 
 *       thread.id === threadId ? { ...thread, isPinned: !isPinned } : thread
 *     ));
 *     throw error;
 *   }
 * };
 * 
 * <ChatSidebar
 *   threads={threads}
 *   currentThreadId={currentThreadId}
 *   onThreadSelect={handleThreadSelect}
 *   onNewChat={handleNewChat}
 *   onDeleteThread={handleDeleteThread}
 *   onTogglePinThread={handleTogglePinThread}
 *   loading={loading}
 *   isOpen={sidebarOpen}
 *   onToggle={() => setSidebarOpen(!sidebarOpen)}
 *   availableModels={models}
 *   currentModel={selectedModel}
 * />
 * ```
 */
import { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { UserProfile } from './UserProfile';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';
import type { ChatThread, ModelConfig } from '../../../src/shared/types';

interface ChatSidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  onTogglePinThread: (threadId: string, isPinned: boolean) => void;
  onRefreshThreads?: () => Promise<void>;
  loading: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  availableModels?: Record<string, ModelConfig>;
  onModelChange?: (threadId: string, modelId: string) => void;
  currentModel?: string; // Currently selected model in the main interface
}

/**
 * Enhanced sidebar component for chat thread management
 * 
 * @param threads - List of chat threads
 * @param currentThreadId - ID of currently selected thread
 * @param onThreadSelect - Callback for thread selection
 * @param onNewChat - Callback for new chat creation
 * @param onDeleteThread - Callback for thread deletion
 * @param onTogglePinThread - Callback for pinning/unpinning threads
 * @param loading - Loading state for threads
 * @param availableModels - Available models for display and selection
 * @param onModelChange - Callback when model is changed for a thread
 * @param currentModel - Currently selected model in main interface
 * @returns React component
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewChat,
  onDeleteThread,
  onTogglePinThread,
  onRefreshThreads,
  loading,
  isOpen = false,
  onClose,
  onToggle,
  availableModels = {},
  currentModel
}) => {
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pinningThreadId, setPinningThreadId] = useState<string | null>(null);

  const { debug, log } = useLogger('ChatSidebar');

  /**
   * Get model configuration by ID
   */
  const getModelConfig = useCallback((modelId: string | undefined): ModelConfig | null => {
    if (!modelId || !availableModels[modelId]) return null;
    return availableModels[modelId];
  }, [availableModels]);

  /**
   * Get the display model for a thread (prioritize currentModel, then lastUsedModel)
   */
  const getThreadDisplayModel = useCallback((thread: ChatThread): ModelConfig | null => {
    // For current thread, show the currently selected model from main interface
    if (thread.id === currentThreadId && currentModel) {
      return getModelConfig(currentModel);
    }
    
    // Otherwise, show the thread's current model or last used model
    const modelId = thread.currentModel || thread.lastUsedModel;
    return getModelConfig(modelId);
  }, [currentThreadId, currentModel, getModelConfig]);

  /**
   * Handle thread selection
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
   * Handle thread pinning/unpinning
   */
  const handleTogglePin = useCallback(async (threadId: string, currentPinStatus: boolean) => {
    try {
      setPinningThreadId(threadId);
      const newPinStatus = !currentPinStatus;
      debug(`${newPinStatus ? 'Pinning' : 'Unpinning'} thread: ${threadId}`);
      
      await onTogglePinThread(threadId, newPinStatus);
      log(`Thread ${newPinStatus ? 'pinned' : 'unpinned'} successfully`);
    } catch (error) {
      debug('Pin toggle failed', error);
    } finally {
      setPinningThreadId(null);
    }
  }, [onTogglePinThread, debug, log]);

  /**
   * Sort threads with pinned threads at the top
   */
  const sortedThreads = useCallback(() => {
    return [...threads].sort((a, b) => {
      // First, sort by pinned status (pinned threads first)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by updatedAt (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [threads]);

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

  /**
   * Truncate text to specified length
   */
  const truncateText = useCallback((text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  /**
   * Render individual thread item with enhanced design
   */
  const renderThreadItem = useCallback((thread: ChatThread) => {
    const isSelected = thread.id === currentThreadId;
    const isDeleting = deletingThreadId === thread.id;
    const isConfirmingDelete = confirmDeleteId === thread.id;
    const isPinning = pinningThreadId === thread.id;
    const isPinned = Boolean(thread.isPinned);
    const lastMessage = thread.messages[thread.messages.length - 1];
    const displayModel = getThreadDisplayModel(thread);

    return (
      <div
        key={thread.id}
        className={cn(
          'group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 mb-3',
          isSelected
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg transform scale-[1.02]'
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md',
          isPinned && 'ring-2 ring-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
        )}
        onClick={() => !isConfirmingDelete && handleThreadSelect(thread.id)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold truncate pr-2 text-base leading-tight',
              isSelected ? 'text-blue-900' : 'text-gray-900'
            )}>
              {truncateText(thread.title, 45)}
            </h3>
            
            {/* Model indicator - Always visible */}
            {displayModel && (
              <div className="flex items-center mt-1.5 mb-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: displayModel.color }}
                />
                <span 
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full truncate transition-colors duration-200',
                    isSelected 
                      ? 'shadow-sm border' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  )}
                  style={{
                    backgroundColor: isSelected ? displayModel.bgColor : undefined,
                    color: isSelected ? displayModel.textColor : undefined,
                    borderColor: isSelected ? displayModel.color : undefined
                  }}
                >
                  {displayModel.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            {/* Pin button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(thread.id, isPinned);
              }}
              disabled={isPinning}
              className={cn(
                'transition-all duration-200 p-2 rounded-lg',
                isPinned
                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 opacity-100'
                  : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50'
              )}
              title={isPinned ? 'Unpin conversation' : 'Pin to top'}
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
            
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteThread(thread.id);
              }}
              disabled={isDeleting}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg',
                isConfirmingDelete
                  ? 'opacity-100 bg-red-100 text-red-600 hover:bg-red-200'
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
        </div>

        {/* Last message preview - removed robot emoji */}
        {lastMessage && (
          <p className={cn(
            'text-sm mb-2 truncate leading-relaxed',
            isSelected ? 'text-blue-700' : 'text-gray-600'
          )}>
            <span className={cn(
              'inline-block w-5 text-xs mr-1',
              lastMessage.role === 'user' ? 'text-gray-500' : 'text-indigo-500'
            )}>
              {lastMessage.role === 'user' ? 'You:' : 'AI:'}
            </span>
            {truncateText(lastMessage.content, 55)}
          </p>
        )}

        {/* Thread metadata with enhanced styling */}
        <div className="flex justify-between items-center text-xs">
          <span className={cn(
            'font-medium',
            isSelected ? 'text-blue-600' : 'text-gray-500'
          )}>
            {formatDate(thread.updatedAt)}
          </span>
          <div className="flex items-center space-x-3">
            <span className={cn(
              'flex items-center',
              isSelected ? 'text-blue-600' : 'text-gray-500'
            )}>
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {thread.messages.length}
            </span>
          </div>
        </div>

        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div className="absolute inset-0 bg-red-50 rounded-xl p-4 flex flex-col justify-center border-2 border-red-200">
            <p className="text-sm text-red-800 mb-3 text-center font-medium">
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
    pinningThreadId,
    handleThreadSelect,
    handleDeleteThread,
    handleTogglePin,
    cancelDelete,
    formatDate,
    truncateText,
    getThreadDisplayModel
  ]);

  /**
   * Render loading skeleton with enhanced design
   */
  const renderLoadingSkeleton = () => (
    <div className="space-y-4 px-1">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded-lg mb-3"></div>
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-gray-200 rounded-full mr-2"></div>
              <div className="h-3 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded-lg w-4/5 mb-3"></div>
            <div className="flex justify-between items-center">
              <div className="h-2 bg-gray-200 rounded-full w-16"></div>
              <div className="h-2 bg-gray-200 rounded-full w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state with enhanced design
   */
  const renderEmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className="text-5xl mb-4 opacity-60">💭</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
      <p className="text-gray-500 text-sm mb-6 leading-relaxed">
        Start your first chat to begin exploring AI conversations
      </p>
      <Button onClick={handleNewChat} size="md" className="px-6">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create New Chat
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay - only show on small screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          'fixed left-0 top-0 w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex-col h-full z-40 transition-transform duration-300',
          // Always show as flex, but use transform to hide/show
          'flex',
          // Transform based on isOpen state for all screen sizes
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        data-no-drop="true"
      >
      {/* Header with enhanced styling */}
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        {/* Top row: Toggle button + Chats title + Refresh button */}
        <div className="flex items-center gap-3 mb-4">
          {/* Sidebar toggle button */}
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-sm"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          
          <h1 className="text-xl font-bold text-gray-900 flex-1">Conversations</h1>
          
          {/* Refresh button */}
          {onRefreshThreads && (
            <button
              onClick={() => onRefreshThreads()}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 hover:shadow-sm"
              aria-label="Refresh chat list"
              title="Refresh conversations from server"
            >
              <svg
                className={cn(
                  "w-4 h-4 text-gray-600",
                  loading && "animate-spin"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
        
        {/* Enhanced New Chat button */}
        <Button 
          onClick={handleNewChat} 
          className="w-full mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
          size="md"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          OpenRouter Chat • {threads.length} conversations
          {threads.filter(t => t.isPinned).length > 0 && (
            <span className="text-amber-600 ml-1">
              • {threads.filter(t => t.isPinned).length} pinned
            </span>
          )}
        </p>
      </div>

      {/* Thread list with enhanced scrolling */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
          renderLoadingSkeleton()
        ) : threads.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-1">
            {sortedThreads().map(renderThreadItem)}
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <UserProfile />
    </div>
    </>
  );
}; 