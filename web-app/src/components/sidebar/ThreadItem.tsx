/**
 * ThreadItem.tsx
 * 
 * Component for rendering individual thread items in the sidebar
 * 
 * Components:
 *   ThreadItem - Complete thread item with actions, model indicator, and confirmations
 * 
 * Usage: <ThreadItem thread={thread} isSelected={isSelected} onSelect={onSelect} />
 */

import React, { useCallback } from 'react';
import { Button } from '../ui/Button';
import { InlineEdit } from '../ui/InlineEdit';
import { ModelIndicator } from './ModelIndicator';
import { ThreadActions } from './ThreadActions';
import { ThreadMeta } from './ThreadMeta';
import { ThreadMenu } from './ThreadMenu';
import { Tag } from '../ui/Tag';
import { cn } from '../../utils/cn';
import { useTagSystemContext } from '../TagSystem';
import type { ChatThread, ModelConfig, ChatTag } from '../../../../src/shared/types';

/**
 * Props for the ThreadItem component
 */
interface ThreadItemProps {
  /** Thread data */
  thread: ChatThread;
  /** Whether the thread is currently selected */
  isSelected: boolean;
  /** Whether the thread is being deleted */
  isDeleting: boolean;
  /** Whether the thread confirmation delete is active */
  isConfirmingDelete: boolean;
  /** Whether the thread is being pinned/unpinned */
  isPinning: boolean;
  /** Model configuration for display */
  displayModel: ModelConfig | null;
  /** Callback for thread selection */
  onSelect: (threadId: string) => void;
  /** Callback for thread deletion */
  onDelete: (threadId: string) => void;
  /** Callback for pin/unpin action */
  onPin: (threadId: string, currentPinStatus: boolean) => void;
  /** Callback for editing thread title */
  onEdit?: (threadId: string, newTitle: string) => Promise<ChatThread>;
  /** Callback for canceling delete confirmation */
  onCancelDelete: () => void;

  /** Function to get tags for this thread */
  getThreadTags?: (threadId: string) => ChatTag[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Individual thread item component with full functionality
 * 
 * @param thread - Thread data
 * @param isSelected - Whether the thread is currently selected
 * @param isDeleting - Whether the thread is being deleted
 * @param isConfirmingDelete - Whether delete confirmation is active
 * @param isPinning - Whether the thread is being pinned/unpinned
 * @param displayModel - Model configuration for display
 * @param onSelect - Callback for thread selection
 * @param onDelete - Callback for thread deletion
 * @param onPin - Callback for pin/unpin action
 * @param onCancelDelete - Callback for canceling delete confirmation
 * @param className - Additional CSS classes
 * @returns JSX element containing the thread item
 */
export const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isSelected,
  isDeleting,
  isConfirmingDelete,
  isPinning,
  displayModel,
  onSelect,
  onDelete,
  onPin,
  onEdit,
  onCancelDelete,
  getThreadTags,
  className
}) => {
  const [contextMenu, setContextMenu] = React.useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 }
  });

  const isPinned = Boolean(thread.isPinned);
  const lastMessage = thread.messages[thread.messages.length - 1];
  
  // Use optimistic tags for instant feedback
  const { getOptimisticThreadTags } = useTagSystemContext();
  const threadTags = getOptimisticThreadTags(thread.id);

  /**
   * Truncate text to specified length
   */
  const truncateText = useCallback((text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  /**
   * Handle thread selection
   */
  const handleSelect = useCallback(() => {
    if (!isConfirmingDelete) {
      onSelect(thread.id);
    }
  }, [thread.id, isConfirmingDelete, onSelect]);

  /**
   * Handle thread title edit
   */
  const handleTitleSave = useCallback(async (newTitle: string): Promise<void> => {
    if (onEdit) {
      await onEdit(thread.id, newTitle);
    }
  }, [onEdit, thread.id]);

  /**
   * Handle right-click for context menu
   */
  const handleRightClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY }
    });
  }, [thread.id]);

  /**
   * Close context menu
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <div
      className={cn(
        'group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 mb-3',
        isSelected
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-300 dark:border-blue-500 shadow-lg transform scale-[1.02]'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md',
        isPinned && 'ring-2 ring-amber-200 dark:ring-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950',
        className
      )}
      onClick={handleSelect}
      onContextMenu={handleRightClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          {/* Editable thread title */}
          <InlineEdit
            value={thread.title}
            onSave={handleTitleSave}
            disabled={!onEdit}
            validate={(value: string) => {
              const trimmed = value.trim();
              if (trimmed.length < 2) {
                return 'Title must be at least 2 characters';
              }
              return null;
            }}
            textClassName={cn(
              'font-semibold text-base leading-tight cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 rounded px-1 py-0.5 truncate max-w-[200px]',
              isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-slate-100'
            )}
            inputClassName="font-semibold text-base leading-tight bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded px-1 py-0.5"
            maxLength={100}
          />
          
          {/* Model indicator - Always visible */}
          {displayModel && (
            <ModelIndicator 
              model={displayModel}
              isSelected={isSelected}
              className="mt-1.5 mb-2"
            />
          )}
        </div>
        
        {/* Action buttons */}
        <ThreadActions
          thread={thread}
          isPinned={isPinned}
          isDeleting={isDeleting}
          isPinning={isPinning}
          isConfirmingDelete={isConfirmingDelete}
          onPin={onPin}
          onDelete={onDelete}
          getThreadTags={getThreadTags}
        />
      </div>

      {/* Last message preview */}
      {lastMessage && (
        <p className={cn(
          'text-sm mb-2 truncate leading-relaxed',
          isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-gray-600 dark:text-slate-300'
        )}>
          <span className={cn(
            'inline-block w-5 text-xs mr-1',
            lastMessage.role === 'user' ? 'text-gray-500 dark:text-slate-400' : 'text-indigo-500 dark:text-indigo-400'
          )}>
            {lastMessage.role === 'user' ? 'You:' : 'AI:'}
          </span>
          {truncateText(lastMessage.content, 55)}
        </p>
      )}

      {/* Thread Tags - Positioned below AI message and above timestamp */}
      {threadTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {threadTags.map((tag: ChatTag) => (
            <Tag
              key={tag.id}
              tag={tag}
              size="sm"
              className="pointer-events-none"
            />
          ))}
        </div>
      )}

      {/* Thread metadata */}
      <ThreadMeta
        date={thread.updatedAt}
        messageCount={thread.messages.length}
        isSelected={isSelected}
      />

      {/* Delete confirmation overlay */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-red-50 dark:bg-red-950 rounded-xl p-4 flex flex-col justify-center border-2 border-red-200 dark:border-red-500">
          <p className="text-sm text-red-800 dark:text-red-100 mb-3 text-center font-medium">
            Delete this conversation?
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(thread.id);
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
                onCancelDelete();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <ThreadMenu
          thread={thread}
          isDeleting={isDeleting}
          isConfirmingDelete={isConfirmingDelete}
          onDelete={onDelete}
          getThreadTags={getThreadTags}
          isContextMenu={true}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}; 