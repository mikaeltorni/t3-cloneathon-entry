/**
 * firestoreChatStorage.ts
 * 
 * Firestore-based chat storage service for persistent chat data
 * 
 * Features:
 *   - Firestore database integration
 *   - User-specific chat storage
 *   - Real-time data synchronization
 *   - Thread and message management
 *   - Automatic data persistence
 *   - Authentication-aware storage
 * 
 * Collection Structure:
 *   users/{userId}/chats/{chatId} - Chat threads
 *   users/{userId}/chats/{chatId}/messages/{messageId} - Chat messages
 * 
 * Usage: import { firestoreChatStorage } from './firestoreChatStorage'
 */
import { randomUUID } from 'crypto';
import { db } from './config/firebase-admin';
import type { ChatThread, ChatMessage } from '../shared/types';

/**
 * Firestore chat storage error class
 */
class FirestoreChatStorageError extends Error {
  constructor(message: string, public operation: string, public originalError?: any) {
    super(message);
    this.name = 'FirestoreChatStorageError';
  }
}

/**
 * Chat storage service interface (same as file-based version)
 */
interface ChatStorageService {
  getAllThreads(userId: string): Promise<ChatThread[]>;
  getThread(userId: string, threadId: string): Promise<ChatThread | null>;
  createThread(userId: string, title: string): Promise<ChatThread>;
  deleteThread(userId: string, threadId: string): Promise<boolean>;
  updateThreadTitle(userId: string, threadId: string, title: string): Promise<ChatThread | null>;
  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string, modelId?: string): ChatMessage;
  addMessageToThread(userId: string, threadId: string, message: ChatMessage): Promise<void>;
}

/**
 * Firestore chat storage service implementation
 */
class FirestoreChatStorageService implements ChatStorageService {
  private readonly COLLECTION_NAME = 'users';

  constructor() {
    console.log('[Firestore] Initializing Firestore chat storage service');
  }

  /**
   * Get user's chat collection reference
   */
  private getUserChatsCollection(userId: string) {
    return db.collection(this.COLLECTION_NAME).doc(userId).collection('chats');
  }

  /**
   * Get chat messages subcollection reference
   */
  private getChatMessagesCollection(userId: string, chatId: string) {
    return this.getUserChatsCollection(userId).doc(chatId).collection('messages');
  }

  /**
   * Convert Firestore document to ChatThread
   */
  private documentToChatThread(doc: FirebaseFirestore.DocumentSnapshot): ChatThread | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    return {
      id: doc.id,
      title: data.title || 'Untitled Chat',
      messages: data.messages || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Convert Firestore document to ChatMessage
   */
  private documentToChatMessage(doc: FirebaseFirestore.DocumentSnapshot): ChatMessage | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    return {
      id: doc.id,
      role: data.role,
      content: data.content || '',
      timestamp: data.timestamp?.toDate() || new Date(),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.modelId && { modelId: data.modelId }),
    };
  }

  /**
   * Get all chat threads for a user
   * 
   * @param userId - User ID
   * @returns Array of chat threads sorted by update time (newest first)
   */
  async getAllThreads(userId: string): Promise<ChatThread[]> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      console.log(`[Firestore] Getting all threads for user: ${userId}`);

      const snapshot = await this.getUserChatsCollection(userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const threads: ChatThread[] = [];

      for (const doc of snapshot.docs) {
        const threadData = this.documentToChatThread(doc);
        if (threadData) {
          // Get messages for this thread
          const messagesSnapshot = await this.getChatMessagesCollection(userId, doc.id)
            .orderBy('timestamp', 'asc')
            .get();

          const messages: ChatMessage[] = [];
          messagesSnapshot.docs.forEach(messageDoc => {
            const message = this.documentToChatMessage(messageDoc);
            if (message) {
              messages.push(message);
            }
          });

          threadData.messages = messages;
          threads.push(threadData);
        }
      }

      console.log(`[Firestore] Retrieved ${threads.length} threads for user: ${userId}`);
      return threads;
    } catch (error) {
      console.error(`[Firestore] Error getting threads for user ${userId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to get all threads: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getAllThreads',
        error
      );
    }
  }

  /**
   * Get specific thread by ID
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to get
   * @returns Thread data or null if not found
   */
  async getThread(userId: string, threadId: string): Promise<ChatThread | null> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      console.log(`[Firestore] Getting thread ${threadId} for user: ${userId}`);

      const doc = await this.getUserChatsCollection(userId).doc(threadId).get();
      const thread = this.documentToChatThread(doc);

      if (thread) {
        // Get messages for this thread
        const messagesSnapshot = await this.getChatMessagesCollection(userId, threadId)
          .orderBy('timestamp', 'asc')
          .get();

        const messages: ChatMessage[] = [];
        messagesSnapshot.docs.forEach(messageDoc => {
          const message = this.documentToChatMessage(messageDoc);
          if (message) {
            messages.push(message);
          }
        });

        thread.messages = messages;
        console.log(`[Firestore] Retrieved thread: ${thread.title} (${thread.messages.length} messages)`);
      } else {
        console.log(`[Firestore] Thread not found: ${threadId}`);
      }

      return thread;
    } catch (error) {
      console.error(`[Firestore] Error getting thread ${threadId} for user ${userId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to get thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getThread',
        error
      );
    }
  }

  /**
   * Create new chat thread
   * 
   * @param userId - User ID
   * @param title - Title for the new thread
   * @returns Created thread data
   */
  async createThread(userId: string, title: string): Promise<ChatThread> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!title?.trim()) {
        throw new Error('Thread title is required');
      }

      const threadId = randomUUID();
      const now = new Date();

      const thread: ChatThread = {
        id: threadId,
        title: title.trim(),
        messages: [],
        createdAt: now,
        updatedAt: now,
      };

      console.log(`[Firestore] Creating new thread: ${thread.title} (${threadId}) for user: ${userId}`);

      // Create thread document
      await this.getUserChatsCollection(userId).doc(threadId).set({
        title: thread.title,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`[Firestore] Created new thread: ${thread.title} (${threadId})`);
      return thread;
    } catch (error) {
      console.error(`[Firestore] Error creating thread for user ${userId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'createThread',
        error
      );
    }
  }

  /**
   * Delete chat thread
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to delete
   * @returns True if deleted, false if not found
   */
  async deleteThread(userId: string, threadId: string): Promise<boolean> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      console.log(`[Firestore] Deleting thread ${threadId} for user: ${userId}`);

      // First, delete all messages in the thread
      const messagesSnapshot = await this.getChatMessagesCollection(userId, threadId).get();
      const batch = db.batch();

      messagesSnapshot.docs.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });

      // Delete the thread document
      const threadRef = this.getUserChatsCollection(userId).doc(threadId);
      const threadDoc = await threadRef.get();

      if (!threadDoc.exists) {
        console.log(`[Firestore] Thread not found for deletion: ${threadId}`);
        return false;
      }

      batch.delete(threadRef);

      // Commit the batch
      await batch.commit();

      console.log(`[Firestore] Deleted thread: ${threadId} (including ${messagesSnapshot.size} messages)`);
      return true;
    } catch (error) {
      console.error(`[Firestore] Error deleting thread ${threadId} for user ${userId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to delete thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deleteThread',
        error
      );
    }
  }

  /**
   * Update thread title
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to update
   * @param title - New title
   * @returns Updated thread data or null if not found
   */
  async updateThreadTitle(userId: string, threadId: string, title: string): Promise<ChatThread | null> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      if (!title?.trim()) {
        throw new Error('Thread title is required');
      }

      console.log(`[Firestore] Updating title for thread ${threadId} for user: ${userId}`);

      const threadRef = this.getUserChatsCollection(userId).doc(threadId);
      const threadDoc = await threadRef.get();

      if (!threadDoc.exists) {
        console.log(`[Firestore] Thread not found for title update: ${threadId}`);
        return null;
      }

      const now = new Date();
      await threadRef.update({
        title: title.trim(),
        updatedAt: now,
      });

      // Get the updated thread with messages
      const updatedThread = await this.getThread(userId, threadId);

      if (updatedThread) {
        console.log(`[Firestore] Updated thread title: "${updatedThread.title}"`);
      }

      return updatedThread;
    } catch (error) {
      console.error(`[Firestore] Error updating thread title for ${threadId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to update thread title: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateThreadTitle',
        error
      );
    }
  }

  /**
   * Create new message (local operation, same as file-based version)
   * 
   * @param content - Message content
   * @param role - Message role (user or assistant)
   * @param imageUrl - Optional image URL
   * @param modelId - Optional AI model identifier
   * @returns Created message data
   */
  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string, modelId?: string): ChatMessage {
    try {
      if (!content?.trim() && !imageUrl?.trim()) {
        throw new Error('Message must have content or image URL');
      }

      if (!role || !['user', 'assistant'].includes(role)) {
        throw new Error('Invalid message role');
      }

      const message: ChatMessage = {
        id: randomUUID(),
        role,
        content: content?.trim() || '',
        timestamp: new Date(),
        ...(imageUrl?.trim() && { imageUrl: imageUrl.trim() }),
        ...(modelId?.trim() && { modelId: modelId.trim() })
      };

      console.log(`[Firestore] Created ${role} message (${message.content.length} characters)${imageUrl ? ' with image' : ''}`);
      return message;
    } catch (error) {
      throw new FirestoreChatStorageError(
        `Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'createMessage',
        error
      );
    }
  }

  /**
   * Add message to thread
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to add message to
   * @param message - Message to add
   */
  async addMessageToThread(userId: string, threadId: string, message: ChatMessage): Promise<void> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      if (!message?.content?.trim() && !message?.imageUrl?.trim()) {
        throw new Error('Message must have content or image URL');
      }

      console.log(`[Firestore] Adding ${message.role} message to thread ${threadId} for user: ${userId}`);

      // Add message to messages subcollection
      await this.getChatMessagesCollection(userId, threadId).doc(message.id).set({
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        ...(message.imageUrl && { imageUrl: message.imageUrl }),
        ...(message.modelId && { modelId: message.modelId }),
      });

      // Update thread's updatedAt timestamp
      await this.getUserChatsCollection(userId).doc(threadId).update({
        updatedAt: new Date(),
      });

      console.log(`[Firestore] Added ${message.role} message to thread: ${threadId}`);
    } catch (error) {
      console.error(`[Firestore] Error adding message to thread ${threadId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to add message to thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'addMessageToThread',
        error
      );
    }
  }
}

// Export singleton instance
export const firestoreChatStorage: ChatStorageService = new FirestoreChatStorageService(); 