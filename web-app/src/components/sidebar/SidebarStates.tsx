/**
 * SidebarStates.tsx
 * 
 * Loading and empty state components for the chat sidebar
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   SidebarStates - Loading skeleton and empty state displays
 * 
 * Usage: <SidebarStates.Loading /> or <SidebarStates.Empty onNewChat={onNewChat} />
 */

import React from 'react';
import { Button } from '../ui/Button';

/**
 * Props for the Empty state component
 */
interface EmptyStateProps {
  /** Callback for creating new chat */
  onNewChat: () => void;
}

/**
 * Loading skeleton component
 * Enhanced with comprehensive dark mode support
 */
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 px-1">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded-lg mb-3"></div>
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-gray-200 dark:bg-slate-600 rounded-full mr-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded-full w-20"></div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded-lg w-4/5 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full w-16"></div>
            <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full w-8"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Empty state component with call-to-action
 * Enhanced with comprehensive dark mode support
 * 
 * @param onNewChat - Callback for creating new chat
 * @returns JSX element containing the empty state
 */
const EmptyState: React.FC<EmptyStateProps> = ({ onNewChat }) => (
  <div className="text-center py-12 px-4">
    <div className="text-5xl mb-4 opacity-60">💭</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
      No conversations yet
    </h3>
    <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
      Start your first chat to begin exploring AI conversations
    </p>
    <Button onClick={onNewChat} size="md" className="px-6">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Create New Chat
    </Button>
  </div>
);

/**
 * Sidebar states component collection
 */
export const SidebarStates = {
  Loading: LoadingSkeleton,
  Empty: EmptyState
}; 