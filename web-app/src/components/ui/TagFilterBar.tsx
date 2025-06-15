/**
 * TagFilterBar.tsx
 * 
 * Tag filter bar component for filtering chats by tags
 * 
 * Components:
 *   TagFilterBar - Filter bar with tag selection and ALL button
 * 
 * Usage: <TagFilterBar tags={tags} selectedTags={selectedTags} onTagToggle={onTagToggle} onClearAll={onClearAll} />
 */
import React from 'react';
import { Tag } from './Tag';
import { cn } from '../../utils/cn';
import type { ChatTag } from '../../../../src/shared/types';

interface TagFilterBarProps {
  tags: ChatTag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  onClearAll: () => void;
  onTagRightClick?: (e: React.MouseEvent, tag: ChatTag) => void;
  className?: string;
}

/**
 * Tag filter bar for filtering chats by tags
 * 
 * @param tags - Available tags
 * @param selectedTags - Currently selected tag IDs
 * @param onTagToggle - Callback when a tag is toggled
 * @param onClearAll - Callback to clear all selected tags
 * @param onTagRightClick - Callback when a tag is right-clicked
 * @param className - Additional CSS classes
 * @returns React component
 */
export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  tags,
  selectedTags,
  onTagToggle,
  onClearAll,
  onTagRightClick,
  className
}) => {
  const hasSelectedTags = selectedTags.length > 0;

  // Show helpful text when no tags exist
  if (tags.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center p-3 bg-gray-50 border-b border-gray-200',
        className
      )}>
        <span className="text-sm text-gray-500">
          💡 Right-click on any chat to add tags for better organization
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-3 bg-gray-50 border-b border-gray-200',
      className
    )}>
      {/* First row: ALL button and selected count */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onClearAll}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            'border border-gray-300 shadow-sm',
            hasSelectedTags
              ? 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-200'
          )}
          title="Show all chats"
        >
          ALL
        </button>

        {/* Selected count indicator */}
        {hasSelectedTags && (
          <div className="text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
            <span className="font-medium">{selectedTags.length}</span> selected
          </div>
        )}
      </div>

      {/* Tag grid - wraps to multiple rows */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          
          return (
            <Tag
              key={tag.id}
              tag={tag}
              selected={isSelected}
              onClick={() => onTagToggle(tag.id)}
              onRightClick={onTagRightClick ? (e: React.MouseEvent) => onTagRightClick(e, tag) : undefined}
              size="sm"
              className={cn(
                'transition-all duration-200 hover:scale-105',
                !isSelected && 'opacity-75 hover:opacity-100'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}; 