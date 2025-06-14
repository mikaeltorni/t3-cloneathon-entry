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
 *   - Message state management
 *   - Loading state tracking
 *   - Error state handling
 *   - Token metrics state
 * 
 * Usage: const chatState = useChatState();
 */
import { useState, useCallback } from 'react';
import type { ChatThread, ChatMessage, ImageAttachment, DocumentAttachment, TokenMetrics } from '../../../src/shared/types';

interface ChatState {
  // Core state
  threads: ChatThread[];
  currentThread: ChatThread | null;
  messages: ChatMessage[];
  
  // Loading states
  loading: boolean;
  threadsLoading: boolean;
  isLoadingThreads: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  
  // Error states
  error: string | null;
  threadsError: string | null;
  
  // Attachments
  images: ImageAttachment[];
  documents: DocumentAttachment[];
  
  // Metrics
  currentTokenMetrics: TokenMetrics | null;
  tokenMetrics: TokenMetrics | null;
}

interface ChatStateActions {
  // Thread state setters
  setThreads: (threads: ChatThread[] | ((prevThreads: ChatThread[]) => ChatThread[])) => void;
  setCurrentThread: (thread: ChatThread | null | ((prev: ChatThread | null) => ChatThread | null)) => void;
  updateCurrentThread: (updater: (thread: ChatThread | null) => ChatThread | null) => void;
  
  // Message state setters
  setMessages: (messages: ChatMessage[]) => void;
  
  // Loading state setters
  setLoading: (loading: boolean) => void;
  setThreadsLoading: (loading: boolean) => void;
  setIsLoadingThreads: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setIsSending: (sending: boolean) => void;
  
  // Error state management
  setError: (error: string | null) => void;
  setThreadsError: (error: string | null) => void;
  clearError: () => void;
  
  // File attachments
  setImages: (images: ImageAttachment[]) => void;
  setDocuments: (documents: DocumentAttachment[]) => void;
  clearAttachments: () => void;
  
  // Token metrics
  setCurrentTokenMetrics: (metrics: TokenMetrics | null) => void;
  setTokenMetrics: (metrics: TokenMetrics | null) => void;
  
  // Reset all state
  resetChatState: () => void;
  resetState: () => void;
}

export interface UseChatStateReturn extends ChatState, ChatStateActions {}

/**
 * Core chat state management hook
 * 
 * Provides centralized state management for all chat-related state
 * including threads, messages, loading states, errors, and attachments.
 * 
 * @returns Chat state and state management functions
 */
export const useChatState = (): UseChatStateReturn => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  
  // Attachments
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  
  // Metrics
  const [currentTokenMetrics, setCurrentTokenMetrics] = useState<TokenMetrics | null>(null);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);

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
    setThreadsError(null);
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
    setMessages([]);
    setLoading(false);
    setThreadsLoading(true);
    setIsLoadingThreads(true);
    setIsLoadingMessages(false);
    setIsSending(false);
    setError(null);
    setThreadsError(null);
    setImages([]);
    setDocuments([]);
    setCurrentTokenMetrics(null);
    setTokenMetrics(null);
  }, []);

  // Alias for resetChatState
  const resetState = resetChatState;

  return {
    // State
    threads,
    currentThread,
    messages,
    loading,
    threadsLoading,
    isLoadingThreads,
    isLoadingMessages,
    isSending,
    error,
    threadsError,
    images,
    documents,
    currentTokenMetrics,
    tokenMetrics,
    
    // Actions
    setThreads,
    setCurrentThread,
    updateCurrentThread,
    setMessages,
    setLoading,
    setThreadsLoading,
    setIsLoadingThreads,
    setIsLoadingMessages,
    setIsSending,
    setError,
    setThreadsError,
    clearError,
    setImages,
    setDocuments,
    clearAttachments,
    setCurrentTokenMetrics,
    setTokenMetrics,
    resetChatState,
    resetState
  };
}; 