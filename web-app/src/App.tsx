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
 *   - Integrated Trello-style tagging system
 */
import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { ModelSidebar } from './components/ModelSidebar';
import { ModelSidebarToggle } from './components/ui/ModelSidebarToggle';
import { TagSystem, useTagSystemContext } from './components/TagSystem';
import { SidebarToggle } from './components/ui/SidebarToggle';
import { SignInForm } from './components/auth/SignInForm';
import { ConnectionError } from './components/error/ConnectionError';
import { ErrorBanner } from './components/error/ErrorBanner';
import { cn } from './utils/cn';
import { useChat } from './hooks/useChat';
import { ModelsProvider } from './contexts/ModelsContext';
import { useModels } from './hooks/useModels';
import { useLogger } from './hooks/useLogger';
import { useAuth } from './hooks/useAuth';
import { useSidebarToggle } from './hooks/useSidebarToggle';
import { clearAllCaches } from './utils/sessionCache';
import { isMobileScreen } from './utils/deviceUtils';
import type { ChatThread } from '../../src/shared/types';

/**
 * Inner app content that has access to TagSystem context
 */
function AppInner({ chat }: { chat: ReturnType<typeof useChat> }) {
  // Use custom hooks for state management
  const models = useModels();
  const sidebar = useSidebarToggle();
  const { debug } = useLogger('App');
  
  // Model sidebar state
  const [isModelSidebarOpen, setIsModelSidebarOpen] = useState(false);

  // Get tagging context
  const { filteredThreads, handleContextMenu, getThreadTags } = useTagSystemContext();

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
      
      // Only update if this is a genuine thread switch AND the model is different
      if (threadModel !== currentModel) {
        debug(`🔄 Thread model sync: would change from ${currentModel} to ${threadModel} for thread ${chat.currentThread.id}`);
        
        // Disabled automatic sync to preserve user model selection during message generation
        // setCurrentModel(threadModel);
        debug(`⚠️ Thread model sync DISABLED to preserve user model selection`);
      } else {
        debug(`✅ Thread model sync: keeping current model ${currentModel} for thread ${chat.currentThread.id}`);
      }
    }
  }, [chat.currentThread?.id, chat.currentThread, currentModel, debug]); // Include all dependencies

  /**
   * Handle manual refresh of threads from server
   */
  const handleRefreshThreads = async () => {
    await chat.loadThreads(true);
  };

  /**
   * Enhanced new chat handler with mobile auto-close
   */
  const handleNewChat = () => {
    // Call the original new chat function
    chat.handleNewChat();
    
    // Auto-close sidebar on mobile for better UX
    if (isMobileScreen() && sidebar.isOpen) {
      sidebar.close();
      debug('🔥 Auto-closed sidebar on mobile after new chat creation');
    }
  };

  /**
   * Enhanced sidebar toggle with mutual exclusivity
   */
  const handleChatSidebarToggle = () => {
    // If model sidebar is open, close it first
    if (isModelSidebarOpen) {
      setIsModelSidebarOpen(false);
      debug('🔄 Auto-closed model sidebar to open chat sidebar');
    }
    sidebar.toggle();
  };

  /**
   * Enhanced model sidebar toggle with mutual exclusivity
   */
  const handleModelSidebarToggle = () => {
    // If chat sidebar is open, close it first
    if (sidebar.isOpen) {
      sidebar.close();
      debug('🔄 Auto-closed chat sidebar to open model sidebar');
    }
    setIsModelSidebarOpen(!isModelSidebarOpen);
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
    debug(`🔄 Model change requested: ${modelId} (previous: ${currentModel})`);
    setCurrentModel(modelId);
    debug(`✅ Current model changed to: ${modelId}`);
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

  return (
    <div className="h-screen bg-gray-50">
      {/* Floating Toggle Button - Only visible when sidebar is closed */}
      {!sidebar.isOpen && (
        <SidebarToggle 
          isOpen={sidebar.isOpen}
          onToggle={handleChatSidebarToggle}
        />
      )}

      {/* Enhanced Fixed Chat Sidebar with Model Information and Tag Support */}
      <ChatSidebar
        threads={filteredThreads}
        currentThreadId={chat.currentThread?.id || null}
        onThreadSelect={chat.handleThreadSelect}
        onNewChat={handleNewChat}
        onDeleteThread={chat.handleDeleteThread}
        onTogglePinThread={chat.handleTogglePinThread}
        onRefreshThreads={handleRefreshThreads}
        loading={chat.threadsLoading}
        isOpen={sidebar.isOpen}
        onClose={sidebar.close}
        onToggle={handleChatSidebarToggle}
        availableModels={models.availableModels}
        onModelChange={handleModelChange}
        currentModel={currentModel}
        onThreadRightClick={handleContextMenu}
        getThreadTags={getThreadTags}
      />

      {/* Model Sidebar Toggle Button - Top Right */}
      <ModelSidebarToggle
        isOpen={isModelSidebarOpen}
        onToggle={handleModelSidebarToggle}
        currentModel={currentModel}
        models={models.availableModels}
        loading={models.modelsLoading}
      />

      {/* Model Selection Sidebar - Right Side */}
      <ModelSidebar
        isOpen={isModelSidebarOpen}
        onClose={() => setIsModelSidebarOpen(false)}
        value={currentModel}
        onChange={handleCurrentModelChange}
        models={models.availableModels}
        loading={models.modelsLoading}
      />

      {/* Main Chat Area - Offset by sidebar widths when open */}
      <div 
        className={cn(
          'h-full flex flex-col transition-all duration-300',
          {
            'ml-80': sidebar.isOpen,
            'ml-0': !sidebar.isOpen
          },
          {
            'mr-80': isModelSidebarOpen,
            'mr-0': !isModelSidebarOpen
          }
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
            documents={chat.documents}
            onImagesChange={chat.handleImagesChange}
            onDocumentsChange={chat.handleDocumentsChange}
            sidebarOpen={sidebar.isOpen}
            modelSidebarOpen={isModelSidebarOpen}
            currentTokenMetrics={chat.currentTokenMetrics}
            selectedModel={currentModel}
            onModelChange={handleCurrentModelChange}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Main application component
 * 
 * @returns React component
 */
function AppContent() {
  // Use custom hooks for state management
  const chat = useChat();
  const { user, loading: authLoading } = useAuth();
  const { debug } = useLogger('AppContent');

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
  }, [user, authLoading, debug]); // Removed chat and chat.loadThreads from dependencies

  /**
   * Handle thread updates (including tag assignments)
   */
  const handleThreadUpdate = async (threadId: string, updates: Partial<ChatThread>) => {
    await chat.handleThreadUpdate(threadId, updates);
  };

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
      <TagSystem
        threads={chat.threads}
        onThreadUpdate={handleThreadUpdate}
      >
        <AppInner chat={chat} />
      </TagSystem>
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
