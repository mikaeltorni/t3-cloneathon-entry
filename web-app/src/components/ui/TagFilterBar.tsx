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
  className?: string;
}

/**
 * Tag filter bar for filtering chats by tags
 * 
 * @param tags - Available tags
 * @param selectedTags - Currently selected tag IDs
 * @param onTagToggle - Callback when a tag is toggled
 * @param onClearAll - Callback to clear all selected tags
 * @param className - Additional CSS classes
 * @returns React component
 */
export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  tags,
  selectedTags,
  onTagToggle,
  onClearAll,
  className
}) => {
  const hasSelectedTags = selectedTags.length > 0;

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center space-x-2 p-3 bg-gray-50 border-b border-gray-200',
      'overflow-x-auto scrollbar-hide',
      className
    )}>
      {/* ALL button */}
      <button
        onClick={onClearAll}
        className={cn(
          'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
          'border border-gray-300',
          hasSelectedTags
            ? 'bg-white text-gray-700 hover:bg-gray-50'
            : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
        )}
        title="Show all chats"
      >
        ALL
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-300 flex-shrink-0" />

      {/* Tag filters */}
      <div className="flex items-center space-x-2 min-w-0">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          
          return (
            <Tag
              key={tag.id}
              tag={tag}
              selected={isSelected}
              onClick={() => onTagToggle(tag.id)}
              size="sm"
              className={cn(
                'flex-shrink-0 transition-all duration-200',
                !isSelected && 'opacity-70 hover:opacity-100'
              )}
            />
          );
        })}
      </div>

      {/* Selected count indicator */}
      {hasSelectedTags && (
        <div className="flex-shrink-0 text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
          {selectedTags.length} selected
        </div>
      )}
    </div>
  );
}; 