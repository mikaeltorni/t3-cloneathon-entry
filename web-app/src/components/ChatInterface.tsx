/**
 * ChatInterface.tsx
 * 
 * Main chat interface component - refactored with extracted components and hooks
 * Now uses smaller, focused components and custom hooks for better maintainability
 * 
 * Components:
 *   ChatInterface
 * 
 * Features:
 *   - Composed of smaller, focused components
 *   - Custom hooks for file management and state
 *   - Clean separation of concerns
 *   - Enhanced maintainability and testability
 *   - Performance optimized with React.memo
 * 
 * Usage: <ChatInterface currentThread={thread} onSendMessage={send} ... />
 */
import React, { useMemo } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatLayout } from './ui/ChatLayout';
import { GlobalDragOverlay } from './ui/GlobalDragOverlay';

import { useReasoningState } from '../hooks/useReasoningState';
import { useInputBarHeight } from '../hooks/useInputBarHeight';
import { useFileManagement } from '../hooks/useFileManagement';
import type { ChatThread, ModelConfig, ImageAttachment, DocumentAttachment, TokenMetrics } from '../../../src/shared/types';

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  currentThread: ChatThread | null;
  onSendMessage: (content: string, images?: ImageAttachment[], documents?: DocumentAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  loading: boolean;
  availableModels: Record<string, ModelConfig>;
  images: ImageAttachment[];
  documents: DocumentAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  onDocumentsChange: (documents: DocumentAttachment[]) => void;
  sidebarOpen?: boolean;
  modelSidebarOpen?: boolean;
  currentTokenMetrics?: TokenMetrics | null;
  selectedModel?: string; // External model selection from ModelSidebar
  onModelChange?: (modelId: string) => void; // Model change handler
  onModelSelectorClick?: () => void; // Callback to open model selector
}

/**
 * Main chat interface component
 * 
 * Orchestrates the message display and input composition using
 * extracted components and hooks for better organization and maintainability.
 * 
 * @param currentThread - Current active chat thread
 * @param onSendMessage - Callback for sending messages
 * @param loading - Loading state for message sending
 * @param availableModels - Available AI models
 * @param images - Current image attachments
 * @param documents - Current document attachments
 * @param onImagesChange - Callback for image changes
 * @param onDocumentsChange - Callback for document changes
 * @param sidebarOpen - Whether the sidebar is open
 * @param currentTokenMetrics - Current token usage metrics
 * @param selectedModel - Currently selected AI model (from ModelSidebar)
 * @param onModelChange - Callback when model is changed (via ModelSidebar)
 * @returns React component
 */
const ChatInterface: React.FC<ChatInterfaceProps> = React.memo(({
  currentThread,
  onSendMessage,
  loading,
  availableModels,
  images,
  documents,
  onImagesChange,
  onDocumentsChange,
  sidebarOpen = false,
  modelSidebarOpen = false,
  currentTokenMetrics = null,
  selectedModel,
  onModelChange,
  onModelSelectorClick
}) => {


  /**
   * Memoized messages array from current thread
   */
  const messages = useMemo(() => {
    return currentThread?.messages || [];
  }, [currentThread?.messages]);

  /**
   * Reasoning state management hook
   */
  const { expandedReasoningIds, handleToggleReasoning } = useReasoningState(messages);

  /**
   * Input bar height management hook
   */
  const { inputBarHeight, updateHeight } = useInputBarHeight(200);

  /**
   * File management hook with global drop zone
   */
  const { dropZone } = useFileManagement({
    images,
    documents,
    onImagesChange,
    onDocumentsChange,
    maxImages: 5,
    maxDocuments: 5
  });

  return (
    <ChatLayout 
      isDragOver={dropZone.isDragOver}
      dropHandlers={dropZone.dropHandlers}
    >
      {/* Global drag overlay */}
      <GlobalDragOverlay isVisible={dropZone.isDragOver} />

      {/* Message List with Dynamic Spacing */}
      <MessageList 
        messages={messages}
        expandedReasoningIds={expandedReasoningIds}
        onToggleReasoning={handleToggleReasoning}
        dynamicBottomPadding={inputBarHeight}
      />

      {/* Fixed Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        loading={loading}
        availableModels={availableModels}
        images={images}
        documents={documents}
        onImagesChange={onImagesChange}
        onDocumentsChange={onDocumentsChange}
        onHeightChange={updateHeight}
        sidebarOpen={sidebarOpen}
        modelSidebarOpen={modelSidebarOpen}
        currentTokenMetrics={currentTokenMetrics}
        isGenerating={loading}
        currentMessages={messages}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        onModelSelectorClick={onModelSelectorClick}
      />
    </ChatLayout>
  );
});

ChatInterface.displayName = 'ChatInterface';

export { ChatInterface }; 