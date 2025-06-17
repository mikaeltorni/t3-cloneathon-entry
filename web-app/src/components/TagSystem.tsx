/**
 * TagSystem.tsx
 * 
 * Central orchestrator for the Trello-style chat tagging system
 * 
 * Components:
 *   TagSystem - Main component that provides tagging functionality without UI
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
 * Tag system provider that renders tag UI and provides context
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

  // Create wrapper functions for tag operations that use the API directly
  const addTagToThread = useCallback(async (threadId: string, tagId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const currentTags = thread.tags || [];
    if (currentTags.includes(tagId)) return;

    const updatedTags = [...currentTags, tagId];
    await onThreadUpdate(threadId, { tags: updatedTags });
  }, [threads, onThreadUpdate]);

  const removeTagFromThread = useCallback(async (threadId: string, tagId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const currentTags = thread.tags || [];
    const updatedTags = currentTags.filter(id => id !== tagId);
    await onThreadUpdate(threadId, { tags: updatedTags });
  }, [threads, onThreadUpdate]);

  // Get current thread for context menu
  const currentThread = useMemo(() => 
    threads.find(t => t.id === contextMenu.threadId),
    [threads, contextMenu.threadId]
  );

  // Get thread's current tag IDs with proper memoization - currently unused but kept for future use
  // const currentThreadTagIds = useMemo(() => 
  //   currentThread?.tags || [],
  //   [currentThread?.tags]
  // );

  // Get available tags (not assigned to current thread) - currently unused
  // const availableTags = useMemo(() => 
  //   tags.filter(tag => !currentThreadTagIds.includes(tag.id)),
  //   [tags, currentThreadTagIds]
  // );

  // Get assigned tags (assigned to current thread) - currently unused
  // const assignedTags = useMemo(() => 
  //   tags.filter(tag => currentThreadTagIds.includes(tag.id)),
  //   [tags, currentThreadTagIds]
  // );

  /**
   * Handle right-click context menu
   */
  const handleContextMenu = (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      threadId
    });
  };

  /**
   * Close context menu
   */
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  /**
   * Handle tag assignment - currently unused but keeping for future use
   */
  // const handleAssignTag = async (tagId: string) => {
  //   if (!contextMenu.threadId) return;
  //   
  //   try {
  //     await addTagToThread(contextMenu.threadId, tagId);
  //     closeContextMenu();
  //   } catch (error) {
  //     console.error('Failed to assign tag:', error);
  //   }
  // };

  /**
   * Handle tag removal - currently unused but keeping for future use
   */
  // const handleRemoveTag = async (tagId: string) => {
  //   if (!contextMenu.threadId) return;
  //   
  //   try {
  //     await removeTagFromThread(contextMenu.threadId, tagId);
  //     closeContextMenu();
  //   } catch (error) {
  //     console.error('Failed to remove tag:', error);
  //   }
  // };

  /**
   * Open create tag modal - currently unused but keeping for future use
   */
  // const openCreateTagModal = () => {
  //   setIsCreateTagModalOpen(true);
  //   closeContextMenu();
  // };

  /**
   * Handle tag creation and auto-assign to current thread
   */
  const handleCreateTag = async (name: string, color: { r: number; g: number; b: number }) => {
    try {
      const newTag = await createTag(name, color);
      setIsCreateTagModalOpen(false);
      
      // Auto-assign the newly created tag to the thread that triggered the context menu
      if (contextMenu.threadId) {
        try {
          await addTagToThread(contextMenu.threadId, newTag.id);
        } catch (assignError) {
          console.error('Failed to auto-assign new tag to thread:', assignError);
          // Tag was created successfully, but assignment failed
          // User can manually assign it later
        }
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  // Generate context menu items for thread
  const generateContextMenuItems = (thread: ChatThread): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const threadTags = thread.tags || [];
    
    // Add tags that are not already on this thread
    const availableTagsToAdd = tags.filter(tag => !threadTags.includes(tag.id));
    
    if (availableTagsToAdd.length > 0) {
      availableTagsToAdd.forEach(tag => {
        items.push({
          id: `add-${tag.id}`,
          label: `Add "${tag.name}"`,
          icon: '🏷️',
          action: () => addTagToThread(thread.id, tag.id),
          tag
        });
      });
    }
    
    // Remove tags that are currently on this thread
    if (threadTags.length > 0) {
      if (items.length > 0) {
        items.push({ 
          id: 'separator-1',
          label: '',
          action: () => {},
          type: 'separator' 
        });
      }
      
      const threadTagObjects = tags.filter(tag => threadTags.includes(tag.id));
      threadTagObjects.forEach(tag => {
        items.push({
          id: `remove-${tag.id}`,
          label: `Remove "${tag.name}"`,
          icon: '❌',
          action: () => removeTagFromThread(thread.id, tag.id),
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
  };

  // Generate context menu items for tag management
  const generateTagContextMenuItems = (tag: ChatTag): ContextMenuItem[] => {
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
  };

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
  const handleTagRightClick = (e: React.MouseEvent, tag: ChatTag) => {
    e.preventDefault();
    setTagContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      tag
    });
  };

  // Handle tag deletion
  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      setTagContextMenu(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  // Handle tag editing
  const handleEditTag = () => {
    setTagContextMenu(prev => ({ ...prev, isOpen: false }));
    setIsEditTagModalOpen(true);
  };

  /**
   * Open create tag modal
   */
  const openCreateTagModal = () => {
    setIsCreateTagModalOpen(true);
  };

  /**
   * Get thread tags with optimistic updates applied
   */
  const getOptimisticThreadTags = useCallback((threadId: string): ChatTag[] => {
    const realTags = getThreadTags(threadId);
    const realTagIds = realTags.map(tag => tag.id);
    
    const threadOptimisticAssigned = optimisticAssigned.get(threadId) || new Set();
    const threadOptimisticRemoved = optimisticRemoved.get(threadId) || new Set();
    
    // Start with real tags, remove optimistically removed ones
    const filteredTags = realTags.filter(tag => !threadOptimisticRemoved.has(tag.id));
    
    // Add optimistically assigned tags
    const assignedTags = Array.from(threadOptimisticAssigned)
      .filter(tagId => !realTagIds.includes(tagId)) // Don't duplicate real tags
      .map(tagId => tags.find(tag => tag.id === tagId))
      .filter(Boolean) as ChatTag[];
    
    return [...filteredTags, ...assignedTags];
  }, [getThreadTags, optimisticAssigned, optimisticRemoved, tags]);

  /**
   * Set optimistic assigned state
   */
  const setOptimisticAssigned = useCallback((threadId: string, tagId: string) => {
    setOptimisticAssignedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId) || new Set();
      threadSet.add(tagId);
      newMap.set(threadId, threadSet);
      return newMap;
    });
  }, []);

  /**
   * Set optimistic removed state
   */
  const setOptimisticRemoved = useCallback((threadId: string, tagId: string) => {
    setOptimisticRemovedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId) || new Set();
      threadSet.add(tagId);
      newMap.set(threadId, threadSet);
      return newMap;
    });
  }, []);

  /**
   * Clear optimistic state for a specific tag
   */
  const clearOptimistic = useCallback((threadId: string, tagId: string) => {
    setOptimisticAssignedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId);
      if (threadSet) {
        threadSet.delete(tagId);
        if (threadSet.size === 0) {
          newMap.delete(threadId);
        } else {
          newMap.set(threadId, threadSet);
        }
      }
      return newMap;
    });
    
    setOptimisticRemovedState(prev => {
      const newMap = new Map(prev);
      const threadSet = newMap.get(threadId);
      if (threadSet) {
        threadSet.delete(tagId);
        if (threadSet.size === 0) {
          newMap.delete(threadId);
        } else {
          newMap.set(threadId, threadSet);
        }
      }
      return newMap;
    });
  }, []);

  const contextValue: TagSystemContextValue = {
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
    addTagToThread,
    removeTagFromThread,
    createTag,
    openCreateTagModal,
    // Optimistic states for instant feedback
    getOptimisticThreadTags,
    setOptimisticAssigned,
    setOptimisticRemoved,
    clearOptimistic
  };

  return (
    <TagSystemContext.Provider value={contextValue}>
      {/* Render children with context */}
      {children}

      {/* Thread Context Menu */}
      {contextMenu.isOpen && contextMenu.threadId && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          items={generateContextMenuItems(currentThread!)}
          onClose={closeContextMenu}
        />
      )}

      {/* Tag Management Context Menu */}
      {tagContextMenu.isOpen && tagContextMenu.tag && (
        <ContextMenu
          isOpen={tagContextMenu.isOpen}
          position={tagContextMenu.position}
          items={generateTagContextMenuItems(tagContextMenu.tag)}
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