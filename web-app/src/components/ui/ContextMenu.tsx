/**
 * ContextMenu.tsx
 * 
 * Right-click context menu component for tag operations
 * 
 * Components:
 *   ContextMenu - Context menu with tag management options
 * 
 * Usage: <ContextMenu isOpen={isOpen} position={position} onClose={onClose} items={menuItems} />
 */
import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import type { ChatTag } from '../../../../src/shared/types';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  type?: 'normal' | 'separator' | 'danger';
  disabled?: boolean;
  tag?: ChatTag; // For tag-specific items
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
  className?: string;
}

/**
 * Context menu component for right-click operations
 * 
 * @param isOpen - Whether the menu is visible
 * @param position - Menu position coordinates
 * @param onClose - Callback to close the menu
 * @param items - Menu items
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  items,
  className
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position
      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      if (adjustedX !== position.x || adjustedY !== position.y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    item.action();
    onClose();
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
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ 
                  backgroundColor: `rgb(${item.tag.color.r}, ${item.tag.color.g}, ${item.tag.color.b})` 
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}; 