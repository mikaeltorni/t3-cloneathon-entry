/**
 * ThreadMenu.tsx
 * 
 * Universal menu for thread actions including tags and delete
 * 
 * Components:
 *   ThreadMenu - Dropdown menu with thread actions for all devices
 * 
 * Usage: <ThreadMenu thread={thread} onDelete={onDelete} getThreadTags={getThreadTags} />
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useTagSystemContext } from '../TagSystem';
import { ThreadTagForMenu } from '../ui/ThreadTagForMenu';
import type { ChatThread, ChatTag } from '../../../../src/shared/types';

/**
 * Props for the ThreadMenu component
 */
interface ThreadMenuProps {
  /** Thread data */
  thread: ChatThread;
  /** Whether the thread is being deleted */
  isDeleting: boolean;
  /** Whether delete confirmation is active */
  isConfirmingDelete: boolean;
  /** Callback for delete action */
  onDelete: (threadId: string) => void;
  /** Function to get tags for this thread */
  getThreadTags?: (threadId: string) => ChatTag[];
  /** Whether to show as context menu */
  isContextMenu?: boolean;
  /** Position for context menu */
  position?: { x: number; y: number };
  /** Callback when menu should close */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Universal thread menu component with actions and tag management
 * 
 * @param thread - Thread data
 * @param isDeleting - Whether the thread is being deleted
 * @param isConfirmingDelete - Whether delete confirmation is active
 * @param onDelete - Callback for delete action
 * @param getThreadTags - Function to get tags for this thread
 * @param isContextMenu - Whether to show as context menu
 * @param position - Position for context menu
 * @param onClose - Callback when menu should close
 * @param className - Additional CSS classes
 * @returns JSX element containing the thread menu
 */
export const ThreadMenu: React.FC<ThreadMenuProps> = ({
  thread,
  isDeleting,
  isConfirmingDelete,
  onDelete,
  getThreadTags,
  isContextMenu = false,
  position,
  onClose,
  className
}) => {
  const [isOpen, setIsOpen] = useState(isContextMenu);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get tag system context
  const tagSystem = useTagSystemContext();
  const threadTags = getThreadTags?.(thread.id) || [];

  // Update open state when context menu prop changes
  useEffect(() => {
    setIsOpen(isContextMenu);
  }, [isContextMenu]);

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        (!buttonRef.current || !buttonRef.current.contains(event.target as Node)) &&
        !menuRef.current.contains(event.target as Node)
             ) {
         setIsOpen(false);
         onClose?.();
       }
     };

     if (isOpen) {
       document.addEventListener('mousedown', handleClickOutside);
     }

     return () => {
       document.removeEventListener('mousedown', handleClickOutside);
     };
   }, [isOpen, onClose]);

   /**
    * Toggle menu visibility
    */
   const toggleMenu = (e: React.MouseEvent) => {
     e.stopPropagation();
     setIsOpen(!isOpen);
   };

  /**
   * Handle delete action
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(thread.id);
    setIsOpen(false);
    onClose?.();
  };



  /**
   * Handle opening create tag modal
   */
  const handleOpenCreateTagModal = () => {
    tagSystem.openCreateTagModal();
    setIsOpen(false);
    onClose?.();
  };

  /**
   * Get menu positioning styles
   */
  const getMenuStyles = () => {
    if (isContextMenu && position) {
      return {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        zIndex: 9999
      };
    }
    return {};
  };

  return (
    <div className={cn('relative', className)}>
      {/* Menu trigger button - only show if not context menu */}
      {!isContextMenu && (
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className={cn(
            'opacity-100 transition-all duration-200 p-2 rounded-lg',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            isOpen && 'bg-gray-100 text-gray-600'
          )}
          title="Thread options"
          aria-label="Open thread options menu"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          style={getMenuStyles()}
          className={cn(
            'bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-50 min-w-64',
            isContextMenu 
              ? 'fixed' 
              : 'absolute right-0 top-full mt-1'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tags section */}
          <div className="p-3 border-b border-gray-100 dark:border-slate-700">
            <div className="space-y-2">
              {/* Assigned tags */}
              {threadTags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Assigned Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {threadTags.map((tag: ChatTag) => (
                      <ThreadTagForMenu
                        key={tag.id}
                        tag={tag}
                        threadId={thread.id}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Available tags */}
              {tagSystem.tags.filter(tag => !threadTags.some((t: ChatTag) => t.id === tag.id)).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Available Tags</h4>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {tagSystem.tags
                      .filter(tag => !threadTags.some((t: ChatTag) => t.id === tag.id))
                      .slice(0, 10)
                      .map((tag) => (
                        <ThreadTagForMenu
                          key={tag.id}
                          tag={tag}
                          threadId={thread.id}
                          size="sm"
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Create new tag */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCreateTagModal();
              }}
              className="w-full mt-2 p-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded font-medium"
            >
              + Create New Tag
            </button>
          </div>

          {/* Action buttons */}
          <div className="p-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                'w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors',
                isConfirmingDelete
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'text-red-600 hover:bg-red-50'
              )}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isConfirmingDelete ? 'Confirm Delete' : 'Delete Thread'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 