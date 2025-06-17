/**
 * ChatInput.tsx
 * 
 * Chat input component for message composition - refactored into smaller components
 * Now uses extracted components for better maintainability and single responsibility
 * 
 * Components:
 *   ChatInput
 * 
 * Features:
 *   - Composed of smaller, focused components
 *   - Auto-resizing textarea with keyboard shortcuts
 *   - Image and document attachments management
 *   - Model information display
 *   - Reasoning and search controls
 *   - Metrics display
 *   - Fixed positioning with proper spacing
 *   - Input remains writable during content generation
 * 
 * Usage: <ChatInput onSendMessage={send} loading={loading} availableModels={models} />
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ModelIndicator } from './input/ModelIndicator';
import { SearchControls } from './input/SearchControls';
import { ReasoningControls } from './input/ReasoningControls';
import { MetricsDisplay } from './input/MetricsDisplay';
import { MessageInput } from './input/MessageInput';
import { ImageAttachments } from './ImageAttachments';
import { DocumentAttachments } from './DocumentAttachments';
import { useLogger } from '../hooks/useLogger';
import { useMessageForm } from '../hooks/useMessageForm';
import { useMobileScrollState } from '../hooks/useMobileScrollState';
import { tokenizerService } from '../services/tokenizerService';
import { cn } from '../utils/cn';
import type { ModelConfig, ImageAttachment, DocumentAttachment, TokenMetrics, ChatMessage } from '../../../src/shared/types';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  onSendMessage: (content: string, images?: ImageAttachment[], documents?: DocumentAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  loading: boolean; // Only true when sending a message
  availableModels: Record<string, ModelConfig>;
  onHeightChange?: (height: number) => void;
  images: ImageAttachment[];
  documents: DocumentAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  onDocumentsChange: (documents: DocumentAttachment[]) => void;
  sidebarOpen?: boolean;
  modelSidebarOpen?: boolean;
  currentTokenMetrics?: TokenMetrics | null;
  isGenerating?: boolean; // True when AI is generating content
  currentMessages?: ChatMessage[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onModelSelectorClick?: () => void; // Callback to open model selector
  mobileScrollState?: ReturnType<typeof useMobileScrollState>;
}

/**
 * Chat input component - refactored with extracted components
 * 
 * Handles message composition with:
 * - Model information and controls
 * - Reasoning and search options
 * - Metrics display
 * - Message input and submission
 * - Input remains writable during content generation
 * 
 * @param props - Component props
 * @returns React component
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  availableModels,
  onHeightChange,
  images,
  documents,
  onImagesChange,
  onDocumentsChange,
  sidebarOpen = false,
  modelSidebarOpen = false,
  currentTokenMetrics = null,
  isGenerating = false,
  currentMessages = [],
  selectedModel: externalSelectedModel,
  onModelChange,
  onModelSelectorClick,
  mobileScrollState: externalMobileScrollState
}) => {
  const inputBarRef = useRef<HTMLDivElement>(null);
  const { debug } = useLogger('ChatInput');
  
  // Mobile scroll state management - always call hook but use external state if provided
  const internalMobileScrollState = useMobileScrollState();
  const mobileScrollState = externalMobileScrollState || internalMobileScrollState;
  
  // State for context window usage
  const [contextWindowUsage, setContextWindowUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  } | null>(null);

  /**
   * Form state and handlers from useMessageForm hook
   * Note: We pass loading (not isGenerating) to prevent submission during send
   */
  const {
    message,
    setMessage,
    selectedModel,
    useReasoning,
    reasoningEffort,
    useWebSearch,
    webSearchEffort,
    setUseReasoning,
    setReasoningEffort,
    setUseWebSearch,
    setWebSearchEffort,
    isReasoningModel,
    supportsEffortControl,
    supportsWebEffortControl,
    canSubmit,
    handleSubmit,
    handleKeyDown,
    textareaRef
  } = useMessageForm({
    onSendMessage,
    availableModels,
    loading, // Only disabled during actual message sending
    images,
    documents,
    selectedModel: externalSelectedModel,
    onModelChange
  });

  /**
   * Calculate context window usage based on current messages and model
   */
  const calculateContextWindow = useCallback(async () => {
    if (!selectedModel || currentMessages.length === 0) {
      setContextWindowUsage(null);
      return;
    }

    try {
      // Get model config for accurate contextLength
      const modelConfig = availableModels[selectedModel];
      if (!modelConfig) {
        debug(`Model config not found for ${selectedModel}`);
        setContextWindowUsage(null);
        return;
      }

      // Use the new method that takes ModelConfig directly for accurate context length
      const contextUsage = await tokenizerService.calculateConversationContextUsageFromModelConfig(
        currentMessages, 
        selectedModel,
        modelConfig
      );

      setContextWindowUsage(contextUsage);
      debug(`Context window calculated for ${selectedModel}: ${contextUsage.percentage.toFixed(1)}% (${contextUsage.used}/${contextUsage.total})`);
    } catch (error) {
      debug('Failed to calculate context window usage:', error);
      setContextWindowUsage(null);
    }
  }, [selectedModel, currentMessages, availableModels, debug]);

  // Calculate context window usage when model or messages change
  useEffect(() => {
    calculateContextWindow();
  }, [calculateContextWindow]);

  /**
   * Auto-resize textarea based on content
   */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      
      // Update input bar height after textarea resize
      setTimeout(() => {
        const inputBar = inputBarRef.current;
        if (inputBar) {
          const height = inputBar.offsetHeight;
          const paddingBuffer = 20; // Extra buffer for comfort
          onHeightChange?.(height + paddingBuffer);
          debug('Input bar height updated:', height + paddingBuffer);
        }
      }, 0);
    }
  }, [textareaRef, onHeightChange, debug]);

  /**
   * Measure input bar height and notify parent
   */
  const updateInputBarHeight = useCallback(() => {
    const inputBar = inputBarRef.current;
    if (inputBar) {
      const height = inputBar.offsetHeight;
      const paddingBuffer = 20; // Extra buffer for comfort
      onHeightChange?.(height + paddingBuffer);
      debug('Input bar height updated:', height + paddingBuffer);
    }
  }, [onHeightChange, debug]);

  /**
   * Enhanced message change handler with auto-resize and mobile state tracking
   */
  const handleEnhancedMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  }, [setMessage, autoResizeTextarea]);

  /**
   * Enhanced focus and blur handlers for mobile scroll state
   * Track focus on the entire container instead of individual elements
   */
  const handleContainerFocus = useCallback(() => {
    mobileScrollState.handleContainerFocus();
  }, [mobileScrollState]);

  const handleContainerBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Only blur if focus is moving outside the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      mobileScrollState.handleContainerBlur();
    }
  }, [mobileScrollState]);

  // Update input bar height when content changes
  useEffect(() => {
    updateInputBarHeight();
  }, [images.length, documents.length, message, updateInputBarHeight]);

  // Update input bar height on window resize
  useEffect(() => {
    const handleResize = () => updateInputBarHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateInputBarHeight]);

  return (
    <div 
      ref={inputBarRef}
      className={cn(
        'fixed bottom-0 bg-white border-t border-gray-200 shadow-lg z-40 transition-all duration-300',
        'p-3 sm:p-4', // Responsive padding - smaller on mobile
        sidebarOpen ? 'left-80' : 'left-0',
        modelSidebarOpen ? 'right-80' : 'right-0'
      )}
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
      tabIndex={-1} // Make container focusable for event delegation
    >
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
        {/* Image Attachments */}
        <ImageAttachments 
          images={images}
          onImagesChange={onImagesChange}
        />
        
        {/* Document Attachments */}
        <DocumentAttachments
          documents={documents}
          onDocumentsChange={onDocumentsChange}
        />

        {/* Token Metrics and Context Window Display - Conditionally shown on mobile */}
        {mobileScrollState.shouldShowControls && (
          <MetricsDisplay
            currentTokenMetrics={currentTokenMetrics}
            isGenerating={isGenerating}
            contextWindowUsage={contextWindowUsage}
          />
        )}

        {/* Current Model Indicator - Conditionally shown on mobile */}
        {selectedModel && availableModels[selectedModel] && mobileScrollState.shouldShowControls && (
          <ModelIndicator
            selectedModel={selectedModel}
            availableModels={availableModels}
            onClick={() => onModelSelectorClick?.()}
            loading={loading}
          />
        )}

        {/* Web Search Controls - Conditionally shown on mobile */}
        {availableModels[selectedModel] && mobileScrollState.shouldShowControls && (
          <SearchControls
            selectedModel={selectedModel}
            availableModels={availableModels}
            useWebSearch={useWebSearch}
            webSearchEffort={webSearchEffort}
            onUseWebSearchChange={setUseWebSearch}
            onWebSearchEffortChange={setWebSearchEffort}
            supportsWebEffortControl={supportsWebEffortControl}
          />
        )}

        {/* Reasoning Controls - Conditionally shown on mobile */}
        {mobileScrollState.shouldShowControls && (
          <ReasoningControls
            selectedModel={selectedModel}
            availableModels={availableModels}
            useReasoning={useReasoning}
            reasoningEffort={reasoningEffort}
            onUseReasoningChange={setUseReasoning}
            onReasoningEffortChange={setReasoningEffort}
            isReasoningModel={isReasoningModel}
            supportsEffortControl={supportsEffortControl}
          />
        )}

        {/* Message Input - Always visible */}
        <MessageInput
          message={message}
          onChange={handleEnhancedMessageChange}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
          textareaRef={textareaRef}
          loading={loading} // Only disabled when sending, not during generation
          isGenerating={isGenerating} // Pass generation state for visual feedback
          canSubmit={canSubmit}
          images={images}
          documents={documents}
          onImagesChange={onImagesChange}
          onDocumentsChange={onDocumentsChange}
          maxImages={5}
          maxDocuments={5}
        />
      </div>
    </div>
  );
}; 