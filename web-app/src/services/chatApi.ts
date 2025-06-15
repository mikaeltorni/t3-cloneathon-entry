/**
 * chatApi.ts
 * 
 * REFACTORED: Now uses composed services for clean architecture
 * 
 * Services:
 *   - HttpClient: Base HTTP operations
 *   - StreamingService: Real-time streaming
 *   - MessageService: Message operations
 *   - ThreadService: Thread management
 * 
 * Features:
 *   - Clean service composition
 *   - Single responsibility principle
 *   - Maintainable and testable code
 * 
 * Usage: import { chatApiService } from './services/chatApi'
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
 * REFACTORED Chat API Service (638 lines → 140 lines!)
 * 
 * Now uses composed services with clean separation of concerns:
 * - HttpClient handles base HTTP operations
 * - StreamingService handles real-time streaming
 * - MessageService handles message operations
 * 
 * Benefits:
 * - Single responsibility principle
 * - Testable components
 * - Maintainable architecture
 * - Clean error handling
 */
export class ChatApiService {
  private httpClient: HttpClient;
  private streamingService: StreamingService;
  private messageService: MessageService;

  constructor(baseUrl: string = API_BASE_URL, getAuthToken?: () => Promise<string | null>) {
    this.httpClient = new HttpClient({
      baseUrl,
      getAuthToken,
      timeout: 10000
    });
    
    this.streamingService = StreamingService.create(this.httpClient);
    this.messageService = MessageService.create(this.httpClient);
    
    logger.info(`ChatApiService initialized with composed services`);
  }

  // Thread Operations
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

  async getChat(threadId: string): Promise<ChatThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    logger.info(`Fetching chat thread: ${threadId}`);
    
    const thread = await this.httpClient.get<ChatThread>(`/chats/${threadId}`);
    
    logger.info(`Successfully fetched chat thread: ${threadId}`);
    return thread;
  }

  async deleteChat(threadId: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    logger.info(`Deleting chat thread: ${threadId}`);
    
    await this.httpClient.delete(`/chats/${threadId}`);
    
    logger.info(`Successfully deleted chat thread: ${threadId}`);
  }

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
  async sendMessage(request: CreateMessageRequest): Promise<CreateMessageResponse> {
    return this.messageService.sendMessage(request);
  }

  async getAvailableModels(): Promise<AvailableModelsResponse> {
    return this.messageService.getAvailableModels();
  }

  // Streaming Operations (delegating to StreamingService)
  async sendMessageStream(
    request: CreateMessageRequest,
    onChunk: (chunk: string, fullContent: string) => void,
    onComplete: (response: CreateMessageResponse) => void,
    onError: (error: Error) => void,
    onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void,
    onTokenMetrics?: (metrics: Partial<TokenMetrics>) => void,
    onAnnotationsChunk?: (annotations: any[]) => void,
    onThreadCreated?: (threadId: string) => void,
    onUserMessageConfirmed?: (userMessage: any) => void
  ): Promise<void> {
    const callbacks: StreamingCallbacks = {
      onChunk,
      onComplete,
      onError,
      onReasoningChunk,
      onTokenMetrics,
      onAnnotationsChunk,
      onThreadCreated,
      onUserMessageConfirmed
    };

    return this.streamingService.streamMessage(request, callbacks);
  }
}

// Export factory function and singleton
export const createChatApiService = (getAuthToken?: () => Promise<string | null>) => {
  return new ChatApiService(API_BASE_URL, getAuthToken);
};

// Default singleton instance (for backwards compatibility)
export const chatApiService = new ChatApiService(); 