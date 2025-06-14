/**
 * threadService.ts
 * 
 * Thread management service
 * 
 * Services:
 *   ThreadService
 * 
 * Features:
 *   - Thread CRUD operations
 *   - Efficient pagination
 *   - Pin/unpin functionality
 *   - Title updates
 *   - Batch operations
 * 
 * Usage: import { ThreadService } from './threadService'
 */
import { logger } from '../utils/logger';
import { HttpClient } from './httpClient';
import type { PaginatedResponse } from './types/apiTypes';
import type { 
  ChatThread, 
  ChatMessage,
  GetChatsResponse 
} from '../../../src/shared/types';

/**
 * Thread service for chat thread management
 * 
 * Handles all thread-related operations including CRUD,
 * pagination, pinning, and batch operations.
 */
export class ThreadService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Get all chat threads with efficient pagination
   * 
   * @param limit - Number of threads to fetch (default: 50)
   * @param cursor - Pagination cursor from previous request
   * @param summaryOnly - If true, returns thread summaries without messages
   * @returns Promise with chat threads and pagination info
   */
  async getAllThreadsEfficient(
    limit: number = 50,
    cursor?: string,
    summaryOnly: boolean = false
  ): Promise<PaginatedResponse<ChatThread>> {
    try {
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
    } catch (error) {
      logger.error('Failed to fetch chat threads efficiently', error as Error);
      throw new Error('Failed to load chat history. Please try again.');
    }
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

    try {
      logger.info(`Fetching batch messages for ${threadIds.length} threads`);
      
      const response = await this.httpClient.post<Record<string, ChatMessage[]>>('/chats/batch/messages', {
        threadIds
      });
      
      logger.info(`Successfully fetched batch messages for ${Object.keys(response).length} threads`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch batch messages', error as Error);
      throw new Error('Failed to load thread messages. Please try again.');
    }
  }

  /**
   * Get single chat thread by ID
   * 
   * @param threadId - Thread ID to fetch
   * @returns Promise with chat thread
   */
  async getThread(threadId: string): Promise<ChatThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    try {
      logger.info(`Fetching chat thread: ${threadId}`);
      
      const thread = await this.httpClient.get<ChatThread>(`/chats/${threadId}`);
      
      logger.info(`Successfully fetched chat thread: ${threadId}`);
      return thread;
    } catch (error) {
      logger.error(`Failed to fetch chat thread: ${threadId}`, error as Error);
      throw new Error('Failed to load chat thread. Please try again.');
    }
  }

  /**
   * Delete chat thread
   * 
   * @param threadId - Thread ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteThread(threadId: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    try {
      logger.info(`Deleting chat thread: ${threadId}`);
      
      await this.httpClient.delete(`/chats/${threadId}`);
      
      logger.info(`Successfully deleted chat thread: ${threadId}`);
    } catch (error) {
      logger.error(`Failed to delete chat thread: ${threadId}`, error as Error);
      throw new Error('Failed to delete chat thread. Please try again.');
    }
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

    try {
      logger.info(`Updating thread title: ${threadId} -> "${title}"`);
      
      const updatedThread = await this.httpClient.patch<ChatThread>(`/chats/${threadId}`, {
        title: title.trim()
      });
      
      logger.info(`Successfully updated thread title: ${threadId}`);
      return updatedThread;
    } catch (error) {
      logger.error(`Failed to update thread title: ${threadId}`, error as Error);
      throw new Error('Failed to update chat title. Please try again.');
    }
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

    try {
      logger.info(`${isPinned ? 'Pinning' : 'Unpinning'} thread: ${threadId}`);
      
      const updatedThread = await this.httpClient.patch<ChatThread>(`/chats/${threadId}/pin`, {
        isPinned
      });
      
      logger.info(`Successfully ${isPinned ? 'pinned' : 'unpinned'} thread: ${threadId}`);
      return updatedThread;
    } catch (error) {
      logger.error(`Failed to ${isPinned ? 'pin' : 'unpin'} thread: ${threadId}`, error as Error);
      throw new Error(`Failed to ${isPinned ? 'pin' : 'unpin'} chat thread. Please try again.`);
    }
  }

  /**
   * Batch delete threads
   * 
   * @param threadIds - Array of thread IDs to delete
   * @returns Promise with deletion results
   */
  async batchDeleteThreads(threadIds: string[]): Promise<{
    deleted: string[];
    failed: { threadId: string; error: string }[];
  }> {
    if (!threadIds.length) {
      return { deleted: [], failed: [] };
    }

    try {
      logger.info(`Batch deleting ${threadIds.length} threads`);
      
      const response = await this.httpClient.post<{
        deleted: string[];
        failed: { threadId: string; error: string }[];
      }>('/chats/batch/delete', {
        threadIds
      });
      
      logger.info(`Batch delete completed: ${response.deleted.length} deleted, ${response.failed.length} failed`);
      return response;
    } catch (error) {
      logger.error('Failed to batch delete threads', error as Error);
      throw new Error('Failed to delete selected threads. Please try again.');
    }
  }

  /**
   * Search threads by title or content
   * 
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Promise with matching threads
   */
  async searchThreads(query: string, limit: number = 20): Promise<ChatThread[]> {
    if (!query?.trim()) {
      return [];
    }

    try {
      logger.info(`Searching threads: "${query}"`);
      
      const params: Record<string, string> = {
        q: query.trim(),
        limit: limit.toString(),
      };
      
      const response = await this.httpClient.get<{ threads: ChatThread[] }>('/chats/search', params);
      
      logger.info(`Search completed: found ${response.threads.length} matching threads`);
      return response.threads;
    } catch (error) {
      logger.error('Failed to search threads', error as Error);
      throw new Error('Failed to search chat threads. Please try again.');
    }
  }

  /**
   * Get thread statistics
   * 
   * @returns Promise with thread statistics
   */
  async getThreadStats(): Promise<{
    total: number;
    pinned: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    try {
      logger.info('Fetching thread statistics');
      
      const stats = await this.httpClient.get<{
        total: number;
        pinned: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
      }>('/chats/stats');
      
      logger.info('Successfully fetched thread statistics', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to fetch thread statistics', error as Error);
      throw new Error('Failed to load thread statistics. Please try again.');
    }
  }

  /**
   * Create thread service instance
   * 
   * @param httpClient - HTTP client instance
   * @returns ThreadService instance
   */
  static create(httpClient: HttpClient): ThreadService {
    return new ThreadService(httpClient);
  }
} 