/**
 * MobileThreadMenu.tsx
 * 
 * Mobile-optimized menu for thread actions including tags, pin, and delete
 * 
 * Components:
 *   MobileThreadMenu - Dropdown menu with thread actions for mobile
 * 
 * Usage: <MobileThreadMenu threadId={threadId} onPin={onPin} onDelete={onDelete} />
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { isMobileScreen } from '../../utils/deviceUtils';
import { useTagSystemContext } from '../TagSystem';
import { Tag } from '../ui/Tag';
import type { ChatThread, ChatTag } from '../../../../src/shared/types';

/**
 * Props for the MobileThreadMenu component
 */
interface MobileThreadMenuProps {
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
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mobile thread menu component with actions and tag management
 * 
 * @param thread - Thread data
 * @param isDeleting - Whether the thread is being deleted
 * @param isConfirmingDelete - Whether delete confirmation is active
 * @param onDelete - Callback for delete action
 * @param getThreadTags - Function to get tags for this thread
 * @param className - Additional CSS classes
 * @returns JSX element containing the mobile menu
 */
export const MobileThreadMenu: React.FC<MobileThreadMenuProps> = ({
  thread,
  isDeleting,
  isConfirmingDelete,
  onDelete,
  getThreadTags,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get tag system context
  const tagSystem = useTagSystemContext();
  const threadTags = getThreadTags?.(thread.id) || [];

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowTags(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Toggle menu visibility
   */
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setShowTags(false);
  };

  /**
   * Handle delete action
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(thread.id);
    setIsOpen(false);
  };

  /**
   * Toggle tag view
   */
  const handleShowTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTags(!showTags);
  };

  // Only render on mobile
  if (!isMobileScreen()) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Menu trigger button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={cn(
          'opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          isOpen && 'opacity-100 bg-gray-100 text-gray-600'
        )}
        title="Thread options"
        aria-label="Open thread options menu"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tags section */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <button
                onClick={handleShowTags}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showTags ? 'Hide' : 'Manage'}
              </button>
            </div>
            
            {/* Current tags */}
            {threadTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-2">
                {threadTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    tag={tag}
                    size="sm"
                    removable={false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-2">No tags assigned</p>
            )}

            {/* Tag management (expanded view) */}
            {showTags && (
              <div className="mt-3 max-h-32 overflow-y-auto">
                <div className="space-y-1">
                  {tagSystem.tags.map((tag) => {
                    const isAssigned = threadTags.some(t => t.id === tag.id);
                    return (
                      <div
                        key={tag.id}
                        className={cn(
                          'flex items-center justify-between p-2 rounded text-xs',
                          isAssigned ? 'bg-blue-50' : 'hover:bg-gray-50'
                        )}
                      >
                        <Tag tag={tag} size="sm" removable={false} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle tag assignment
                            // This would need to be implemented
                            console.log(`Toggle tag ${tag.id} for thread ${thread.id}`);
                          }}
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            isAssigned
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          )}
                        >
                          {isAssigned ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Create new tag button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open create tag modal
                    console.log('Create new tag');
                  }}
                  className="w-full mt-2 p-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded font-medium"
                >
                  + Create New Tag
                </button>
              </div>
            )}
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