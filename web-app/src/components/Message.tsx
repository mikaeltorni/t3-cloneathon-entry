/**
 * Message.tsx
 * 
 * Individual message component for chat interface
 * Extracted from ChatInterface.tsx for better organization
 * 
 * Components:
 *   Message
 * 
 * Features:
 *   - User vs Assistant message styling
 *   - Image display support (single and multiple images)
 *   - Reasoning toggle and collapsible display
 *   - Timestamp formatting
 *   - Loading states for reasoning
 * 
 * Usage: <Message message={msg} onToggleReasoning={toggleReasoning} isReasoningExpanded={expanded} />
 */
import React, { useCallback } from 'react';
import { cn } from '../utils/cn';
import type { ChatMessage } from '../../../src/shared/types';

/**
 * Props for the Message component
 */
interface MessageProps {
  message: ChatMessage;
  isReasoningExpanded: boolean;
  onToggleReasoning: (messageId: string) => void;
}

/**
 * Individual message component
 * 
 * Handles display of both user and assistant messages with:
 * - Image attachments (single and multiple)
 * - Reasoning display for AI messages
 * - Proper styling and formatting
 * 
 * @param message - Message object to display
 * @param isReasoningExpanded - Whether reasoning is expanded
 * @param onToggleReasoning - Callback to toggle reasoning expansion
 * @returns React component
 */
export const Message: React.FC<MessageProps> = ({
  message,
  isReasoningExpanded,
  onToggleReasoning
}) => {
  const isUser = message.role === 'user';
  
  // Only show reasoning if the message actually has reasoning content OR is currently reasoning
  const hasReasoningContent = !isUser && (message.reasoning || message.metadata?.isReasoning === true);
  const showReasoning = hasReasoningContent && message.reasoning;
  const isCurrentlyReasoning = !isUser && message.metadata?.isReasoning === true;
  const reasoningDuration = message.metadata?.reasoningDuration;

  /**
   * Format timestamp for display
   */
  const formatTime = useCallback((date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  /**
   * Format reasoning duration for display
   */
  const formatReasoningDuration = useCallback((duration: number): string => {
    if (duration < 1000) {
      return `${Math.round(duration)}ms`;
    } else {
      return `${(duration / 1000).toFixed(1)}s`;
    }
  }, []);

  /**
   * Render message images (single or multiple)
   */
  const renderImages = () => {
    // Multiple images (new feature)
    if (message.images && message.images.length > 0) {
      return (
        <div className="mb-3">
          <div className={cn(
            'grid gap-2',
            message.images.length === 1 ? 'grid-cols-1' : 
            message.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 sm:grid-cols-3'
          )}>
            {message.images.map((image) => (
              <div key={image.id} className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Single image (backward compatibility)
    if (message.imageUrl) {
      return (
        <div className="mb-3">
          <img
            src={message.imageUrl}
            alt="Shared image"
            className="max-w-full h-auto rounded-lg shadow-sm"
            style={{ maxHeight: '200px' }}
            loading="lazy"
          />
        </div>
      );
    }
    
    return null;
  };

  /**
   * Render reasoning toggle button
   */
  const renderReasoningToggle = () => {
    if (!hasReasoningContent && !isCurrentlyReasoning) return null;

    return (
      <button
        onClick={() => showReasoning ? onToggleReasoning(message.id) : undefined}
        className={cn(
          "inline-flex items-center space-x-1 text-xs transition-colors",
          showReasoning 
            ? "text-gray-500 hover:text-gray-700 cursor-pointer" 
            : "text-gray-400 cursor-default"
        )}
        disabled={!showReasoning}
      >
        <span>💭</span>
        {isCurrentlyReasoning ? (
          <span className="font-medium animate-pulse">Reasoning...</span>
        ) : showReasoning && reasoningDuration ? (
          <span className="font-medium">
            Reasoned ({formatReasoningDuration(reasoningDuration)})
          </span>
        ) : showReasoning ? (
          <span className="font-medium">Reasoned</span>
        ) : (
          <span className="font-medium text-gray-400">Reasoning...</span>
        )}
        {showReasoning && (
          <span className={cn(
            'transform transition-transform duration-200',
            isReasoningExpanded ? 'rotate-180' : 'rotate-0'
          )}>
            ▼
          </span>
        )}
      </button>
    );
  };

  /**
   * Render expanded reasoning content
   */
  const renderReasoningContent = () => {
    if (!showReasoning || !isReasoningExpanded) return null;

    return (
      <div className="bg-gray-50 bg-opacity-70 border-l-2 border-gray-300 pl-3 py-2 text-xs text-gray-600 animate-in slide-in-from-top-2 duration-200">
        <div className="whitespace-pre-wrap font-mono leading-relaxed opacity-80 text-xs">
          {message.reasoning}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%]', isUser ? 'order-2' : 'order-1')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          )}
        >
          {/* Display images */}
          {renderImages()}
          
          {/* Message content with reasoning */}
          <div className="space-y-2">
            {/* Reasoning toggle button */}
            {renderReasoningToggle()}
            
            {/* Collapsible reasoning display */}
            {renderReasoningContent()}
            
            {/* Main message content */}
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className={cn(
          'text-xs text-gray-500 mt-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatTime(message.timestamp)}
          {message.modelId && !isUser && (
            <span className="ml-2 text-gray-400">via {message.modelId.split('/').pop()}</span>
          )}
        </div>
      </div>
    </div>
  );
}; 