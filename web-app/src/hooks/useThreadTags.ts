/**
 * useThreadTags.ts
 * 
 * Custom hook for managing thread tag filtering and basic operations
 * 
 * Hook:
 *   useThreadTags - Manages thread tag filtering (individual operations handled by ThreadTag components)
 * 
 * Usage: const { filteredThreads, getThreadTags } = useThreadTags(threads, tags);
 */
import { useState, useCallback, useMemo } from 'react';
import { useLogger } from './useLogger';
import type { ChatThread, ChatTag } from '../../../src/shared/types';

interface UseThreadTagsReturn {
  selectedTagIds: string[];
  setSelectedTagIds: (tagIds: string[]) => void;
  filteredThreads: ChatThread[];
  getThreadTags: (threadId: string) => ChatTag[];
  toggleTagFilter: (tagId: string) => void;
  clearTagFilters: () => void;
}

interface UseThreadTagsProps {
  threads: ChatThread[];
  tags: ChatTag[];
}

/**
 * Custom hook for managing thread tag filtering and basic operations
 * 
 * Note: Individual tag add/remove operations are now handled by ThreadTag components
 * with their own debouncing. This hook focuses on filtering and tag retrieval.
 * 
 * @param props - Hook configuration
 * @returns Thread tag management functions and state
 */
export function useThreadTags({ threads, tags }: UseThreadTagsProps): UseThreadTagsReturn {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  const { debug } = useLogger('useThreadTags');

  /**
   * Get tags for a specific thread
   */
  const getThreadTags = useCallback((threadId: string): ChatTag[] => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread?.tags) return [];
    
    return tags.filter(tag => thread.tags!.includes(tag.id));
  }, [threads, tags]);

  /**
   * Toggle tag filter selection
   */
  const toggleTagFilter = useCallback((tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        debug(`Removing tag ${tagId} from filter`);
        return prev.filter(id => id !== tagId);
      } else {
        debug(`Adding tag ${tagId} to filter`);
        return [...prev, tagId];
      }
    });
  }, [debug]);

  /**
   * Clear all tag filters
   */
  const clearTagFilters = useCallback(() => {
    debug('Clearing all tag filters');
    setSelectedTagIds([]);
  }, [debug]);

  /**
   * Filter threads based on selected tags
   */
  const filteredThreads = useMemo(() => {
    if (selectedTagIds.length === 0) {
      return threads;
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
    getThreadTags,
    toggleTagFilter,
    clearTagFilters
  };
} 