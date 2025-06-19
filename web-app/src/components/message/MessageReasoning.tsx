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
    const result = message?.metadata?.isReasoning === true && !!message?.metadata?.reasoning;
    // Debug: streaming reasoning state
    // eslint-disable-next-line no-console
    console.log(`[MessageReasoning] isStreamingReasoning for messageId=${messageId}:`, result, {
      isReasoning: message?.metadata?.isReasoning,
      reasoning: message?.metadata?.reasoning
    });
    return result;
  }, [message?.metadata?.isReasoning, message?.metadata?.reasoning, messageId]);

  /**
   * Get the streaming reasoning content
   */
  const streamingReasoningContent = useMemo(() => {
    const content = isStreamingReasoning ? message?.metadata?.reasoning : null;
    // Debug: streaming reasoning content
    // eslint-disable-next-line no-console
    console.log(`[MessageReasoning] streamingReasoningContent for messageId=${messageId}:`, content);
    return content;
  }, [isStreamingReasoning, message?.metadata?.reasoning, messageId]);

  /**
   * Memoized reasoning content - handles both streaming and final reasoning
   */
  const reasoningContent = useMemo(() => {
    // Debug: reasoningContent recompute
    // eslint-disable-next-line no-console
    console.log(`[MessageReasoning] reasoningContent recompute for messageId=${messageId}`, {
      isStreamingReasoning,
      streamingReasoningContent,
      reasoning,
      showReasoning
    });

    // Show streaming reasoning first if available
    if (isStreamingReasoning && streamingReasoningContent) {
      // Debug: rendering streaming reasoning
      // eslint-disable-next-line no-console
      console.log(`[MessageReasoning] Rendering streaming reasoning for messageId=${messageId}`);
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
      // Debug: no reasoning to display
      // eslint-disable-next-line no-console
      console.log(`[MessageReasoning] No reasoning to display for messageId=${messageId}`);
      return null;
    }

    // Debug: rendering final reasoning with toggle
    // eslint-disable-next-line no-console
    console.log(`[MessageReasoning] Rendering final reasoning with toggle for messageId=${messageId}`, {
      showReasoning
    });

    return (
      <div className="mb-3">
        <button
          onClick={() => {
            // Debug: toggle reasoning button clicked
            // eslint-disable-next-line no-console
            console.log(`[MessageReasoning] Toggle reasoning button clicked for messageId=${messageId}, current showReasoning=${showReasoning}`);
            onToggleReasoning();
          }}
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
            {/* Debug: showing reasoning content */}
            {/* eslint-disable-next-line no-console */}
            {(() => { console.log(`[MessageReasoning] Showing reasoning content for messageId=${messageId}`); return reasoning; })()}
          </div>
        )}
      </div>
    );
  }, [reasoning, messageId, showReasoning, onToggleReasoning, isStreamingReasoning, streamingReasoningContent]);

  // Debug: returning reasoningContent
  // eslint-disable-next-line no-console
  console.log(`[MessageReasoning] Returning reasoningContent for messageId=${messageId}`);

  return reasoningContent;
}; 