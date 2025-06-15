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

import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import type { ChatThread, ChatTag } from '../../../src/shared/types';
import type { ContextMenuItem } from './ui/ContextMenu';
import { ContextMenu } from './ui/ContextMenu';
import { TagModal } from './ui/TagModal';
import { TagFilterBar } from './ui/TagFilterBar';
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
}

const TagSystemContext = createContext<TagSystemContextValue | null>(null);

export const useTagSystemContext = () => {
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

  // Hooks
  const { 
    tags, 
    createTag,
    updateTag,
    deleteTag
  } = useTags();
  
  const {
    selectedTagIds,
    filteredThreads,
    addTagToThread,
    removeTagFromThread,
    toggleTagFilter,
    clearTagFilters,
    getThreadTags
  } = useThreadTags({ 
    threads, 
    tags, 
    onThreadUpdate 
  });

  // Get current thread for context menu
  const currentThread = useMemo(() => 
    threads.find(t => t.id === contextMenu.threadId),
    [threads, contextMenu.threadId]
  );

  // Get thread's current tag IDs with proper memoization
  const currentThreadTagIds = useMemo(() => 
    currentThread?.tags || [],
    [currentThread?.tags]
  );

  // Get available tags (not assigned to current thread)
  const availableTags = useMemo(() => 
    tags.filter(tag => !currentThreadTagIds.includes(tag.id)),
    [tags, currentThreadTagIds]
  );

  // Get assigned tags (assigned to current thread)
  const assignedTags = useMemo(() => 
    tags.filter(tag => currentThreadTagIds.includes(tag.id)),
    [tags, currentThreadTagIds]
  );

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
   * Handle tag assignment
   */
  const handleAssignTag = async (tagId: string) => {
    if (!contextMenu.threadId) return;
    
    try {
      await addTagToThread(contextMenu.threadId, tagId);
      closeContextMenu();
    } catch (error) {
      console.error('Failed to assign tag:', error);
    }
  };

  /**
   * Handle tag removal
   */
  const handleRemoveTag = async (tagId: string) => {
    if (!contextMenu.threadId) return;
    
    try {
      await removeTagFromThread(contextMenu.threadId, tagId);
      closeContextMenu();
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  /**
   * Open create tag modal
   */
  const openCreateTagModal = () => {
    setIsCreateTagModalOpen(true);
    closeContextMenu();
  };

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
          console.log(`Auto-assigned new tag "${newTag.name}" to thread ${contextMenu.threadId}`);
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

    // Add tag management options if there are existing tags
    if (tags.length > 0) {
      items.push({ 
        id: 'separator-3',
        label: '',
        action: () => {},
        type: 'separator' 
      });
      items.push({
        id: 'manage-tags',
        label: 'Manage Tags',
        icon: '⚙️',
        action: () => {
          setContextMenu(prev => ({ ...prev, isOpen: false }));
          // Could open a tag management modal here
        }
      });
    }
    
    return items;
  };

  // Generate context menu items for tag management
  const generateTagContextMenuItems = (tag: ChatTag): ContextMenuItem[] => {
    return [
      {
        id: `edit-${tag.id}`,
        label: `Edit "${tag.name}"`,
        icon: '✏️',
        action: () => handleEditTag(tag),
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
  const handleEditTag = (tag: ChatTag) => {
    setTagContextMenu(prev => ({ ...prev, isOpen: false }));
    setIsEditTagModalOpen(true);
  };

  const contextValue: TagSystemContextValue = {
    tags,
    selectedTags: selectedTagIds,
    filteredThreads,
    handleContextMenu,
    getThreadTags,
    onTagToggle: toggleTagFilter,
    onClearAll: clearTagFilters,
    onTagRightClick: handleTagRightClick,
    onThreadRightClick: handleContextMenu
  };

  return (
    <TagSystemContext.Provider value={contextValue}>
      {/* Tag Filter Bar */}
      <TagFilterBar
        tags={tags}
        selectedTags={selectedTagIds}
        onTagToggle={toggleTagFilter}
        onClearAll={clearTagFilters}
        onTagRightClick={handleTagRightClick}
      />

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
        onSubmit={async (name: string, color: { r: number; g: number; b: number }) => {
          await createTag(name, color);
          setIsCreateTagModalOpen(false);
        }}
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