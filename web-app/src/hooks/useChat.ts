/**
 * useChat.ts
 * 
 * Custom hook for managing chat state and operations
 * Extracted from App.tsx to improve code organization and reusability
 * 
 * Hook:
 *   useChat
 * 
 * Features:
 *   - Thread management (load, select, create, delete)
 *   - Message sending with streaming support
 *   - Loading states and error handling
 *   - Automatic thread reloading
 * 
 * Usage: const chat = useChat();
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { createChatApiService } from '../services/chatApi';
import { useAuth } from './useAuth';
import { useLogger } from './useLogger';
import { useErrorHandler } from './useErrorHandler';
import type { ChatThread, ChatMessage, ImageAttachment, TokenMetrics } from '../../../src/shared/types';
import { 
  getCachedThreads, 
  setCachedThreads, 
  addThreadToCache, 
  removeThreadFromCache,
  hasCachedThreads 
} from '../utils/sessionCache';

/**
 * Chat hook return interface
 */
interface UseChatReturn {
  // State
  threads: ChatThread[];
  currentThread: ChatThread | null;
  loading: boolean;
  threadsLoading: boolean;
  error: string | null;
  images: ImageAttachment[];
  currentTokenMetrics: TokenMetrics | null;
  
  // Actions
  loadThreads: (forceRefresh?: boolean) => Promise<void>;
  handleThreadSelect: (threadId: string) => Promise<void>;
  handleNewChat: () => void;
  handleSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  handleDeleteThread: (threadId: string) => Promise<void>;
  handleTogglePinThread: (threadId: string, isPinned: boolean) => Promise<void>;
  clearError: () => void;
  handleImagesChange: (images: ImageAttachment[]) => void;
}

/**
 * Custom hook for chat management
 * 
 * Provides comprehensive chat functionality including:
 * - Thread loading and management
 * - Message sending with real-time streaming
 * - Error handling and loading states
 * 
 * @returns Chat state and operations
 */
export const useChat = (): UseChatReturn => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [currentTokenMetrics, setCurrentTokenMetrics] = useState<TokenMetrics | null>(null);

  const { user } = useAuth();
  const { log, debug, warn, error: logError } = useLogger('useChat');
  const { handleError } = useErrorHandler();

  // Reset all chat state when user changes (including logout)
  useEffect(() => {
    debug('User state changed, resetting chat state', { 
      userId: user?.uid || 'null',
      userEmail: user?.email || 'null'
    });
    
    // Clear all local state
    setThreads([]);
    setCurrentThread(null);
    setLoading(false);
    setError(null);
    setImages([]);
    
    // Reset loading state appropriately
    setThreadsLoading(!!user); // Only set loading if user exists
  }, [user?.uid, debug]); // Use user.uid to detect actual user changes

  // Create authenticated API service
  const chatApiService = useMemo(() => {
    const getAuthToken = async () => {
      if (user) {
        try {
          // Get fresh ID token from Firebase with force refresh periodically
          debug('Getting auth token for API request...', { 
            userId: user.uid, 
            userEmail: user.email 
          });
          
          // Check if user is still valid before trying to get token
          if (!user.uid) {
            debug('User object exists but has no UID');
            return null;
          }
          
          const token = await user.getIdToken(false); // Don't force refresh every time
          debug(`Auth token obtained: ${token ? 'Yes' : 'No'}`);
          
          // Validate token is not empty
          if (!token || token.trim().length === 0) {
            debug('Token is empty, trying force refresh...');
            const freshToken = await user.getIdToken(true);
            debug(`Fresh auth token obtained: ${freshToken ? 'Yes' : 'No'}`);
            return freshToken;
          }
          
          return token;
        } catch (error) {
          debug('Failed to get auth token, trying force refresh...', error);
          // If normal token fails, try force refresh
          try {
            const freshToken = await user.getIdToken(true);
            debug(`Fresh auth token obtained: ${freshToken ? 'Yes' : 'No'}`);
            return freshToken;
          } catch (refreshError) {
            debug('Failed to get fresh auth token', refreshError);
            return null;
          }
        }
      }
      debug('No user available for auth token');
      return null;
    };

    debug('Creating new ChatApiService', { hasUser: !!user });
    return createChatApiService(getAuthToken);
  }, [user, debug]);

  /**
   * Load all chat threads (with caching)
   * 
   * @param forceRefresh - Force reload from server, ignoring cache
   */
  const loadThreads = useCallback(async (forceRefresh: boolean = false) => {
    // Ensure user is available before loading threads
    if (!user) {
      debug('Cannot load threads: no user authenticated');
      setThreadsLoading(false);
      return;
    }

    try {
      setThreadsLoading(true);
      
      // Try to load from cache first if not forcing refresh
      if (!forceRefresh && hasCachedThreads()) {
        const cachedThreads = getCachedThreads();
        if (cachedThreads) {
          debug(`Loading ${cachedThreads.length} threads from cache`);
          setThreads(cachedThreads);
          setError(null);
          log(`Successfully loaded ${cachedThreads.length} threads from cache`);
          setThreadsLoading(false);
          return;
        }
      }
      
      // Load from server if no cache or forced refresh
      debug('Loading threads from server...', { 
        userId: user.uid, 
        forceRefresh,
        hasCache: hasCachedThreads() 
      });
      
      // Use efficient method with reasonable pagination
      const result = await chatApiService.getAllChatsEfficient(100); // Load up to 100 threads efficiently
      
      // Update cache with fresh data
      setCachedThreads(result.threads);
      
      setThreads(result.threads);
      setError(null);
      log(`Successfully loaded ${result.threads.length} threads from server efficiently (hasMore: ${result.hasMore})`);
    } catch (err) {
      const errorMessage = 'Failed to load chat history. Make sure the server is running.';
      handleError(err as Error, 'LoadThreads');
      setError(errorMessage);
      warn(errorMessage);
      
      // If server fails, try to fallback to cache
      if (!forceRefresh && hasCachedThreads()) {
        const cachedThreads = getCachedThreads();
        if (cachedThreads) {
          debug(`Falling back to ${cachedThreads.length} cached threads due to server error`);
          setThreads(cachedThreads);
          warn('Using cached chat history due to server error');
        }
      }
    } finally {
      setThreadsLoading(false);
    }
  }, [user, chatApiService, debug, log, warn, handleError]);

  /**
   * Handle thread selection from sidebar
   * 
   * @param threadId - ID of the thread to select
   */
  const handleThreadSelect = useCallback(async (threadId: string) => {
    try {
      debug(`Selecting thread: ${threadId}`, { 
        hasUser: !!user, 
        userId: user?.uid,
        userEmail: user?.email 
      });
      
      // Check if user is still authenticated
      if (!user) {
        throw new Error('User not authenticated. Please sign in again.');
      }
      
      const thread = await chatApiService.getChat(threadId);
      setCurrentThread(thread);
      setError(null);
      log(`Thread selected: ${thread.title}`);
    } catch (err) {
      const errorMessage = err instanceof Error && err.message.includes('not authenticated') 
        ? 'Please sign in again to access your chat history'
        : 'Failed to load chat thread. Please try again.';
      
      handleError(err as Error, 'ThreadSelect');
      setError(errorMessage);
      warn(errorMessage);
    }
  }, [chatApiService, user, debug, log, warn, handleError]);

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
   * @param images - Optional image attachments
   * @param modelId - AI model to use
   * @param useReasoning - Whether to enable reasoning for the request
   * @param reasoningEffort - Reasoning effort level
   * @param useWebSearch - Whether to enable web search for the request
   * @param webSearchEffort - Web search effort level
   */
  const handleSendMessage = useCallback(async (
    content: string, 
    images?: ImageAttachment[], 
    modelId?: string, 
    useReasoning?: boolean, 
    reasoningEffort?: 'low' | 'medium' | 'high', 
    useWebSearch?: boolean, 
    webSearchEffort?: 'low' | 'medium' | 'high'
  ) => {
    setLoading(true);
    setError(null);
    setCurrentTokenMetrics(null); // Clear previous metrics

    try {
      // Check server connectivity first
      // const isHealthy = await chatApiService.checkHealth();
      // if (!isHealthy) {
      //   setError('Server is not running. Start it with: npm run dev');
      //   return;
      // }

      let tempThread = currentThread;
      let isNewThread = false;

      // Create user message immediately for instant feedback
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
        images: images,
        imageUrl: images && images.length === 1 ? images[0].url : undefined // For backward compatibility
      };

      // If no current thread, create a temporary one
      if (!currentThread) {
        tempThread = {
          id: `temp-${Date.now()}`,
          title: content.length > 50 ? content.substring(0, 50) + '...' : content,
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCurrentThread(tempThread);
        isNewThread = true;
      } else {
        // Add user message to existing thread immediately
        tempThread = {
          ...currentThread,
          messages: [...currentThread.messages, userMessage],
          updatedAt: new Date()
        };
        setCurrentThread(tempThread);
        isNewThread = true;
      }

      // Create a temporary streaming message for the AI response
      const tempAiMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        modelId,
        reasoning: '' // Initialize reasoning for reasoning models
      };

      // Clear images immediately after creating user message to prevent duplication
      setImages([]);

      await chatApiService.sendMessageStream(
        {
          threadId: currentThread?.id, // Use original thread ID for server
          content,
          imageUrl: images && images.length > 1 ? undefined : images?.[0]?.url, // Only for single image
          images: images,
          modelId,
          useReasoning,
          reasoningEffort,
          useWebSearch,
          webSearchEffort
        },
        // onChunk callback - update the streaming message content
        (chunk: string, fullContent: string) => {
          debug('📝 Received content chunk', { chunkLength: chunk.length, totalLength: fullContent.length, wasReasoning: tempAiMessage.metadata?.isReasoning });
          
          // IMPORTANT: If we're receiving content chunks, reasoning has definitely ended
          if (tempAiMessage.metadata?.isReasoning === true) {
            debug('🔄 Reasoning ended (content streaming started)');
            
            tempAiMessage.metadata = {
              ...tempAiMessage.metadata,
              isReasoning: false
            };
          }
          
          // Update the temporary message with the streaming content
          tempAiMessage.content = fullContent;
          
          if (tempThread) {
            // Find if temp message already exists in thread
            const existingTempIndex = tempThread.messages.findIndex(msg => msg.id === tempAiMessage.id);
            
            if (existingTempIndex >= 0) {
              // Update existing temp message (this will include the updated metadata)
              const updatedMessages = [...tempThread.messages];
              updatedMessages[existingTempIndex] = { ...tempAiMessage };
              const updatedThread = {
                ...tempThread,
                messages: updatedMessages,
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
              tempThread = updatedThread;
            } else {
              // Add temp message for the first time
              const updatedThread = {
                ...tempThread,
                messages: [...tempThread.messages, tempAiMessage],
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
              tempThread = updatedThread;
            }
          }
        },
        // onComplete callback - finalize the response
        async (response: any) => {
          debug('Streaming completed', { threadId: response.threadId });
          
          // Final cleanup of reasoning state if not already done
          if (tempAiMessage.metadata?.isReasoning === true) {
            debug('Final reasoning cleanup');
            
            tempAiMessage.metadata = { 
              ...tempAiMessage.metadata, 
              isReasoning: false
            };
          }
          
          // Get the final thread from server to ensure consistency
          const finalThread = await chatApiService.getChat(response.threadId);
          
          // Transfer metadata from temp message to final message
          if (tempAiMessage.metadata && finalThread.messages.length > 0) {
            const lastMessage = finalThread.messages[finalThread.messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.id === tempAiMessage.id) {
              lastMessage.metadata = tempAiMessage.metadata;
            }
          }
          
          setCurrentThread(finalThread);

          // Always update cache and move thread to top of list (most recent activity)
          addThreadToCache(finalThread);
          
          // Update local threads list - always move updated thread to top
          setThreads(prevThreads => {
            const filteredThreads = prevThreads.filter(t => t.id !== finalThread.id);
            return [finalThread, ...filteredThreads];
          });
          
          debug(`Moved thread to top of list: ${finalThread.title} (${isNewThread ? 'new' : 'existing'} thread)`)

          // Clear images after successful message send
          setImages([]);
          
          log('Streaming message completed successfully');
        },
        // onError callback - handle errors and clean up
        (error: Error) => {
          const errorMessage = error.message || 'Failed to send message';
          setError(errorMessage);
          logError('Failed to send streaming message', error);
          
          // Always remove temp AI message on error to prevent empty messages
          if (tempThread) {
            const messagesWithoutTempAi = tempThread.messages.filter(msg => msg.id !== tempAiMessage.id);
            setCurrentThread({
              ...tempThread,
              messages: messagesWithoutTempAi,
              updatedAt: tempThread.updatedAt
            });
          }
          
          // Also show a user-friendly error message
          if (error.message.includes('Failed to fetch') || error.message.includes('TypeError')) {
            setError('Cannot connect to server. Make sure the server is running with: npm run dev');
          }
        },
        // onReasoningChunk callback - update the reasoning in real-time
        (reasoningChunk: string, fullReasoning: string) => {
          debug('🧠 Received reasoning chunk', { chunkLength: reasoningChunk.length, totalLength: fullReasoning.length });
          
          // Update the temporary message with the streaming reasoning
          tempAiMessage.reasoning = fullReasoning;
          
          // Mark that this message is currently reasoning
          tempAiMessage.metadata = {
            ...tempAiMessage.metadata,
            isReasoning: true
          };
          
          if (tempThread) {
            // Find if temp message already exists in thread
            const existingTempIndex = tempThread.messages.findIndex(msg => msg.id === tempAiMessage.id);
            
            if (existingTempIndex >= 0) {
              // Update existing temp message
              const updatedMessages = [...tempThread.messages];
              updatedMessages[existingTempIndex] = { ...tempAiMessage };
              const updatedThread = {
                ...tempThread,
                messages: updatedMessages,
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
              tempThread = updatedThread;
            } else {
              // Add temp message for the first time (this shouldn't happen for reasoning)
              const updatedThread = {
                ...tempThread,
                messages: [...tempThread.messages, tempAiMessage],
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
              tempThread = updatedThread;
            }
          }
        },
        // onTokenMetrics callback - update real-time token metrics
        (metrics: Partial<TokenMetrics>) => {
          debug('📊 Received token metrics', { 
            tokensPerSecond: metrics.tokensPerSecond?.toFixed(2),
            totalTokens: metrics.totalTokens,
            outputTokens: metrics.outputTokens,
            cost: metrics.estimatedCost?.total?.toFixed(6)
          });
          
          // Update current token metrics for global display
          const currentMetrics: TokenMetrics = {
            inputTokens: metrics.inputTokens || 0,
            outputTokens: metrics.outputTokens || 0,
            totalTokens: metrics.totalTokens || 0,
            tokensPerSecond: metrics.tokensPerSecond || 0,
            startTime: metrics.startTime || Date.now(),
            endTime: metrics.endTime,
            duration: metrics.duration,
            estimatedCost: metrics.estimatedCost
          };
          
          setCurrentTokenMetrics(currentMetrics);
          
          // Update the temporary message with the latest token metrics
          tempAiMessage.tokenMetrics = currentMetrics;
          
          if (tempThread) {
            // Find if temp message already exists in thread
            const existingTempIndex = tempThread.messages.findIndex(msg => msg.id === tempAiMessage.id);
            
            if (existingTempIndex >= 0) {
              // Update existing temp message with token metrics
              const updatedMessages = [...tempThread.messages];
              updatedMessages[existingTempIndex] = { ...tempAiMessage };
              const updatedThread = {
                ...tempThread,
                messages: updatedMessages,
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
              tempThread = updatedThread;
            }
          }
        },
        // onAnnotationsChunk callback - handle real-time web search annotations
        (annotations: any[]) => {
          debug('🔍 Received annotations chunk', { annotationsCount: annotations.length });
          
          // Update the temporary message with the streaming annotations
          tempAiMessage.annotations = annotations;
          
          if (tempThread) {
            // Find if temp message already exists in thread
            const existingTempIndex = tempThread.messages.findIndex(msg => msg.id === tempAiMessage.id);
            
            if (existingTempIndex >= 0) {
              // Update existing temp message with annotations
              const updatedMessages = [...tempThread.messages];
              updatedMessages[existingTempIndex] = { ...tempAiMessage };
              const updatedThread = {
                ...tempThread,
                messages: updatedMessages,
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
              tempThread = updatedThread;
            }
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
  }, [currentThread, chatApiService, debug, log, logError, loadThreads]);

  /**
   * Handle deleting a thread
   * 
   * @param threadId - ID of the thread to delete
   */
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      debug(`Deleting thread: ${threadId}`);
      await chatApiService.deleteChat(threadId);
      
      // Remove from local state and cache
      const updatedThreads = threads.filter(t => t.id !== threadId);
      setThreads(updatedThreads);
      
      // Update cache
      removeThreadFromCache(threadId);
      
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
  }, [threads, currentThread?.id, chatApiService, debug, log, warn, handleError]);

  /**
   * Handle toggling thread pin status
   * 
   * @param threadId - ID of the thread to pin/unpin
   * @param isPinned - New pin status for the thread
   */
  const handleTogglePinThread = useCallback(async (threadId: string, isPinned: boolean) => {
    try {
      debug(`${isPinned ? 'Pinning' : 'Unpinning'} thread: ${threadId}`);
      
      // Update local state immediately for responsive UI
      setThreads(prevThreads => prevThreads.map(thread => 
        thread.id === threadId ? { ...thread, isPinned } : thread
      ));
      
      // Update current thread if it's the one being toggled
      if (currentThread?.id === threadId) {
        setCurrentThread(prev => prev ? { ...prev, isPinned } : null);
      }
      
      // Send to server
      await chatApiService.toggleThreadPin(threadId, isPinned);
      
      // Update cache with the new pin status
      const updatedThreads = threads.map(thread => 
        thread.id === threadId ? { ...thread, isPinned } : thread
      );
      setCachedThreads(updatedThreads);
      
      setError(null);
      log(`Thread ${isPinned ? 'pinned' : 'unpinned'} successfully`);
    } catch (err) {
      const errorMessage = `Failed to ${isPinned ? 'pin' : 'unpin'} thread`;
      handleError(err as Error, 'TogglePinThread');
      setError(errorMessage);
      warn(errorMessage);
      
      // Revert local state on error
      setThreads(prevThreads => prevThreads.map(thread => 
        thread.id === threadId ? { ...thread, isPinned: !isPinned } : thread
      ));
      
      // Revert current thread if it's the one being toggled
      if (currentThread?.id === threadId) {
        setCurrentThread(prev => prev ? { ...prev, isPinned: !isPinned } : null);
      }
    }
  }, [threads, currentThread?.id, chatApiService, debug, log, warn, handleError]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle images change
   * 
   * @param images - New images
   */
  const handleImagesChange = useCallback((images: ImageAttachment[]) => {
    setImages(images);
  }, []);

  return {
    // State
    threads,
    currentThread,
    loading,
    threadsLoading,
    error,
    images,
    currentTokenMetrics,
    
    // Actions
    loadThreads,
    handleThreadSelect,
    handleNewChat,
    handleSendMessage,
    handleDeleteThread,
    handleTogglePinThread,
    clearError,
    handleImagesChange
  };
};