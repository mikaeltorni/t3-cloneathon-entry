/**
 * chatApiComposed.ts
 * 
 * Composed chat API service using extracted services
 * 
 * Services:
 *   ChatApiComposed - Main API orchestrator
 * 
 * Features:
 *   - Clean service composition
 *   - Unified API interface
 *   - Service dependency injection
 *   - Streamlined error handling
 * 
 * Usage: import { createChatApiComposed } from './chatApiComposed'
 */
import { logger } from '../utils/logger';
import { HttpClient } from './httpClient';
import { StreamingService } from './streamingService';
import { MessageService } from './messageService';
import type { 
  ChatThread, 
  ChatMessage,
  CreateMessageRequest, 
  CreateMessageResponse, 
  GetChatsResponse,
  AvailableModelsResponse,
  TokenMetrics
} from '../../../src/shared/types';
import type { StreamingCallbacks, PaginatedResponse } from './types/apiTypes';

// Base API URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Composed chat API service
 * 
 * Orchestrates multiple focused services to provide a unified
 * chat API interface with clean separation of concerns.
 */
export class ChatApiComposed {
  private httpClient: HttpClient;
  private streamingService: StreamingService;
  private messageService: MessageService;

  constructor(
    httpClient: HttpClient,
    streamingService: StreamingService,
    messageService: MessageService
  ) {
    this.httpClient = httpClient;
    this.streamingService = streamingService;
    this.messageService = messageService;
    logger.info('ChatApiComposed initialized with composed services');
  }

  // Thread Operations (using HttpClient directly for simple operations)

  /**
   * Get all chat threads with efficient pagination
   * 
   * @param limit - Number of threads to fetch (default: 50)
   * @param cursor - Pagination cursor from previous request
   * @param summaryOnly - If true, returns thread summaries without messages
   * @returns Promise with chat threads and pagination info
   */
  async getAllChatsEfficient(
    limit: number = 50,
    cursor?: string,
    summaryOnly: boolean = false
  ): Promise<PaginatedResponse<ChatThread>> {
    const params: Record<string, string> = {
      limit: limit.toString(),
    };
    
    if (cursor) params.startAfter = cursor;
    if (summaryOnly) params.summaryOnly = 'true';

    logger.info(`Fetching chat threads (efficient): limit=${limit}, summaryOnly=${summaryOnly}`);
    
    const response = await this.httpClient.get<GetChatsResponse & { hasMore?: boolean; cursor?: string }>(
      '/chats',
      params
    );
    
    logger.info(`Successfully fetched ${response.threads.length} chat threads efficiently (hasMore: ${response.hasMore})`);
    
    return {
      data: response.threads,
      hasMore: response.hasMore || false,
      cursor: response.cursor,
    };
  }

  /**
   * Get messages for multiple threads in batch
   * 
   * @param threadIds - Array of thread IDs to fetch messages for
   * @returns Promise with thread ID to messages mapping
   */
  async getBatchMessages(threadIds: string[]): Promise<Record<string, ChatMessage[]>> {
    if (!threadIds.length) {
      return {};
    }

    logger.info(`Fetching batch messages for ${threadIds.length} threads`);
    
    const response = await this.httpClient.post<Record<string, ChatMessage[]>>('/chats/batch/messages', {
      threadIds
    });
    
    logger.info(`Successfully fetched batch messages for ${Object.keys(response).length} threads`);
    return response;
  }

  /**
   * Get single chat thread by ID
   * 
   * @param threadId - Thread ID to fetch
   * @returns Promise with chat thread
   */
  async getChat(threadId: string): Promise<ChatThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    logger.info(`Fetching chat thread: ${threadId}`);
    
    const thread = await this.httpClient.get<ChatThread>(`/chats/${threadId}`);
    
    logger.info(`Successfully fetched chat thread: ${threadId}`);
    return thread;
  }

  /**
   * Delete chat thread
   * 
   * @param threadId - Thread ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteChat(threadId: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    logger.info(`Deleting chat thread: ${threadId}`);
    
    await this.httpClient.delete(`/chats/${threadId}`);
    
    logger.info(`Successfully deleted chat thread: ${threadId}`);
  }

  /**
   * Update thread title
   * 
   * @param threadId - Thread ID to update
   * @param title - New thread title
   * @returns Promise with updated chat thread
   */
  async updateThreadTitle(threadId: string, title: string): Promise<ChatThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    if (!title?.trim()) {
      throw new Error('Thread title is required');
    }

    logger.info(`Updating thread title: ${threadId} -> "${title}"`);
    
    const updatedThread = await this.httpClient.patch<ChatThread>(`/chats/${threadId}`, {
      title: title.trim()
    });
    
    logger.info(`Successfully updated thread title: ${threadId}`);
    return updatedThread;
  }

  /**
   * Toggle thread pin status
   * 
   * @param threadId - Thread ID to pin/unpin
   * @param isPinned - Pin status to set
   * @returns Promise with updated chat thread
   */
  async toggleThreadPin(threadId: string, isPinned: boolean): Promise<ChatThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    logger.info(`${isPinned ? 'Pinning' : 'Unpinning'} thread: ${threadId}`);
    
    const updatedThread = await this.httpClient.patch<ChatThread>(`/chats/${threadId}/pin`, {
      isPinned
    });
    
    logger.info(`Successfully ${isPinned ? 'pinned' : 'unpinned'} thread: ${threadId}`);
    return updatedThread;
  }

  // Message Operations (delegating to MessageService)

  /**
   * Send message to chat thread (delegates to MessageService)
   * 
   * @param request - Create message request
   * @returns Promise with create message response
   */
  async sendMessage(request: CreateMessageRequest): Promise<CreateMessageResponse> {
    return this.messageService.sendMessage(request);
  }

  /**
   * Get available AI models (delegates to MessageService)
   * 
   * @returns Promise with available models response
   */
  async getAvailableModels(): Promise<AvailableModelsResponse> {
    return this.messageService.getAvailableModels();
  }

  // Streaming Operations (delegating to StreamingService)

  /**
   * Stream message with real-time callbacks (delegates to StreamingService)
   * 
   * @param request - Create message request
   * @param onChunk - Callback for content chunks
   * @param onComplete - Callback when streaming is complete
   * @param onError - Callback for errors
   * @param onReasoningChunk - Optional callback for reasoning chunks
   * @param onTokenMetrics - Optional callback for real-time token metrics
   * @param onAnnotationsChunk - Optional callback for annotation chunks
   * @param onThreadCreated - Optional callback for thread creation
   * @returns Promise that resolves when streaming starts
   */
  async sendMessageStream(
    request: CreateMessageRequest,
    onChunk: (chunk: string, fullContent: string) => void,
    onComplete: (response: CreateMessageResponse) => void,
    onError: (error: Error) => void,
    onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void,
    onTokenMetrics?: (metrics: Partial<TokenMetrics>) => void,
    onAnnotationsChunk?: (annotations: any[]) => void,
    onThreadCreated?: (threadId: string) => void
  ): Promise<void> {
    const callbacks: StreamingCallbacks = {
      onChunk,
      onComplete,
      onError,
      onReasoningChunk,
      onTokenMetrics,
      onAnnotationsChunk,
      onThreadCreated
    };

    return this.streamingService.streamMessage(request, callbacks);
  }
}

/**
 * Create composed chat API service instance
 * 
 * @param getAuthToken - Optional auth token getter function
 * @returns ChatApiComposed instance
 */
export const createChatApiComposed = (getAuthToken?: () => Promise<string | null>): ChatApiComposed => {
  // Create HTTP client
  const httpClient = new HttpClient({
    baseUrl: API_BASE_URL,
    getAuthToken,
    timeout: 10000
  });

  // Create specialized services
  const streamingService = StreamingService.create(httpClient);
  const messageService = MessageService.create(httpClient);

  // Return composed service
  return new ChatApiComposed(httpClient, streamingService, messageService);
};

// Default singleton instance (for backwards compatibility)
export const chatApiComposed = createChatApiComposed(); 