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
  GetChatsResponse 
} from '../../../src/shared/types';

// Base API URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
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

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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
    if (!request.content?.trim() && !request.imageUrl?.trim()) {
      throw new Error('Message content or image URL is required');
    }

    try {
      logger.info('Sending message to chat', {
        threadId: request.threadId || 'new',
        hasContent: !!request.content,
        hasImage: !!request.imageUrl
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
}

// Export singleton instance
export const chatApiService = new ChatApiService(); 