/**
 * ChatInput.tsx
 * 
 * Chat input component for message composition - refactored with extracted hooks
 * Now uses useMessageForm hook for cleaner state management and form handling
 * 
 * Components:
 *   ChatInput
 * 
 * Features:
 *   - Auto-resizing textarea with keyboard shortcuts
 *   - Image attachments management
 *   - Beautiful horizontal model selection with brain icons
 *   - Reasoning toggle for optional models
 *   - Form submission handling using extracted useMessageForm hook
 *   - Fixed positioning with proper spacing
 * 
 * Usage: <ChatInput onSendMessage={send} loading={loading} availableModels={models} />
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from './ui/Button';
// ModelSelector removed - now using ModelSidebar
import { ReasoningToggle } from './ui/ReasoningToggle';
import { SearchToggle } from './ui/SearchToggle';
import { ImageAttachments } from './ImageAttachments';
import { TokenMetricsDisplay } from './TokenMetricsDisplay';
import { ContextWindowDisplay } from './ContextWindowDisplay';
import { useLogger } from '../hooks/useLogger';
import { useMessageForm } from '../hooks/useMessageForm';
import { tokenizerService } from '../services/tokenizerService';
import { cn } from '../utils/cn';
import type { ModelConfig, ImageAttachment, TokenMetrics, ChatMessage } from '../../../src/shared/types';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  loading: boolean;
  availableModels: Record<string, ModelConfig>;
  onHeightChange?: (height: number) => void;
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  sidebarOpen?: boolean;
  currentTokenMetrics?: TokenMetrics | null;
  isGenerating?: boolean;
  currentMessages?: ChatMessage[];
  selectedModel?: string; // External model selection from ModelSidebar
  onModelChange?: (modelId: string) => void; // Model change handler
}

/**
 * Chat input component
 * 
 * Handles message composition and form submission with:
 * - Auto-resizing textarea
 * - Image attachment management
 * - Model selection and reasoning options
 * - Keyboard shortcuts and accessibility
 * - Form state management via useMessageForm hook
 * 
 * @param onSendMessage - Callback for sending messages
 * @param loading - Loading state indicator
 * @param availableModels - Available AI models
 * @param onHeightChange - Callback when input height changes
 * @param images - Current image attachments
 * @param onImagesChange - Callback for image changes
 * @param sidebarOpen - Whether the sidebar is open
 * @param currentTokenMetrics - Current token usage metrics
 * @param isGenerating - Whether a message is currently being generated
 * @param currentMessages - Current conversation messages
 * @param selectedModel - Currently selected AI model (from ModelSidebar)
 * @param onModelChange - Callback when model is changed (via ModelSidebar)
 * @returns React component
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  availableModels,
  onHeightChange,
  images,
  onImagesChange,
  sidebarOpen = false,
  currentTokenMetrics = null,
  isGenerating = false,
  currentMessages = [],
  selectedModel: externalSelectedModel,
  onModelChange
}) => {
  const inputBarRef = useRef<HTMLDivElement>(null);
  const { debug } = useLogger('ChatInput');
  
  // State for context window usage
  const [contextWindowUsage, setContextWindowUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  } | null>(null);

  /**
   * Form state and handlers from useMessageForm hook
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
    loading,
    images,
    selectedModel: externalSelectedModel,
    onModelChange
  });

  // Model change now handled by ModelSidebar - no longer needed inline

  /**
   * Calculate context window usage based on current messages and model
   */
  const calculateContextWindow = useCallback(async () => {
    if (!selectedModel || currentMessages.length === 0) {
      setContextWindowUsage(null);
      return;
    }

    try {
      // Convert messages to format expected by tokenizer
      const messagesForTokenizer = currentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const contextUsage = await tokenizerService.calculateConversationContextUsage(
        messagesForTokenizer, 
        selectedModel
      );

      setContextWindowUsage(contextUsage);
      debug(`Context window calculated for ${selectedModel}: ${contextUsage.percentage.toFixed(1)}%`);
    } catch (error) {
      debug('Failed to calculate context window usage:', error);
      setContextWindowUsage(null);
    }
  }, [selectedModel, currentMessages, debug]);

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
  }, [onHeightChange, debug]);

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
   * Enhanced message change handler with auto-resize
   */
  const handleEnhancedMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  }, [setMessage, autoResizeTextarea]);

  // Update input bar height when content changes
  useEffect(() => {
    updateInputBarHeight();
  }, [images.length, message, updateInputBarHeight]);

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
        'fixed bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40 transition-all duration-300',
        sidebarOpen ? 'left-80' : 'left-0',
        // Leave space for ModelSidebar on the right
        'right-16'
      )}
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Attachments */}
          <ImageAttachments 
            images={images}
            onImagesChange={onImagesChange}
          />

          {/* Token Metrics and Context Window Display */}
          {(currentTokenMetrics || isGenerating || contextWindowUsage) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {isGenerating && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full animate-pulse">Generating...</span>
                  )}
                  {currentTokenMetrics && (
                    <TokenMetricsDisplay 
                      metrics={currentTokenMetrics} 
                      variant="compact"
                      className="justify-start"
                    />
                  )}
                </div>
                
                {/* Context Window Display on the right */}
                {contextWindowUsage && (
                  <ContextWindowDisplay 
                    contextWindow={contextWindowUsage}
                    variant="compact"
                    className="flex-shrink-0"
                  />
                )}
              </div>
            </div>
          )}

          {/* Current Model Indicator - Shows selected model from ModelSidebar */}
          {selectedModel && availableModels[selectedModel] && (
            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: availableModels[selectedModel].color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  Current Model: {availableModels[selectedModel].name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">
                  (Use sidebar on the right to change model)
                </div>

              </div>
            </div>
          )}

          {/* Web Search Toggle - Available for ALL Models */}
          {availableModels[selectedModel] && (
            <div className="flex items-center flex-wrap gap-3 mb-3">
              <SearchToggle
                enabled={useWebSearch}
                onChange={setUseWebSearch}
                webSearchMode={
                  availableModels[selectedModel].webSearchMode === 'none' 
                    ? 'optional' 
                    : availableModels[selectedModel].webSearchMode as 'forced' | 'optional'
                }
                webSearchPricing={availableModels[selectedModel]?.webSearchPricing}
                modelName={availableModels[selectedModel]?.name}
              />
            </div>
          )}

          {/* Feature Toggles for Reasoning */}
          {(isReasoningModel()) && (
            <div className="space-y-3">
              <div className="flex items-center flex-wrap gap-3">
                {/* Reasoning Toggle for Models with Optional Reasoning */}
                {isReasoningModel() && availableModels[selectedModel]?.reasoningMode === 'optional' && (
                  <ReasoningToggle
                    enabled={useReasoning}
                    onChange={setUseReasoning}
                    reasoningMode={availableModels[selectedModel]?.reasoningMode || 'none'}
                    modelName={availableModels[selectedModel]?.name}
                  />
                )}
                
                {/* Inline Reasoning Effort Level Display */}
                {isReasoningModel() && supportsEffortControl() && (
                  <div className={cn(
                    'flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition-all duration-200',
                    useReasoning 
                      ? 'opacity-100 bg-blue-50 border border-blue-200' 
                      : 'opacity-30 bg-gray-50 border border-gray-200'
                  )}>
                    <span className="text-xs font-medium text-gray-600">reasoning:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-base">
                        {reasoningEffort === 'low' ? '⚡' : reasoningEffort === 'medium' ? '⚖️' : '🧠'}
                      </span>
                      <span className={cn(
                        'text-xs font-medium',
                        reasoningEffort === 'low' && 'text-green-600',
                        reasoningEffort === 'medium' && 'text-yellow-600',
                        reasoningEffort === 'high' && 'text-blue-600'
                      )}>
                        {reasoningEffort}
                      </span>
                    </div>
                    
                    {/* Left/Right arrows to adjust effort level */}
                    {useReasoning && (
                      <div className="flex items-center space-x-0.5 ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
                            const currentIndex = levels.indexOf(reasoningEffort);
                            const prevIndex = currentIndex === 0 ? levels.length - 1 : currentIndex - 1;
                            setReasoningEffort(levels[prevIndex]);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5"
                          title="Decrease reasoning effort"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
                            const currentIndex = levels.indexOf(reasoningEffort);
                            const nextIndex = (currentIndex + 1) % levels.length;
                            setReasoningEffort(levels[nextIndex]);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5"
                          title="Increase reasoning effort"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Web Search Effort Level Display */}
                {supportsWebEffortControl() && (
                  <div className={cn(
                    'flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition-all duration-200',
                    useWebSearch 
                      ? 'opacity-100 bg-green-50 border border-green-200' 
                      : 'opacity-30 bg-gray-50 border border-gray-200'
                  )}>
                    <span className="text-xs font-medium text-gray-600">search:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-base">
                        {webSearchEffort === 'low' ? '⚡' : webSearchEffort === 'medium' ? '⚖️' : '🔍'}
                      </span>
                      <span className={cn(
                        'text-xs font-medium',
                        webSearchEffort === 'low' && 'text-green-600',
                        webSearchEffort === 'medium' && 'text-yellow-600',
                        webSearchEffort === 'high' && 'text-blue-600'
                      )}>
                        {webSearchEffort}
                      </span>
                    </div>
                    
                    {/* Left/Right arrows to adjust effort level */}
                    {useWebSearch && (
                      <div className="flex items-center space-x-0.5 ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
                            const currentIndex = levels.indexOf(webSearchEffort);
                            const prevIndex = currentIndex === 0 ? levels.length - 1 : currentIndex - 1;
                            setWebSearchEffort(levels[prevIndex]);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5"
                          title="Decrease search context size"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
                            const currentIndex = levels.indexOf(webSearchEffort);
                            const nextIndex = (currentIndex + 1) % levels.length;
                            setWebSearchEffort(levels[nextIndex]);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5"
                          title="Increase search context size"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleEnhancedMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                disabled={loading}
                className={cn(
                  'w-full px-4 py-3 border border-gray-300 rounded-xl resize-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'min-h-[48px] max-h-[120px] overflow-y-auto',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
                style={{ height: '48px' }}
              />
            </div>
            
            <Button
              type="submit"
              disabled={!canSubmit}
              loading={loading}
              className="px-6 py-3 h-12"
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 