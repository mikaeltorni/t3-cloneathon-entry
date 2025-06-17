/**
 * Tag.tsx
 * 
 * Reusable tag component with Trello-style design
 * Enhanced with vibrant colors for dark mode
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
  onRightClick?: (e: React.MouseEvent, tag: ChatTag) => void;
  selected?: boolean;
  removable?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Enhance colors for dark mode by boosting brightness and saturation
 */
const enhanceColorForDarkMode = (r: number, g: number, b: number) => {
  // Convert RGB to HSL for easier manipulation
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r / 255:
        h = ((g / 255 - b / 255) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g / 255:
        h = ((b / 255 - r / 255) / diff + 2) / 6;
        break;
      case b / 255:
        h = ((r / 255 - g / 255) / diff + 4) / 6;
        break;
    }
  }
  
  // Boost saturation and lightness for dark mode
  const enhancedS = Math.min(1, s * 1.6); // Increase saturation by 60%
  const enhancedL = Math.min(0.85, Math.max(0.4, l + 0.3)); // Ensure lightness is between 40-85%
  
  // Convert back to RGB
  const c = (1 - Math.abs(2 * enhancedL - 1)) * enhancedS;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = enhancedL - c / 2;
  
  let rNew = 0, gNew = 0, bNew = 0;
  
  if (h >= 0 && h < 1/6) {
    rNew = c; gNew = x; bNew = 0;
  } else if (h >= 1/6 && h < 2/6) {
    rNew = x; gNew = c; bNew = 0;
  } else if (h >= 2/6 && h < 3/6) {
    rNew = 0; gNew = c; bNew = x;
  } else if (h >= 3/6 && h < 4/6) {
    rNew = 0; gNew = x; bNew = c;
  } else if (h >= 4/6 && h < 5/6) {
    rNew = x; gNew = 0; bNew = c;
  } else {
    rNew = c; gNew = 0; bNew = x;
  }
  
  return {
    r: Math.round((rNew + m) * 255),
    g: Math.round((gNew + m) * 255),
    b: Math.round((bNew + m) * 255)
  };
};

/**
 * Tag display component with Trello-style design
 * Enhanced with vibrant colors for dark mode
 * 
 * @param tag - Tag object with name and color
 * @param onClick - Callback when tag is clicked
 * @param onRemove - Callback when remove button is clicked
 * @param onRightClick - Callback when tag is right-clicked
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
  onRightClick,
  selected = false,
  removable = false,
  className,
  size = 'md'
}) => {
  const { r, g, b } = tag.color;
  
  // Check if we're in dark mode by checking if html has dark class
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  // Use enhanced colors in dark mode, original colors in light mode
  const displayColor = isDarkMode ? enhanceColorForDarkMode(r, g, b) : { r, g, b };
  const backgroundColor = `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`;
  
  // Calculate text color based on enhanced background brightness
  const brightness = (displayColor.r * 299 + displayColor.g * 587 + displayColor.b * 114) / 1000;
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

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick?.(e, tag);
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
        'cursor-pointer hover:shadow-lg',
        sizes[size],
        selected && 'ring-2 ring-blue-400 ring-offset-1 dark:ring-blue-300 dark:ring-offset-slate-800',
        onClick && 'hover:opacity-90 hover:scale-105',
        // Enhanced shadow and glow for dark mode
        isDarkMode && 'shadow-lg hover:shadow-xl',
        className
      )}
      style={{ 
        backgroundColor,
        color: textColor,
        // Add subtle glow effect in dark mode
        ...(isDarkMode && {
          boxShadow: `0 0 10px ${backgroundColor}40, 0 4px 6px -1px rgba(0, 0, 0, 0.3)`
        })
      }}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      title={tag.name}
    >
      <span className="truncate max-w-[120px] font-semibold">{tag.name}</span>
      
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