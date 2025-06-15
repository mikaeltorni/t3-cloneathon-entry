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

import React, { useState, useMemo, createContext, useContext } from 'react';
import type { ChatThread, ChatTag } from '../../../src/shared/types';
import type { ContextMenuItem } from './ui/ContextMenu';
import { ContextMenu } from './ui/ContextMenu';
import { TagModal } from './ui/TagModal';
import { TagFilterBar } from './ui/TagFilterBar';
import { useTags } from '../hooks/useTags';
import { useThreadTags } from '../hooks/useThreadTags';

interface TagSystemContextValue {
  tags: ChatTag[];
  selectedTagIds: string[];
  filteredThreads: ChatThread[];
  handleContextMenu: (e: React.MouseEvent, threadId: string) => void;
  getThreadTags: (threadId: string) => ChatTag[];
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

  // Modal states
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);

  // Hooks
  const { 
    tags, 
    createTag
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
   * Handle tag creation
   */
  const handleCreateTag = async (name: string, color: { r: number; g: number; b: number }) => {
    try {
      await createTag(name, color);
      setIsCreateTagModalOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  /**
   * Generate context menu items
   */
  const generateContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    // Available tags to add
    if (availableTags.length > 0) {
      availableTags.forEach(tag => {
        items.push({
          id: `add-${tag.id}`,
          label: tag.name,
          action: () => handleAssignTag(tag.id),
          icon: (
            <div 
              className="w-3 h-3 rounded-full border border-gray-300" 
              style={{ backgroundColor: `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})` }}
            />
          )
        });
      });
    }

    // Separator if we have both available and assigned tags
    if (availableTags.length > 0 && assignedTags.length > 0) {
      items.push({ 
        id: 'separator-1',
        label: '',
        action: () => {},
        type: 'separator' 
      });
    }

    // Assigned tags to remove (in red)
    if (assignedTags.length > 0) {
      assignedTags.forEach(tag => {
        items.push({
          id: `remove-${tag.id}`,
          label: `Remove ${tag.name}`,
          action: () => handleRemoveTag(tag.id),
          type: 'danger',
          icon: (
            <div 
              className="w-3 h-3 rounded-full border border-red-300" 
              style={{ backgroundColor: `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})` }}
            />
          )
        });
      });
    }

    // Separator before create new tag
    if (items.length > 0) {
      items.push({ 
        id: 'separator-2',
        label: '',
        action: () => {},
        type: 'separator' 
      });
    }

    // Create new tag option
    items.push({
      id: 'create-new-tag',
      label: 'Create New Tag',
      action: openCreateTagModal,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    });

    return items;
  };

  const contextValue: TagSystemContextValue = {
    tags,
    selectedTagIds,
    filteredThreads,
    handleContextMenu,
    getThreadTags
  };

  return (
    <TagSystemContext.Provider value={contextValue}>
      {/* Tag Filter Bar */}
      <TagFilterBar
        tags={tags}
        selectedTags={selectedTagIds}
        onTagToggle={toggleTagFilter}
        onClearAll={clearTagFilters}
      />

      {/* Render children with context */}
      {children}

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={generateContextMenuItems()}
        onClose={closeContextMenu}
      />

      {/* Create Tag Modal */}
      <TagModal
        isOpen={isCreateTagModalOpen}
        onClose={() => setIsCreateTagModalOpen(false)}
        onSubmit={handleCreateTag}
        title="Create New Tag"
        submitLabel="Create Tag"
      />
    </TagSystemContext.Provider>
  );
}; 