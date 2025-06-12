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
 *   - Global drag-and-drop zone for images (excluding sidebar)
 *   - Dynamic spacing to prevent messages from hiding behind input bar
 *   - Persistent reasoning visibility: Reasoning remains expanded after message completion
 */
import React, { useState, useCallback, useMemo } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useLogger } from '../hooks/useLogger';
import { useGlobalDropZone } from '../hooks/useGlobalDropZone';
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
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  sidebarOpen?: boolean;
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
 * @param images - Current image attachments
 * @param onImagesChange - Callback for image changes
 * @returns React component
 */
const ChatInterface: React.FC<ChatInterfaceProps> = React.memo(({
  currentThread,
  onSendMessage,
  loading,
  availableModels,
  modelsLoading,
  images,
  onImagesChange,
  sidebarOpen = false
}) => {
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Set<string>>(new Set());
  const [inputBarHeight, setInputBarHeight] = useState(200); // Default height for initial render
  const { debug } = useLogger('ChatInterface');

  /**
   * Handle input bar height changes for dynamic spacing
   */
  const handleInputBarHeightChange = useCallback((height: number) => {
    setInputBarHeight(height);
    debug('Input bar height updated:', height);
  }, [debug]);

  /**
   * Add new images from global drop zone
   */
  const handleImagesAdd = useCallback((newImages: ImageAttachment[]) => {
    onImagesChange([...images, ...newImages]);
    debug(`Added ${newImages.length} images via global drop zone`);
  }, [images, onImagesChange, debug]);

  /**
   * Global drop zone for the entire chat interface (excluding sidebar)
   */
  const { isDragOver, dropHandlers } = useGlobalDropZone({
    onImagesAdd: handleImagesAdd,
    currentImageCount: images.length,
    maxImages: 5,
    excludeSelector: '[data-no-drop="true"]' // Sidebar will have this attribute
  });

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

  /**
   * Effect to preserve reasoning visibility when message IDs change
   * (e.g., when temp messages get replaced with server messages)
   */
  React.useEffect(() => {
    if (!currentThread?.messages) return;

    // Check if we have any temp message IDs in expandedReasoningIds
    const tempIds = Array.from(expandedReasoningIds).filter(id => id.startsWith('temp-'));
    
    if (tempIds.length > 0) {
      debug('Checking for temp message ID updates...', { tempIds });
      
      // For each temp ID, try to find the corresponding server message
      const updates = new Map<string, string>();
      
      tempIds.forEach(tempId => {
        // Find the message that was recently created and has reasoning
        const latestAssistantWithReasoning = currentThread.messages
          .filter(msg => msg.role === 'assistant' && msg.reasoning && !msg.id.startsWith('temp-'))
          .slice(-1)[0]; // Get the most recent one
        
        if (latestAssistantWithReasoning) {
          updates.set(tempId, latestAssistantWithReasoning.id);
          debug(`Mapping temp ID ${tempId} to server ID ${latestAssistantWithReasoning.id}`);
        }
      });
      
      // Update expandedReasoningIds if we found any mappings
      if (updates.size > 0) {
        setExpandedReasoningIds(prev => {
          const newSet = new Set(prev);
          
          updates.forEach((newId, oldId) => {
            if (newSet.has(oldId)) {
              newSet.delete(oldId);
              newSet.add(newId);
              debug(`Updated reasoning visibility: ${oldId} -> ${newId}`);
            }
          });
          
          return newSet;
        });
      }
    }
  }, [currentThread?.messages, expandedReasoningIds, debug]);

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
            <div className="flex items-center justify-center h-full">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4 text-center">
                <div className="text-4xl mb-3">📸</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop Images Here</h3>
                <p className="text-sm text-gray-600">
                  Drop your images anywhere to attach them to your message
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPG, PNG, GIF, WebP • Max 5 images • 10MB each
                </p>
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
        modelsLoading={modelsLoading}
        images={images}
        onImagesChange={onImagesChange}
        onHeightChange={handleInputBarHeightChange}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export { ChatInterface }; 