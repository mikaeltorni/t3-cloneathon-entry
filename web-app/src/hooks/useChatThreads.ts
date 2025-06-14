/**
 * useChatThreads.ts
 * 
 * Thread management hook extracted from useChat
 * 
 * Hook:
 *   useChatThreads
 * 
 * Features:
 *   - Thread loading with caching
 *   - Thread selection and management
 *   - New chat creation
 *   - Thread deletion
 *   - Pin/unpin operations
 * 
 * Usage: const threadOps = useChatThreads(chatState, apiService);
 */
import { useCallback } from 'react';
import { logger } from '../utils/logger';
import { useErrorHandler } from './useErrorHandler';
import type { ChatThread } from '../../../src/shared/types';
import type { PaginatedResponse } from '../services/types/apiTypes';

// Interface for the API service
interface ChatApiService {
  getAllChatsEfficient: (limit: number) => Promise<PaginatedResponse<ChatThread>>;
  getChat: (threadId: string) => Promise<ChatThread>;
  deleteChat: (threadId: string) => Promise<void>;
  toggleThreadPin: (threadId: string, isPinned: boolean) => Promise<ChatThread>;
}

// Interface for chat state
interface ChatState {
  threads: ChatThread[];
  setThreads: (threads: ChatThread[] | ((prevThreads: ChatThread[]) => ChatThread[])) => void;
  currentThread: ChatThread | null;
  setCurrentThread: (thread: ChatThread | null | ((prev: ChatThread | null) => ChatThread | null)) => void;
  isLoadingThreads: boolean;
  setIsLoadingThreads: (loading: boolean) => void;
  threadsError: string | null;
  setThreadsError: (error: string | null) => void;
}

/**
 * Thread management operations hook
 * 
 * @param chatState - Chat state management
 * @param apiService - Chat API service
 * @returns Thread operation functions
 */
export function useChatThreads(chatState: ChatState, apiService: ChatApiService) {
  const { handleError } = useErrorHandler();

  const {
    threads,
    setThreads,
    currentThread,
    setCurrentThread,
    isLoadingThreads,
    setIsLoadingThreads,
    threadsError,
    setThreadsError
  } = chatState;

  /**
   * Load threads from API
   */
  const loadThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      setThreadsError(null);
      
      logger.info('Loading chat threads');
      
      const response = await apiService.getAllChatsEfficient(50);
      const threads = response.data; // Updated to use 'data' property
      
      setThreads(threads);
      logger.info(`Loaded ${threads.length} threads`);
      
      return threads;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load threads';
      logger.error('Failed to load threads:', error as Error);
      setThreadsError(errorMessage);
      handleError(error as Error, 'Thread Loading');
      return [];
    } finally {
      setIsLoadingThreads(false);
    }
  }, [apiService, setIsLoadingThreads, setThreadsError, setThreads, handleError]);

  /**
   * Select a thread and load its full data
   */
  const selectThread = useCallback(async (threadId: string | null) => {
    if (!threadId) {
      setCurrentThread(null);
      return;
    }

    try {
      logger.info(`Selecting thread: ${threadId}`);
      
      // Try to find thread in current threads first
      const existingThread = threads.find(t => t.id === threadId);
      if (existingThread) {
        setCurrentThread(existingThread);
      }
      
      // Load full thread data
      const fullThread = await apiService.getChat(threadId);
      setCurrentThread(fullThread);
      
      logger.info(`Selected thread: ${fullThread.title}`);
    } catch (error) {
      logger.error(`Failed to select thread ${threadId}:`, error as Error);
      handleError(error as Error, 'Thread Selection');
      setCurrentThread(null);
    }
  }, [threads, apiService, setCurrentThread, handleError]);

  /**
   * Create a new chat thread
   */
  const createNewChat = useCallback(() => {
    logger.info('Creating new chat');
    setCurrentThread(null);
  }, [setCurrentThread]);

  /**
   * Delete a thread
   */
  const deleteThread = useCallback(async (threadId: string) => {
    try {
      logger.info(`Deleting thread: ${threadId}`);
      
      await apiService.deleteChat(threadId);
      
      // Remove from threads list
      setThreads((prevThreads: ChatThread[]) => prevThreads.filter(t => t.id !== threadId));
      
      // Clear current thread if it was deleted
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
      }
      
      logger.info(`Deleted thread: ${threadId}`);
    } catch (error) {
      logger.error(`Failed to delete thread ${threadId}:`, error as Error);
      handleError(error as Error, 'Thread Deletion');
      throw error;
    }
  }, [apiService, setThreads, currentThread, setCurrentThread, handleError]);

  /**
   * Update thread in threads list
   */
  const updateThreadInList = useCallback((updatedThread: ChatThread) => {
    setThreads((prevThreads: ChatThread[]) => 
      prevThreads.map(thread => 
        thread.id === updatedThread.id ? updatedThread : thread
      )
    );
    
    // Update current thread if it matches
    if (currentThread?.id === updatedThread.id) {
      setCurrentThread(updatedThread);
    }
  }, [setThreads, currentThread, setCurrentThread]);

  /**
   * Add new thread to the list
   */
  const addThreadToList = useCallback((newThread: ChatThread) => {
    setThreads((prevThreads: ChatThread[]) => [newThread, ...prevThreads]);
  }, [setThreads]);

  /**
   * Pin/unpin a thread
   */
  const togglePin = useCallback(async (threadId: string) => {
    try {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      const isPinned = !thread.isPinned;
      logger.info(`${isPinned ? 'Pinning' : 'Unpinning'} thread: ${threadId}`);

      // Optimistic update
      setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
        t.id === threadId ? { ...t, isPinned } : t
      ));

      if (currentThread?.id === threadId) {
        setCurrentThread((prev: ChatThread | null) => prev ? { ...prev, isPinned } : null);
      }

      // API call
      await apiService.toggleThreadPin(threadId, isPinned);
      
      // Update with server response
      setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
        t.id === threadId ? { ...t, isPinned: !isPinned } : t
      ));

      if (currentThread?.id === threadId) {
        setCurrentThread((prev: ChatThread | null) => prev ? { ...prev, isPinned: !isPinned } : null);
      }

      logger.info(`Successfully ${isPinned ? 'pinned' : 'unpinned'} thread: ${threadId}`);
    } catch (error) {
      // Revert optimistic update on error
      const thread = threads.find(t => t.id === threadId);
      if (thread) {
        const originalPinned = thread.isPinned;
        setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
          t.id === threadId ? { ...t, isPinned: originalPinned } : t
        ));

        if (currentThread?.id === threadId) {
          setCurrentThread((prev: ChatThread | null) => prev ? { ...prev, isPinned: originalPinned } : null);
        }
      }

      logger.error(`Failed to toggle pin for thread ${threadId}:`, error as Error);
      handleError(error as Error, 'Thread Pin Toggle');
      throw error;
    }
  }, [threads, currentThread, apiService, setThreads, setCurrentThread, handleError]);

  return {
    // State
    threads,
    currentThread,
    isLoadingThreads,
    threadsError,
    
    // Operations
    loadThreads,
    selectThread,
    createNewChat,
    deleteThread,
    updateThreadInList,
    addThreadToList,
    togglePin
  };
} 