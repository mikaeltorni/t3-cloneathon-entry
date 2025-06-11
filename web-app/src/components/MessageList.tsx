/**
 * MessageList.tsx
 * 
 * Message list component for rendering conversation messages
 * 
 * Components:
 *   MessageList
 * 
 * Features:
 *   - Message rendering with auto-scroll
 *   - Welcome state for empty conversations
 *   - Reasoning state management
 *   - Performance optimized with React.memo and useCallback
 *   - Virtualization-ready structure
 *   - Dynamic bottom padding to prevent overlap with fixed input bar
 * 
 * Usage: <MessageList messages={messages} expandedReasoningIds={ids} onToggleReasoning={toggle} dynamicBottomPadding={height} />
 */
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Message } from './Message';
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
 * @param {MessageListProps} props - Message list properties
 * @returns {JSX.Element} Rendered message list component
 */
const MessageList: React.FC<MessageListProps> = React.memo(({ 
  messages, 
  expandedReasoningIds, 
  onToggleReasoning,
  dynamicBottomPadding = 200 // Default fallback padding
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Enhanced scroll to bottom with multiple fallback strategies
   */
  const scrollToBottom = useCallback((force = false) => {
    const container = containerRef.current;
    const messagesEnd = messagesEndRef.current;
    
    if (!container) return;

    // If user is actively scrolling, don't auto-scroll (unless forced)
    if (isUserScrolling.current && !force) return;

    // Method 1: Scroll container to bottom (most reliable)
    container.scrollTop = container.scrollHeight;

    // Method 2: Also use scrollIntoView as fallback
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }

    // Method 3: Force scroll after a delay to handle dynamic content
    setTimeout(() => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }, []);

  /**
   * Detect if user is manually scrolling
   */
  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset scrolling flag after 1 second of no scroll activity
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 1000);
  }, []);

  /**
   * Enhanced auto-scroll: triggers on message changes with improved timing
   */
  useEffect(() => {
    // Force scroll to bottom when new messages arrive
    const timeoutId = setTimeout(() => {
      scrollToBottom(true); // Force scroll even if user was scrolling
    }, 100);

    // Additional scroll after content has definitely rendered
    const secondTimeout = setTimeout(() => {
      scrollToBottom(true);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(secondTimeout);
    };
  }, [messages.length, scrollToBottom]);

  /**
   * Scroll when message content changes (streaming updates)
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      // Debounced scroll during streaming to avoid excessive scrolling
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [messages[messages.length - 1]?.content, scrollToBottom]);

  /**
   * Re-scroll when padding changes to maintain bottom position
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [dynamicBottomPadding, scrollToBottom]);

  /**
   * Re-scroll when reasoning is toggled (changes content height)
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 300); // Longer delay for animation completion

    return () => clearTimeout(timeoutId);
  }, [expandedReasoningIds.size, scrollToBottom]);

  /**
   * Cleanup scroll timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Memoized welcome message component
   */
  const welcomeMessage = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to OpenRouter Chat!
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Start a conversation with any AI model. Upload images, ask questions, 
          and explore the capabilities of different language models.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💬 Ask Anything</h3>
            <p className="text-blue-700">Get help with coding, writing, analysis, and more</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">🖼️ Upload Images</h3>
            <p className="text-purple-700">Share images for analysis and description</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">🧠 Reasoning Models</h3>
            <p className="text-green-700">Enable reasoning for complex problem solving</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">⚡ Multiple Models</h3>
            <p className="text-orange-700">Switch between different AI models</p>
          </div>
        </div>
      </div>
    </div>
  ), []);

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

  // Show welcome message if no messages
  if (messages.length === 0) {
    return (
      <div 
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: `${dynamicBottomPadding}px` }}
      >
        {welcomeMessage}
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
      <div className="max-w-4xl mx-auto">
        {messagesList}
        <div ref={messagesEndRef} className="h-1" aria-hidden="true" />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export { MessageList }; 