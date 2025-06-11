/**
 * ChatInterface.tsx
 * 
 * Main chat interface component - refactored for better organization
 * Now uses composed components for cleaner architecture
 * 
 * Components:
 *   ChatInterface
 * 
 * Features:
 *   - Simplified layout composition using extracted components
 *   - Clean separation of concerns
 *   - Enhanced maintainability and testability
 *   - Responsive design with proper spacing
 *   - Performance optimized with React.memo and reasoning state management
 */
import React, { useState, useCallback, useMemo } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useLogger } from '../hooks/useLogger';
import type { ChatThread, ModelConfig, ImageAttachment } from '../../../src/shared/types';

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  currentThread: ChatThread | null;
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean) => Promise<void>;
  loading: boolean;
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
}

/**
 * Main chat interface component
 * 
 * Orchestrates the message display and input composition using
 * extracted components for better organization and maintainability.
 * 
 * @param currentThread - Current active chat thread
 * @param onSendMessage - Callback for sending messages
 * @param loading - Loading state for message sending
 * @param availableModels - Available AI models
 * @param modelsLoading - Models loading state
 * @returns React component
 */
const ChatInterface: React.FC<ChatInterfaceProps> = React.memo(({
  currentThread,
  onSendMessage,
  loading,
  availableModels,
  modelsLoading
}) => {
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Set<string>>(new Set());
  const { debug } = useLogger('ChatInterface');

  /**
   * Toggle reasoning expansion for a message
   */
  const handleToggleReasoning = useCallback((messageId: string) => {
    setExpandedReasoningIds(prev => {
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

  /**
   * Memoized messages array from current thread
   */
  const messages = useMemo(() => {
    return currentThread?.messages || [];
  }, [currentThread?.messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Message List */}
      <MessageList 
        messages={messages}
        expandedReasoningIds={expandedReasoningIds}
        onToggleReasoning={handleToggleReasoning}
      />

      {/* Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        loading={loading}
        availableModels={availableModels}
        modelsLoading={modelsLoading}
      />
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export { ChatInterface }; 