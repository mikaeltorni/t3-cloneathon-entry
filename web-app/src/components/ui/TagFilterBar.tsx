/**
 * TagFilterBar.tsx
 * 
 * Filter bar component for filtering by tags
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   TagFilterBar
 * 
 * Usage: <TagFilterBar selectedTags={selectedTags} onTagToggle={onTagToggle} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
import { Tag } from './Tag';
// Use shared types for consistency
interface TagType {
  id: string;
  name: string;
  color: { r: number; g: number; b: number };
}

interface TagFilterBarProps {
  availableTags?: TagType[];
  selectedTags?: Set<string>;
  onTagToggle: (tagId: string) => void;
  className?: string;
}

/**
 * Filter bar component for tag-based filtering
 * Enhanced with dark mode support
 * 
 * @param availableTags - Array of available tags
 * @param selectedTags - Set of selected tag IDs
 * @param onTagToggle - Callback when tag selection changes
 * @param className - Additional CSS classes
 * @returns React component
 */
export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  availableTags = [],
  selectedTags = new Set(),
  onTagToggle,
  className
}) => {
  // Add null checking for safety
  const tags = availableTags || [];
  const selectedTagsSet = selectedTags || new Set();
  
  if (tags.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center p-3 bg-gray-50 border-b border-gray-200',
        'dark:bg-slate-800 dark:border-slate-600',
        className
      )}>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          No tags available for filtering
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-3 bg-gray-50 border-b border-gray-200',
      'dark:bg-slate-800 dark:border-slate-600',
      className
    )}>
      <div className="flex flex-wrap gap-2">
        {/* Clear All Button */}
        {selectedTagsSet.size > 0 && (
          <button
            onClick={() => selectedTagsSet.forEach(tagId => onTagToggle(tagId))}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200',
              'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400',
              'dark:text-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:border-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800'
            )}
          >
            Clear All
          </button>
        )}

        {/* Tag Buttons */}
        {tags.map((tag) => {
          const isSelected = selectedTagsSet.has(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200',
                isSelected
                  ? 'shadow-md scale-105 border-opacity-60'
                  : 'hover:scale-105 hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800'
              )}
              style={{
                backgroundColor: isSelected ? `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})` : undefined,
                borderColor: `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})`,
                color: isSelected 
                  ? (tag.color.r * 0.299 + tag.color.g * 0.587 + tag.color.b * 0.114) > 125 ? '#000000' : '#ffffff'
                  : `rgb(${tag.color.r}, ${tag.color.g}, ${tag.color.b})`
              }}
            >
              {tag.name}
            </button>
          );
        })}

        {/* Active Filter Count */}
        {selectedTagsSet.size > 0 && (
          <div className="text-xs text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm">
            {selectedTagsSet.size} filter{selectedTagsSet.size !== 1 ? 's' : ''} active
          </div>
        )}
      </div>
    </div>
  );
}; 