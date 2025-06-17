/**
 * ChatLayout.tsx
 * 
 * Main chat layout component that orchestrates message display and input
 * Enhanced with improved mobile background styling
 * 
 * Components:
 *   ChatLayout
 * 
 * Features:
 *   - Flexible layout composition
 *   - Dynamic background based on drag state
 *   - Enhanced mobile background styling
 *   - Responsive message and input positioning
 *   - Support for global drag-and-drop
 * 
 * Usage: <ChatLayout isDragOver={dragState} dropHandlers={handlers}>content</ChatLayout>
 */
import React from 'react';
import type { ReactNode } from 'react';

interface ChatLayoutProps {
  /** Child components to render */
  children: ReactNode;
  /** Whether files are being dragged over */
  isDragOver: boolean;
  /** Drop event handlers for drag-and-drop */
  dropHandlers: Record<string, (event: React.DragEvent<HTMLDivElement>) => void>;
}

/**
 * Main chat layout component
 * Enhanced with improved mobile background styling
 * 
 * @param children - Child components to render
 * @param isDragOver - Whether files are being dragged
 * @param dropHandlers - Drag and drop event handlers
 * @returns React component providing the main chat layout
 */
export const ChatLayout: React.FC<ChatLayoutProps> = React.memo(({
  children,
  isDragOver,
  dropHandlers
}) => {
  return (
    <div 
      className={`flex flex-col h-full transition-colors duration-200 ${
        isDragOver 
          ? 'bg-blue-50 dark:bg-blue-950' 
          : 'bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-800'
      }`}
      {...dropHandlers}
    >
      {children}
    </div>
  );
});

ChatLayout.displayName = 'ChatLayout'; 