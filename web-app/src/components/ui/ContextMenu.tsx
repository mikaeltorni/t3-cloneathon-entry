/**
 * ContextMenu.tsx
 * 
 * Context menu component for right-click interactions
 * Enhanced with comprehensive dark mode support and vibrant tag colors
 * 
 * Components:
 *   ContextMenu
 * 
 * Usage: <ContextMenu position={position} onClose={onClose} items={items} />
 */
import React, { useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import type { ChatTag } from '../../../../src/shared/types';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  type?: 'default' | 'danger' | 'separator';
  tag?: ChatTag;
}

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
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
 * Context menu component for right-click interactions
 * Enhanced with dark mode support and vibrant tag colors
 * 
 * @param position - Menu position coordinates
 * @param onClose - Callback to close menu
 * @param items - Menu items array
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  items,
  className
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Check if we're in dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[200px] bg-white rounded-md shadow-lg border border-gray-200 py-1',
        'dark:bg-slate-800 dark:border-slate-600',
        'animate-in slide-in-from-top-1 duration-100',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item) => {
        if (item.type === 'separator') {
          return (
            <div
              key={item.id}
              className="h-px bg-gray-200 my-1 dark:bg-slate-600"
            />
          );
        }

        // Calculate enhanced tag color for dark mode
        let tagStyle = {};
        if (item.tag) {
          const displayColor = isDarkMode 
            ? enhanceColorForDarkMode(item.tag.color.r, item.tag.color.g, item.tag.color.b)
            : item.tag.color;
          
          tagStyle = {
            backgroundColor: `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`,
            ...(isDarkMode && {
              boxShadow: `0 0 8px rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})40`
            })
          };
        }

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={cn(
              'w-full text-left px-3 py-2 text-sm flex items-center space-x-2',
              'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
              'dark:hover:bg-slate-700 dark:focus:bg-slate-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              item.type === 'danger' 
                ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 dark:focus:bg-red-950' 
                : 'text-gray-700 dark:text-slate-300'
            )}
          >
            {item.icon && (
              <span className="flex-shrink-0">{item.icon}</span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.tag && (
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0 shadow-sm"
                style={tagStyle}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}; 