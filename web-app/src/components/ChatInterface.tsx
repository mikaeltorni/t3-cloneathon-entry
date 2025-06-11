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
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { ModelSelector } from './ui/ModelSelector';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';
import type { ChatThread, ChatMessage, ModelConfig } from '../../../src/shared/types';

interface ChatInterfaceProps {
  currentThread: ChatThread | null;
  onSendMessage: (content: string, imageUrl?: string, modelId?: string) => Promise<void>;
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
  const [imageUrl, setImageUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash-preview-05-20');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { debug, log } = useLogger('ChatInterface');

  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Auto-resize textarea based on content
   */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

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

  /**
   * Handle form submission
   * 
   * @param e - Form event
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !imageUrl.trim()) return;

    const messageContent = message.trim();
    const imageUrlContent = imageUrl.trim();

    debug('Submitting message', { 
      hasContent: !!messageContent, 
      hasImage: !!imageUrlContent 
    });

    // Clear inputs immediately for better UX
    setMessage('');
    setImageUrl('');

    // Reset textarea height immediately
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '48px';
    }

    try {
      await onSendMessage(messageContent || 'Analyze this image', imageUrlContent || undefined, selectedModel);
      log('Message sent successfully');
    } catch (error) {
      // Error handling is done in parent component
      debug('Message sending failed', error);
    }
  }, [message, imageUrl, onSendMessage, debug, log]);

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
            {msg.imageUrl && (
              <div className="mb-3">
                <img
                  src={msg.imageUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '200px' }}
                  loading="lazy"
                />
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
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
  }, [formatTime]);

  /**
   * Render loading indicator
   */
  const renderLoadingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="order-1 max-w-[70%]">
        <div className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-2xl">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">AI is thinking...</span>
          </div>
        </div>
      </div>
      <div className="order-2 ml-3 w-8 h-8 rounded-full flex items-center justify-center text-sm">
        🤖
      </div>
    </div>
  );

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
   * Contains AI model selector, image URL input, and message textarea
   * Fixed positioning handled by container wrapper
   */
  const renderMessageInput = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Model Selector and Image URL */}
      <div className="flex space-x-3">
        <div className="flex-1">
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            models={availableModels}
            loading={modelsLoading}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (Optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>
      </div>

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
          disabled={loading || (!message.trim() && !imageUrl.trim())}
          loading={loading}
          size="lg"
          className="self-end"
        >
          Send
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Tip: Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );

  return (
    <>
      {/* Main Chat Area */}
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        {renderHeader()}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-52">
          {!currentThread ? (
            renderWelcomeMessage()
          ) : currentThread.messages.length === 0 ? (
            renderEmptyThreadMessage()
          ) : (
            <>
              {currentThread.messages.map(renderMessage)}
              {loading && renderLoadingIndicator()}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Bar */}
      <div className="fixed bottom-0 left-0 md:left-80 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
        <div className="max-w-full mx-auto">
          {renderMessageInput()}
        </div>
      </div>
    </>
  );
}; 