/**
 * ThreadBatchService.ts
 * 
 * Batch operations for chat threads
 * 
 * Classes:
 *   ThreadBatchService - Handles batch operations on multiple threads
 * 
 * Features:
 *   - Batch message fetching
 *   - Batch thread deletion
 *   - Efficient pagination
 *   - Error handling for partial failures
 * 
 * Usage: import { ThreadBatchService } from './thread/ThreadBatchService'
 */

import { logger } from '../../utils/logger';
import { HttpClient } from '../httpClient';
import type { PaginatedResponse } from '../types/apiTypes';
import type { 
  ChatThread, 
  ChatMessage,
  GetChatsResponse 
} from '../../../../src/shared/types';

/**
 * Service for batch thread operations
 * 
 * Handles operations that work with multiple threads simultaneously
 * for improved performance and user experience.
 */
export class ThreadBatchService {
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
   * Delete multiple threads in batch
   * 
   * @param threadIds - Array of thread IDs to delete
   * @returns Promise with deletion results (success/failure per thread)
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
      
      logger.info(`Batch deletion completed: ${response.deleted.length} deleted, ${response.failed.length} failed`);
      return response;
    } catch (error) {
      logger.error('Failed to batch delete threads', error as Error);
      throw new Error('Failed to delete chat threads. Please try again.');
    }
  }

  /**
   * Create factory method for dependency injection
   * 
   * @param httpClient - HTTP client instance
   * @returns ThreadBatchService instance
   */
  static create(httpClient: HttpClient): ThreadBatchService {
    return new ThreadBatchService(httpClient);
  }
} 