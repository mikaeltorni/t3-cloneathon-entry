/**
 * useThreadTags.ts
 * 
 * Custom hook for managing thread tag assignments
 * 
 * Hook:
 *   useThreadTags - Manages thread tag operations and filtering
 * 
 * Usage: const { addTagToThread, removeTagFromThread, filteredThreads } = useThreadTags(threads, tags);
 */
import { useState, useCallback, useMemo } from 'react';
import { useLogger } from './useLogger';
import type { ChatThread, ChatTag } from '../../../src/shared/types';

interface UseThreadTagsReturn {
  selectedTagIds: string[];
  setSelectedTagIds: (tagIds: string[]) => void;
  filteredThreads: ChatThread[];
  addTagToThread: (threadId: string, tagId: string) => Promise<void>;
  removeTagFromThread: (threadId: string, tagId: string) => Promise<void>;
  toggleTagFilter: (tagId: string) => void;
  clearTagFilters: () => void;
  getThreadTags: (threadId: string) => ChatTag[];
}

interface UseThreadTagsProps {
  threads: ChatThread[];
  tags: ChatTag[];
  onThreadUpdate?: (threadId: string, updatedThread: Partial<ChatThread>) => void;
}

/**
 * Custom hook for managing thread tag assignments and filtering
 * 
 * @param threads - Array of chat threads
 * @param tags - Array of available tags
 * @param onThreadUpdate - Callback when thread is updated with new tags
 * @returns Object with thread tag management functions
 */
export const useThreadTags = ({
  threads,
  tags,
  onThreadUpdate
}: UseThreadTagsProps): UseThreadTagsReturn => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  const { debug, log } = useLogger('useThreadTags');

  /**
   * Get tags for a specific thread
   */
  const getThreadTags = useCallback((threadId: string): ChatTag[] => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread?.tags) return [];
    
    return tags.filter(tag => thread.tags!.includes(tag.id));
  }, [threads, tags]);

  /**
   * Add a tag to a thread
   */
  const addTagToThread = useCallback(async (threadId: string, tagId: string): Promise<void> => {
    try {
      debug(`Adding tag ${tagId} to thread ${threadId}`);
      
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const currentTags = thread.tags || [];
      if (currentTags.includes(tagId)) {
        debug('Tag already exists on thread');
        return; // Tag already exists
      }

      const updatedTags = [...currentTags, tagId];
      
      // Update via callback (this should handle API call)
      await onThreadUpdate?.(threadId, { tags: updatedTags });
      
      log(`Added tag ${tagId} to thread ${threadId}`);
    } catch (error) {
      debug(`Failed to add tag to thread: ${error}`);
      throw error;
    }
  }, [threads, onThreadUpdate, debug, log]);

  /**
   * Remove a tag from a thread
   */
  const removeTagFromThread = useCallback(async (threadId: string, tagId: string): Promise<void> => {
    try {
      debug(`Removing tag ${tagId} from thread ${threadId}`);
      
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const currentTags = thread.tags || [];
      const updatedTags = currentTags.filter(id => id !== tagId);
      
      // Update via callback (this should handle API call)
      await onThreadUpdate?.(threadId, { tags: updatedTags });
      
      log(`Removed tag ${tagId} from thread ${threadId}`);
    } catch (error) {
      debug(`Failed to remove tag from thread: ${error}`);
      throw error;
    }
  }, [threads, onThreadUpdate, debug, log]);

  /**
   * Toggle tag filter selection
   */
  const toggleTagFilter = useCallback((tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  }, []);

  /**
   * Clear all tag filters
   */
  const clearTagFilters = useCallback(() => {
    setSelectedTagIds([]);
  }, []);

  /**
   * Filter threads based on selected tags
   */
  const filteredThreads = useMemo(() => {
    if (selectedTagIds.length === 0) {
      return threads; // Show all threads when no tags are selected
    }

    return threads.filter(thread => {
      const threadTags = thread.tags || [];
      // Thread must have at least one of the selected tags
      return selectedTagIds.some(tagId => threadTags.includes(tagId));
    });
  }, [threads, selectedTagIds]);

  return {
    selectedTagIds,
    setSelectedTagIds,
    filteredThreads,
    addTagToThread,
    removeTagFromThread,
    toggleTagFilter,
    clearTagFilters,
    getThreadTags
  };
}; 