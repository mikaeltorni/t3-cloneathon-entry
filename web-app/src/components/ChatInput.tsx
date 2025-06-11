/**
 * ChatInput.tsx
 * 
 * Chat input component for message composition
 * Extracted from ChatInterface.tsx for better organization
 * 
 * Components:
 *   ChatInput
 * 
 * Features:
 *   - Auto-resizing textarea with keyboard shortcuts
 *   - Image attachments management
 *   - Model selection with reasoning toggle
 *   - Form submission handling
 *   - Fixed positioning with proper spacing
 * 
 * Usage: <ChatInput onSendMessage={send} loading={loading} availableModels={models} />
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { ModelSelector } from './ui/ModelSelector';
import { ReasoningToggle } from './ui/ReasoningToggle';
import { ImageAttachments } from './ImageAttachments';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';
import type { ModelConfig, ImageAttachment } from '../../../src/shared/types';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean) => Promise<void>;
  loading: boolean;
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
  onHeightChange?: (height: number) => void;
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
}

/**
 * Chat input component
 * 
 * Handles message composition and form submission with:
 * - Auto-resizing textarea
 * - Image attachment management
 * - Model selection and reasoning options
 * - Keyboard shortcuts and accessibility
 * 
 * @param onSendMessage - Callback for sending messages
 * @param loading - Loading state indicator
 * @param availableModels - Available AI models
 * @param modelsLoading - Models loading state
 * @param onHeightChange - Callback when input height changes
 * @returns React component
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  loading,
  availableModels,
  modelsLoading,
  onHeightChange,
  images,
  onImagesChange
}) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash-preview-05-20');
  const [useReasoning, setUseReasoning] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  
  const { debug, log } = useLogger('ChatInput');

  /**
   * Check if a model supports reasoning based on model configuration
   */
  const isReasoningModel = useCallback((modelId?: string): boolean => {
    if (!modelId || !availableModels[modelId]) return false;
    return availableModels[modelId].hasReasoning;
  }, [availableModels]);

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

  // Auto-focus textarea after sending message
  useEffect(() => {
    if (!loading) {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height and focus
        textarea.style.height = '48px';
        setTimeout(() => {
          textarea.focus();
        }, 100);
      }
    }
  }, [loading]);

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

  // Handle reasoning state when model changes
  useEffect(() => {
    const currentModel = availableModels[selectedModel];
    if (currentModel) {
      if (currentModel.reasoningMode === 'forced') {
        // For forced reasoning models, always enable reasoning
        if (!useReasoning) {
          setUseReasoning(true);
          debug('Auto-enabled reasoning for forced reasoning model:', currentModel.name);
        }
      } else if (currentModel.reasoningMode === 'none') {
        // For models without reasoning, always disable reasoning
        if (useReasoning) {
          setUseReasoning(false);
          debug('Auto-disabled reasoning for non-reasoning model:', currentModel.name);
        }
      }
      // For optional reasoning models, keep current user preference
    }
  }, [selectedModel, availableModels, useReasoning, debug]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && images.length === 0) return;

    const messageContent = message.trim();

    debug('Submitting message', { 
      hasContent: !!messageContent, 
      imageCount: images.length,
      model: selectedModel,
      useReasoning
    });

    // Clear inputs immediately for better UX
    setMessage('');
    onImagesChange([]);

    // Reset textarea height immediately
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '48px';
    }

    try {
      await onSendMessage(
        messageContent, 
        images.length > 0 ? images : undefined, 
        selectedModel,
        useReasoning
      );
      log('Message sent successfully');
    } catch (error) {
      // Error handling is done in parent component
      debug('Message sending failed', error);
    }
  }, [message, images, onSendMessage, debug, log, selectedModel, useReasoning, onImagesChange]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  /**
   * Handle textarea input changes
   */
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  }, [autoResizeTextarea]);

  return (
    <div 
      ref={inputBarRef}
      className="fixed bottom-0 left-0 md:left-80 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50"
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Image Attachments */}
          <ImageAttachments 
            images={images}
            onImagesChange={onImagesChange}
          />

          {/* Model Selection and Options */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              models={availableModels}
              loading={modelsLoading}
            />
            
            {isReasoningModel(selectedModel) && (
              <ReasoningToggle
                enabled={useReasoning}
                onChange={setUseReasoning}
                reasoningMode={availableModels[selectedModel].reasoningMode}
                modelName={availableModels[selectedModel].name}
              />
            )}

            {/* Subtle image upload hint */}
            <div className="text-xs text-gray-400 opacity-50 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Drop images anywhere</span>
            </div>
          </div>

          {/* Message Input and Send Button */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
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
              disabled={(!message.trim() && images.length === 0) || loading}
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