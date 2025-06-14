/**
 * useChat.ts
 * 
 * Main chat orchestration hook
 * 
 * Hook:
 *   useChat
 * 
 * Features:
 *   - Orchestrates chat state, threads, and messaging
 *   - Provides unified chat interface
 *   - Delegates to specialized hooks
 * 
 * Usage: const chat = useChat();
 */
import { useCallback } from 'react';
import { useChatState } from './useChatState';
import { useChatApiService } from './useChatApiService';
import { useChatThreads } from './useChatThreads';
import { useChatMessaging } from './useChatMessaging';
import type { ChatThread, ImageAttachment, DocumentAttachment, TokenMetrics } from '../../../src/shared/types';

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
  documents: DocumentAttachment[];
  currentTokenMetrics: TokenMetrics | null;
  
  // Actions
  loadThreads: (forceRefresh?: boolean) => Promise<void>;
  handleThreadSelect: (threadId: string) => Promise<void>;
  handleNewChat: () => void;
  handleSendMessage: (content: string, images?: ImageAttachment[], documents?: DocumentAttachment[], modelId?: string, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high') => Promise<void>;
  handleDeleteThread: (threadId: string) => Promise<void>;
  handleTogglePinThread: (threadId: string, isPinned: boolean) => Promise<void>;
  clearError: () => void;
  handleImagesChange: (images: ImageAttachment[]) => void;
  handleDocumentsChange: (documents: DocumentAttachment[]) => void;
}

/**
 * Main chat management hook
 * 
 * Orchestrates all chat functionality by combining specialized hooks
 * for state management, API service, thread operations, and messaging.
 * 
 * @returns Comprehensive chat interface
 */
export const useChat = (): UseChatReturn => {
  // Initialize core chat state
  const chatState = useChatState();
  
  // Create authenticated API service
  const chatApiService = useChatApiService();
  
  // Initialize thread operations
  const threadOps = useChatThreads(chatState, chatApiService);
  
  // Initialize messaging operations
  const messagingOps = useChatMessaging(chatState, chatApiService, threadOps.loadThreads);

  /**
   * Handle images change
   * 
   * @param images - New images
   */
  const handleImagesChange = useCallback((images: ImageAttachment[]) => {
    chatState.setImages(images);
  }, [chatState]);

  /**
   * Handle documents change
   * 
   * @param documents - New documents
   */
  const handleDocumentsChange = useCallback((documents: DocumentAttachment[]) => {
    chatState.setDocuments(documents);
  }, [chatState]);

  return {
    // State from chatState
    threads: chatState.threads,
    currentThread: chatState.currentThread,
    loading: chatState.loading,
    threadsLoading: chatState.threadsLoading,
    error: chatState.error,
    images: chatState.images,
    documents: chatState.documents,
    currentTokenMetrics: chatState.currentTokenMetrics,
    
    // Actions from threadOps
    loadThreads: threadOps.loadThreads,
    handleThreadSelect: threadOps.handleThreadSelect,
    handleNewChat: threadOps.handleNewChat,
    handleDeleteThread: threadOps.handleDeleteThread,
    handleTogglePinThread: threadOps.handleTogglePinThread,
    
    // Actions from messagingOps
    handleSendMessage: messagingOps.handleSendMessage,
    
    // Actions from chatState
    clearError: chatState.clearError,
    
    // Local actions
    handleImagesChange,
    handleDocumentsChange
  };
};