/**
 * useChat.ts
 * 
 * Custom hook for managing chat state and operations
 * Extracted from App.tsx to improve code organization and reusability
 * 
 * Hook:
 *   useChat
 * 
 * Features:
 *   - Thread management (load, select, create, delete)
 *   - Message sending with streaming support
 *   - Loading states and error handling
 *   - Automatic thread reloading
 * 
 * Usage: const chat = useChat();
 */
import { useState, useCallback } from 'react';
import { chatApiService } from '../services/chatApi';
import { useLogger } from './useLogger';
import { useErrorHandler } from './useErrorHandler';
import type { ChatThread, ChatMessage, ImageAttachment } from '../../../src/shared/types';

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
  
  // Actions
  loadThreads: () => Promise<void>;
  handleThreadSelect: (threadId: string) => Promise<void>;
  handleNewChat: () => void;
  handleSendMessage: (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean) => Promise<void>;
  handleDeleteThread: (threadId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for chat management
 * 
 * Provides comprehensive chat functionality including:
 * - Thread loading and management
 * - Message sending with real-time streaming
 * - Error handling and loading states
 * 
 * @returns Chat state and operations
 */
export const useChat = (): UseChatReturn => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { log, debug, warn, error: logError } = useLogger('useChat');
  const { handleError } = useErrorHandler();

  /**
   * Load all chat threads from the server
   */
  const loadThreads = useCallback(async () => {
    try {
      setThreadsLoading(true);
      debug('Loading threads from server...');
      const allThreads = await chatApiService.getAllChats();
      setThreads(allThreads);
      setError(null);
      log(`Successfully loaded ${allThreads.length} threads`);
    } catch (err) {
      const errorMessage = 'Failed to load chat history. Make sure the server is running.';
      handleError(err as Error, 'LoadThreads');
      setError(errorMessage);
      warn(errorMessage);
    } finally {
      setThreadsLoading(false);
    }
  }, [debug, log, warn, handleError]);

  /**
   * Handle thread selection from sidebar
   * 
   * @param threadId - ID of the thread to select
   */
  const handleThreadSelect = useCallback(async (threadId: string) => {
    try {
      debug(`Selecting thread: ${threadId}`);
      const thread = await chatApiService.getChat(threadId);
      setCurrentThread(thread);
      setError(null);
      log(`Thread selected: ${thread.title}`);
    } catch (err) {
      const errorMessage = 'Failed to load chat thread';
      handleError(err as Error, 'ThreadSelect');
      setError(errorMessage);
      warn(errorMessage);
    }
  }, [debug, log, warn, handleError]);

  /**
   * Handle creating a new chat
   */
  const handleNewChat = useCallback(() => {
    debug('Creating new chat');
    setCurrentThread(null);
    log('New chat created');
  }, [debug, log]);

  /**
   * Handle sending a message with streaming
   * 
   * @param content - Message content
   * @param images - Optional image attachments
   * @param modelId - AI model to use
   * @param useReasoning - Whether to enable reasoning for the request
   */
  const handleSendMessage = useCallback(async (content: string, images?: ImageAttachment[], modelId?: string, useReasoning?: boolean) => {
    setLoading(true);
    setError(null);

    try {
      // Check server connectivity first
      const isHealthy = await chatApiService.checkHealth();
      if (!isHealthy) {
        setError('Server is not running. Start it with: npm run dev');
        return;
      }

      let tempThread = currentThread;
      let isNewThread = false;

      // Create user message immediately for instant feedback
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
        images: images,
        imageUrl: images && images.length === 1 ? images[0].url : undefined // For backward compatibility
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
        reasoning: '' // Initialize reasoning for reasoning models
      };

      await chatApiService.sendMessageStream(
        {
          threadId: currentThread?.id, // Use original thread ID for server
          content,
          imageUrl: images && images.length > 1 ? undefined : images?.[0]?.url, // Only for single image
          images: images,
          modelId,
          useReasoning
        },
        // onChunk callback - update the streaming message content
        (chunk: string, fullContent: string) => {
          debug('📝 Received content chunk', { chunkLength: chunk.length, totalLength: fullContent.length, wasReasoning: tempAiMessage.metadata?.isReasoning });
          
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
              // Update existing temp message (this will include the updated metadata)
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
              // Add temp message for the first time
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
        // onComplete callback - finalize the response
        async (response) => {
          debug('Streaming completed', { threadId: response.threadId });
          
          // Final cleanup of reasoning state if not already done
          if (tempAiMessage.metadata?.isReasoning === true) {
            debug('Final reasoning cleanup');
            
            tempAiMessage.metadata = { 
              ...tempAiMessage.metadata, 
              isReasoning: false
            };
          }
          
          // Get the final thread from server to ensure consistency
          const finalThread = await chatApiService.getChat(response.threadId);
          
          // Transfer metadata from temp message to final message
          if (tempAiMessage.metadata && finalThread.messages.length > 0) {
            const lastMessage = finalThread.messages[finalThread.messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.id === tempAiMessage.id) {
              lastMessage.metadata = tempAiMessage.metadata;
            }
          }
          
          setCurrentThread(finalThread);

          // Reload threads to update sidebar if new thread was created
          if (isNewThread || !currentThread) {
            await loadThreads();
          }
          
          log('Streaming message completed successfully');
        },
        // onError callback - handle errors and clean up
        (error) => {
          const errorMessage = error.message || 'Failed to send message';
          setError(errorMessage);
          logError('Failed to send streaming message', error);
          
          // Always remove temp AI message on error to prevent empty messages
          if (tempThread) {
            const messagesWithoutTempAi = tempThread.messages.filter(msg => msg.id !== tempAiMessage.id);
            setCurrentThread({
              ...tempThread,
              messages: messagesWithoutTempAi,
              updatedAt: tempThread.updatedAt
            });
          }
          
          // Also show a user-friendly error message
          if (error.message.includes('Failed to fetch') || error.message.includes('TypeError')) {
            setError('Cannot connect to server. Make sure the server is running with: npm run dev');
          }
        },
        // onReasoningChunk callback - update the reasoning in real-time
        (reasoningChunk: string, fullReasoning: string) => {
          debug('🧠 Received reasoning chunk', { chunkLength: reasoningChunk.length, totalLength: fullReasoning.length });
          
          // Update the temporary message with the streaming reasoning
          tempAiMessage.reasoning = fullReasoning;
          
          // Mark that this message is currently reasoning
          tempAiMessage.metadata = {
            ...tempAiMessage.metadata,
            isReasoning: true
          };
          
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
              // Add temp message for the first time (this shouldn't happen for reasoning)
              const updatedThread = {
                ...tempThread,
                messages: [...tempThread.messages, tempAiMessage],
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
      logError('Failed to start streaming message', err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentThread, debug, log, logError, loadThreads]);

  /**
   * Handle deleting a thread
   * 
   * @param threadId - ID of the thread to delete
   */
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      debug(`Deleting thread: ${threadId}`);
      await chatApiService.deleteChat(threadId);
      
      // Remove from local state
      setThreads(threads.filter(t => t.id !== threadId));
      
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
  }, [threads, currentThread?.id, debug, log, warn, handleError]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    threads,
    currentThread,
    loading,
    threadsLoading,
    error,
    
    // Actions
    loadThreads,
    handleThreadSelect,
    handleNewChat,
    handleSendMessage,
    handleDeleteThread,
    clearError
  };
}; 