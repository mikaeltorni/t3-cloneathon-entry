/**
 * ReasoningDisplay.tsx
 * 
 * Real-time reasoning display for streaming AI thoughts
 * 
 * Components:
 *   ReasoningDisplay
 * 
 * Features:
 *   - Real-time streaming of reasoning content
 *   - Inline display with message
 *   - Raw model output, no fancy formatting
 * 
 * Usage: <ReasoningDisplay reasoning={reasoningContent} />
 */

import React from 'react';
import { cn } from '../utils/cn';

interface ReasoningDisplayProps {
  reasoning?: string;
  className?: string;
}

/**
 * Simple real-time reasoning display
 * 
 * @param reasoning - Raw reasoning content from model
 * @param className - Additional CSS classes
 * @returns React element
 */
export const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoning,
  className
}) => {
  // Don't render if no reasoning content
  if (!reasoning || reasoning.trim().length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'mt-3 p-3 bg-gray-50 border-l-4 border-gray-300 text-sm text-gray-700',
      'dark:bg-slate-800 dark:border-slate-500 dark:text-slate-300',
      className
    )}>
      <div className="font-medium text-gray-600 mb-2 dark:text-slate-400">Reasoning:</div>
      <div className="whitespace-pre-wrap font-mono leading-relaxed">
        {reasoning}
      </div>
    </div>
  );
}; 