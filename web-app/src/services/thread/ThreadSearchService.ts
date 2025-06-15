/**
 * ThreadSearchService.ts
 * 
 * Search and analytics operations for chat threads
 * 
 * Classes:
 *   ThreadSearchService - Handles thread search and statistics
 * 
 * Features:
 *   - Thread search functionality
 *   - Thread statistics and analytics
 *   - Usage metrics and insights
 * 
 * Usage: import { ThreadSearchService } from './thread/ThreadSearchService'
 */

import { logger } from '../../utils/logger';
import { HttpClient } from '../httpClient';
import type { ChatThread } from '../../../../src/shared/types';

/**
 * Service for thread search and analytics
 * 
 * Provides search capabilities and statistical insights
 * about thread usage and patterns.
 */
export class ThreadSearchService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Search threads by query
   * 
   * @param query - Search query string
   * @param limit - Maximum number of results (default: 20)
   * @returns Promise with matching chat threads
   */
  async searchThreads(query: string, limit: number = 20): Promise<ChatThread[]> {
    if (!query?.trim()) {
      return [];
    }

    try {
      logger.info(`Searching threads with query: "${query}" (limit: ${limit})`);
      
      const response = await this.httpClient.get<{ threads: ChatThread[] }>('/chats/search', {
        q: query.trim(),
        limit: limit.toString()
      });
      
      logger.info(`Found ${response.threads.length} threads matching query: "${query}"`);
      return response.threads;
    } catch (error) {
      logger.error(`Failed to search threads with query: "${query}"`, error as Error);
      throw new Error('Failed to search chat threads. Please try again.');
    }
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
    try {
      logger.info('Fetching thread statistics');
      
      const response = await this.httpClient.get<{
        total: number;
        pinned: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
      }>('/chats/stats');
      
      logger.info(`Thread stats: ${response.total} total, ${response.pinned} pinned`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch thread statistics', error as Error);
      throw new Error('Failed to load thread statistics. Please try again.');
    }
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
    try {
      logger.info('Fetching advanced thread analytics');
      
      const response = await this.httpClient.get<{
        messageCount: number;
        averageMessagesPerThread: number;
        mostActiveDay: string;
        topModelsUsed: Array<{ model: string; count: number }>;
        threadsByMonth: Array<{ month: string; count: number }>;
      }>('/chats/analytics');
      
      logger.info(`Advanced analytics: ${response.messageCount} total messages, ${response.averageMessagesPerThread.toFixed(1)} avg per thread`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch advanced analytics', error as Error);
      throw new Error('Failed to load thread analytics. Please try again.');
    }
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
    try {
      logger.info(`Searching threads from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const response = await this.httpClient.get<{ threads: ChatThread[] }>('/chats/search/date', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: limit.toString()
      });
      
      logger.info(`Found ${response.threads.length} threads in date range`);
      return response.threads;
    } catch (error) {
      logger.error('Failed to search threads by date range', error as Error);
      throw new Error('Failed to search threads by date. Please try again.');
    }
  }

  /**
   * Create factory method for dependency injection
   * 
   * @param httpClient - HTTP client instance
   * @returns ThreadSearchService instance
   */
  static create(httpClient: HttpClient): ThreadSearchService {
    return new ThreadSearchService(httpClient);
  }
} 