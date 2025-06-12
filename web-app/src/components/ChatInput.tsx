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
import React, { useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { ModelSelector } from './ModelSelector';
import { ReasoningToggle } from './ui/ReasoningToggle';
import { ImageAttachments } from './ImageAttachments';
import { useLogger } from '../hooks/useLogger';
import { useMessageForm } from '../hooks/useMessageForm';
import { cn } from '../utils/cn';
import type { ModelConfig, ImageAttachment } from '../../../src/shared/types';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  loading: boolean;
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
  onHeightChange?: (height: number) => void;
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  sidebarOpen?: boolean;
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
 * @param modelsLoading - Models loading state
 * @param onHeightChange - Callback when input height changes
 * @param images - Current image attachments
 * @param onImagesChange - Callback for image changes
 * @param sidebarOpen - Whether the sidebar is open
 * @returns React component
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  availableModels,
  modelsLoading,
  onHeightChange,
  images,
  onImagesChange,
  sidebarOpen = false
}) => {
  const inputBarRef = useRef<HTMLDivElement>(null);
  const { debug } = useLogger('ChatInput');

  /**
   * Form state and handlers from useMessageForm hook
   */
  const {
    message,
    selectedModel,
    useReasoning,
    reasoningEffort,
    setSelectedModel,
    setUseReasoning,
    setReasoningEffort,
    handleSubmit,
    handleKeyPress,
    handleMessageChange,
    isReasoningModel,
    supportsEffortControl,
    isSubmitDisabled,
    textareaRef
  } = useMessageForm({
    onSendMessage,
    availableModels,
    loading,
    images
  });

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
    handleMessageChange(e);
    autoResizeTextarea();
  }, [handleMessageChange, autoResizeTextarea]);

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
        'fixed bottom-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 transition-all duration-300',
        sidebarOpen ? 'left-80' : 'left-0'
      )}
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Attachments */}
          <ImageAttachments 
            images={images}
            onImagesChange={onImagesChange}
          />

          {/* Model Selection with Beautiful Buttons */}
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            models={availableModels}
            loading={modelsLoading}
          />

          {/* Optional Reasoning Toggle for Models with Optional Reasoning */}
          {isReasoningModel() && availableModels[selectedModel]?.reasoningMode === 'optional' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <ReasoningToggle
                  enabled={useReasoning}
                  onChange={setUseReasoning}
                  reasoningMode={availableModels[selectedModel]?.reasoningMode || 'none'}
                  modelName={availableModels[selectedModel]?.name}
                />
                
                {/* Inline Effort Level Display - only show if model supports effort control */}
                {supportsEffortControl() && (
                  <div className={cn(
                    'flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition-all duration-200',
                    useReasoning 
                      ? 'opacity-100 bg-blue-50 border border-blue-200' 
                      : 'opacity-30 bg-gray-50 border border-gray-200'
                  )}>
                    <span className="text-xs font-medium text-gray-600">effort:</span>
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
                        {/* Left arrow - decrease effort */}
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
                          title="Decrease effort level"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {/* Right arrow - increase effort */}
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
                          title="Increase effort level"
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
                onKeyPress={handleKeyPress}
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
              disabled={isSubmitDisabled}
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