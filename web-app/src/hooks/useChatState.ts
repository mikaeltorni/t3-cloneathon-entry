/**
 * useChatState.ts
 * 
 * Core chat state management hook
 * 
 * Hooks:
 *   useChatState
 * 
 * Features:
 *   - Thread state management
 *   - Loading state tracking
 *   - Error state handling
 *   - Token metrics state
 * 
 * Usage: const chatState = useChatState();
 */
import { useState, useCallback } from 'react';
import type { ChatThread, ImageAttachment, DocumentAttachment, TokenMetrics } from '../../../src/shared/types';

interface ChatState {
  // Core state
  threads: ChatThread[];
  currentThread: ChatThread | null;
  loading: boolean;
  threadsLoading: boolean;
  error: string | null;
  images: ImageAttachment[];
  documents: DocumentAttachment[];
  currentTokenMetrics: TokenMetrics | null;
}

interface ChatStateActions {
  // Thread state setters
  setThreads: (threads: ChatThread[]) => void;
  setCurrentThread: (thread: ChatThread | null) => void;
  updateCurrentThread: (updater: (thread: ChatThread | null) => ChatThread | null) => void;
  
  // Loading state setters
  setLoading: (loading: boolean) => void;
  setThreadsLoading: (loading: boolean) => void;
  
  // Error state management
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // File attachments
  setImages: (images: ImageAttachment[]) => void;
  setDocuments: (documents: DocumentAttachment[]) => void;
  clearAttachments: () => void;
  
  // Token metrics
  setCurrentTokenMetrics: (metrics: TokenMetrics | null) => void;
  
  // Reset all state
  resetChatState: () => void;
}

export interface UseChatStateReturn extends ChatState, ChatStateActions {}

/**
 * Core chat state management hook
 * 
 * Provides centralized state management for all chat-related state
 * including threads, loading states, errors, and attachments.
 * 
 * @returns Chat state and state management functions
 */
export const useChatState = (): UseChatStateReturn => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [currentTokenMetrics, setCurrentTokenMetrics] = useState<TokenMetrics | null>(null);

  /**
   * Update current thread with a function
   * 
   * @param updater - Function to update the current thread
   */
  const updateCurrentThread = useCallback((updater: (thread: ChatThread | null) => ChatThread | null) => {
    setCurrentThread(updater);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear all file attachments
   */
  const clearAttachments = useCallback(() => {
    setImages([]);
    setDocuments([]);
  }, []);

  /**
   * Reset all chat state to initial values
   */
  const resetChatState = useCallback(() => {
    setThreads([]);
    setCurrentThread(null);
    setLoading(false);
    setError(null);
    setImages([]);
    setDocuments([]);
    setCurrentTokenMetrics(null);
    setThreadsLoading(true);
  }, []);

  return {
    // State
    threads,
    currentThread,
    loading,
    threadsLoading,
    error,
    images,
    documents,
    currentTokenMetrics,
    
    // Actions
    setThreads,
    setCurrentThread,
    updateCurrentThread,
    setLoading,
    setThreadsLoading,
    setError,
    clearError,
    setImages,
    setDocuments,
    clearAttachments,
    setCurrentTokenMetrics,
    resetChatState
  };
}; 