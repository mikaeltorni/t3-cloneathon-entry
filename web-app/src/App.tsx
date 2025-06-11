import { useState, useEffect } from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { chatApiService } from './services/chatApi';
import type { ChatThread } from '../../src/shared/types';

function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all threads on app start
  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setThreadsLoading(true);
      const allThreads = await chatApiService.getAllChats();
      setThreads(allThreads);
      setError(null);
    } catch (err) {
      console.error('Failed to load threads:', err);
      setError('Failed to load chat history. Make sure the server is running.');
    } finally {
      setThreadsLoading(false);
    }
  };

  const handleThreadSelect = async (threadId: string) => {
    try {
      const thread = await chatApiService.getChat(threadId);
      setCurrentThread(thread);
      setError(null);
    } catch (err) {
      console.error('Failed to load thread:', err);
      setError('Failed to load chat thread');
    }
  };

  const handleNewChat = () => {
    setCurrentThread(null);
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await chatApiService.sendMessage({
        threadId: currentThread?.id,
        content,
        imageUrl
      });

      // Update current thread with new messages
      if (currentThread && currentThread.id === response.threadId) {
        setCurrentThread({
          ...currentThread,
          messages: [...currentThread.messages, response.message, response.assistantResponse],
          updatedAt: response.assistantResponse.timestamp
        });
      } else {
        // New thread created, load it
        const newThread = await chatApiService.getChat(response.threadId);
        setCurrentThread(newThread);
      }

      // Reload threads to update sidebar
      await loadThreads();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await chatApiService.deleteChat(threadId);
      
      // Remove from local state
      setThreads(threads.filter(t => t.id !== threadId));
      
      // Clear current thread if it was deleted
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to delete thread:', err);
      setError('Failed to delete chat thread');
    }
  };

  if (error && threads.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-bold text-red-800 mb-2">Server Connection Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="bg-red-100 rounded-lg p-3 text-left text-sm">
              <p className="text-red-800 font-medium mb-2">Make sure the server is running:</p>
              <code className="text-xs bg-red-200 px-2 py-1 rounded block">
                npm run server:dev
              </code>
            </div>
            <button
              onClick={loadThreads}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <ChatSidebar
        threads={threads}
        currentThreadId={currentThread?.id || null}
        onThreadSelect={handleThreadSelect}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        loading={threadsLoading}
      />

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm">
                <span className="font-medium">Error:</span> {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            currentThread={currentThread}
            onSendMessage={handleSendMessage}
            loading={loading}
          />
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-3 text-center text-xs text-gray-500">
          <span className="flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Google Gemini 2.5 Flash
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              OpenRouter API
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Persistent Chat Storage
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
