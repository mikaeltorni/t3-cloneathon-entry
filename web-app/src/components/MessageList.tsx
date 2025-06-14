/**
 * MessageList.tsx
 * 
 * Message list component for rendering conversation messages - refactored with extracted components
 * Now uses smaller, focused components and custom hooks for better maintainability
 * 
 * Components:
 *   MessageList
 * 
 * Features:
 *   - Composed of smaller, focused components
 *   - Custom hook for scroll management
 *   - Welcome state for empty conversations
 *   - Performance optimized with React.memo
 *   - Dynamic bottom padding to prevent overlap with fixed input bar
 * 
 * Usage: <MessageList messages={messages} expandedReasoningIds={ids} onToggleReasoning={toggle} dynamicBottomPadding={height} />
 */
import React from 'react';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { WelcomeMessage } from './message/WelcomeMessage';
import { MessageListContent } from './message/MessageListContent';
import type { ChatMessage } from '../../../src/shared/types';

interface MessageListProps {
  messages: ChatMessage[];
  expandedReasoningIds: Set<string>;
  onToggleReasoning: (messageId: string) => void;
  dynamicBottomPadding?: number;
}

/**
 * Message list component with optimized rendering and dynamic spacing
 * 
 * @param messages - Array of chat messages
 * @param expandedReasoningIds - Set of message IDs with expanded reasoning
 * @param onToggleReasoning - Callback to toggle reasoning for a message
 * @param dynamicBottomPadding - Dynamic bottom padding to account for input bar
 * @returns React component
 */
const MessageList: React.FC<MessageListProps> = React.memo(({ 
  messages, 
  expandedReasoningIds, 
  onToggleReasoning,
  dynamicBottomPadding = 200 // Default fallback padding
}) => {
  // Extract scroll management logic to custom hook
  const { containerRef, messagesEndRef, handleScroll } = useAutoScroll({
    dynamicBottomPadding,
    messageCount: messages.length,
    lastMessageContent: messages[messages.length - 1]?.content,
    expandedReasoningCount: expandedReasoningIds.size
  });

  // Show welcome message if no messages
  if (messages.length === 0) {
    return (
      <div 
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: `${dynamicBottomPadding}px` }}
      >
        <WelcomeMessage />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      style={{ paddingBottom: `${dynamicBottomPadding}px` }}
      onScroll={handleScroll}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      <MessageListContent
        messages={messages}
        expandedReasoningIds={expandedReasoningIds}
        onToggleReasoning={onToggleReasoning}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export { MessageList }; 