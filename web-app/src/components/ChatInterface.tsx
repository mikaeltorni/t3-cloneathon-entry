/**
 * ChatInterface.tsx
 * 
 * Main chat interface component for message display and input
 * 
 * Components:
 *   ChatInterface
 * 
 * Features:
 *   - Message display with image support
 *   - Message input with image URL support
 *   - AI model selection with real-time switching
 *   - Auto-scrolling to latest messages
 *   - Auto-focus input field for seamless typing experience
 *   - Loading states and error handling
 *   - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 *   - Automatic textarea height adjustment
 *   - Support for reasoning models (Gemini Pro, DeepSeek R1)
 *   - Fixed input bar that stays anchored to bottom of viewport
 *   - Responsive design that adapts to sidebar presence
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { ModelSelector } from './ui/ModelSelector';
import { ReasoningDisplay } from './ReasoningDisplay';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';
import type { ChatThread, ChatMessage, ModelConfig, ImageAttachment } from '../../../src/shared/types';
import { ImageAttachments } from './ImageAttachments';

/**
 * Props for the ChatInterface component
 * 
 * @interface ChatInterfaceProps
 * @property currentThread - Currently active chat thread
 * @property onSendMessage - Callback for sending messages with multiple images
 * @property loading - Loading state indicator
 * @property availableModels - Available AI models
 * @property modelsLoading - Models loading state
 */
interface ChatInterfaceProps {
  currentThread: ChatThread | null;
  onSendMessage: (content: string, images?: ImageAttachment[], modelId?: string) => Promise<void>;
  loading: boolean;
  availableModels: Record<string, ModelConfig>;
  modelsLoading: boolean;
}

/**
 * Main chat interface component
 * 
 * @param currentThread - Current active chat thread
 * @param onSendMessage - Callback for sending messages
 * @param loading - Loading state for message sending
 * @returns React component
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentThread,
  onSendMessage,
  loading,
  availableModels,
  modelsLoading
}) => {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash-preview-05-20');
  const [inputBarHeight, setInputBarHeight] = useState(320); // Default height
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);

  const { debug, log } = useLogger('ChatInterface');

  /**
   * Check if a model is a reasoning model
   * 
   * @param modelId - Model identifier
   * @returns True if the model has reasoning capabilities
   */
  const isReasoningModel = useCallback((modelId?: string): boolean => {
    if (!modelId || !availableModels[modelId]) return false;
    return availableModels[modelId].type === 'reasoning';
  }, [availableModels]);

  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Measure input bar height and update messages padding
   */
  const updateInputBarHeight = useCallback(() => {
    const inputBar = inputBarRef.current;
    if (inputBar) {
      const height = inputBar.offsetHeight;
      const paddingBuffer = 20; // Extra buffer for comfort
      setInputBarHeight(height + paddingBuffer);
      debug('Input bar height updated:', height + paddingBuffer);
    }
  }, [debug]);

  /**
   * Auto-resize textarea based on content
   */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      // Update input bar height after textarea resize
      setTimeout(updateInputBarHeight, 0);
    }
  }, [updateInputBarHeight]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentThread?.messages, scrollToBottom]);

  // Auto-focus textarea when component mounts or thread changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !loading) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        textarea.focus();
      }, 100);
    }
  }, [currentThread?.id, loading]);

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

  /**
   * Handle form submission
   * 
   * @param e - Form event
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && images.length === 0) return;

    const messageContent = message.trim();

    debug('Submitting message', { 
      hasContent: !!messageContent, 
      imageCount: images.length 
    });

    // Clear inputs immediately for better UX
    setMessage('');
    setImages([]);

    // Reset textarea height immediately
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '48px';
    }

    try {
      await onSendMessage(
        messageContent, 
        images.length > 0 ? images : undefined, 
        selectedModel
      );
      log('Message sent successfully');
    } catch (error) {
      // Error handling is done in parent component
      debug('Message sending failed', error);
    }
  }, [message, images, onSendMessage, debug, log, selectedModel]);

  /**
   * Handle keyboard shortcuts
   * 
   * @param e - Keyboard event
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  /**
   * Handle textarea input changes
   * 
   * @param e - Input event
   */
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autoResizeTextarea();
  }, [autoResizeTextarea]);

  /**
   * Format timestamp for display
   * 
   * @param date - Date to format
   * @returns Formatted time string
   */
  const formatTime = useCallback((date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  /**
   * Render individual message component
   * 
   * @param msg - Message to render
   * @returns React element
   */
  const renderMessage = useCallback((msg: ChatMessage) => {
    const isUser = msg.role === 'user';
    const showReasoning = !isUser && isReasoningModel(msg.modelId) && msg.reasoning;
    
    return (
      <div key={msg.id} className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
        <div className={cn('max-w-[70%]', isUser ? 'order-2' : 'order-1')}>
          <div
            className={cn(
              'px-4 py-3 rounded-2xl',
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            )}
          >
            {/* Display multiple images if available, otherwise single image */}
            {msg.images && msg.images.length > 0 ? (
              /* Multiple images (new feature) */
              <div className="mb-3">
                <div className={cn(
                  'grid gap-2',
                  msg.images.length === 1 ? 'grid-cols-1' : 
                  msg.images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2 sm:grid-cols-3'
                )}>
                  {msg.images.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-auto rounded-lg shadow-sm"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : msg.imageUrl ? (
              /* Single image (backward compatibility) */
              <div className="mb-3">
                <img
                  src={msg.imageUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '200px' }}
                  loading="lazy"
                />
              </div>
            ) : null}
            
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            
            {/* Reasoning Display for reasoning models */}
            {showReasoning && (
              <ReasoningDisplay reasoning={msg.reasoning} />
            )}
          </div>
          <div className={cn(
            'text-xs text-gray-500 mt-1',
            isUser ? 'text-right' : 'text-left'
          )}>
            {formatTime(msg.timestamp)}
          </div>
        </div>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm',
          isUser ? 'order-1 mr-3' : 'order-2 ml-3'
        )}>
          {isUser ? '👤' : '🤖'}
        </div>
      </div>
    );
  }, [formatTime, isReasoningModel]);

  /**
   * Render welcome message for new chat
   */
  const renderWelcomeMessage = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <span className="text-6xl block mb-4">💬</span>
        <h3 className="text-xl font-medium mb-2">Welcome to OpenRouter Chat</h3>
        <p className="text-gray-400">Start a new conversation or select an existing chat from the sidebar</p>
      </div>
    </div>
  );

  /**
   * Render empty thread message
   */
  const renderEmptyThreadMessage = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <span className="text-4xl block mb-4">🌟</span>
        <h3 className="text-lg font-medium mb-2">New Conversation</h3>
        <p className="text-gray-400">Send your first message to get started!</p>
      </div>
    </div>
  );

  /**
   * Render header with thread information
   */
  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {currentThread ? currentThread.title : 'Select a chat or start a new one'}
      </h2>
      {currentThread && (
        <p className="text-sm text-gray-500 mt-1">
          {currentThread.messages.length} messages • Updated {new Date(currentThread.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );

  /**
   * Render message input form elements
   * Contains AI model selector, drag & drop images, and message textarea
   * Fixed positioning handled by container wrapper
   */
  const renderMessageInput = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Model Selector */}
      <div>
        <ModelSelector
          value={selectedModel}
          onChange={setSelectedModel}
          models={availableModels}
          loading={modelsLoading}
          disabled={loading}
        />
      </div>

      {/* Image Attachments */}
      <ImageAttachments
        images={images}
        onImagesChange={setImages}
        disabled={loading}
      />

      {/* Message Input */}
      <div className="flex space-x-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          rows={1}
          style={{ minHeight: '48px', maxHeight: '120px' }}
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || (!message.trim() && images.length === 0)}
          loading={loading}
          size="lg"
          className="self-end"
        >
          Send
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Tip: Press Enter to send, Shift+Enter for new line • Drag & drop images to attach
      </p>
    </form>
  );

  return (
    <>
      {/* Main Chat Area */}
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        {renderHeader()}

        {/* Messages with dynamic spacing based on actual input bar height */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4" 
          style={{ paddingBottom: `${inputBarHeight}px` }}
        >
          {!currentThread ? (
            renderWelcomeMessage()
          ) : currentThread.messages.length === 0 ? (
            renderEmptyThreadMessage()
          ) : (
            <>
              {currentThread.messages.map(renderMessage)}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Bar with dynamic height measurement */}
      <div 
        ref={inputBarRef}
        className="fixed bottom-0 left-0 md:left-80 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg"
      >
        <div className="max-w-full mx-auto">
          {renderMessageInput()}
        </div>
      </div>
    </>
  );
}; 