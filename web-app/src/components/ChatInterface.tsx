import { useState, useRef, useEffect } from 'react';
import type { ChatThread, ChatMessage } from '../../../src/shared/types';

interface ChatInterfaceProps {
  currentThread: ChatThread | null;
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  loading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentThread,
  onSendMessage,
  loading
}) => {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentThread?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !imageUrl.trim()) return;

    const messageContent = message.trim();
    const imageUrlContent = imageUrl.trim();

    setMessage('');
    setImageUrl('');

    try {
      await onSendMessage(messageContent || 'Analyze this image', imageUrlContent || undefined);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';
    
    return (
      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {msg.imageUrl && (
              <div className="mb-3">
                <img
                  src={msg.imageUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(msg.timestamp)}
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isUser ? 'order-1 mr-3' : 'order-2 ml-3'}`}>
          {isUser ? '👤' : '🤖'}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentThread ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <span className="text-6xl block mb-4">💬</span>
              <h3 className="text-xl font-medium mb-2">Welcome to OpenRouter Chat</h3>
              <p className="text-gray-400">Start a new conversation or select an existing chat from the sidebar</p>
            </div>
          </div>
        ) : currentThread.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <span className="text-4xl block mb-4">🌟</span>
              <h3 className="text-lg font-medium mb-2">New Conversation</h3>
              <p className="text-gray-400">Send your first message to get started!</p>
            </div>
          </div>
        ) : (
          <>
            {currentThread.messages.map(renderMessage)}
            {loading && (
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
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Image URL Input */}
          <div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
            />
          </div>

          {/* Message Input */}
          <div className="flex space-x-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={loading || (!message.trim() && !imageUrl.trim())}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading || (!message.trim() && !imageUrl.trim())
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}; 