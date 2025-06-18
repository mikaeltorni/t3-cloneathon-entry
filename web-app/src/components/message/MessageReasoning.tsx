/**
 * MessageReasoning.tsx
 * 
 * Component for displaying message reasoning with toggle functionality
 * Enhanced with comprehensive dark mode support and streaming reasoning display
 * 
 * Components:
 *   MessageReasoning
 * 
 * Usage: <MessageReasoning reasoning={reasoning} messageId={messageId} showReasoning={showReasoning} onToggle={onToggle} message={message} />
 */
import React, { useMemo } from 'react';
import { ReasoningDisplay } from '../ReasoningDisplay';
import type { ChatMessage } from '../../../../src/shared/types';

interface MessageReasoningProps {
  reasoning?: string;
  messageId: string;
  showReasoning: boolean;
  onToggleReasoning: () => void;
  message?: ChatMessage; // Add message prop to access metadata
}

/**
 * Reasoning display component for messages
 * Enhanced with comprehensive dark mode support and streaming reasoning
 * 
 * @param reasoning - Final reasoning content
 * @param messageId - Message ID for accessibility
 * @param showReasoning - Whether reasoning is currently shown
 * @param onToggleReasoning - Toggle function
 * @param message - Full message object to access metadata for streaming
 * @returns React component
 */
export const MessageReasoning: React.FC<MessageReasoningProps> = ({
  reasoning,
  messageId,
  showReasoning,
  onToggleReasoning,
  message
}) => {
  /**
   * Check if this message is currently streaming reasoning
   */
  const isStreamingReasoning = useMemo(() => {
    return message?.metadata?.isReasoning === true && !!message?.metadata?.reasoning;
  }, [message?.metadata?.isReasoning, message?.metadata?.reasoning]);

  /**
   * Get the streaming reasoning content
   */
  const streamingReasoningContent = useMemo(() => {
    return isStreamingReasoning ? message?.metadata?.reasoning : null;
  }, [isStreamingReasoning, message?.metadata?.reasoning]);

  /**
   * Memoized reasoning content - handles both streaming and final reasoning
   */
  const reasoningContent = useMemo(() => {
    // Show streaming reasoning first if available
    if (isStreamingReasoning && streamingReasoningContent) {
      return (
        <div className="mb-3">
          <ReasoningDisplay 
            reasoning={streamingReasoningContent}
            className="animate-pulse" // Add pulse animation for streaming
          />
        </div>
      );
    }

    // Show final reasoning with toggle if available
    if (!reasoning) {
      return null;
    }

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
  }, [reasoning, messageId, showReasoning, onToggleReasoning, isStreamingReasoning, streamingReasoningContent]);

  return reasoningContent;
}; 