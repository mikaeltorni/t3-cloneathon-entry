/**
 * App.tsx
 * 
 * Main application component with authentication, chat interface, and model selection
 * 
 * Features:
 *   - Authentication flow with Firebase Auth
 *   - Chat interface with sidebar navigation
 *   - Model selection sidebar
 *   - Thread management and filtering
 *   - Error handling and loading states
 *   - Mobile-responsive design
 *   - Tag system integration
 * 
 * Usage: Default export as main app component
 */
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { ModelSidebar } from './components/ModelSidebar';

import { TagSystem } from './components/TagSystem';
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
import { DEFAULT_MODEL } from '../../src/shared/modelConfig';
import { useTagSystemContext } from './components/TagSystem';
import { useUserPreferences } from './hooks/useUserPreferences';

/**
 * Inner app content that has access to TagSystem context
 */
function AppInner({ chat }: { chat: ReturnType<typeof useChat> }) {
  // Use custom hooks for state management
  const models = useModels();
  const sidebar = useSidebarToggle();
  const userPreferences = useUserPreferences();
  const { debug } = useLogger('App');
  
  // Model sidebar state
  const [isModelSidebarOpen, setIsModelSidebarOpen] = useState(false);

  // Get tagging context
  const { filteredThreads, getThreadTags } = useTagSystemContext();

  // Track current model selection (for sidebar display)
  // Use user's last selected model as the default instead of DEFAULT_MODEL
  const [currentModel, setCurrentModel] = useState<string>(
    userPreferences.lastSelectedModel || DEFAULT_MODEL
  );

  // State to prevent race conditions during manual model changes
  const [isManualModelChange, setIsManualModelChange] = useState(false);

  // Update currentModel when user preferences load/change
  useEffect(() => {
    if (userPreferences.lastSelectedModel && !chat.currentThread) {
      // Only update when no thread is selected (new chat scenario)
      debug(`🔄 Using user's last selected model for new chat: ${userPreferences.lastSelectedModel}`);
      setCurrentModel(userPreferences.lastSelectedModel);
    }
  }, [userPreferences.lastSelectedModel, chat.currentThread, debug]);

  // Sync currentModel when thread changes - but ONLY when switching threads, not during message generation
  useEffect(() => {
    // CRITICAL: Don't override manual model changes
    if (isManualModelChange) {
      debug(`⏸️ Skipping automatic model sync - manual change in progress`);
      return;
    }
    
    if (chat.currentThread) {
      // Use the thread's current model, or last used model, or fall back to user's preferred model
      const threadModel = chat.currentThread.currentModel || 
                          chat.currentThread.lastUsedModel || 
                          userPreferences.lastSelectedModel ||
                          DEFAULT_MODEL;
      
      // CRITICAL: Only sync model when thread ID actually changes (switching threads)
      // Do NOT sync during message generation (when only messages change)
      
      // Only update if this is a genuine thread switch AND the model is different
      if (threadModel !== currentModel) {
        debug(`🔄 Thread model sync: changing from ${currentModel} to ${threadModel} for thread ${chat.currentThread.id}`);
        setCurrentModel(threadModel);
        debug(`✅ Thread model synced to: ${threadModel}`);
      } else {
        debug(`✅ Thread model sync: keeping current model ${currentModel} for thread ${chat.currentThread.id}`);
      }
    } else {
      // No thread selected (new chat scenario) - use user's last selected model
      const preferredModel = userPreferences.lastSelectedModel || DEFAULT_MODEL;
      if (preferredModel !== currentModel) {
        debug(`🔄 No thread selected, using user's preferred model: ${preferredModel}`);
        setCurrentModel(preferredModel);
      }
    }
  }, [chat.currentThread?.id, userPreferences.lastSelectedModel, currentModel, debug, isManualModelChange]);

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
   * Enhanced sidebar toggle with mutual exclusivity on mobile only
   */
  const handleChatSidebarToggle = () => {
    // Only enforce mutual exclusivity on mobile where dark overlay appears
    if (isMobileScreen() && isModelSidebarOpen) {
      setIsModelSidebarOpen(false);
      debug('🔄 Auto-closed model sidebar to open chat sidebar (mobile overlay mode)');
    }
    sidebar.toggle();
  };

  /**
   * Enhanced model sidebar toggle with mutual exclusivity on mobile only
   */
  const handleModelSidebarToggle = () => {
    // Only enforce mutual exclusivity on mobile where dark overlay appears
    if (isMobileScreen() && sidebar.isOpen) {
      sidebar.close();
      debug('🔄 Auto-closed chat sidebar to open model sidebar (mobile overlay mode)');
    }
    setIsModelSidebarOpen(!isModelSidebarOpen);
  };

  /**
   * Handle model change for a specific thread with Firebase persistence
   */
  const handleModelChange = async (threadId: string, modelId: string) => {
    debug(`Model changed for thread ${threadId}: ${modelId}`);
    
    try {
      // Update current model if it's for the active thread
      if (threadId === chat.currentThread?.id) {
        setCurrentModel(modelId);
        
        // Also update user's last selected model preference (for new chats)
        userPreferences.updateLastSelectedModel(modelId).catch(error => {
          debug(`⚠️ Failed to update user's last selected model: ${error.message}`);
        });
      }
      
      // Update the thread's current model in Firebase
      await chat.handleThreadUpdate(threadId, { currentModel: modelId });
      debug(`✅ Successfully updated thread model in Firebase: ${threadId} -> ${modelId}`);
    } catch (error) {
      debug(`❌ Failed to update thread model in Firebase: ${error}`);
      // Revert the local change if Firebase update failed
      if (threadId === chat.currentThread?.id) {
        const fallbackModel = chat.currentThread?.currentModel || 
                             chat.currentThread?.lastUsedModel || 
                             userPreferences.lastSelectedModel ||
                             DEFAULT_MODEL;
        setCurrentModel(fallbackModel);
      }
    }
  };

  /**
   * Handle model change from ChatInterface (current conversation)
   */
  const handleCurrentModelChange = (modelId: string) => {
    // Set flag to prevent race conditions
    setIsManualModelChange(true);
    
    debug(`🔄 Model change requested: ${modelId} (previous: ${currentModel})`);
    setCurrentModel(modelId);
    debug(`✅ Current model changed to: ${modelId}`);
    
    // Update user's last selected model preference (for new chats)
    userPreferences.updateLastSelectedModel(modelId).catch(error => {
      debug(`⚠️ Failed to update user's last selected model: ${error.message}`);
    });
    
    // If there's an active thread, update its model preference
    if (chat.currentThread?.id) {
      handleModelChange(chat.currentThread.id, modelId).finally(() => {
        // Clear the flag after the Firebase update completes
        setTimeout(() => {
          setIsManualModelChange(false);
          debug(`🔓 Manual model change completed, re-enabling automatic sync`);
        }, 500); // Small delay to ensure all state updates have completed
      });
    } else {
      // Clear the flag immediately if no thread update needed
      setTimeout(() => {
        setIsManualModelChange(false);
        debug(`🔓 Manual model change completed (no thread), re-enabling automatic sync`);
      }, 100);
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
        
        getThreadTags={getThreadTags}
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
            onModelSelectorClick={handleModelSidebarToggle}
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