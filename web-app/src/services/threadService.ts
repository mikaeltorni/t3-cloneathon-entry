/**
 * threadService.ts
 * 
 * Refactored thread management service using service composition
 * 
 * Classes:
 *   ThreadService - Main orchestrator service
 * 
 * Features:
 *   - Service composition following single responsibility principle
 *   - CRUD operations via ThreadCrudService
 *   - Batch operations via ThreadBatchService
 *   - Search and analytics via ThreadSearchService
 *   - Backwards compatibility with original API
 * 
 * Usage: import { ThreadService } from './threadService'
 */

import { logger } from '../utils/logger';
import { HttpClient } from './httpClient';
import type { PaginatedResponse } from './types/apiTypes';
import type { 
  ChatThread, 
  ChatMessage
} from '../../../src/shared/types';

// Import extracted thread services
import { 
  ThreadCrudService,
  ThreadBatchService,
  ThreadSearchService
} from './thread';

/**
 * Refactored thread service using focused service composition
 * 
 * Orchestrates thread operations across multiple specialized services
 * for better maintainability and single responsibility.
 */
export class ThreadService {
  private crudService: ThreadCrudService;
  private batchService: ThreadBatchService;
  private searchService: ThreadSearchService;

  constructor(httpClient: HttpClient) {
    this.crudService = new ThreadCrudService(httpClient);
    this.batchService = new ThreadBatchService(httpClient);
    this.searchService = new ThreadSearchService(httpClient);
    
    logger.info('ThreadService initialized with focused service composition');
  }

  // CRUD Operations (delegated to ThreadCrudService)

  /**
   * Get single chat thread by ID
   * 
   * @param threadId - Thread ID to fetch
   * @returns Promise with chat thread
   */
  async getThread(threadId: string): Promise<ChatThread> {
    return this.crudService.getThread(threadId);
  }

  /**
   * Delete chat thread
   * 
   * @param threadId - Thread ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteThread(threadId: string): Promise<void> {
    return this.crudService.deleteThread(threadId);
  }

  /**
   * Update thread title
   * 
   * @param threadId - Thread ID to update
   * @param title - New thread title
   * @returns Promise with updated chat thread
   */
  async updateThreadTitle(threadId: string, title: string): Promise<ChatThread> {
    return this.crudService.updateThreadTitle(threadId, title);
  }

  /**
   * Toggle thread pin status
   * 
   * @param threadId - Thread ID to pin/unpin
   * @param isPinned - Pin status to set
   * @returns Promise with updated chat thread
   */
  async toggleThreadPin(threadId: string, isPinned: boolean): Promise<ChatThread> {
    return this.crudService.toggleThreadPin(threadId, isPinned);
  }

  // Batch Operations (delegated to ThreadBatchService)

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
    return this.batchService.getAllThreadsEfficient(limit, cursor, summaryOnly);
  }

  /**
   * Get messages for multiple threads in batch
   * 
   * @param threadIds - Array of thread IDs to fetch messages for
   * @returns Promise with thread ID to messages mapping
   */
  async getBatchMessages(threadIds: string[]): Promise<Record<string, ChatMessage[]>> {
    return this.batchService.getBatchMessages(threadIds);
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
    return this.batchService.batchDeleteThreads(threadIds);
  }

  // Search and Analytics Operations (delegated to ThreadSearchService)

  /**
   * Search threads by query
   * 
   * @param query - Search query string
   * @param limit - Maximum number of results (default: 20)
   * @returns Promise with matching chat threads
   */
  async searchThreads(query: string, limit: number = 20): Promise<ChatThread[]> {
    return this.searchService.searchThreads(query, limit);
  }

  /**
   * Get thread statistics and analytics
   * 
   * @returns Promise with thread usage statistics
   */
  async getThreadStats(): Promise<{
    total: number;
    pinned: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    return this.searchService.getThreadStats();
  }

  /**
   * Get advanced thread analytics
   * 
   * @returns Promise with detailed analytics data
   */
  async getAdvancedAnalytics(): Promise<{
    messageCount: number;
    averageMessagesPerThread: number;
    mostActiveDay: string;
    topModelsUsed: Array<{ model: string; count: number }>;
    threadsByMonth: Array<{ month: string; count: number }>;
  }> {
    return this.searchService.getAdvancedAnalytics();
  }

  /**
   * Search threads by date range
   * 
   * @param startDate - Start date for search
   * @param endDate - End date for search
   * @param limit - Maximum number of results
   * @returns Promise with threads in date range
   */
  async searchThreadsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 50
  ): Promise<ChatThread[]> {
    return this.searchService.searchThreadsByDateRange(startDate, endDate, limit);
  }

  /**
   * Create factory method for dependency injection
   * 
   * @param httpClient - HTTP client instance
   * @returns ThreadService instance
   */
  static create(httpClient: HttpClient): ThreadService {
    return new ThreadService(httpClient);
  }
} 