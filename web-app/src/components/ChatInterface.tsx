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
 */
import React, { useState, useCallback } from 'react';
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
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentThread,
  onSendMessage,
  loading,
  availableModels,
  modelsLoading
}) => {
  const [inputBarHeight, setInputBarHeight] = useState(140); // Default height
  const { debug } = useLogger('ChatInterface');

  /**
   * Handle input bar height changes
   */
  const handleInputHeightChange = useCallback((height: number) => {
    setInputBarHeight(height);
    debug('Input bar height updated:', height);
  }, [debug]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Message List */}
      <MessageList 
        currentThread={currentThread}
        inputBarHeight={inputBarHeight}
      />

      {/* Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        loading={loading}
        availableModels={availableModels}
        modelsLoading={modelsLoading}
        onHeightChange={handleInputHeightChange}
      />
    </div>
  );
}; 