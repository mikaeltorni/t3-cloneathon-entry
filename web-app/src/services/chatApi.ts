/**
 * chatApi.ts
 * 
 * HTTP client for chat API communication
 * 
 * Functions:
 *   chatApiService - Main API service with error handling and logging
 * 
 * Features:
 *   - Centralized API error handling
 *   - Request/response logging
 *   - Type-safe API calls
 *   - Automatic error transformation
 * 
 * Usage: import { chatApiService } from './services/chatApi'
 */
import { logger } from '../utils/logger';
import type { 
  ChatThread, 
  CreateMessageRequest, 
  CreateMessageResponse, 
  GetChatsResponse,
  AvailableModelsResponse 
} from '../../../src/shared/types';

// Base API URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API Error class for structured error handling
 */
class ApiError extends Error {
  public status: number;
  public statusText: string;

  constructor(
    status: number,
    statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * HTTP client utility with error handling and logging
 */
class ChatApiService {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null>;

  constructor(baseUrl: string = API_BASE_URL, getAuthToken?: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
    logger.info(`ChatApiService initialized with base URL: ${baseUrl}`);
  }

  /**
   * Make HTTP request with error handling and logging
   * 
   * @param endpoint - API endpoint
   * @param options - Fetch options
   * @returns Promise with response data
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      logger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`);

      // Get auth token if available
      const authToken = this.getAuthToken ? await this.getAuthToken() : null;
      
      // Debug logging for auth token
      if (authToken) {
        logger.debug(`Auth token obtained: ${authToken.substring(0, 20)}...`);
      } else {
        logger.warn('No auth token available for request', {
          hasGetAuthToken: !!this.getAuthToken,
          endpoint,
          method: options.method || 'GET'
        });
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      // Add authorization header if token is available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      const duration = Date.now() - startTime;
      logger.debug(`API Response: ${response.status} ${endpoint} (${duration}ms)`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }

        throw new ApiError(response.status, response.statusText, errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`API Request failed: ${options.method || 'GET'} ${endpoint}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new Error(
        error instanceof Error 
          ? `Network error: ${error.message}` 
          : 'Unknown API error occurred'
      );
    }
  }

  /**
   * Get all chat threads
   * 
   * @returns Promise with array of chat threads
   */
  async getAllChats(): Promise<ChatThread[]> {
    try {
      logger.info('Fetching all chat threads');
      const response = await this.makeRequest<GetChatsResponse>('/chats');
      logger.info(`Successfully fetched ${response.threads.length} chat threads`);
      return response.threads;
    } catch (error) {
      logger.error('Failed to fetch chat threads', error as Error);
      throw new Error('Failed to load chat history. Please try again.');
    }
  }

  /**
   * Get specific chat thread by ID
   * 
   * @param threadId - ID of the thread to fetch
   * @returns Promise with chat thread data
   */
  async getChat(threadId: string): Promise<ChatThread> {
    if (!threadId.trim()) {
      throw new Error('Thread ID is required');
    }

    try {
      logger.info(`Fetching chat thread: ${threadId}`);
      const thread = await this.makeRequest<ChatThread>(`/chats/${threadId}`);
      logger.info(`Successfully fetched chat thread: ${thread.title}`);
      return thread;
    } catch (error) {
      logger.error(`Failed to fetch chat thread: ${threadId}`, error as Error);
      
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('Chat thread not found');
      }
      
      throw new Error('Failed to load chat thread. Please try again.');
    }
  }

  /**
   * Send a new message to a chat thread
   * 
   * @param request - Message request data
   * @returns Promise with message response
   */
  async sendMessage(request: CreateMessageRequest): Promise<CreateMessageResponse> {
    if (!request.content?.trim() && !request.imageUrl?.trim() && (!request.images || request.images.length === 0)) {
      throw new Error('Message content or image URL is required');
    }

    try {
      logger.info('Sending message to chat', {
        threadId: request.threadId || 'new',
        hasContent: !!request.content,
        hasImage: !!request.imageUrl,
        hasImages: !!(request.images && request.images.length > 0),
        imageCount: request.images?.length || 0
      });

      const response = await this.makeRequest<CreateMessageResponse>('/chats/message', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      logger.info(`Message sent successfully to thread: ${response.threadId}`);
      return response;
    } catch (error) {
      logger.error('Failed to send message', error as Error);
      
      if (error instanceof ApiError) {
        // Pass through API errors with their specific messages
        throw error;
      }
      
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Delete a chat thread
   * 
   * @param threadId - ID of the thread to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteChat(threadId: string): Promise<void> {
    if (!threadId.trim()) {
      throw new Error('Thread ID is required');
    }

    try {
      logger.info(`Deleting chat thread: ${threadId}`);
      
      await this.makeRequest(`/chats/${threadId}`, {
        method: 'DELETE',
      });

      logger.info(`Successfully deleted chat thread: ${threadId}`);
    } catch (error) {
      logger.error(`Failed to delete chat thread: ${threadId}`, error as Error);
      
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('Chat thread not found');
      }
      
      throw new Error('Failed to delete chat thread. Please try again.');
    }
  }

  /**
   * Update chat thread title
   * 
   * @param threadId - ID of the thread to update
   * @param title - New title for the thread
   * @returns Promise with updated thread data
   */
  async updateThreadTitle(threadId: string, title: string): Promise<ChatThread> {
    if (!threadId.trim()) {
      throw new Error('Thread ID is required');
    }

    if (!title.trim()) {
      throw new Error('Thread title is required');
    }

    try {
      logger.info(`Updating thread title: ${threadId}`);
      
      const thread = await this.makeRequest<ChatThread>(`/chats/${threadId}/title`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.trim() }),
      });

      logger.info(`Successfully updated thread title: ${thread.title}`);
      return thread;
    } catch (error) {
      logger.error(`Failed to update thread title: ${threadId}`, error as Error);
      
      if (error instanceof ApiError && error.status === 404) {
        throw new Error('Chat thread not found');
      }
      
      throw new Error('Failed to update thread title. Please try again.');
    }
  }

  /**
   * Get available AI models
   * 
   * @returns Promise with available models configuration
   */
  async getAvailableModels(): Promise<AvailableModelsResponse> {
    try {
      logger.info('Fetching available AI models');
      const response = await this.makeRequest<AvailableModelsResponse>('/models');
      logger.info(`Successfully fetched ${Object.keys(response.models).length} available models`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch available models', error as Error);
      throw new Error('Failed to load available AI models. Please try again.');
    }
  }

  /**
   * Check API health/connectivity
   * 
   * @returns Promise that resolves if API is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      logger.debug('Checking API health');
      
      // Try to fetch threads as a health check
      await this.getAllChats();
      
      logger.info('API health check passed');
      return true;
    } catch (error) {
      logger.warn('API health check failed', error as Error);
      return false;
    }
  }

  /**
   * Send a new message to a chat thread with streaming response
   * 
   * @param request - Message request data
   * @param onChunk - Callback for each response chunk
   * @param onComplete - Callback when streaming is complete
   * @param onError - Callback for errors
   * @param onReasoningChunk - Optional callback for reasoning chunks
   * @returns Promise that resolves when streaming starts
   */
  async sendMessageStream(
    request: CreateMessageRequest,
    onChunk: (chunk: string, fullContent: string) => void,
    onComplete: (response: CreateMessageResponse) => void,
    onError: (error: Error) => void,
    onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void
  ): Promise<void> {
    if (!request.content?.trim() && !request.imageUrl?.trim() && (!request.images || request.images.length === 0)) {
      throw new Error('Message content or image URL is required');
    }

    try {
      logger.info('Starting streaming message to chat', {
        threadId: request.threadId || 'new',
        hasContent: !!request.content,
        hasImage: !!request.imageUrl,
        hasImages: !!(request.images && request.images.length > 0),
        imageCount: request.images?.length || 0
      });

      const url = `${this.baseUrl}/chats/message/stream`;
      
      // Get auth token if available
      const authToken = this.getAuthToken ? await this.getAuthToken() : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token is available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new ApiError(response.status, response.statusText, errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let threadId: string | null = null;
      let userMessage: any = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          logger.info('Streaming completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              switch (parsed.type) {
                case 'thread_info':
                  threadId = parsed.threadId;
                  logger.debug(`Stream using thread: ${threadId}`);
                  break;
                  
                case 'user_message':
                  userMessage = parsed.message;
                  logger.debug('User message confirmed', { 
                    messageId: userMessage.id, 
                    imageCount: userMessage.imageCount 
                  });
                  break;
                  
                case 'ai_start':
                  logger.debug('AI response started');
                  break;
                  
                case 'reasoning_chunk':
                  if (onReasoningChunk) {
                    onReasoningChunk(parsed.content, parsed.fullReasoning);
                  }
                  break;
                  
                case 'ai_chunk':
                  onChunk(parsed.content, parsed.fullContent);
                  break;
                  
                case 'ai_complete':
                  const completeResponse: CreateMessageResponse = {
                    threadId: threadId!,
                    message: userMessage,
                    assistantResponse: parsed.assistantMessage
                  };
                  onComplete(completeResponse);
                  logger.info(`Streaming message completed for thread: ${threadId}`);
                  break;
                  
                case 'error':
                  onError(new Error(parsed.error));
                  return;
              }
            } catch (parseError) {
              logger.warn('Failed to parse streaming chunk:', data);
            }
          }
        }
      }

    } catch (error) {
      logger.error('Failed to stream message', error as Error);
      onError(
        error instanceof Error 
          ? error 
          : new Error('Failed to stream message. Please try again.')
      );
    }
  }
}

// Export factory function and singleton
export const createChatApiService = (getAuthToken?: () => Promise<string | null>) => {
  return new ChatApiService(API_BASE_URL, getAuthToken);
};

// Default singleton instance (for backwards compatibility)
export const chatApiService = new ChatApiService(); 