/**
 * Tag.tsx
 * 
 * Reusable tag component with Trello-style design
 * 
 * Components:
 *   Tag - Display component for individual tags
 * 
 * Usage: <Tag tag={tag} onClick={handleClick} onRemove={handleRemove} />
 */
import React from 'react';
import type { ChatTag } from '../../../../src/shared/types';
import { cn } from '../../utils/cn';

interface TagProps {
  tag: ChatTag;
  onClick?: (tag: ChatTag) => void;
  onRemove?: (tagId: string) => void;
  selected?: boolean;
  removable?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Tag display component with Trello-style design
 * 
 * @param tag - Tag object with name and color
 * @param onClick - Callback when tag is clicked
 * @param onRemove - Callback when remove button is clicked
 * @param selected - Whether the tag is selected for filtering
 * @param removable - Whether to show remove button
 * @param className - Additional CSS classes
 * @param size - Tag size variant
 * @returns React component
 */
export const Tag: React.FC<TagProps> = ({
  tag,
  onClick,
  onRemove,
  selected = false,
  removable = false,
  className,
  size = 'md'
}) => {
  const { r, g, b } = tag.color;
  const backgroundColor = `rgb(${r}, ${g}, ${b})`;
  
  // Calculate text color based on background brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = brightness > 125 ? '#000000' : '#ffffff';

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(tag);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.(tag.id);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md font-medium transition-all duration-200',
        'cursor-pointer hover:shadow-sm',
        sizes[size],
        selected && 'ring-2 ring-blue-400 ring-offset-1',
        onClick && 'hover:opacity-80',
        className
      )}
      style={{ 
        backgroundColor,
        color: textColor
      }}
      onClick={handleClick}
      title={tag.name}
    >
      <span className="truncate max-w-[120px]">{tag.name}</span>
      
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          className={cn(
            'ml-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors',
            'flex items-center justify-center',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
          title="Remove tag"
        >
          <svg
            className={cn(
              'fill-current',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
            )}
            viewBox="0 0 20 20"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}; 