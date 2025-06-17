/**
 * TagFilterBar.tsx
 * 
 * Filter bar component for filtering by tags
 * Enhanced with comprehensive dark mode support and vibrant colors
 * 
 * Components:
 *   TagFilterBar
 * 
 * Usage: <TagFilterBar selectedTags={selectedTags} onTagToggle={onTagToggle} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
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
 * Filter bar component for tag-based filtering
 * Enhanced with dark mode support and vibrant colors
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
  
  // Check if we're in dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');
  
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
        {tags.map(tag => {
          const isSelected = selectedTagsSet.has(tag.id);
          
          // Use enhanced colors in dark mode
          const displayColor = isDarkMode ? enhanceColorForDarkMode(tag.color.r, tag.color.g, tag.color.b) : tag.color;
          const backgroundColor = `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`;
          const brightness = (displayColor.r * 299 + displayColor.g * 587 + displayColor.b * 114) / 1000;
          const textColor = brightness > 125 ? '#000000' : '#ffffff';
          
          return (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200',
                isSelected
                  ? 'shadow-lg scale-105 border-opacity-60'
                  : 'hover:scale-105 hover:shadow-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800',
                // Enhanced shadow and glow for dark mode
                isDarkMode && isSelected && 'shadow-xl',
              )}
              style={{
                backgroundColor: isSelected ? backgroundColor : 'transparent',
                borderColor: backgroundColor,
                color: isSelected ? textColor : backgroundColor,
                // Add subtle glow effect in dark mode when selected
                ...(isDarkMode && isSelected && {
                  boxShadow: `0 0 15px ${backgroundColor}60, 0 4px 8px -1px rgba(0, 0, 0, 0.4)`
                })
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