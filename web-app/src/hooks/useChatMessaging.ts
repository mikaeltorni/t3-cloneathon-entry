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
    onComplete: (response: any) => void,
    onError: (error: Error) => void,
    onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void,
    onTokenMetrics?: (metrics: Partial<TokenMetrics>) => void,
    onAnnotationsChunk?: (annotations: any[]) => void
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

      await chatApiService.sendMessageStream(
        {
          threadId: currentThread?.id, // Use original thread ID for server
          content,
          imageUrl: images && images.length > 1 ? undefined : images?.[0]?.url, // Only for single image
          images: images,
          documents: documents,
          modelId,
          useReasoning,
          reasoningEffort,
          useWebSearch,
          webSearchEffort
        },
        // onChunk callback - update the streaming message content
        (chunk: string, fullContent: string) => {
          debug('📝 Received content chunk', { 
            chunkLength: chunk.length, 
            totalLength: fullContent.length, 
            wasReasoning: tempAiMessage.metadata?.isReasoning,
            chunkPreview: chunk.substring(0, 50) + '...',
            fullContentPreview: fullContent.substring(0, 100) + '...'
          });
          
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
              // Add new temp message to thread
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
        // onComplete callback - replace temp message with final message
        (finalResponse: any) => {
          debug('✅ Message streaming completed', { 
            messageId: finalResponse.assistantResponse?.id,
            contentLength: finalResponse.assistantResponse?.content?.length,
            hasReasoning: !!finalResponse.assistantResponse?.reasoning,
            reasoningLength: finalResponse.assistantResponse?.reasoning?.length || 0,
            hasTokenMetrics: !!finalResponse.tokenMetrics
          });
          
          if (tempThread && finalResponse.assistantResponse) {
            // Find the temp message and replace it with the final one
            const tempIndex = tempThread.messages.findIndex(msg => msg.id === tempAiMessage.id);
            
            if (tempIndex >= 0) {
              const updatedMessages = [...tempThread.messages];
              updatedMessages[tempIndex] = finalResponse.assistantResponse;
              const updatedThread = {
                ...tempThread,
                messages: updatedMessages,
                updatedAt: new Date()
              };
              setCurrentThread(updatedThread);
            }
          }
          
          // Reload threads to get the updated thread from server
          if (isNewThread) {
            log('Reloading threads after new message sent');
            loadThreads();
          }
        },
        // onError callback
        (error: Error) => {
          const errorMessage = error.message || 'Failed to send message';
          setError(errorMessage);
          logError('Failed to stream message', error);
        },
        // onReasoningChunk callback - update the reasoning content
        (reasoning: string, fullReasoning: string) => {
          debug('🧠 Received reasoning chunk', { 
            chunkLength: reasoning.length, 
            totalLength: fullReasoning.length, 
            chunkPreview: reasoning.substring(0, 50) + '...',
            fullReasoningPreview: fullReasoning.substring(0, 100) + '...'
          });
          
          // Mark that we're currently in reasoning mode
          tempAiMessage.metadata = {
            ...tempAiMessage.metadata,
            isReasoning: true
          };
          
          // Update the temporary message with the streaming reasoning
          tempAiMessage.reasoning = fullReasoning;
          
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
              // Add new temp message to thread
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
        // onTokenMetrics callback - update token metrics in real-time
        (metrics: Partial<TokenMetrics>) => {
          debug('📊 Received token metrics', {
            inputTokens: metrics.inputTokens,
            outputTokens: metrics.outputTokens,
            totalTokens: metrics.totalTokens,
            tokensPerSecond: metrics.tokensPerSecond,
            duration: metrics.duration,
            estimatedCost: metrics.estimatedCost?.total
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
      logError('Failed to send message', err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentThread, chatApiService, debug, log, logError, loadThreads, setCurrentThread, setLoading, setError, setCurrentTokenMetrics, clearAttachments]);

  return {
    handleSendMessage
  };
}; 