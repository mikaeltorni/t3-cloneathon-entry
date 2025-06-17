/**
 * TagSystem.tsx
 * 
 * Central orchestrator for the Trello-style chat tagging system - OPTIMIZED
 * 
 * Components:
 *   TagSystem - Main component that provides tagging functionality without UI
 * 
 * Optimizations:
 *   - O(1) tag lookups using Map instead of O(n) find operations
 *   - Memoized expensive computations
 *   - Reduced re-renders with stable references
 *   - Optimized context menu generation
 * 
 * Usage: <TagSystem threads={threads} onThreadUpdate={handleThreadUpdate} />
 */

import React, { useState, useMemo, useEffect, createContext, useContext, useCallback } from 'react';
import type { ChatThread, ChatTag } from '../../../src/shared/types';
import type { ContextMenuItem } from './ui/ContextMenu';
import { ContextMenu } from './ui/ContextMenu';
import { TagModal } from './ui/TagModal';
import { useTags } from '../hooks/useTags';
import { useThreadTags } from '../hooks/useThreadTags';

interface TagSystemContextValue {
  tags: ChatTag[];
  selectedTags: string[];
  filteredThreads: ChatThread[];
  handleContextMenu: (e: React.MouseEvent, threadId: string) => void;
  getThreadTags: (threadId: string) => ChatTag[];
  onTagToggle: (tagId: string) => void;
  onClearAll: () => void;
  onTagRightClick: (e: React.MouseEvent, tag: ChatTag) => void;
  onThreadRightClick: (e: React.MouseEvent, threadId: string) => void;
  // Add tag management functions
  addTagToThread: (threadId: string, tagId: string) => Promise<void>;
  removeTagFromThread: (threadId: string, tagId: string) => Promise<void>;
  createTag: (name: string, color: { r: number; g: number; b: number }) => Promise<ChatTag>;
  openCreateTagModal: () => void;
  // Optimistic states for instant feedback
  getOptimisticThreadTags: (threadId: string) => ChatTag[];
  setOptimisticAssigned: (threadId: string, tagId: string) => void;
  setOptimisticRemoved: (threadId: string, tagId: string) => void;
  clearOptimistic: (threadId: string, tagId: string) => void;
}

const TagSystemContext = createContext<TagSystemContextValue | null>(null);

export const useTagSystemContext = () => { // eslint-disable-line react-refresh/only-export-components
  const context = useContext(TagSystemContext);
  if (!context) {
    throw new Error('useTagSystemContext must be used within TagSystem');
  }
  return context;
};

interface TagSystemProps {
  threads: ChatThread[];
  onThreadUpdate: (threadId: string, updates: Partial<ChatThread>) => Promise<void>;
  children: React.ReactNode;
}

/**
 * Tag system provider that renders tag UI and provides context - OPTIMIZED
 * 
 * @param {ChatThread[]} threads - Array of chat threads
 * @param {Function} onThreadUpdate - Callback to update thread data
 * @param {React.ReactNode} children - Child components to render
 * @returns {JSX.Element} TagSystem component
 */
export const TagSystem: React.FC<TagSystemProps> = ({
  threads,
  onThreadUpdate,
  children
}) => {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    threadId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    threadId: null
  });

  // Tag context menu state (for tag management)
  const [tagContextMenu, setTagContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    tag: ChatTag | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    tag: null
  });

  // Modal states
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [isEditTagModalOpen, setIsEditTagModalOpen] = useState(false);

  // Optimistic states for instant feedback across all components
  const [optimisticAssigned, setOptimisticAssignedState] = useState<Map<string, Set<string>>>(new Map());
  const [optimisticRemoved, setOptimisticRemovedState] = useState<Map<string, Set<string>>>(new Map());

  // Hooks
  const { 
    tags, 
    createTag,
    updateTag,
    deleteTag
    // refreshTags - unused, commenting out to avoid linting error
  } = useTags();
  
  const {
    selectedTagIds,
    filteredThreads,
    toggleTagFilter,
    clearTagFilters,
    getThreadTags
  } = useThreadTags({ 
    threads, 
    tags
  });

  // 🚀 OPTIMIZATION: Create memoized tags Map for O(1) lookups instead of O(n) find operations
  const tagsMap = useMemo(() => {
    const map = new Map<string, ChatTag>();
    tags.forEach(tag => map.set(tag.id, tag));
    return map;
  }, [tags]);

  // 🚀 OPTIMIZATION: Create memoized threads Map for O(1) lookups
  const threadsMap = useMemo(() => {
    const map = new Map<string, ChatThread>();
    threads.forEach(thread => map.set(thread.id, thread));
    return map;
  }, [threads]);

  /**
   * 🚀 OPTIMIZED: Get thread tags with optimistic updates applied
   * Now uses O(1) Map lookups instead of O(n) find operations
   */
  const getOptimisticThreadTags = useCallback((threadId: string): ChatTag[] => {
    const realTags = getThreadTags(threadId);
    const realTagIds = new Set(realTags.map(tag => tag.id)); // Use Set for O(1) includes check
    
    const threadOptimisticAssigned = optimisticAssigned.get(threadId) || new Set();
    const threadOptimisticRemoved = optimisticRemoved.get(threadId) || new Set();
    
    // Start with real tags, remove optimistically removed ones
    const filteredTags = realTags.filter(tag => !threadOptimisticRemoved.has(tag.id));
    
    // 🚀 OPTIMIZATION: Use Map.get() for O(1) lookups instead of tags.find()
    const assignedTags: ChatTag[] = [];
    for (const tagId of threadOptimisticAssigned) {
      if (!realTagIds.has(tagId)) { // Don't duplicate real tags
        const tag = tagsMap.get(tagId);
        if (tag) {
          assignedTags.push(tag);
        }
      }
    }
    
    return [...filteredTags, ...assignedTags];
  }, [getThreadTags, optimisticAssigned, optimisticRemoved, tagsMap]);

  // 🚀 OPTIMIZATION: Memoize tag operations to reduce re-renders
  const tagOperations = useMemo(() => ({
    addTagToThread: async (threadId: string, tagId: string) => {
      const operationId = `ADD-${threadId}-${tagId}-${Date.now()}`;
      console.log(`🏷️ [TagSystem-${operationId}] ADD operation started`);
      
      const thread = threadsMap.get(threadId);
      if (!thread) {
        console.log(`❌ [TagSystem-${operationId}] Thread not found: ${threadId}`);
        return;
      }

      // ✨ Use optimistic thread tags instead of raw thread tags to account for pending operations
      const optimisticTags = getOptimisticThreadTags(threadId);
      const currentTags = optimisticTags.map(tag => tag.id);
      console.log(`🏷️ [TagSystem-${operationId}] Current tags (with optimistic):`, currentTags);
      console.log(`🏷️ [TagSystem-${operationId}] Original thread tags:`, thread.tags || []);
      console.log(`🏷️ [TagSystem-${operationId}] Adding tag: ${tagId}`);
      
      // Always add the tag if it's not already there - build correct final state
      const updatedTags = currentTags.includes(tagId) 
        ? currentTags 
        : [...currentTags, tagId];
      
      console.log(`🏷️ [TagSystem-${operationId}] Final tags:`, updatedTags);
      console.log(`🏷️ [TagSystem-${operationId}] Calling onThreadUpdate with tags:`, updatedTags);
      
      try {
        await onThreadUpdate(threadId, { tags: updatedTags });
        console.log(`✅ [TagSystem-${operationId}] Successfully updated thread tags`);
      } catch (error) {
        console.error(`❌ [TagSystem-${operationId}] Failed to update thread:`, error);
        throw error;
      }
    },

    removeTagFromThread: async (threadId: string, tagId: string) => {
      const operationId = `REMOVE-${threadId}-${tagId}-${Date.now()}`;
      console.log(`🏷️ [TagSystem-${operationId}] REMOVE operation started`);
      
      const thread = threadsMap.get(threadId);
      if (!thread) {
        console.log(`❌ [TagSystem-${operationId}] Thread not found: ${threadId}`);
        return;
      }

      // ✨ Use optimistic thread tags instead of raw thread tags to account for pending operations
      const optimisticTags = getOptimisticThreadTags(threadId);
      const currentTags = optimisticTags.map(tag => tag.id);
      console.log(`🏷️ [TagSystem-${operationId}] Current tags (with optimistic):`, currentTags);
      console.log(`🏷️ [TagSystem-${operationId}] Original thread tags:`, thread.tags || []);
      console.log(`🏷️ [TagSystem-${operationId}] Removing tag: ${tagId}`);
      
      // Always remove the tag - build correct final state
      const updatedTags = currentTags.filter(id => id !== tagId);
      
      console.log(`🏷️ [TagSystem-${operationId}] Final tags:`, updatedTags);
      console.log(`🏷️ [TagSystem-${operationId}] Calling onThreadUpdate with tags:`, updatedTags);
      
      try {
        await onThreadUpdate(threadId, { tags: updatedTags });
        console.log(`✅ [TagSystem-${operationId}] Successfully updated thread tags`);
      } catch (error) {
        console.error(`❌ [TagSystem-${operationId}] Failed to update thread:`, error);
        throw error;
      }
    }
  }), [threadsMap, getOptimisticThreadTags, onThreadUpdate]);

  // Get current thread for context menu
  const currentThread = useMemo(() => 
    contextMenu.threadId ? threadsMap.get(contextMenu.threadId) || null : null,
    [threadsMap, contextMenu.threadId]
  );

  // 🚀 OPTIMIZATION: Memoize available and assigned tags for context menu generation
  const threadTagInfo = useMemo(() => {
    if (!currentThread) return { availableTagsToAdd: [], threadTagObjects: [] };

    const threadTags = new Set(currentThread.tags || []);
    
    // Add tags that are not already on this thread
    const availableTagsToAdd = tags.filter(tag => !threadTags.has(tag.id));
    
    // Get thread tag objects using Map for O(1) lookups
    const threadTagObjects: ChatTag[] = [];
    for (const tagId of threadTags) {
      const tag = tagsMap.get(tagId);
      if (tag) {
        threadTagObjects.push(tag);
      }
    }
    
    return { availableTagsToAdd, threadTagObjects };
  }, [currentThread, tags, tagsMap]);

  /**
   * Handle right-click context menu
   */
  const handleContextMenu = useCallback((e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      threadId
    });
  }, []);

  /**
   * Close context menu
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Handle tag creation and auto-assign to current thread
   */
  const handleCreateTag = useCallback(async (name: string, color: { r: number; g: number; b: number }) => {
    try {
      const newTag = await createTag(name, color);
      setIsCreateTagModalOpen(false);
      
      // Auto-assign the newly created tag to the thread that triggered the context menu
      if (contextMenu.threadId) {
        try {
          await tagOperations.addTagToThread(contextMenu.threadId, newTag.id);
        } catch (assignError) {
          console.error('Failed to auto-assign new tag to thread:', assignError);
          // Tag was created successfully, but assignment failed
          // User can manually assign it later
        }
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  }, [createTag, contextMenu.threadId, tagOperations]);

  // 🚀 OPTIMIZATION: Memoize context menu items generation
  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!currentThread) return [];

    const items: ContextMenuItem[] = [];
    const { availableTagsToAdd, threadTagObjects } = threadTagInfo;
    
    if (availableTagsToAdd.length > 0) {
      availableTagsToAdd.forEach(tag => {
        items.push({
          id: `add-${tag.id}`,
          label: `Add "${tag.name}"`,
          icon: '🏷️',
          action: () => tagOperations.addTagToThread(currentThread.id, tag.id),
          tag
        });
      });
    }
    
    // Remove tags that are currently on this thread
    if (threadTagObjects.length > 0) {
      if (items.length > 0) {
        items.push({ 
          id: 'separator-1',
          label: '',
          action: () => {},
          type: 'separator' 
        });
      }
      
      threadTagObjects.forEach(tag => {
        items.push({
          id: `remove-${tag.id}`,
          label: `Remove "${tag.name}"`,
          icon: '❌',
          action: () => tagOperations.removeTagFromThread(currentThread.id, tag.id),
          type: 'danger',
          tag
        });
      });
    }
    
    // Add separator and "Add New Tag" option
    if (items.length > 0) {
      items.push({ 
        id: 'separator-2',
        label: '',
        action: () => {},
        type: 'separator' 
      });
    }
    
    items.push({
      id: 'add-new-tag',
      label: 'Add New Tag',
      icon: '➕',
      action: () => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
        setIsCreateTagModalOpen(true);
      }
    });

    return items;
  }, [currentThread, threadTagInfo, tagOperations]);

  // 🚀 OPTIMIZATION: Memoize tag context menu items generation
  const tagContextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!tagContextMenu.tag) return [];

    const tag = tagContextMenu.tag;
    return [
      {
        id: `edit-${tag.id}`,
        label: `Edit "${tag.name}"`,
        icon: '✏️',
        action: () => handleEditTag(),
        tag
      },
      { 
        id: `separator-edit-${tag.id}`,
        label: '',
        action: () => {},
        type: 'separator' 
      },
      {
        id: `delete-${tag.id}`,
        label: `Delete "${tag.name}"`,
        icon: '🗑️',
        action: () => handleDeleteTag(tag.id),
        type: 'danger',
        tag
      }
    ];
  }, [tagContextMenu.tag]);

  // Close context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, isOpen: false }));
      setTagContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    if (contextMenu.isOpen || tagContextMenu.isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.isOpen, tagContextMenu.isOpen]);

  // Handle tag right-click for tag management
  const handleTagRightClick = useCallback((e: React.MouseEvent, tag: ChatTag) => {
    e.preventDefault();
    setTagContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      tag
    });
  }, []);

  // Handle tag deletion
  const handleDeleteTag = useCallback(async (tagId: string) => {
    try {
      await deleteTag(tagId);
      setTagContextMenu(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  }, [deleteTag]);

  // Handle tag editing
  const handleEditTag = useCallback(() => {
    setTagContextMenu(prev => ({ ...prev, isOpen: false }));
    setIsEditTagModalOpen(true);
  }, []);

  /**
   * Open create tag modal
   */
  const openCreateTagModal = useCallback(() => {
    setIsCreateTagModalOpen(true);
  }, []);

  /**
   * Set optimistic assigned state
   */
  const setOptimisticAssigned = useCallback((threadId: string, tagId: string) => {
    const stateKey = `${threadId}-${tagId}`;
    console.log(`🔵 [TagSystem] Setting optimistic ASSIGNED for ${stateKey}`);
    
    setOptimisticAssignedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId) || new Set();
      
      console.log(`🔵 [TagSystem] Before adding - thread ${threadId} assigned tags:`, Array.from(threadSet));
      threadSet.add(tagId);
      newMap.set(threadId, threadSet);
      console.log(`🔵 [TagSystem] After adding - thread ${threadId} assigned tags:`, Array.from(threadSet));
      
      return newMap;
    });
  }, []);

  /**
   * Set optimistic removed state
   */
  const setOptimisticRemoved = useCallback((threadId: string, tagId: string) => {
    const stateKey = `${threadId}-${tagId}`;
    console.log(`🔴 [TagSystem] Setting optimistic REMOVED for ${stateKey}`);
    
    setOptimisticRemovedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId) || new Set();
      
      console.log(`🔴 [TagSystem] Before adding - thread ${threadId} removed tags:`, Array.from(threadSet));
      threadSet.add(tagId);
      newMap.set(threadId, threadSet);
      console.log(`🔴 [TagSystem] After adding - thread ${threadId} removed tags:`, Array.from(threadSet));
      
      return newMap;
    });
  }, []);

  /**
   * Clear optimistic state for a specific tag
   */
  const clearOptimistic = useCallback((threadId: string, tagId: string) => {
    const stateKey = `${threadId}-${tagId}`;
    console.log(`🧹 [TagSystem] Clearing optimistic state for ${stateKey}`);
    
    setOptimisticAssignedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId);
      if (threadSet) {
        console.log(`🧹 [TagSystem] Before clearing assigned - thread ${threadId}:`, Array.from(threadSet));
        threadSet.delete(tagId);
        if (threadSet.size === 0) {
          newMap.delete(threadId);
          console.log(`🧹 [TagSystem] Removed empty assigned set for thread ${threadId}`);
        } else {
          newMap.set(threadId, threadSet);
          console.log(`🧹 [TagSystem] After clearing assigned - thread ${threadId}:`, Array.from(threadSet));
        }
      } else {
        console.log(`🧹 [TagSystem] No assigned set found for thread ${threadId}`);
      }
      return newMap;
    });
    
    setOptimisticRemovedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId);
      if (threadSet) {
        console.log(`🧹 [TagSystem] Before clearing removed - thread ${threadId}:`, Array.from(threadSet));
        threadSet.delete(tagId);
        if (threadSet.size === 0) {
          newMap.delete(threadId);
          console.log(`🧹 [TagSystem] Removed empty removed set for thread ${threadId}`);
        } else {
          newMap.set(threadId, threadSet);
          console.log(`🧹 [TagSystem] After clearing removed - thread ${threadId}:`, Array.from(threadSet));
        }
      } else {
        console.log(`🧹 [TagSystem] No removed set found for thread ${threadId}`);
      }
      return newMap;
    });
  }, []);

  // 🚀 OPTIMIZATION: Memoize context value to prevent unnecessary re-renders
  const contextValue: TagSystemContextValue = useMemo(() => ({
    tags,
    selectedTags: selectedTagIds,
    filteredThreads,
    handleContextMenu,
    getThreadTags,
    onTagToggle: toggleTagFilter,
    onClearAll: clearTagFilters,
    onTagRightClick: handleTagRightClick,
    onThreadRightClick: handleContextMenu,
    // Add tag management functions
    addTagToThread: tagOperations.addTagToThread,
    removeTagFromThread: tagOperations.removeTagFromThread,
    createTag,
    openCreateTagModal,
    // Optimistic states for instant feedback
    getOptimisticThreadTags,
    setOptimisticAssigned,
    setOptimisticRemoved,
    clearOptimistic
  }), [
    tags,
    selectedTagIds,
    filteredThreads,
    handleContextMenu,
    getThreadTags,
    toggleTagFilter,
    clearTagFilters,
    handleTagRightClick,
    tagOperations.addTagToThread,
    tagOperations.removeTagFromThread,
    createTag,
    openCreateTagModal,
    getOptimisticThreadTags,
    setOptimisticAssigned,
    setOptimisticRemoved,
    clearOptimistic
  ]);

  return (
    <TagSystemContext.Provider value={contextValue}>
      {/* Render children with context */}
      {children}

      {/* Thread Context Menu */}
      {contextMenu.isOpen && contextMenu.threadId && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}

      {/* Tag Management Context Menu */}
      {tagContextMenu.isOpen && tagContextMenu.tag && (
        <ContextMenu
          isOpen={tagContextMenu.isOpen}
          position={tagContextMenu.position}
          items={tagContextMenuItems}
          onClose={() => setTagContextMenu(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Create Tag Modal */}
      <TagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onSubmit={handleCreateTag}
        title="Create New Tag"
      />

      {/* Edit Tag Modal */}
      {tagContextMenu.tag && (
        <TagModal
          isOpen={isEditTagModalOpen}
          onClose={() => setIsEditTagModalOpen(false)}
          onSubmit={async (name: string, color: { r: number; g: number; b: number }) => {
            await updateTag(tagContextMenu.tag!.id, { name, color });
            setIsEditTagModalOpen(false);
          }}
          title="Edit Tag"
          initialName={tagContextMenu.tag.name}
          initialColor={tagContextMenu.tag.color}
        />
      )}
    </TagSystemContext.Provider>
  );
}; 