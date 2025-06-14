/**
 * App.tsx
 * 
 * Main application component - refactored with extracted components
 * Now uses extracted error components for better organization
 * 
 * Components:
 *   App
 * 
 * Features:
 *   - Simplified layout and state management using custom hooks
 *   - Custom hooks for chat and model management
 *   - Enhanced error handling with extracted error components
 *   - Responsive design
 *   - Mobile sidebar toggle functionality
 *   - Cache security: Clears session cache on both login and logout
 */
import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { ModelSidebar } from './components/ModelSidebar';
import { SidebarToggle } from './components/ui/SidebarToggle';
import { SignInForm } from './components/auth/SignInForm';
import { ConnectionError } from './components/error/ConnectionError';
import { ErrorBanner } from './components/error/ErrorBanner';
import { cn } from './utils/cn';
import { useChat } from './hooks/useChat';
import { ModelsProvider, useModels } from './contexts/ModelsContext';
import { useLogger } from './hooks/useLogger';
import { useAuth } from './hooks/useAuth';
import { useSidebarToggle } from './hooks/useSidebarToggle';
import { clearAllCaches } from './utils/sessionCache';

/**
 * Main application component
 * 
 * @returns React component
 */
function AppContent() {
  // Use custom hooks for state management
  const chat = useChat();
  const models = useModels();
  const { user, loading: authLoading } = useAuth();
  const sidebar = useSidebarToggle();
  const { debug } = useLogger('App');

  // Track current model selection (for sidebar display)
  const [currentModel, setCurrentModel] = useState<string>('google/gemini-2.5-flash-preview');

  // Sync currentModel when thread changes - but ONLY when switching threads, not during message generation
  useEffect(() => {
    if (chat.currentThread) {
      // Use the thread's current model, or last used model, or fall back to default
      const threadModel = chat.currentThread.currentModel || 
                          chat.currentThread.lastUsedModel || 
                          'google/gemini-2.5-flash-preview';
      
      // CRITICAL: Only sync model when thread ID actually changes (switching threads)
      // Do NOT sync during message generation (when only messages change)
      const isThreadSwitch = chat.currentThread.id !== chat.currentThread?.id;
      
      // Only update if this is a genuine thread switch AND the model is different
      if (threadModel !== currentModel) {
        debug(`🔄 Thread model sync: changing from ${currentModel} to ${threadModel} for thread ${chat.currentThread.id} (thread switch: ${isThreadSwitch})`);
        console.log(`🚨 [DEBUG] Thread sync would change model from ${currentModel} to ${threadModel} - SUPPRESSED during message generation`);
        
        // For now, let's disable this automatic sync to prevent overriding user selections
        // setCurrentModel(threadModel);
        debug(`⚠️ Thread model sync DISABLED to preserve user model selection`);
      } else {
        debug(`✅ Thread model sync: keeping current model ${currentModel} for thread ${chat.currentThread.id}`);
      }
    }
  }, [chat.currentThread?.id, debug]); // Removed other dependencies to only sync on thread ID change

  // Models are now auto-loaded by useModels hook - no manual call needed!

  // Load threads only after user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      debug('User authenticated, clearing any existing cache and loading fresh data...');
      
      // Clear any existing cache to ensure clean state for this user session
      clearAllCaches();
      debug('🗑️ All cache layers cleared for security');
      
      // Add a small delay to ensure Firebase token is ready
      const loadWithDelay = async () => {
        try {
          // Wait for token to be available
          await user.getIdToken();
          chat.loadThreads();
        } catch (error) {
          console.error('Failed to get auth token, retrying in 1 second...', error);
          // Retry after a short delay if token isn't ready
          setTimeout(() => {
            chat.loadThreads();
          }, 1000);
        }
      };
      
      loadWithDelay();
    }
  }, [user, authLoading, debug, chat.loadThreads]);

  /**
   * Handle manual refresh of threads from server
   */
  const handleRefreshThreads = async () => {
    await chat.loadThreads(true);
  };

  /**
   * Handle model change for a specific thread
   */
  const handleModelChange = async (threadId: string, modelId: string) => {
    debug(`Model changed for thread ${threadId}: ${modelId}`);
    // Update current model if it's for the active thread
    if (threadId === chat.currentThread?.id) {
      setCurrentModel(modelId);
    }
    // TODO: Implement thread-specific model persistence
    // This would update the thread's currentModel field in the backend
  };

  /**
   * Handle model change from ChatInterface (current conversation)
   */
  const handleCurrentModelChange = (modelId: string) => {
    console.log(`🚨 [DEBUG] ModelSidebar onChange called with: ${modelId}`);
    debug(`🔄 Model change requested: ${modelId} (previous: ${currentModel})`);
    setCurrentModel(modelId);
    debug(`✅ Current model changed to: ${modelId}`);
    console.log(`🚨 [DEBUG] App currentModel state updated to: ${modelId}`);
    // If there's an active thread, update its model preference
    if (chat.currentThread?.id) {
      handleModelChange(chat.currentThread.id, modelId);
    }
  };

  /**
   * Check if error is a server connection error
   */
  const isConnectionError = (error: string): boolean => {
    return error.includes('server') || error.includes('running');
  };

  // Show connection error if threads failed to load and error suggests server issues
  if (chat.error && isConnectionError(chat.error)) {
    return (
      <ConnectionError 
        error={chat.error} 
        onRetry={() => chat.loadThreads()} 
      />
    );
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
      <div className="h-screen bg-gray-50">
        {/* Floating Toggle Button - Only visible when sidebar is closed */}
        {!sidebar.isOpen && (
          <SidebarToggle 
            isOpen={sidebar.isOpen}
            onToggle={sidebar.toggle}
          />
        )}

        {/* Enhanced Fixed Chat Sidebar with Model Information */}
        <ChatSidebar
          threads={chat.threads}
          currentThreadId={chat.currentThread?.id || null}
          onThreadSelect={chat.handleThreadSelect}
          onNewChat={chat.handleNewChat}
          onDeleteThread={chat.handleDeleteThread}
          onTogglePinThread={chat.handleTogglePinThread}
          onRefreshThreads={handleRefreshThreads}
          loading={chat.threadsLoading}
          isOpen={sidebar.isOpen}
          onClose={sidebar.close}
          onToggle={sidebar.toggle}
          availableModels={models.availableModels}
          onModelChange={handleModelChange}
          currentModel={currentModel}
        />

        {/* Main Chat Area - Offset by sidebar width when open, with right margin for ModelSidebar */}
        <div 
          className={cn(
            'h-full flex flex-col transition-all duration-300',
            {
              'ml-80': sidebar.isOpen,
              'ml-0': !sidebar.isOpen
            },
            // Always leave space for ModelSidebar tab on the right
            'mr-16'
          )}
        >
          {/* Error Banner */}
          {chat.error && !isConnectionError(chat.error) && (
            <ErrorBanner 
              error={chat.error} 
              onDismiss={chat.clearError} 
            />
          )}

          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface
              currentThread={chat.currentThread}
              onSendMessage={chat.handleSendMessage}
              loading={chat.loading}
              availableModels={models.availableModels}
              images={chat.images}
              onImagesChange={chat.handleImagesChange}
              sidebarOpen={sidebar.isOpen}
              currentTokenMetrics={chat.currentTokenMetrics}
              selectedModel={currentModel}
              onModelChange={handleCurrentModelChange}
            />
          </div>
        </div>

        {/* Model Selection Sidebar - Right Side */}
        <ModelSidebar
          value={currentModel}
          onChange={handleCurrentModelChange}
          models={models.availableModels}
          loading={models.modelsLoading}
        />
      </div>
    </ErrorBoundary>
  );
}

/**
 * Main App component with provider
 */
function App() {
  return (
    <ModelsProvider>
      <AppContent />
    </ModelsProvider>
  );
}

export default App;
