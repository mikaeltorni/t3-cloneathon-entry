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
import type { ChatThread, ModelConfig, ChatTag } from '../../../../src/shared/types';

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

  /** Function to get tags for a thread */
  getThreadTags?: (threadId: string) => ChatTag[];
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
  getThreadTags,
  className
}) => {
  /**
   * Get model configuration by ID with DEFAULT_MODEL fallback
   */
  const getModelConfig = useCallback((modelId: string | undefined): ModelConfig | null => {
    if (!modelId) return null;
    
    // Try to get the exact model first
    if (availableModels[modelId]) {
      return availableModels[modelId];
    }
    
    // If model not found, log a warning but don't fallback yet
    console.warn(`[ThreadList] Model not found in availableModels: ${modelId}. Available models:`, Object.keys(availableModels));
    return null;
  }, [availableModels]);

  /**
   * Get the display model for a thread with comprehensive fallback logic
   */
  const getThreadDisplayModel = useCallback((thread: ChatThread): ModelConfig | null => {
    // PRIORITY 1: Always prioritize the thread's own stored model data
    // This ensures each thread shows its own model, not a global state
    let modelId: string | undefined = thread.currentModel || thread.lastUsedModel;
    
    // PRIORITY 2: For the currently selected thread, only override with currentModel 
    // if the thread doesn't have its own model data yet (new thread scenario)
    if (thread.id === currentThreadId && !modelId && currentModel) {
      modelId = currentModel;
      console.debug(`[ThreadList] Using global currentModel for new thread ${thread.id}: ${currentModel}`);
    }
    
    // PRIORITY 3: Fallback to extracting model from thread messages if thread model data is missing
    if (!modelId && thread.messages && thread.messages.length > 0) {
      // Look for the most recent assistant message with a modelId
      const assistantMessages = thread.messages
        .filter(msg => msg.role === 'assistant' && msg.modelId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (assistantMessages.length > 0) {
        modelId = assistantMessages[0].modelId;
        console.debug(`[ThreadList] Using fallback model from message for thread ${thread.id}: ${modelId}`);
      }
    }
    
    // Enhanced debugging to track why models might disappear
    console.debug(`[ThreadList] Model resolution for thread ${thread.id}:`, {
      threadId: thread.id,
      threadCurrentModel: thread.currentModel,
      threadLastUsedModel: thread.lastUsedModel,
      isCurrentThread: thread.id === currentThreadId,
      globalCurrentModel: currentModel,
      resolvedModelId: modelId,
      threadTitle: thread.title.substring(0, 30),
      messagesCount: thread.messages?.length || 0
    });
    
    // Try to get the model config
    let modelConfig = getModelConfig(modelId);
    
    // // Log if we have a model ID but can't find the config
    // if (!modelConfig && modelId) {
    //   console.warn(`[ThreadList] Model config not found for modelId: ${modelId} in thread ${thread.id}. Available models:`, Object.keys(availableModels));
    // }
    
    // Log when no model is found at all
    if (!modelConfig && !modelId) {
      console.debug(`[ThreadList] No model information found for thread ${thread.id}. Thread may be new or missing model data.`);
    }
    
    return modelConfig;
  }, [currentThreadId, currentModel, getModelConfig, availableModels]);

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
          getThreadTags={getThreadTags}
        />
      ))}
    </div>
  );
}; 