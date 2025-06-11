/**
 * App.tsx
 * 
 * Main application component - refactored for better organization
 * Now uses custom hooks for chat and model management
 * 
 * Components:
 *   App
 * 
 * Features:
 *   - Simplified layout and state management
 *   - Custom hooks for chat and model operations
 *   - Enhanced error handling with ErrorBoundary
 *   - Responsive design
 */
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { Button } from './components/ui/Button';
import { SignInForm } from './components/auth/SignInForm';
import { useChat } from './hooks/useChat';
import { useModels } from './hooks/useModels';
import { useLogger } from './hooks/useLogger';
import { useAuth } from './hooks/useAuth';

/**
 * Main application component
 * 
 * @returns React component
 */
function App() {
  // Use custom hooks for state management
  const chat = useChat();
  const models = useModels();
  const { user, loading: authLoading } = useAuth();
  const { debug } = useLogger('App');

  // Load all threads and models on app start
  useEffect(() => {
    debug('App mounted, loading threads and models...');
    chat.loadThreads();
    models.loadModels();
  }, [debug, chat.loadThreads, models.loadModels]);

  /**
   * Render server connection error UI
   */
  const renderConnectionError = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-red-800 mb-2">Server Connection Error</h2>
          <p className="text-red-700 mb-4">{chat.error}</p>
          <div className="bg-red-100 rounded-lg p-3 text-left text-sm">
            <p className="text-red-800 font-medium mb-2">Make sure the server is running:</p>
            <code className="text-xs bg-red-200 px-2 py-1 rounded block">
              npm run server:dev
            </code>
          </div>
          <Button
            onClick={chat.loadThreads}
            variant="destructive"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * Render error banner for non-critical errors
   */
  const renderErrorBanner = () => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{chat.error}</p>
          </div>
        </div>
        <button
          onClick={chat.clearError}
          className="text-red-400 hover:text-red-600"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Show connection error if threads failed to load and error suggests server issues
  if (chat.error && (chat.error.includes('server') || chat.error.includes('running'))) {
    return renderConnectionError();
  }

  // Show sign-in form if user is not authenticated
  if (!authLoading && !user) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <SignInForm />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-50">
        {/* Chat Sidebar */}
        <ChatSidebar
          threads={chat.threads}
          currentThreadId={chat.currentThread?.id || null}
          onThreadSelect={chat.handleThreadSelect}
          onNewChat={chat.handleNewChat}
          onDeleteThread={chat.handleDeleteThread}
          loading={chat.threadsLoading}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Error Banner */}
          {chat.error && !chat.error.includes('server') && !chat.error.includes('running') && (
            renderErrorBanner()
          )}

          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface
              currentThread={chat.currentThread}
              onSendMessage={chat.handleSendMessage}
              loading={chat.loading}
              availableModels={models.availableModels}
              modelsLoading={models.modelsLoading}
              images={chat.images}
              onImagesChange={chat.handleImagesChange}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
