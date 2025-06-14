/**
 * useChatThreads.ts
 * 
 * Thread management operations hook
 * 
 * Hooks:
 *   useChatThreads
 * 
 * Features:
 *   - Thread loading with caching
 *   - Thread selection
 *   - New chat creation
 *   - Thread deletion
 *   - Pin/unpin operations
 * 
 * Usage: const threadOps = useChatThreads(chatState, chatApiService);
 */
import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLogger } from './useLogger';
import { useErrorHandler } from './useErrorHandler';
import type { UseChatStateReturn } from './useChatState';
import type { ChatThread } from '../../../src/shared/types';
import { 
  getCachedThreads, 
  setCachedThreads, 
  removeThreadFromCache,
  hasCachedThreads 
} from '../utils/sessionCache';

interface ChatApiService {
  getAllChatsEfficient: (limit: number) => Promise<{ threads: any[], hasMore: boolean }>;
  getChat: (threadId: string) => Promise<any>;
  deleteChat: (threadId: string) => Promise<void>;
  toggleThreadPin: (threadId: string, isPinned: boolean) => Promise<any>; // Returns ChatThread
}

interface UseChatThreadsReturn {
  loadThreads: (forceRefresh?: boolean) => Promise<void>;
  handleThreadSelect: (threadId: string) => Promise<void>;
  handleNewChat: () => void;
  handleDeleteThread: (threadId: string) => Promise<void>;
  handleTogglePinThread: (threadId: string, isPinned: boolean) => Promise<void>;
}

/**
 * Thread management operations hook
 * 
 * Handles all thread-related operations including loading, selection,
 * creation, deletion, and pin management with caching support.
 * 
 * @param chatState - Chat state management hook return
 * @param chatApiService - Chat API service instance
 * @returns Thread operation functions
 */
export const useChatThreads = (
  chatState: UseChatStateReturn,
  chatApiService: ChatApiService
): UseChatThreadsReturn => {
  const { user } = useAuth();
  const { log, debug, warn } = useLogger('useChatThreads');
  const { handleError } = useErrorHandler();

  const {
    threads,
    currentThread,
    setThreads,
    setCurrentThread,
    setThreadsLoading,
    setError,
    resetChatState
  } = chatState;

  // Reset all chat state when user changes (including logout)
  useEffect(() => {
    debug('User state changed, resetting thread state', { 
      userId: user?.uid || 'null',
      userEmail: user?.email || 'null'
    });
    
    resetChatState();
  }, [user?.uid, debug, resetChatState]);

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
      const result = await chatApiService.getAllChatsEfficient(100);
      
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
  }, [user, chatApiService, debug, log, warn, handleError, setThreads, setError, setThreadsLoading]);

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
  }, [chatApiService, user, debug, log, warn, handleError, setCurrentThread, setError]);

  /**
   * Handle creating a new chat
   */
  const handleNewChat = useCallback(() => {
    debug('Creating new chat');
    setCurrentThread(null);
    log('New chat created');
  }, [debug, log, setCurrentThread]);

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
  }, [threads, currentThread?.id, chatApiService, debug, log, warn, handleError, setThreads, setCurrentThread, setError]);

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
      setThreads((prevThreads: any[]) => prevThreads.map((thread: any) => 
        thread.id === threadId ? { ...thread, isPinned } : thread
      ));
      
      // Update current thread if it's the one being toggled
      if (currentThread?.id === threadId) {
        setCurrentThread((prev: any) => prev ? { ...prev, isPinned } : null);
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
      setThreads((prevThreads: any[]) => prevThreads.map((thread: any) => 
        thread.id === threadId ? { ...thread, isPinned: !isPinned } : thread
      ));
      
      // Revert current thread if it's the one being toggled
      if (currentThread?.id === threadId) {
        setCurrentThread((prev: any) => prev ? { ...prev, isPinned: !isPinned } : null);
      }
    }
  }, [threads, currentThread?.id, chatApiService, debug, log, warn, handleError, setThreads, setCurrentThread, setError]);

  return {
    loadThreads,
    handleThreadSelect,
    handleNewChat,
    handleDeleteThread,
    handleTogglePinThread
  };
}; 