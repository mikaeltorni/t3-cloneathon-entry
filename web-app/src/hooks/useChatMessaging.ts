/**
 * useChatMessaging.ts
 * 
 * Message streaming and sending operations hook
 * 
 * Hook:
 *   useChatMessaging
 * 
 * Features:
 *   - Real-time message streaming
 *   - Token metrics tracking
 *   - Reasoning support
 *   - Web search integration
 * 
 * Usage: const messagingOps = useChatMessaging(chatState, apiService, loadThreads);
 */
import { useCallback } from 'react';
import { useLogger } from './useLogger';
import type { UseChatStateReturn } from './useChatState';
import type { CreateMessageRequest, CreateMessageResponse, TokenMetrics } from '../../../src/shared/types';

// Interface for the API service
interface ChatApiService {
  sendMessageStream: (
    request: CreateMessageRequest,
    onChunk: (chunk: string, fullContent: string) => void,
    onComplete: (response: CreateMessageResponse) => void,
    onError: (error: Error) => void,
    onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void,
    onTokenMetrics?: (metrics: Partial<TokenMetrics>) => void,
    onAnnotationsChunk?: (annotations: any[]) => void,
    onThreadCreated?: (threadId: string) => void
  ) => Promise<void>;
}

// Interface for chat state
interface UseChatStateReturn {
  currentThread: ChatThread | null;
  setCurrentThread: (thread: ChatThread | null | ((prev: ChatThread | null) => ChatThread | null)) => void;
  setIsSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTokenMetrics: (metrics: TokenMetrics | null) => void;
  clearAttachments: () => void;
}

// Interface for thread operations
interface ThreadOperations {
  addThreadToList: (thread: ChatThread) => void;
}

// Interface for the hook return
interface UseChatMessagingReturn {
  sendMessage: (request: CreateMessageRequest) => Promise<void>;
}

/**
 * Message streaming and sending operations hook
 * 
 * Handles real-time message streaming with support for reasoning,
 * token metrics, and web search annotations.
 * 
 * @param chatState - Chat state management
 * @param chatApiService - Chat API service
 * @param threadOps - Thread operations for optimistic updates
 * @returns Message operation functions
 */
export const useChatMessaging = (
  chatState: UseChatStateReturn,
  chatApiService: ChatApiService,
  threadOps: ThreadOperations
): UseChatMessagingReturn => {
  const { debug, log, error: logError } = useLogger('useChatMessaging');

  const {
    currentThread,
    setCurrentThread,
    setIsSending,
    setError,
    setCurrentTokenMetrics,
    clearAttachments
  } = chatState;

  /**
   * Send message with streaming support
   * 
   * @param request - Create message request
   */
  const sendMessage = useCallback(async (request: CreateMessageRequest) => {
    if (!request.content?.trim() && !request.imageUrl?.trim() && (!request.images || request.images.length === 0)) {
      throw new Error('Message content or image is required');
    }

    try {
      setIsSending(true);
      setError(null);

      debug('🚀 Starting message send', {
        threadId: request.threadId || 'new',
        hasContent: !!request.content,
        hasImages: !!(request.images && request.images.length > 0),
        imageCount: request.images?.length || 0,
        modelId: request.modelId,
        useReasoning: request.useReasoning,
        useWebSearch: request.useWebSearch
      });

      const isNewThread = !request.threadId;
      let tempThread = currentThread;

      // Create temporary AI message for streaming
      const tempAiMessage: any = {
        id: `temp-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: {
          isStreaming: true,
          isReasoning: false
        }
      };

      // Start streaming
      await chatApiService.sendMessageStream(
        request,
        // onChunk callback - update streaming content
        (chunk: string, fullContent: string) => {
          debug('📝 Received content chunk', { 
            chunkLength: chunk.length, 
            totalLength: fullContent.length,
            chunkPreview: chunk.substring(0, 50) + '...',
            fullContentPreview: fullContent.substring(0, 100) + '...'
          });
          
          // Update the temporary message content
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
        (finalResponse: CreateMessageResponse) => {
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
          
          // Add new thread to cache without server refresh for better UX
          if (isNewThread && tempThread) {
            log('Adding new thread to cache without server refresh');
            threadOps.addThreadToList(tempThread);
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
        },
        // onThreadCreated callback - handle new thread creation during streaming
        (threadId: string) => {
          debug('🆕 New thread created during streaming', { threadId });
          
          // Create a temporary thread structure for new chats
          if (isNewThread && !tempThread) {
            // Create user message for the temporary thread
            const userMessage = {
              id: `temp-user-${Date.now()}`,
              role: 'user' as const,
              content: request.content || '',
              timestamp: new Date(),
              imageUrl: request.imageUrl,
              images: request.images,
              documents: request.documents
            };
            
            // Create temporary thread with the user message
            tempThread = {
              id: threadId,
              title: request.content && request.content.length > 50 ? request.content.substring(0, 50) + '...' : request.content || 'New Chat',
              messages: [userMessage],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Set as current thread so UI can display it
            setCurrentThread(tempThread);
            
            debug('✅ Created temporary thread for streaming', { 
              threadId, 
              messageCount: tempThread.messages.length 
            });
          }
        }
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      logError('Failed to send message', err as Error);
    } finally {
      setIsSending(false);
    }
  }, [currentThread, chatApiService, debug, log, logError, threadOps, setCurrentThread, setIsSending, setError, setCurrentTokenMetrics, clearAttachments]);

  return {
    sendMessage
  };
}; 