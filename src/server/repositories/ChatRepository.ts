/**
 * ChatRepository.ts
 * 
 * Repository pattern for chat data access
 * Abstracts storage implementation to support future database integration
 * 
 * Repository:
 *   ChatRepository
 * 
 * Features:
 *   - Abstract interface for chat data operations
 *   - Support for both file-based and database storage
 *   - Consistent API for all chat operations
 *   - Easy switching between storage backends
 * 
 * Usage: const chatRepo = new ChatRepository(storageProvider);
 */
import { chatStorage } from '../chatStorage';
import type { ChatThread, ChatMessage } from '../../shared/types';

/**
 * Interface for chat storage operations
 * This can be implemented by file storage, database, or any other storage backend
 */
export interface IChatStorageProvider {
  getAllThreads(): ChatThread[];
  getThread(threadId: string): ChatThread | null;
  createThread(title: string): ChatThread;
  deleteThread(threadId: string): boolean;
  updateThreadTitle(threadId: string, title: string): ChatThread | null;
  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string, modelId?: string): ChatMessage;
  addMessageToThread(threadId: string, message: ChatMessage): void;
}

/**
 * File-based storage provider
 * Wraps the existing chatStorage for consistency
 */
class FileStorageProvider implements IChatStorageProvider {
  getAllThreads(): ChatThread[] {
    return chatStorage.getAllThreads();
  }

  getThread(threadId: string): ChatThread | null {
    return chatStorage.getThread(threadId);
  }

  createThread(title: string): ChatThread {
    return chatStorage.createThread(title);
  }

  deleteThread(threadId: string): boolean {
    return chatStorage.deleteThread(threadId);
  }

  updateThreadTitle(threadId: string, title: string): ChatThread | null {
    return chatStorage.updateThreadTitle(threadId, title);
  }

  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string, modelId?: string): ChatMessage {
    return chatStorage.createMessage(content, role, imageUrl, modelId);
  }

  addMessageToThread(threadId: string, message: ChatMessage): void {
    chatStorage.addMessageToThread(threadId, message);
  }
}

/**
 * Chat repository implementing the repository pattern
 * 
 * Provides a clean interface for chat operations while abstracting
 * the underlying storage mechanism. This makes it easy to switch
 * from file storage to database storage in the future.
 */
export class ChatRepository {
  private storageProvider: IChatStorageProvider;

  constructor(storageProvider?: IChatStorageProvider) {
    // Default to file storage, but allow injection of other providers
    this.storageProvider = storageProvider || new FileStorageProvider();
  }

  /**
   * Get all chat threads for the current user
   * 
   * @returns Array of chat threads
   */
  async getAllThreads(): Promise<ChatThread[]> {
    try {
      return this.storageProvider.getAllThreads();
    } catch (error) {
      console.error('[ChatRepository] Error getting all threads:', error);
      throw new Error('Failed to retrieve chat threads');
    }
  }

  /**
   * Get a specific chat thread by ID
   * 
   * @param threadId - Thread identifier
   * @returns Chat thread or null if not found
   */
  async getThread(threadId: string): Promise<ChatThread | null> {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }
      return this.storageProvider.getThread(threadId);
    } catch (error) {
      console.error(`[ChatRepository] Error getting thread ${threadId}:`, error);
      throw new Error('Failed to retrieve chat thread');
    }
  }

  /**
   * Create a new chat thread
   * 
   * @param title - Thread title
   * @returns Created thread
   */
  async createThread(title: string): Promise<ChatThread> {
    try {
      if (!title?.trim()) {
        throw new Error('Title is required');
      }
      const thread = this.storageProvider.createThread(title.trim());
      console.log(`[ChatRepository] Successfully created thread: ${thread.id}`);
      return thread;
    } catch (error) {
      console.error('[ChatRepository] Error creating thread:', error);
      throw new Error('Failed to create chat thread');
    }
  }

  /**
   * Delete a chat thread
   * 
   * @param threadId - Thread identifier
   * @returns True if deleted, false if not found
   */
  async deleteThread(threadId: string): Promise<boolean> {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }
      const deleted = this.storageProvider.deleteThread(threadId);
      if (deleted) {
        console.log(`[ChatRepository] Successfully deleted thread: ${threadId}`);
      }
      return deleted;
    } catch (error) {
      console.error(`[ChatRepository] Error deleting thread ${threadId}:`, error);
      throw new Error('Failed to delete chat thread');
    }
  }

  /**
   * Update a thread's title
   * 
   * @param threadId - Thread identifier
   * @param title - New title
   * @returns Updated thread or null if not found
   */
  async updateThreadTitle(threadId: string, title: string): Promise<ChatThread | null> {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }
      if (!title?.trim()) {
        throw new Error('Title is required');
      }
      const updatedThread = this.storageProvider.updateThreadTitle(threadId, title.trim());
      if (updatedThread) {
        console.log(`[ChatRepository] Successfully updated thread title: ${threadId}`);
      }
      return updatedThread;
    } catch (error) {
      console.error(`[ChatRepository] Error updating thread title ${threadId}:`, error);
      throw new Error('Failed to update thread title');
    }
  }

  /**
   * Create a new message
   * 
   * @param content - Message content
   * @param role - Message role (user or assistant)
   * @param imageUrl - Optional image URL
   * @param modelId - Optional model ID for assistant messages
   * @returns Created message
   */
  async createMessage(
    content: string, 
    role: 'user' | 'assistant', 
    imageUrl?: string, 
    modelId?: string
  ): Promise<ChatMessage> {
    try {
      if (!content?.trim()) {
        throw new Error('Message content is required');
      }
      const message = this.storageProvider.createMessage(content.trim(), role, imageUrl, modelId);
      console.log(`[ChatRepository] Successfully created ${role} message`);
      return message;
    } catch (error) {
      console.error('[ChatRepository] Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  /**
   * Add a message to a thread
   * 
   * @param threadId - Thread identifier
   * @param message - Message to add
   */
  async addMessageToThread(threadId: string, message: ChatMessage): Promise<void> {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }
      if (!message) {
        throw new Error('Message is required');
      }
      
      this.storageProvider.addMessageToThread(threadId, message);
      console.log(`[ChatRepository] Successfully added message to thread: ${threadId}`);
    } catch (error) {
      console.error(`[ChatRepository] Error adding message to thread ${threadId}:`, error);
      throw new Error('Failed to add message to thread');
    }
  }

  /**
   * Send a complete message (create user message, add to thread, and get AI response)
   * This is a convenience method that combines multiple operations
   * 
   * @param threadId - Thread identifier
   * @param content - User message content
   * @param imageUrl - Optional image URL
   * @returns User message that was created and added
   */
  async sendMessage(threadId: string, content: string, imageUrl?: string): Promise<ChatMessage> {
    try {
      // Create user message
      const userMessage = await this.createMessage(content, 'user', imageUrl);
      
      // Add to thread
      await this.addMessageToThread(threadId, userMessage);
      
      return userMessage;
    } catch (error) {
      console.error(`[ChatRepository] Error sending message to thread ${threadId}:`, error);
      throw new Error('Failed to send message');
    }
  }
}

// Export default instance for use throughout the application
export const chatRepository = new ChatRepository(); 