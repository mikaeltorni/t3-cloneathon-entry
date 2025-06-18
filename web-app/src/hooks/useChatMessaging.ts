/**
 * useChatMessaging.ts
 * 
 * OPTIMIZED: Chat messaging operations hook with streaming support
 * 
 * Hook:
 *   useChatMessaging
 * 
 * Features:
 *   - Message sending with streaming
 *   - Thread switching stream cancellation
 *   - Temporary message management
 *   - Token metrics tracking
 *   - Error handling and recovery
 *   - Performance optimized with memoization
 * 
 * Usage: const messaging = useChatMessaging(chatState, chatApiService, threadOps);
 */
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useLogger } from './useLogger';
import type { 
  CreateMessageRequest, 
  CreateMessageResponse, 
  ChatMessage,
  ChatThread,
  TokenMetrics,
  WebSearchAnnotation
} from '../../../src/shared/types';

// Define the interface for chat API service
interface ChatApiService {
  sendMessageStream: (
    request: CreateMessageRequest,
    onChunk: (chunk: string, fullContent: string) => void,
    onComplete: (response: CreateMessageResponse) => void,
    onError: (error: Error) => void,
    onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void,
    onTokenMetrics?: (metrics: Partial<TokenMetrics>) => void,
    onAnnotationsChunk?: (annotations: WebSearchAnnotation[]) => void,
    onThreadCreated?: (threadId: string) => void,
    onUserMessageConfirmed?: (userMessage: ChatMessage) => void
  ) => Promise<void>;
  // Add method to cancel active streams
  cancelActiveStream?: () => void;
}

// Define state interface
interface UseChatStateReturn {
  currentThread: ChatThread | null;
  setCurrentThread: (thread: ChatThread | null | ((prev: ChatThread | null) => ChatThread | null)) => void;
  setIsSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTokenMetrics: (metrics: TokenMetrics | null) => void;
  clearAttachments: () => void;
}

// Define thread operations interface
interface ThreadOperations {
  addThreadToList: (thread: ChatThread) => void;
}

interface UseChatMessagingReturn {
  sendMessage: (request: CreateMessageRequest) => Promise<void>;
  cancelActiveStream: () => void;
}

/**
 * OPTIMIZED: Chat messaging operations hook
 * 
 * Handles message sending, streaming, and thread management
 * with proper cleanup and error handling.
 * 
 * @param chatState - Chat state management functions
 * @param chatApiService - API service for chat operations
 * @param threadOps - Thread management operations
 * @returns Message operations interface
 */
export const useChatMessaging = (
  chatState: UseChatStateReturn,
  chatApiService: ChatApiService,
  threadOps: ThreadOperations
): UseChatMessagingReturn => {
  const { debug, error: logError, log } = useLogger('useChatMessaging');

  const {
    currentThread,
    setCurrentThread,
    setIsSending,
    setError,
    setCurrentTokenMetrics,
    clearAttachments
  } = chatState;

  // Track the current thread ID to detect changes
  const currentThreadIdRef = useRef(currentThread?.id);

  // OPTIMIZED: Memoize the cancel function to prevent recreation
  const cancelActiveStream = useCallback(() => {
    if (chatApiService.cancelActiveStream) {
      debug('🛑 Canceling active stream on user request');
      chatApiService.cancelActiveStream();
      setIsSending(false);
      setError(null);
    }
  }, [chatApiService, setIsSending, setError, debug]);

  // OPTIMIZED: Memoize thread ID comparison to prevent unnecessary effects
  const currentThreadId = useMemo(() => currentThread?.id, [currentThread?.id]);

  // FIXED: Effect to cancel streams when thread changes (but NOT on dependency changes)
  useEffect(() => {
    const previousThreadId = currentThreadIdRef.current;
    const newThreadId = currentThreadId;

    // Only cancel streams when switching between two DIFFERENT existing threads
    // Don't cancel for:
    // - New chat creation (undefined -> new thread)
    // - Temp ID updates (temp-thread-123 -> real-thread-456)
    const isRealThreadSwitch = previousThreadId && 
                               newThreadId && 
                               previousThreadId !== newThreadId &&
                               !previousThreadId.startsWith('temp-thread-') &&
                               !newThreadId.startsWith('temp-thread-');

    if (isRealThreadSwitch) {
      debug(`🔄 Real thread switch from ${previousThreadId} to ${newThreadId}, canceling active streams`);
      if (chatApiService.cancelActiveStream) {
        chatApiService.cancelActiveStream();
      }
      // Clear sending state when switching threads
      setIsSending(false);
      setError(null);
    } else if (previousThreadId !== newThreadId) {
      debug(`ℹ️ Thread ID changed but not canceling stream: ${previousThreadId} -> ${newThreadId}`, {
        isNewChat: !previousThreadId,
        isTempUpdate: previousThreadId?.startsWith('temp-thread-') || newThreadId?.startsWith('temp-thread-'),
        reason: !previousThreadId ? 'new chat' : 'temp ID update'
      });
    }

    // Update the ref
    currentThreadIdRef.current = newThreadId;
  }, [currentThreadId, chatApiService, setIsSending, setError, debug]);

  // FIXED: Separate effect for cleanup on unmount only
  useEffect(() => {
    // Only cleanup on component unmount, not on dependency changes
    return () => {
      debug('🧹 Component unmounting, canceling any active streams');
      if (chatApiService.cancelActiveStream) {
        chatApiService.cancelActiveStream();
      }
    };
  }, []); // Empty dependency array for unmount cleanup only

  /**
   * OPTIMIZED: Memoized send message with streaming support
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

      // Create user message to add to UI immediately
      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user' as const,
        content: request.content || '',
        timestamp: new Date(),
        imageUrl: request.imageUrl,
        images: request.images,
        documents: request.documents
      };

      // For new chats, create a temporary thread structure
      if (isNewThread && !tempThread) {
        const newThreadTitle = request.content && request.content.length > 50 
          ? request.content.substring(0, 50) + '...' 
          : request.content || 'New Chat';
        
        tempThread = {
          id: `temp-thread-${Date.now()}`, // Temporary ID until server responds
          title: newThreadTitle,
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setCurrentThread(tempThread);
        debug('✅ Created temporary thread for new chat', { 
          tempThreadId: tempThread.id,
          messageId: userMessage.id,
          title: newThreadTitle 
        });
      } else if (tempThread) {
        // Add user message to existing thread immediately for UI feedback
        tempThread = {
          ...tempThread,
          messages: [...tempThread.messages, userMessage],
          updatedAt: new Date()
        };
        setCurrentThread(tempThread);
        debug('✅ Added user message to existing thread', { 
          messageId: userMessage.id,
          threadId: tempThread.id,
          messageCount: tempThread.messages.length 
        });
      }

      // Create temporary AI message for streaming
      const tempAiMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: {
          isStreaming: true,
          isReasoning: false
        }
      };

      // FIXED: Regular callback functions (not useCallback - that would violate Rules of Hooks)
      const onChunk = (chunk: string, fullContent: string) => {
        debug('📝 Received content chunk', { 
          chunkLength: chunk.length, 
          totalLength: fullContent.length,
          chunkPreview: chunk.substring(0, 50) + '...',
          fullContentPreview: fullContent.substring(0, 100) + '...'
        });
        
        // Update the temporary message content
        tempAiMessage.content = fullContent;
        
        // If we're receiving content chunks, reasoning phase is done
        tempAiMessage.metadata = {
          ...tempAiMessage.metadata,
          isReasoning: false,
          isStreaming: true
        };
        
        if (tempThread) {
          // Find if temp message already exists in thread
          const existingTempIndex = tempThread.messages.findIndex((msg: ChatMessage) => msg.id === tempAiMessage.id);
          
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
      };

      const onComplete = (finalResponse: CreateMessageResponse) => {
        debug('✅ Message streaming completed', { 
          messageId: finalResponse.assistantResponse?.id,
          contentLength: finalResponse.assistantResponse?.content?.length,
          hasReasoning: !!finalResponse.assistantResponse?.reasoning,
          reasoningLength: finalResponse.assistantResponse?.reasoning?.length || 0,
          hasTokenMetrics: !!finalResponse.tokenMetrics
        });
        
        if (tempThread && finalResponse.assistantResponse) {
          // Find the temp message and replace it with the final one
          const tempIndex = tempThread.messages.findIndex((msg: ChatMessage) => msg.id === tempAiMessage.id);
          
          if (tempIndex >= 0) {
            const finalMessage = {
              ...finalResponse.assistantResponse,
              // Clear streaming metadata when message is complete
              metadata: {
                ...finalResponse.assistantResponse.metadata,
                isReasoning: false,
                isStreaming: false
              }
            };
            
            const updatedMessages = [...tempThread.messages];
            updatedMessages[tempIndex] = finalMessage;
            const updatedThread = {
              ...tempThread,
              messages: updatedMessages,
              updatedAt: new Date()
            };
            setCurrentThread(updatedThread);
            tempThread = updatedThread; // Update local reference
          }
        }
        
        // Add new thread to cache without server refresh for better UX
        if (isNewThread && tempThread) {
          debug('🆕 Adding new thread to thread list', { 
            threadId: tempThread.id,
            title: tempThread.title,
            messageCount: tempThread.messages.length 
          });
          threadOps.addThreadToList(tempThread);
        }
      };

      const onError = (error: Error) => {
        const errorMessage = error.message || 'Failed to send message';
        setError(errorMessage);
        logError('Failed to stream message', error);
      };

      const onReasoningChunk = (reasoning: string, fullReasoning: string) => {
        debug('🧠 Received reasoning chunk', { 
          chunkLength: reasoning.length, 
          totalLength: fullReasoning.length, 
          chunkPreview: reasoning.substring(0, 50) + '...',
          fullReasoningPreview: fullReasoning.substring(0, 100) + '...'
        });
        
        // Mark that we're currently in reasoning mode and update reasoning content
        tempAiMessage.metadata = {
          ...tempAiMessage.metadata,
          isReasoning: true,
          isStreaming: true,
          reasoning: fullReasoning
        };
        
        if (tempThread) {
          const existingTempIndex = tempThread.messages.findIndex((msg: ChatMessage) => msg.id === tempAiMessage.id);
          
          if (existingTempIndex >= 0) {
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
            // Add the temp message with reasoning to the thread if it doesn't exist
            const updatedThread = {
              ...tempThread,
              messages: [...tempThread.messages, tempAiMessage],
              updatedAt: new Date()
            };
            
            setCurrentThread(updatedThread);
            tempThread = updatedThread;
          }
        }
      };

      // Start streaming
      await chatApiService.sendMessageStream(
        request,
        onChunk,
        onComplete,
        onError,
        onReasoningChunk,
        // onTokenMetrics callback
        (metrics) => {
          setCurrentTokenMetrics(metrics as TokenMetrics);
        },
        // onAnnotationsChunk callback
        (annotations) => {
          debug('🔍 Received web search annotations', { count: annotations.length });
        },
        // onThreadCreated callback
        (threadId) => {
          debug('🆕 Thread created', { threadId });
          
          // If this is a new thread, update the temporary thread with the real ID
          if (isNewThread && tempThread && tempThread.id.startsWith('temp-thread-')) {
            tempThread = {
              ...tempThread,
              id: threadId // Replace temporary ID with real ID from server
            };
            setCurrentThread(tempThread);
            debug('🔄 Updated temp thread with real ID', { 
              tempId: tempThread.id,
              realId: threadId 
            });
          }
        },
        // onUserMessageConfirmed callback
        (userMessage) => {
          debug('✅ User message confirmed', { messageId: userMessage.id });
        }
      );

      // Clear attachments after successful send
      clearAttachments();
      debug('🧹 Cleared attachments after successful message send');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      logError('Message send failed', error as Error);
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [
    currentThread,
    setCurrentThread,
    setIsSending,
    setError,
    setCurrentTokenMetrics,
    clearAttachments,
    chatApiService,
    threadOps,
    debug,
    logError,
    log
  ]);

  return {
    sendMessage,
    cancelActiveStream
  };
}; 