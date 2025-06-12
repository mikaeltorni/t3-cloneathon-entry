/**
 * SidebarToggle.tsx
 * 
 * Sidebar toggle button component
 * 
 * Components:
 *   SidebarToggle
 * 
 * Features:
 *   - Fixed positioning on the left side
 *   - Responsive visibility
 *   - Smooth animations
 *   - Accessibility support
 * 
 * Usage: <SidebarToggle isOpen={isOpen} onToggle={toggle} />
 */
import React from 'react';
import { cn } from '../../utils/cn';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Sidebar toggle button component
 * 
 * @param isOpen - Whether sidebar is currently open
 * @param onToggle - Callback to toggle sidebar
 * @param className - Additional CSS classes
 * @returns React component
 */
export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  isOpen,
  onToggle,
  className
}) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'fixed left-4 top-4 z-50 p-2 bg-white border border-gray-300 rounded-lg shadow-lg',
        'hover:bg-gray-50 hover:border-gray-400 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'md:hidden', // Only show on mobile/small screens
        className
      )}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      title={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      <svg
        className={cn(
          'w-5 h-5 text-gray-600 transition-transform duration-200',
          isOpen && 'transform rotate-180'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isOpen ? (
          // Close icon (X)
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          // Menu icon (hamburger)
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}; 