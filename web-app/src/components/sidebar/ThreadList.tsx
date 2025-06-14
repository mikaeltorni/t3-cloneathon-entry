/**
 * ThreadList.tsx
 * 
 * Component for rendering a sorted list of threads
 * 
 * Components:
 *   ThreadList - Sorted thread list with individual thread items
 * 
 * Usage: <ThreadList threads={threads} currentThreadId={currentThreadId} />
 */

import React, { useCallback, useMemo } from 'react';
import { ThreadItem } from './ThreadItem';
import { cn } from '../../utils/cn';
import type { ChatThread, ModelConfig } from '../../../../src/shared/types';

/**
 * Props for the ThreadList component
 */
interface ThreadListProps {
  /** Array of threads to display */
  threads: ChatThread[];
  /** ID of currently selected thread */
  currentThreadId: string | null;
  /** ID of thread being deleted */
  deletingThreadId: string | null;
  /** ID of thread with delete confirmation active */
  confirmDeleteId: string | null;
  /** ID of thread being pinned/unpinned */
  pinningThreadId: string | null;
  /** Available models for display */
  availableModels: Record<string, ModelConfig>;
  /** Currently selected model in main interface */
  currentModel?: string;
  /** Callback for thread selection */
  onThreadSelect: (threadId: string) => void;
  /** Callback for thread deletion */
  onDeleteThread: (threadId: string) => void;
  /** Callback for pin/unpin action */
  onTogglePin: (threadId: string, currentPinStatus: boolean) => void;
  /** Callback for canceling delete confirmation */
  onCancelDelete: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Thread list component with sorting and individual thread rendering
 * 
 * @param threads - Array of threads to display
 * @param currentThreadId - ID of currently selected thread
 * @param deletingThreadId - ID of thread being deleted
 * @param confirmDeleteId - ID of thread with delete confirmation active
 * @param pinningThreadId - ID of thread being pinned/unpinned
 * @param availableModels - Available models for display
 * @param currentModel - Currently selected model in main interface
 * @param onThreadSelect - Callback for thread selection
 * @param onDeleteThread - Callback for thread deletion
 * @param onTogglePin - Callback for pin/unpin action
 * @param onCancelDelete - Callback for canceling delete confirmation
 * @param className - Additional CSS classes
 * @returns JSX element containing the thread list
 */
export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  currentThreadId,
  deletingThreadId,
  confirmDeleteId,
  pinningThreadId,
  availableModels,
  currentModel,
  onThreadSelect,
  onDeleteThread,
  onTogglePin,
  onCancelDelete,
  className
}) => {
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
   * Sort threads with pinned threads at the top
   */
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      // First, sort by pinned status (pinned threads first)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by updatedAt (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [threads]);

  return (
    <div className={cn('space-y-1', className)}>
      {sortedThreads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          isSelected={thread.id === currentThreadId}
          isDeleting={deletingThreadId === thread.id}
          isConfirmingDelete={confirmDeleteId === thread.id}
          isPinning={pinningThreadId === thread.id}
          displayModel={getThreadDisplayModel(thread)}
          onSelect={onThreadSelect}
          onDelete={onDeleteThread}
          onPin={onTogglePin}
          onCancelDelete={onCancelDelete}
        />
      ))}
    </div>
  );
}; 