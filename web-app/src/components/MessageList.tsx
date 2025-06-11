/**
 * MessageList.tsx
 * 
 * Message list component for chat interface
 * Extracted from ChatInterface.tsx for better organization
 * 
 * Components:
 *   MessageList
 * 
 * Features:
 *   - Message rendering loop with auto-scroll
 *   - Welcome and empty state messages
 *   - Reasoning state management
 *   - Responsive message container
 * 
 * Usage: <MessageList currentThread={thread} inputBarHeight={height} />
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from './Message';
import { useLogger } from '../hooks/useLogger';
import type { ChatThread } from '../../../src/shared/types';

/**
 * Props for the MessageList component
 */
interface MessageListProps {
  currentThread: ChatThread | null;
  inputBarHeight: number;
}

/**
 * Message list component
 * 
 * Handles display of all messages in a thread with:
 * - Auto-scrolling to latest messages
 * - Welcome and empty state displays
 * - Reasoning expansion state management
 * 
 * @param currentThread - Current active chat thread
 * @param inputBarHeight - Height of input bar for proper spacing
 * @returns React component
 */
export const MessageList: React.FC<MessageListProps> = ({
  currentThread,
  inputBarHeight
}) => {
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { debug } = useLogger('MessageList');

  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Toggle reasoning expansion for a message
   */
  const toggleReasoning = useCallback((messageId: string) => {
    setExpandedReasoning(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        debug(`Collapsed reasoning for message: ${messageId}`);
      } else {
        newSet.add(messageId);
        debug(`Expanded reasoning for message: ${messageId}`);
      }
      return newSet;
    });
  }, [debug]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentThread?.messages, scrollToBottom]);

  /**
   * Render welcome message for new users
   */
  const renderWelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to OpenRouter Chat!</h2>
      <p className="text-gray-600 max-w-md">
        Start a conversation by typing a message below. You can also upload images and select different AI models.
      </p>
    </div>
  );

  /**
   * Render empty thread message
   */
  const renderEmptyThreadMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-4xl mb-4">💬</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to chat!</h3>
      <p className="text-gray-500">
        Type your message below to start the conversation.
      </p>
    </div>
  );

  // No current thread - show welcome
  if (!currentThread) {
    return (
      <div 
        className="flex-1 overflow-y-auto bg-gray-50"
        style={{ paddingBottom: `${inputBarHeight}px` }}
      >
        {renderWelcomeMessage()}
      </div>
    );
  }

  // Thread exists but no messages - show empty state
  if (currentThread.messages.length === 0) {
    return (
      <div 
        className="flex-1 overflow-y-auto bg-gray-50"
        style={{ paddingBottom: `${inputBarHeight}px` }}
      >
        {renderEmptyThreadMessage()}
      </div>
    );
  }

  // Thread with messages - render message list
  return (
    <div 
      className="flex-1 overflow-y-auto bg-gray-50"
      style={{ paddingBottom: `${inputBarHeight}px` }}
    >
      <div className="max-w-4xl mx-auto p-4">
        {currentThread.messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isReasoningExpanded={expandedReasoning.has(msg.id)}
            onToggleReasoning={toggleReasoning}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}; 