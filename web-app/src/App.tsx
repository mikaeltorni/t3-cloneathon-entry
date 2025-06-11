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
import type { ChatThread, ChatMessage, ModelConfig } from '../../src/shared/types';

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
        'google/gemini-2.5-flash-preview-05-20': {
          name: 'Gemini 2.5 Flash',
          description: 'Fast and efficient multimodal model for general tasks',
          type: 'general',
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
   * Handle sending a message with streaming
   * 
   * @param content - Message content
   * @param imageUrl - Optional image URL
   * @param modelId - AI model to use
   */
  const handleSendMessage = useCallback(async (content: string, imageUrl?: string, modelId?: string) => {
    setLoading(true);
    setError(null);

    try {
      debug('Sending streaming message...', { content: content.substring(0, 50), hasImage: !!imageUrl });
      
      let tempThread = currentThread;
      let isNewThread = false;

      // Create a temporary streaming message for the AI response
      const tempAiMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        modelId
      };

      await chatApiService.sendMessageStream(
        {
          threadId: currentThread?.id,
          content,
          imageUrl,
          modelId
        },
        // onChunk callback - update the streaming message
        (chunk: string, fullContent: string) => {
          debug('Received chunk', { chunkLength: chunk.length, totalLength: fullContent.length });
          
          // Update the temporary message with the streaming content
          tempAiMessage.content = fullContent;
          
          if (tempThread) {
            // Find if temp message already exists in thread
            const existingTempIndex = tempThread.messages.findIndex(msg => msg.id === tempAiMessage.id);
            
            if (existingTempIndex >= 0) {
              // Update existing temp message
              const updatedMessages = [...tempThread.messages];
              updatedMessages[existingTempIndex] = { ...tempAiMessage };
              setCurrentThread({
                ...tempThread,
                messages: updatedMessages,
                updatedAt: new Date()
              });
            } else {
              // Add temp message for the first time
              setCurrentThread({
                ...tempThread,
                messages: [...tempThread.messages, tempAiMessage],
                updatedAt: new Date()
              });
            }
          }
        },
        // onComplete callback - finalize the response
        async (response) => {
          debug('Streaming completed', { threadId: response.threadId });
          
          // Update current thread with final messages
          if (tempThread && tempThread.id === response.threadId) {
            // Replace temp message with final assistant message
            const messagesWithoutTemp = tempThread.messages.filter(msg => msg.id !== tempAiMessage.id);
            setCurrentThread({
              ...tempThread,
              messages: [...messagesWithoutTemp, response.message, response.assistantResponse],
              updatedAt: response.assistantResponse.timestamp
            });
          } else {
            // New thread created, load it
            const newThread = await chatApiService.getChat(response.threadId);
            setCurrentThread(newThread);
            isNewThread = true;
          }

          // Reload threads to update sidebar if new thread was created
          if (isNewThread || !tempThread) {
            await loadThreads();
          }
          
          log('Streaming message completed successfully');
        },
        // onError callback - handle errors
        (error) => {
          const errorMessage = error.message || 'Failed to send message';
          setError(errorMessage);
          logError('Failed to send streaming message', error);
          
          // Remove temp message on error
          if (tempThread) {
            const messagesWithoutTemp = tempThread.messages.filter(msg => msg.id !== tempAiMessage.id);
            setCurrentThread({
              ...tempThread,
              messages: messagesWithoutTemp,
              updatedAt: new Date()
            });
          }
        }
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      logError('Failed to start streaming message', err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentThread, debug, log, logError, loadThreads]);

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

  // Footer removed since fixed input bar handles the bottom area

  // Show connection error if no threads could be loaded
  if (error && threads.length === 0) {
    return renderConnectionError();
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-100">
        {/* Fixed Sidebar */}
        <ChatSidebar
          threads={threads}
          currentThreadId={currentThread?.id || null}
          onThreadSelect={handleThreadSelect}
          onNewChat={handleNewChat}
          onDeleteThread={handleDeleteThread}
          loading={threadsLoading}
        />

        {/* Main Chat - offset by sidebar width on desktop */}
        <div className="ml-0 md:ml-80 h-full flex flex-col">
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
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
