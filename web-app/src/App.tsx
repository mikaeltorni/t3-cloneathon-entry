/**
 * App.tsx
 * 
 * Main application component managing chat state and routing
 * 
 * Components:
 *   App
 * 
 * Features:
 *   - Chat thread management
 *   - Real-time messaging with OpenRouter API
 *   - Error handling and loading states
 *   - Responsive design
 */
import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { Button } from './components/ui/Button';
import { chatApiService } from './services/chatApi';
import { useLogger } from './hooks/useLogger';
import { useErrorHandler } from './hooks/useErrorHandler';
import type { ChatThread, ModelConfig } from '../../src/shared/types';

/**
 * Main application component
 * 
 * @returns React component
 */
function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<Record<string, ModelConfig>>({});
  const [modelsLoading, setModelsLoading] = useState(true);

  const { log, debug, warn, error: logError } = useLogger('App');
  const { handleError } = useErrorHandler();

  // Load all threads and models on app start
  useEffect(() => {
    debug('App mounted, loading threads and models...');
    loadThreads();
    loadModels();
  }, []);

  /**
   * Load all chat threads from the server
   */
  const loadThreads = useCallback(async () => {
    try {
      setThreadsLoading(true);
      debug('Loading threads from server...');
      const allThreads = await chatApiService.getAllChats();
      setThreads(allThreads);
      setError(null);
      log(`Successfully loaded ${allThreads.length} threads`);
    } catch (err) {
      const errorMessage = 'Failed to load chat history. Make sure the server is running.';
      handleError(err as Error, 'LoadThreads');
      setError(errorMessage);
      warn(errorMessage);
    } finally {
      setThreadsLoading(false);
    }
  }, [debug, log, warn, handleError]);

  /**
   * Load available AI models from the server
   */
  const loadModels = useCallback(async () => {
    try {
      setModelsLoading(true);
      debug('Loading available models from server...');
      const response = await chatApiService.getAvailableModels();
      setAvailableModels(response.models);
      log(`Successfully loaded ${Object.keys(response.models).length} models`);
    } catch (err) {
      const errorMessage = 'Failed to load AI models.';
      handleError(err as Error, 'LoadModels');
      warn(errorMessage);
      // Set default model if loading fails
      setAvailableModels({
        'google/gemini-2.0-flash-exp:free': {
          name: 'Gemini 2.0 Flash (Experimental)',
          description: 'Latest experimental Gemini model',
          type: 'general',
          free: true
        }
      });
    } finally {
      setModelsLoading(false);
    }
  }, [debug, log, warn, handleError]);

  /**
   * Handle thread selection from sidebar
   * 
   * @param threadId - ID of the thread to select
   */
  const handleThreadSelect = useCallback(async (threadId: string) => {
    try {
      debug(`Selecting thread: ${threadId}`);
      const thread = await chatApiService.getChat(threadId);
      setCurrentThread(thread);
      setError(null);
      log(`Thread selected: ${thread.title}`);
    } catch (err) {
      const errorMessage = 'Failed to load chat thread';
      handleError(err as Error, 'ThreadSelect');
      setError(errorMessage);
      warn(errorMessage);
    }
  }, [debug, log, warn, handleError]);

  /**
   * Handle creating a new chat
   */
  const handleNewChat = useCallback(() => {
    debug('Creating new chat');
    setCurrentThread(null);
    log('New chat created');
  }, [debug, log]);

  /**
   * Handle sending a message
   * 
   * @param content - Message content
   * @param imageUrl - Optional image URL
   * @param modelId - AI model to use
   */
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string, modelId?: string) => {
    setLoading(true);
    setError(null);

    try {
      debug('Sending message...', { content: content.substring(0, 50), hasImage: !!imageUrl });
      
      const response = await chatApiService.sendMessage({
        threadId: currentThread?.id,
        content,
        imageUrl,
        modelId
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
      log('Message sent successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      handleError(err as Error, 'SendMessage');
      setError(errorMessage);
      logError('Failed to send message', err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentThread, debug, log, logError, handleError, loadThreads]);

  /**
   * Handle deleting a thread
   * 
   * @param threadId - ID of the thread to delete
   */
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      debug(`Deleting thread: ${threadId}`);
      await chatApiService.deleteChat(threadId);
      
      // Remove from local state
      setThreads(threads.filter(t => t.id !== threadId));
      
      // Clear current thread if it was deleted
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
      }
      
      setError(null);
      log('Thread deleted successfully');
    } catch (err) {
      const errorMessage = 'Failed to delete chat thread';
      handleError(err as Error, 'DeleteThread');
      setError(errorMessage);
      warn(errorMessage);
    }
  }, [threads, currentThread?.id, debug, log, warn, handleError]);

  /**
   * Render server connection error UI
   */
  const renderConnectionError = () => (
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
          <Button
            onClick={loadThreads}
            variant="destructive"
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * Render error banner
   */
  const renderErrorBanner = () => (
    <div className="bg-red-50 border-b border-red-200 p-3">
      <div className="flex items-center justify-between">
        <p className="text-red-800 text-sm">
          <span className="font-medium">Error:</span> {error}
        </p>
        <button
          onClick={() => setError(null)}
          className="text-red-600 hover:text-red-800 text-sm transition-colors"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    </div>
  );

  /**
   * Render footer status indicators
   */
  const renderFooter = () => (
    <div className="bg-white border-t border-gray-200 p-3 text-center text-xs text-gray-500">
      <span className="flex items-center justify-center space-x-4">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2" aria-hidden="true"></span>
          Google Gemini 2.5 Flash
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2" aria-hidden="true"></span>
          OpenRouter API
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-purple-400 rounded-full mr-2" aria-hidden="true"></span>
          Persistent Chat Storage
        </span>
      </span>
    </div>
  );

  // Show connection error if no threads could be loaded
  if (error && threads.length === 0) {
    return renderConnectionError();
  }

  return (
    <ErrorBoundary>
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
          {error && renderErrorBanner()}

          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface
              currentThread={currentThread}
              onSendMessage={handleSendMessage}
              loading={loading}
              availableModels={availableModels}
              modelsLoading={modelsLoading}
            />
          </div>

          {/* Footer */}
          {renderFooter()}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
