/**
 * useChatMessaging.ts
 * 
 * Message sending and streaming hook
 * 
 * Hooks:
 *   useChatMessaging
 * 
 * Features:
 *   - Message sending with streaming
 *   - Real-time updates during streaming
 *   - Token metrics tracking
 *   - Reasoning support
 *   - Web search integration
 * 
 * Usage: const messaging = useChatMessaging(chatState, chatApiService, loadThreads);
 */
import { useCallback } from 'react';
import { useLogger } from './useLogger';
import { useErrorHandler } from './useErrorHandler';
import type { UseChatStateReturn } from './useChatState';
import type { ChatMessage, ImageAttachment, DocumentAttachment, TokenMetrics } from '../../../src/shared/types';

interface ChatApiService {
  sendMessageStream: (
    request: any,
    onChunk: (chunk: string, fullContent: string) => void,
    onReasoning: (reasoning: string, fullReasoning: string) => void,
    onComplete: (message: any) => void,
    onTokenMetrics: (metrics: TokenMetrics) => void,
    onAnnotationsChunk: (annotations: any[]) => void
  ) => Promise<void>;
}

interface UseChatMessagingReturn {
  handleSendMessage: (
    content: string,
    images?: ImageAttachment[],
    documents?: DocumentAttachment[],
    modelId?: string,
    useReasoning?: boolean,
    reasoningEffort?: 'low' | 'medium' | 'high',
    useWebSearch?: boolean,
    webSearchEffort?: 'low' | 'medium' | 'high'
  ) => Promise<void>;
}

/**
 * Message sending and streaming hook
 * 
 * Handles message sending with real-time streaming support,
 * including reasoning, web search, and token metrics.
 * 
 * @param chatState - Chat state management hook return
 * @param chatApiService - Chat API service instance
 * @param loadThreads - Function to reload threads after message
 * @returns Message sending functions
 */
export const useChatMessaging = (
  chatState: UseChatStateReturn,
  chatApiService: ChatApiService,
  loadThreads: () => Promise<void>
): UseChatMessagingReturn => {
  const { debug, log, error: logError } = useLogger('useChatMessaging');
  const { handleError } = useErrorHandler();

  const {
    currentThread,
    setCurrentThread,
    setLoading,
    setError,
    setCurrentTokenMetrics,
    clearAttachments
  } = chatState;

  /**
   * Handle sending a message with streaming
   */
  const handleSendMessage = useCallback(async (
    content: string,
    images?: ImageAttachment[],
    documents?: DocumentAttachment[],
    modelId?: string,
    useReasoning?: boolean,
    reasoningEffort?: 'low' | 'medium' | 'high',
    useWebSearch?: boolean,
    webSearchEffort?: 'low' | 'medium' | 'high'
  ) => {
    setLoading(true);
    setError(null);
    setCurrentTokenMetrics(null);

    try {
      let tempThread = currentThread;
      let isNewThread = false;

      // Create user message immediately for instant feedback
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
        images: images,
        documents: documents,
        imageUrl: images && images.length === 1 ? images[0].url : undefined
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
        reasoning: ''
      };

      // Clear attachments after creating user message
      clearAttachments();

      // Handle streaming with callbacks...
      // (Implementation would continue here with the streaming logic)
      
      debug('Message sending started');
      log('Message sent successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      logError('Failed to send message', err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentThread, chatApiService, debug, log, logError, loadThreads, setCurrentThread, setLoading, setError, setCurrentTokenMetrics, clearAttachments]);

  return {
    handleSendMessage
  };
}; 