/**
 * MessageReasoning.tsx
 * 
 * Component for displaying message reasoning with toggle functionality
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   MessageReasoning
 * 
 * Usage: <MessageReasoning reasoning={reasoning} messageId={messageId} showReasoning={showReasoning} onToggle={onToggle} />
 */
import React, { useMemo } from 'react';

interface MessageReasoningProps {
  reasoning?: string;
  messageId: string;
  showReasoning: boolean;
  onToggleReasoning: () => void;
}

/**
 * Reasoning display component for messages
 * Enhanced with comprehensive dark mode support
 * 
 * @param reasoning - Reasoning content
 * @param messageId - Message ID for accessibility
 * @param showReasoning - Whether reasoning is currently shown
 * @param onToggleReasoning - Toggle function
 * @returns React component
 */
export const MessageReasoning: React.FC<MessageReasoningProps> = ({
  reasoning,
  messageId,
  showReasoning,
  onToggleReasoning
}) => {
  /**
   * Memoized reasoning content
   */
  const reasoningContent = useMemo(() => {
    if (!reasoning) return null;

    return (
      <div className="mb-3">
        <button
          onClick={onToggleReasoning}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 transition-colors duration-200"
          aria-expanded={showReasoning}
          aria-controls={`reasoning-${messageId}`}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showReasoning ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Reasoning
        </button>
        
        {showReasoning && (
          <div 
            id={`reasoning-${messageId}`}
            className="bg-blue-50 dark:bg-slate-700 p-3 rounded-md text-sm text-blue-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-2 duration-200"
          >
            {reasoning}
          </div>
        )}
      </div>
    );
  }, [reasoning, messageId, showReasoning, onToggleReasoning]);

  return reasoningContent;
}; 