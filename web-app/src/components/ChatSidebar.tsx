/**
 * ChatSidebar.tsx
 * 
 * Enhanced fixed positioned sidebar component for chat thread management
 * Now refactored with smaller, focused sub-components
 * 
 * Components:
 *   ChatSidebar - Main sidebar container using sub-components
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
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarStates } from './sidebar/SidebarStates';
import { ThreadList } from './sidebar/ThreadList';
import { UserProfile } from './UserProfile';
import { TagFilterBar } from './ui/TagFilterBar';
import { useTagSystemContext } from './TagSystem';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';
import type { ChatThread, ModelConfig, ChatTag } from '../../../src/shared/types';

interface ChatSidebarProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  onTogglePinThread: (threadId: string, isPinned: boolean) => void;
  loading: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  availableModels?: Record<string, ModelConfig>;
  onModelChange?: (threadId: string, modelId: string) => void;
  currentModel?: string; // Currently selected model in the main interface
  onThreadRightClick?: (event: React.MouseEvent, threadId: string) => void;
  getThreadTags?: (threadId: string) => ChatTag[];
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
  loading,
  isOpen = false,
  onClose,
  onToggle,
  availableModels = {},
  currentModel,
  onThreadRightClick,
  getThreadTags
}) => {
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pinningThreadId, setPinningThreadId] = useState<string | null>(null);

  const { debug, log } = useLogger('ChatSidebar');

  // Get tag system context
  const tagSystem = useTagSystemContext();

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

  const pinnedCount = threads.filter(t => t.isPinned).length;

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
        {/* Header */}
        <SidebarHeader
          onToggle={onToggle}
          onNewChat={handleNewChat}
          threadCount={threads.length}
          pinnedCount={pinnedCount}
        />

        {/* Tag Filter Bar */}
        <TagFilterBar
          tags={tagSystem.tags}
          selectedTags={tagSystem.selectedTags}
          onTagToggle={tagSystem.onTagToggle}
          onClearAll={tagSystem.onClearAll}
          onTagRightClick={tagSystem.onTagRightClick}
        />

        {/* Thread list with enhanced scrolling */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <SidebarStates.Loading />
          ) : threads.length === 0 ? (
            <SidebarStates.Empty onNewChat={handleNewChat} />
          ) : (
            <ThreadList
              threads={threads}
              currentThreadId={currentThreadId}
              deletingThreadId={deletingThreadId}
              confirmDeleteId={confirmDeleteId}
              pinningThreadId={pinningThreadId}
              availableModels={availableModels}
              currentModel={currentModel}
              onThreadSelect={handleThreadSelect}
              onDeleteThread={handleDeleteThread}
              onTogglePin={handleTogglePin}
              onCancelDelete={cancelDelete}
              onThreadRightClick={onThreadRightClick}
              getThreadTags={getThreadTags}
            />
          )}
        </div>

        {/* User Profile Footer */}
        <UserProfile />
      </div>
    </>
  );
}; 