/**
 * ThreadCrudService.ts
 * 
 * Basic CRUD operations for chat threads
 * 
 * Classes:
 *   ThreadCrudService - Handles create, read, update, delete operations
 * 
 * Features:
 *   - Thread creation and retrieval
 *   - Thread updates (title, pin status)
 *   - Thread deletion
 *   - Input validation and error handling
 * 
 * Usage: import { ThreadCrudService } from './thread/ThreadCrudService'
 */

import { logger } from '../../utils/logger';
import { HttpClient } from '../httpClient';
import type { ChatThread } from '../../../../src/shared/types';

/**
 * Service for basic thread CRUD operations
 * 
 * Handles fundamental create, read, update, and delete operations
 * for chat threads with proper validation and error handling.
 */
export class ThreadCrudService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
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
   * Create factory method for dependency injection
   * 
   * @param httpClient - HTTP client instance
   * @returns ThreadCrudService instance
   */
  static create(httpClient: HttpClient): ThreadCrudService {
    return new ThreadCrudService(httpClient);
  }
} 