/**
 * SidebarHeader.tsx
 * 
 * Header component for the chat sidebar
 * 
 * Components:
 *   SidebarHeader - Header with toggle, title, refresh, and new chat functionality
 * 
 * Usage: <SidebarHeader onToggle={onToggle} onNewChat={onNewChat} onRefresh={onRefresh} />
 */

import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

/**
 * Props for the SidebarHeader component
 */
interface SidebarHeaderProps {
  /** Callback for toggling sidebar */
  onToggle?: () => void;
  /** Callback for creating new chat */
  onNewChat: () => void;
  /** Total number of threads */
  threadCount: number;
  /** Number of pinned threads */
  pinnedCount: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sidebar header component with toggle, title, and new chat functionality
 * 
 * @param onToggle - Callback for toggling sidebar
 * @param onNewChat - Callback for creating new chat
 * @param threadCount - Total number of threads
 * @param pinnedCount - Number of pinned threads
 * @param className - Additional CSS classes
 * @returns JSX element containing the header
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onToggle,
  onNewChat,
  threadCount,
  pinnedCount,
  className
}) => {
  return (
    <div className={cn('p-4 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm', className)}>
      {/* Top row: Toggle button + Chats title */}
      <div className="flex items-center gap-3 mb-4">
        {/* Sidebar toggle button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 hover:shadow-sm"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex-1">Conversations</h1>
      </div>
      
      {/* Enhanced New Chat button */}
      <Button 
        onClick={onNewChat} 
        className="w-full mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
        size="md"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Conversation
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        OpenRouter Chat • {threadCount} conversations
        {pinnedCount > 0 && (
          <span className="text-amber-600 ml-1">
            • {pinnedCount} pinned
          </span>
        )}
      </p>
    </div>
  );
}; 