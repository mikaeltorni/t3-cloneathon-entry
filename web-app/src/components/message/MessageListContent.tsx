/**
 * MessageListContent.tsx
 * 
 * Component for rendering the scrollable message list content
 * 
 * Components:
 *   MessageListContent
 * 
 * Features:
 *   - Optimized message rendering
 *   - Memoized message components
 *   - Scroll anchor element
 *   - Performance optimized with React.memo
 * 
 * Usage: <MessageListContent messages={messages} expandedReasoningIds={ids} onToggleReasoning={toggle} />
 */
import React, { useCallback, useMemo } from 'react';
import { Message } from '../Message';
import type { ChatMessage } from '../../../../src/shared/types';

interface MessageListContentProps {
  /** Array of chat messages to render */
  messages: ChatMessage[];
  /** Set of message IDs with expanded reasoning */
  expandedReasoningIds: Set<string>;
  /** Callback to toggle reasoning visibility for a message */
  onToggleReasoning: (messageId: string) => void;
  /** Ref for the scroll anchor element */
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Message list content renderer with optimized performance
 * 
 * @param messages - Array of chat messages
 * @param expandedReasoningIds - Set of expanded reasoning message IDs
 * @param onToggleReasoning - Callback for toggling reasoning visibility
 * @param messagesEndRef - Ref for scroll anchor element
 * @returns React component rendering the message list
 */
export const MessageListContent: React.FC<MessageListContentProps> = React.memo(({
  messages,
  expandedReasoningIds,
  onToggleReasoning,
  messagesEndRef
}) => {
  /**
   * Create optimized toggle handler for each message
   */
  const createToggleHandler = useCallback((messageId: string) => {
    return () => onToggleReasoning(messageId);
  }, [onToggleReasoning]);

  /**
   * Memoized message list rendering
   */
  const messagesList = useMemo(() => {
    return messages.map((message) => (
      <Message
        key={message.id}
        message={message}
        showReasoning={expandedReasoningIds.has(message.id)}
        onToggleReasoning={createToggleHandler(message.id)}
      />
    ));
  }, [messages, expandedReasoningIds, createToggleHandler]);

  return (
    <div className="max-w-4xl mx-auto">
      {messagesList}
      <div 
        ref={messagesEndRef} 
        className="h-1" 
        aria-hidden="true" 
      />
    </div>
  );
});

MessageListContent.displayName = 'MessageListContent'; 