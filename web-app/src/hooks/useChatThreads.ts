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
  updateThreadTitle: (threadId: string, title: string) => Promise<ChatThread>;
  cancelActiveStream?: () => void;
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
  clearAttachments: () => void;
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
    setThreadsError,
    clearAttachments
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
    // Only cancel active streaming when switching between actual threads
    // Don't cancel when going to null (new chat) or from null to thread
    if (apiService.cancelActiveStream && threadId && currentThread?.id && threadId !== currentThread.id) {
      logger.info(`Canceling active stream before switching from thread ${currentThread.id} to ${threadId}`);
      apiService.cancelActiveStream();
    }

    if (!threadId) {
      setCurrentThread(null);
      // Clear attachments when deselecting thread
      clearAttachments();
      return;
    }

    try {
      logger.info(`Selecting thread: ${threadId}`);
      
      // Clear attachments when switching to a different thread
      clearAttachments();
      
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
  }, [threads, currentThread, apiService, setCurrentThread, handleError, clearAttachments]);

  /**
   * Create a new chat thread
   */
  const createNewChat = useCallback(() => {
    // Don't cancel active streams when creating new chat - let the user start a new conversation
    // Cancellation should only happen when switching between existing threads
    logger.info('Creating new chat');
    setCurrentThread(null);
    // Clear attachments when creating new chat
    clearAttachments();
  }, [setCurrentThread, clearAttachments]);

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
        // Clear attachments when deleting current thread
        clearAttachments();
      }
      
      logger.info(`Deleted thread: ${threadId}`);
    } catch (error) {
      logger.error(`Failed to delete thread ${threadId}:`, error as Error);
      handleError(error as Error, 'Thread Deletion');
      throw error;
    }
  }, [apiService, setThreads, currentThread, setCurrentThread, handleError, clearAttachments]);

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

      // API call - returns the updated thread from server
      const updatedThread = await apiService.toggleThreadPin(threadId, isPinned);
      
      // Update with server response (this ensures consistency with server state)
      setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
        t.id === threadId ? updatedThread : t
      ));

      if (currentThread?.id === threadId) {
        setCurrentThread(updatedThread);
      }

      logger.info(`Successfully ${updatedThread.isPinned ? 'pinned' : 'unpinned'} thread: ${threadId}`);
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

  /**
   * Edit thread title
   */
  const editThreadTitle = useCallback(async (threadId: string, newTitle: string) => {
    try {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      if (!newTitle?.trim()) {
        throw new Error('Thread title cannot be empty');
      }

      const trimmedTitle = newTitle.trim();
      logger.info(`Editing thread title: ${threadId} -> "${trimmedTitle}"`);

      // Optimistic update
      setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
        t.id === threadId ? { ...t, title: trimmedTitle } : t
      ));

      if (currentThread?.id === threadId) {
        setCurrentThread((prev: ChatThread | null) => prev ? { ...prev, title: trimmedTitle } : null);
      }

      // API call - returns the updated thread from server
      const updatedThread = await apiService.updateThreadTitle(threadId, trimmedTitle);
      
      // Update with server response (this ensures consistency with server state)
      setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
        t.id === threadId ? updatedThread : t
      ));

      if (currentThread?.id === threadId) {
        setCurrentThread(updatedThread);
      }

      logger.info(`Successfully updated thread title: ${threadId} -> "${updatedThread.title}"`);
      return updatedThread;
    } catch (error) {
      // Revert optimistic update on error
      const thread = threads.find(t => t.id === threadId);
      if (thread) {
        const originalTitle = thread.title;
        setThreads((prevThreads: ChatThread[]) => prevThreads.map(t =>
          t.id === threadId ? { ...t, title: originalTitle } : t
        ));

        if (currentThread?.id === threadId) {
          setCurrentThread((prev: ChatThread | null) => prev ? { ...prev, title: originalTitle } : null);
        }
      }

      logger.error(`Failed to edit thread title for thread ${threadId}:`, error as Error);
      handleError(error as Error, 'Thread Title Edit');
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
    togglePin,
    editThreadTitle
  };
} 