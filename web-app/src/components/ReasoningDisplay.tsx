/**
 * ReasoningDisplay.tsx
 * 
 * Component for displaying chain of thought reasoning traces
 * 
 * Components:
 *   ReasoningDisplay
 * 
 * Features:
 *   - Expandable/collapsible reasoning section
 *   - Styled reasoning steps with icons
 *   - Only shows for reasoning models
 *   - Smooth animations
 * 
 * Usage: <ReasoningDisplay reasoning={reasoning} />
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';
import type { ReasoningTrace } from '../../../src/shared/types';

interface ReasoningDisplayProps {
  reasoning?: ReasoningTrace[];
  className?: string;
}

/**
 * Get icon for reasoning step type
 * 
 * @param type - Type of reasoning step
 * @returns Icon emoji
 */
const getReasoningIcon = (type: ReasoningTrace['type']): string => {
  switch (type) {
    case 'thinking':
      return '🤔';
    case 'analysis':
      return '🔍';
    case 'conclusion':
      return '💡';
    case 'verification':
      return '✅';
    default:
      return '🧠';
  }
};

/**
 * Get color scheme for reasoning step type
 * 
 * @param type - Type of reasoning step
 * @returns Tailwind CSS classes
 */
const getReasoningColors = (type: ReasoningTrace['type']): string => {
  switch (type) {
    case 'thinking':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'analysis':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    case 'conclusion':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'verification':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

/**
 * Reasoning display component with expandable chain of thought
 * 
 * @param reasoning - Array of reasoning traces
 * @param className - Additional CSS classes
 * @returns React element
 */
export const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoning,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no reasoning data
  if (!reasoning || reasoning.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-3', className)}>
      {/* Reasoning Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-indigo-700 text-sm font-medium transition-colors w-full text-left"
      >
        <span className="text-base">🧠</span>
        <span>Reasoning ({reasoning.length} steps)</span>
        <span className={cn(
          'ml-auto transform transition-transform duration-200',
          isExpanded ? 'rotate-180' : 'rotate-0'
        )}>
          ▼
        </span>
      </button>

      {/* Reasoning Content */}
      {isExpanded && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {reasoning.map((trace) => (
            <div
              key={trace.id}
              className={cn(
                'p-3 rounded-lg border text-sm',
                getReasoningColors(trace.type)
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-base">{getReasoningIcon(trace.type)}</span>
                <span className="font-medium capitalize">
                  Step {trace.step}: {trace.type}
                </span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {trace.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 