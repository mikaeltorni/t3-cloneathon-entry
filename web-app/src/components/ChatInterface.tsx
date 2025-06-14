/**
 * ChatInterface.tsx
 * 
 * Main chat interface component - refactored with extracted hooks
 * Now uses custom hooks for cleaner architecture and better separation of concerns
 * 
 * Components:
 *   ChatInterface
 * 
 * Features:
 *   - Simplified layout composition using extracted hooks
 *   - Clean separation of concerns with useReasoningState and useInputBarHeight
 *   - Enhanced maintainability and testability
 *   - Responsive design with proper spacing
 *   - Performance optimized with React.memo and memoized values
 *   - Global drag-and-drop zone for images (excluding sidebar)
 *   - Dynamic spacing to prevent messages from hiding behind input bar
 *   - Persistent reasoning visibility: Reasoning remains expanded after message completion
 */
import React, { useMemo } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useLogger } from '../hooks/useLogger';
import { useGlobalFileDropZone } from '../hooks/useGlobalFileDropZone';
import { useReasoningState } from '../hooks/useReasoningState';
import { useInputBarHeight } from '../hooks/useInputBarHeight';
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
  currentTokenMetrics?: TokenMetrics | null;
  selectedModel?: string; // External model selection from ModelSidebar
  onModelChange?: (modelId: string) => void; // Model change handler
}

/**
 * Main chat interface component
 * 
 * Orchestrates the message display and input composition using
 * extracted hooks for better organization and maintainability.
 * 
 * @param currentThread - Current active chat thread
 * @param onSendMessage - Callback for sending messages
 * @param loading - Loading state for message sending
 * @param availableModels - Available AI models
 * @param images - Current image attachments
 * @param onImagesChange - Callback for image changes
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
  currentTokenMetrics = null,
  selectedModel,
  onModelChange
}) => {
  const { debug } = useLogger('ChatInterface');

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
   * Add new images from global drop zone
   */
  const handleImagesAdd = React.useCallback((newImages: ImageAttachment[]) => {
    onImagesChange([...images, ...newImages]);
    debug(`Added ${newImages.length} images via global drop zone`);
  }, [images, onImagesChange, debug]);

  /**
   * Add new documents from global drop zone
   */
  const handleDocumentsAdd = React.useCallback((newDocuments: DocumentAttachment[]) => {
    onDocumentsChange([...documents, ...newDocuments]);
    debug(`Added ${newDocuments.length} documents via global drop zone`);
  }, [documents, onDocumentsChange, debug]);

  /**
   * Global file drop zone for the entire chat interface (excluding sidebar)
   */
  const { isDragOver, dropHandlers } = useGlobalFileDropZone({
    onImagesAdd: handleImagesAdd,
    onDocumentsAdd: handleDocumentsAdd,
    currentImageCount: images.length,
    currentDocumentCount: documents.length,
    maxImages: 5,
    maxDocuments: 5,
    excludeSelector: '[data-no-drop="true"]' // Sidebar will have this attribute
  });

  return (
    <div 
      className={`flex flex-col h-full transition-colors duration-200 ${
        isDragOver ? 'bg-blue-50' : 'bg-gray-50'
      }`}
      {...dropHandlers}
    >
      {/* Global drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4 text-center">
                <div className="flex items-center justify-center gap-4 text-5xl mb-4">
                  <span>📸</span>
                  <span>📄</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Drop Images & Documents Here
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Drop your files anywhere to attach them to your message
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p className="font-medium">Images:</p>
                  <p>JPG, PNG, GIF, WebP • Max 5 images • 10MB each</p>
                  <p className="font-medium mt-3">Documents:</p>
                  <p>PDF, TXT, MD, JSON, CSV, XML, HTML, JS, TS, CSS, YAML</p>
                  <p>Max 5 documents • 50MB each</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        currentTokenMetrics={currentTokenMetrics}
        isGenerating={loading}
        currentMessages={messages}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export { ChatInterface }; 