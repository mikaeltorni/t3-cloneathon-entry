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
import { DEFAULT_MODEL } from '../shared/modelConfig';

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
 * Sanitize image attachments for Firestore storage
 * Removes any non-serializable properties that might cause "invalid nested entity" errors
 * 
 * @param images - Array of image attachments
 * @returns Sanitized array of image attachments
 */
function sanitizeImageAttachments(images: any[]): any[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map(image => {
    if (!image || typeof image !== 'object') {
      return null;
    }

    // Only keep the basic required properties for ImageAttachment
    const sanitized: any = {};
    
    // Copy only known safe properties
    if (typeof image.id === 'string') sanitized.id = image.id;
    if (typeof image.url === 'string') sanitized.url = image.url;
    if (typeof image.name === 'string') sanitized.name = image.name;
    if (typeof image.size === 'number') sanitized.size = image.size;
    if (typeof image.type === 'string') sanitized.type = image.type;

    // Ensure all required properties are present
    if (!sanitized.id || !sanitized.url || !sanitized.name || 
        typeof sanitized.size !== 'number' || !sanitized.type) {
      console.warn('[Firestore] Skipping invalid image attachment:', image);
      return null;
    }

    return sanitized;
  }).filter(image => image !== null); // Remove any null entries
}

/**
 * Sanitize document attachments for Firestore storage
 * Removes any non-serializable properties that might cause "invalid nested entity" errors
 * 
 * @param documents - Array of document attachments
 * @returns Sanitized array of document attachments
 */
function sanitizeDocumentAttachments(documents: any[]): any[] {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents.map(doc => {
    if (!doc || typeof doc !== 'object') {
      return null;
    }

    // Only keep the basic required properties for DocumentAttachment
    const sanitized: any = {};
    
    // Copy only known safe properties
    if (typeof doc.id === 'string') sanitized.id = doc.id;
    if (typeof doc.url === 'string') sanitized.url = doc.url;
    if (typeof doc.name === 'string') sanitized.name = doc.name;
    if (typeof doc.size === 'number') sanitized.size = doc.size;
    if (typeof doc.type === 'string') sanitized.type = doc.type;
    if (typeof doc.content === 'string') sanitized.content = doc.content;
    if (typeof doc.category === 'string') sanitized.category = doc.category;

    // Ensure all required properties are present
    if (!sanitized.id || !sanitized.url || !sanitized.name || 
        typeof sanitized.size !== 'number' || !sanitized.type || 
        !sanitized.content || !sanitized.category) {
      console.warn('[Firestore] Skipping invalid document attachment:', doc);
      return null;
    }

    return sanitized;
  }).filter(doc => doc !== null); // Remove any null entries
}

/**
 * Chat storage service interface (enhanced with efficient batch operations)
 */
interface ChatStorageService {
  getAllThreads(userId: string): Promise<ChatThread[]>;
  getAllThreadsEfficient(userId: string, limit?: number, startAfter?: FirebaseFirestore.DocumentSnapshot): Promise<{
    threads: ChatThread[];
    hasMore: boolean;
    lastVisible?: FirebaseFirestore.DocumentSnapshot;
    totalCount?: number;
  }>;
  getThreadSummaries(userId: string, limit?: number, startAfter?: FirebaseFirestore.DocumentSnapshot): Promise<{
    threads: Omit<ChatThread, 'messages'>[];
    hasMore: boolean;
    lastVisible?: FirebaseFirestore.DocumentSnapshot;
  }>;
  getBatchMessages(userId: string, threadIds: string[]): Promise<Map<string, ChatMessage[]>>;
  getThread(userId: string, threadId: string): Promise<ChatThread | null>;
  createThread(userId: string, title: string, currentModel?: string): Promise<ChatThread>;
  deleteThread(userId: string, threadId: string): Promise<boolean>;
  updateThreadTitle(userId: string, threadId: string, title: string): Promise<ChatThread | null>;
  updateThreadPin(userId: string, threadId: string, isPinned: boolean): Promise<ChatThread | null>;
  updateThreadTags(userId: string, threadId: string, tags: string[]): Promise<ChatThread | null>;
  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string, modelId?: string): ChatMessage;
  addMessageToThread(userId: string, threadId: string, message: ChatMessage): Promise<void>;
  updateThreadModel(userId: string, threadId: string, currentModel: string): Promise<ChatThread | null>;
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
      currentModel: data.currentModel || undefined,
      lastUsedModel: data.lastUsedModel || undefined,
      isPinned: data.isPinned || false,
      tags: data.tags || undefined,
    };
  }

  /**
   * Convert Firestore document to ChatMessage
   * 
   * Note: Includes reasoning field for AI models that provide reasoning tokens
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
      ...(data.reasoning && { reasoning: data.reasoning }), // Reasoning tokens from AI models
      ...(data.images && { images: data.images }), // Multiple image attachments
      ...(data.documents && { documents: data.documents }), // Multiple document attachments
    };
  }

  /**
   * Get all chat threads for a user (EFFICIENT VERSION)
   * 
   * Uses batch operations and pagination to minimize Firebase rate limits
   * 
   * @param userId - User ID
   * @param limit - Max threads to retrieve (default: 50)
   * @param startAfter - Pagination cursor (optional)
   * @returns Array of chat threads with pagination info
   */
  async getAllThreadsEfficient(
    userId: string, 
    limit: number = 50, 
    startAfter?: FirebaseFirestore.DocumentSnapshot
  ): Promise<{
    threads: ChatThread[];
    hasMore: boolean;
    lastVisible?: FirebaseFirestore.DocumentSnapshot;
    totalCount?: number;
  }> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      console.log(`[Firestore] Getting threads (efficient) for user: ${userId}, limit: ${limit}`);

      // Build query with pagination
      let query = this.getUserChatsCollection(userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit);

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      const snapshot = await query.get();
      const threads: ChatThread[] = [];
      const threadIds: string[] = [];

      // First, collect all thread data and IDs
      for (const doc of snapshot.docs) {
        const threadData = this.documentToChatThread(doc);
        if (threadData) {
          threads.push(threadData);
          threadIds.push(doc.id);
        }
      }

      // Batch retrieve all messages for all threads in parallel
      if (threadIds.length > 0) {
        console.log(`[Firestore] Batch loading messages for ${threadIds.length} threads`);
        
        const messagePromises = threadIds.map(async (threadId, index) => {
          try {
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

            // Update the corresponding thread with its messages
            threads[index].messages = messages;
            return messages.length;
          } catch (error) {
            console.error(`[Firestore] Error loading messages for thread ${threadId}:`, error);
            threads[index].messages = []; // Set empty messages on error
            return 0;
          }
        });

        // Execute all message queries in parallel
        const messageCounts = await Promise.all(messagePromises);
        const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);
        
        console.log(`[Firestore] Batch loaded ${totalMessages} messages across ${threadIds.length} threads`);
      }

      // Determine if there are more results
      const hasMore = snapshot.docs.length === limit;
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

      console.log(`[Firestore] Retrieved ${threads.length} threads efficiently (hasMore: ${hasMore})`);
      
      return {
        threads,
        hasMore,
        lastVisible,
      };
    } catch (error) {
      console.error(`[Firestore] Error getting threads efficiently for user ${userId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to get threads efficiently: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getAllThreadsEfficient',
        error
      );
    }
  }

  /**
   * Get all chat threads for a user (LEGACY - kept for backward compatibility)
   * 
   * @deprecated Use getAllThreadsEfficient instead
   * @param userId - User ID
   * @returns Array of chat threads sorted by update time (newest first)
   */
  async getAllThreads(userId: string): Promise<ChatThread[]> {
    console.log(`[Firestore] LEGACY getAllThreads called - consider using getAllThreadsEfficient`);
    
    // For backward compatibility, call the efficient version with default pagination
    const result = await this.getAllThreadsEfficient(userId, 100); // Increased default limit
    return result.threads;
  }

  /**
   * Get thread summaries without messages (for efficient list views)
   * 
   * @param userId - User ID
   * @param limit - Max threads to retrieve
   * @param startAfter - Pagination cursor
   * @returns Thread summaries without message content
   */
  async getThreadSummaries(
    userId: string, 
    limit: number = 50,
    startAfter?: FirebaseFirestore.DocumentSnapshot
  ): Promise<{
    threads: Omit<ChatThread, 'messages'>[];
    hasMore: boolean;
    lastVisible?: FirebaseFirestore.DocumentSnapshot;
  }> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      console.log(`[Firestore] Getting thread summaries for user: ${userId}, limit: ${limit}`);

      let query = this.getUserChatsCollection(userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit);

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      const snapshot = await query.get();
      const threads: Omit<ChatThread, 'messages'>[] = [];

      for (const doc of snapshot.docs) {
        const threadData = this.documentToChatThread(doc);
        if (threadData) {
          // Exclude messages for summary view
          const { messages, ...threadSummary } = threadData;
          threads.push(threadSummary);
        }
      }

      const hasMore = snapshot.docs.length === limit;
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

      console.log(`[Firestore] Retrieved ${threads.length} thread summaries (hasMore: ${hasMore})`);
      
      return {
        threads,
        hasMore,
        lastVisible,
      };
    } catch (error) {
      console.error(`[Firestore] Error getting thread summaries for user ${userId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to get thread summaries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getThreadSummaries',
        error
      );
    }
  }

  /**
   * Get messages for multiple threads in batch
   * 
   * @param userId - User ID
   * @param threadIds - Array of thread IDs
   * @returns Map of threadId to messages array
   */
  async getBatchMessages(userId: string, threadIds: string[]): Promise<Map<string, ChatMessage[]>> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadIds.length) {
        return new Map();
      }

      console.log(`[Firestore] Batch loading messages for ${threadIds.length} threads`);

      const messagePromises = threadIds.map(async (threadId) => {
        try {
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

          return [threadId, messages] as [string, ChatMessage[]];
        } catch (error) {
          console.error(`[Firestore] Error loading messages for thread ${threadId}:`, error);
          return [threadId, []] as [string, ChatMessage[]];
        }
      });

      const results = await Promise.all(messagePromises);
      const messageMap = new Map(results);
      
      const totalMessages = Array.from(messageMap.values()).reduce((sum, messages) => sum + messages.length, 0);
      console.log(`[Firestore] Batch loaded ${totalMessages} messages for ${threadIds.length} threads`);

      return messageMap;
    } catch (error) {
      console.error(`[Firestore] Error batch loading messages:`, error);
      throw new FirestoreChatStorageError(
        `Failed to batch load messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getBatchMessages',
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
   * @param currentModel - Optional current model for the thread
   * @returns Created thread data
   */
  async createThread(userId: string, title: string, currentModel?: string): Promise<ChatThread> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!title?.trim()) {
        throw new Error('Thread title is required');
      }

      const threadId = randomUUID();
      const now = new Date();

      // Use default model if none provided
      const defaultModel = DEFAULT_MODEL;
      const modelToUse = currentModel?.trim() || defaultModel;

      const thread: ChatThread = {
        id: threadId,
        title: title.trim(),
        messages: [],
        createdAt: now,
        updatedAt: now,
        currentModel: modelToUse,
      };

      console.log(`[Firestore] Creating new thread: ${thread.title} (${threadId}) for user: ${userId} with model: ${modelToUse}`);

      // Create thread document with model information
      const threadData: any = {
        title: thread.title,
        createdAt: now,
        updatedAt: now,
        currentModel: modelToUse,
      };

      await this.getUserChatsCollection(userId).doc(threadId).set(threadData);

      console.log(`[Firestore] Created new thread: ${thread.title} (${threadId}) with model: ${modelToUse}`);
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
   * Update thread pin status
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to update
   * @param isPinned - New pin status
   * @returns Updated thread data or null if not found
   */
  async updateThreadPin(userId: string, threadId: string, isPinned: boolean): Promise<ChatThread | null> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      if (typeof isPinned !== 'boolean') {
        throw new Error('isPinned must be a boolean');
      }

      console.log(`[Firestore] ${isPinned ? 'Pinning' : 'Unpinning'} thread ${threadId} for user: ${userId}`);

      const threadRef = this.getUserChatsCollection(userId).doc(threadId);
      const threadDoc = await threadRef.get();

      if (!threadDoc.exists) {
        console.log(`[Firestore] Thread not found for pin update: ${threadId}`);
        return null;
      }

      const now = new Date();
      await threadRef.update({
        isPinned,
        updatedAt: now,
      });

      // Get the updated thread with messages
      const updatedThread = await this.getThread(userId, threadId);

      if (updatedThread) {
        console.log(`[Firestore] ${isPinned ? 'Pinned' : 'Unpinned'} thread: "${updatedThread.title}"`);
      }

      return updatedThread;
    } catch (error) {
      console.error(`[Firestore] Error updating thread pin status for ${threadId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to update thread pin status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateThreadPin',
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

      if (!message?.content?.trim() && !message?.imageUrl?.trim() && (!message?.images || message.images.length === 0)) {
        throw new Error('Message must have content, image URL, or images');
      }

      console.log(`[Firestore] Adding ${message.role} message to thread ${threadId} for user: ${userId}`);

      // Sanitize attachments to prevent "invalid nested entity" errors
      const sanitizedImages = message.images ? sanitizeImageAttachments(message.images) : undefined;
      const sanitizedDocuments = message.documents ? sanitizeDocumentAttachments(message.documents) : undefined;

      if (message.images && sanitizedImages && sanitizedImages.length !== message.images.length) {
        console.warn(`[Firestore] Some image attachments were sanitized/removed: ${message.images.length} -> ${sanitizedImages.length}`);
      }

      if (message.documents && sanitizedDocuments && sanitizedDocuments.length !== message.documents.length) {
        console.warn(`[Firestore] Some document attachments were sanitized/removed: ${message.documents.length} -> ${sanitizedDocuments.length}`);
      }

      // Add message to messages subcollection with sanitized attachments
      await this.getChatMessagesCollection(userId, threadId).doc(message.id).set({
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        ...(message.imageUrl && { imageUrl: message.imageUrl }),
        ...(message.modelId && { modelId: message.modelId }),
        ...(message.reasoning && { reasoning: message.reasoning }), // Save reasoning tokens for supported AI models
        ...(sanitizedImages && sanitizedImages.length > 0 && { images: sanitizedImages }), // Save sanitized image attachments
        ...(sanitizedDocuments && sanitizedDocuments.length > 0 && { documents: sanitizedDocuments }), // Save sanitized document attachments
      });

      // Update thread's updatedAt timestamp and track lastUsedModel
      const updateData: any = {
        updatedAt: new Date(),
      };

      // If this is an assistant message with a modelId, update lastUsedModel
      if (message.role === 'assistant' && message.modelId) {
        updateData.lastUsedModel = message.modelId;
        console.log(`[Firestore] Updating lastUsedModel to: ${message.modelId}`);
      }

      await this.getUserChatsCollection(userId).doc(threadId).update(updateData);

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

  /**
   * Update thread model
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to update
   * @param currentModel - New current model
   * @returns Updated thread data or null if not found
   */
  async updateThreadModel(userId: string, threadId: string, currentModel: string): Promise<ChatThread | null> {
    try {
      if (!userId?.trim()) {
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      if (!currentModel?.trim()) {
        throw new Error('Current model is required');
      }

      console.log(`[Firestore] Updating model for thread ${threadId} for user: ${userId} -> ${currentModel}`);

      const threadRef = this.getUserChatsCollection(userId).doc(threadId);
      const threadDoc = await threadRef.get();

      if (!threadDoc.exists) {
        console.log(`[Firestore] Thread not found for model update: ${threadId}`);
        return null;
      }

      const now = new Date();
      await threadRef.update({
        currentModel: currentModel.trim(),
        updatedAt: now,
      });

      // Get the updated thread with messages
      const updatedThread = await this.getThread(userId, threadId);

      if (updatedThread) {
        console.log(`[Firestore] Updated thread model: "${currentModel}"`);
      }

      return updatedThread;
    } catch (error) {
      console.error(`[Firestore] Error updating thread model for ${threadId}:`, error);
      throw new FirestoreChatStorageError(
        `Failed to update thread model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateThreadModel',
        error
      );
    }
  }

  /**
   * Update thread tags
   * 
   * @param userId - User ID
   * @param threadId - ID of the thread to update
   * @param tags - New tags array (can be empty to remove all tags)
   * @returns Updated thread data or null if not found
   */
  async updateThreadTags(userId: string, threadId: string, tags: string[]): Promise<ChatThread | null> {
    const operationId = `FS-UPDATE-${threadId}-${Date.now()}`;
    const startTime = Date.now();
    
    try {
      console.log(`[Firestore-${operationId}] ========== FIRESTORE TAG UPDATE STARTED ==========`);
      console.log(`[Firestore-${operationId}] Input parameters:`, {
        userId: userId,
        threadId: threadId,
        tags: tags,
        tagsLength: tags?.length,
        tagsType: typeof tags
      });
      
      if (!userId?.trim()) {
        console.log(`[Firestore-${operationId}] Validation failed - User ID is required`);
        throw new Error('User ID is required');
      }

      if (!threadId?.trim()) {
        console.log(`[Firestore-${operationId}] Validation failed - Thread ID is required`);
        throw new Error('Thread ID is required');
      }

      if (!Array.isArray(tags)) {
        console.log(`[Firestore-${operationId}] Validation failed - Tags must be an array, got: ${typeof tags}`);
        throw new Error('Tags must be an array');
      }

      console.log(`[Firestore-${operationId}] Validation passed - updating tags for thread ${threadId} for user: ${userId}`);
      console.log(`[Firestore-${operationId}] Tags to set: [${tags.join(', ')}] (${tags.length} items)`);

      const threadRef = this.getUserChatsCollection(userId).doc(threadId);
      console.log(`[Firestore-${operationId}] Getting thread document reference...`);
      
      const checkStartTime = Date.now();
      const threadDoc = await threadRef.get();
      const checkDuration = Date.now() - checkStartTime;
      
      console.log(`[Firestore-${operationId}] Thread document retrieved in ${checkDuration}ms, exists: ${threadDoc.exists}`);

      if (!threadDoc.exists) {
        console.log(`[Firestore-${operationId}] Thread not found for tag update: ${threadId}`);
        return null;
      }

      const existingData = threadDoc.data();
      console.log(`[Firestore-${operationId}] Current thread data:`, {
        title: existingData?.title,
        currentTags: existingData?.tags || [],
        updatedAt: existingData?.updatedAt?.toDate()
      });

      const now = new Date();
      console.log(`[Firestore-${operationId}] Performing Firestore update...`);
      
      const updateStartTime = Date.now();
      await threadRef.update({
        tags,
        updatedAt: now,
      });
      const updateDuration = Date.now() - updateStartTime;
      
      console.log(`[Firestore-${operationId}] Firestore document updated in ${updateDuration}ms`);
      console.log(`[Firestore-${operationId}] Fetching updated thread with messages...`);

      // Get the updated thread with messages
      const getThreadStartTime = Date.now();
      const updatedThread = await this.getThread(userId, threadId);
      const getThreadDuration = Date.now() - getThreadStartTime;
      
      console.log(`[Firestore-${operationId}] Thread retrieval completed in ${getThreadDuration}ms`);

      if (updatedThread) {
        console.log(`[Firestore-${operationId}] Successfully updated thread tags: [${updatedThread.tags?.join(', ') || 'none'}]`);
        console.log(`[Firestore-${operationId}] Updated thread data:`, {
          id: updatedThread.id,
          title: updatedThread.title,
          tags: updatedThread.tags,
          updatedAt: updatedThread.updatedAt,
          messageCount: updatedThread.messages?.length || 0
        });
      } else {
        console.log(`[Firestore-${operationId}] Updated thread is null - this should not happen after successful update`);
      }

      const totalDuration = Date.now() - startTime;
      console.log(`[Firestore-${operationId}] FIRESTORE OPERATION COMPLETED SUCCESSFULLY in ${totalDuration}ms`);
      console.log(`[Firestore-${operationId}] ========== FIRESTORE TAG UPDATE FINISHED ==========`);

      return updatedThread;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`[Firestore-${operationId}] FIRESTORE OPERATION FAILED after ${totalDuration}ms:`, error);
      console.error(`[Firestore-${operationId}] Error details:`, {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      console.log(`[Firestore-${operationId}] ========== FIRESTORE TAG UPDATE FAILED ==========`);
      
      throw new FirestoreChatStorageError(
        `Failed to update thread tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateThreadTags',
        error
      );
    }
  }
}

// Export singleton instance
export const firestoreChatStorage: ChatStorageService = new FirestoreChatStorageService();