/**
 * chatStorage.ts
 * 
 * File-based chat storage service for persistent chat data
 * 
 * Features:
 *   - File-based JSON storage
 *   - Thread and message management
 *   - Automatic data persistence
 *   - Thread creation, deletion, and updates
 *   - Message history management
 *   - Comprehensive error handling and logging
 * 
 * Usage: import { chatStorage } from './chatStorage'
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { ChatThread, ChatMessage, UserChats } from '../shared/types';

// Storage configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const CHAT_FILE = path.join(DATA_DIR, 'userChats.json');
const DEFAULT_USER_ID = 'default';

/**
 * Chat storage error class for structured error handling
 */
class ChatStorageError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'ChatStorageError';
  }
}

/**
 * Chat storage service interface
 */
interface ChatStorageService {
  getAllThreads(): ChatThread[];
  getThread(threadId: string): ChatThread | null;
  createThread(title: string): ChatThread;
  deleteThread(threadId: string): boolean;
  updateThreadTitle(threadId: string, title: string): ChatThread | null;
  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string): ChatMessage;
  addMessageToThread(threadId: string, message: ChatMessage): void;
}

/**
 * Ensures the data directory exists
 */
const ensureDataDirectory = (): void => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.log(`[Storage] Creating data directory: ${DATA_DIR}`);
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    throw new ChatStorageError(
      `Failed to create data directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ensureDataDirectory'
    );
  }
};

/**
 * Loads chat data from file or creates default structure
 * 
 * @returns UserChats data
 */
const loadChatData = (): UserChats => {
  try {
    ensureDataDirectory();

    if (!fs.existsSync(CHAT_FILE)) {
      console.log('[Storage] Chat file not found, creating new one');
      const defaultData: UserChats = {
        userId: DEFAULT_USER_ID,
        threads: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      saveChatData(defaultData);
      return defaultData;
    }

    console.log('[Storage] Loading chat data from file');
    const fileContent = fs.readFileSync(CHAT_FILE, 'utf-8');
    
    if (!fileContent.trim()) {
      console.log('[Storage] Empty chat file, creating default data');
      const defaultData: UserChats = {
        userId: DEFAULT_USER_ID,
        threads: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      saveChatData(defaultData);
      return defaultData;
    }

    const data = JSON.parse(fileContent);
    
    // Validate data structure
    if (!data.userId || !Array.isArray(data.threads)) {
      throw new Error('Invalid chat data structure');
    }

    // Convert date strings back to Date objects
    const processedData: UserChats = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      threads: data.threads.map((thread: any) => ({
        ...thread,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
        messages: thread.messages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }))
      }))
    };

    console.log(`[Storage] Loaded ${processedData.threads.length} chat threads`);
    return processedData;

  } catch (error) {
    console.error('[Storage] Error loading chat data:', error);
    
    if (error instanceof SyntaxError) {
      // Backup corrupted file and create new one
      const backupFile = `${CHAT_FILE}.backup.${Date.now()}`;
      try {
        if (fs.existsSync(CHAT_FILE)) {
          fs.copyFileSync(CHAT_FILE, backupFile);
          console.log(`[Storage] Corrupted file backed up to: ${backupFile}`);
        }
      } catch (backupError) {
        console.error('[Storage] Failed to backup corrupted file:', backupError);
      }
      
      // Create fresh data
      const defaultData: UserChats = {
        userId: DEFAULT_USER_ID,
        threads: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      saveChatData(defaultData);
      return defaultData;
    }

    throw new ChatStorageError(
      `Failed to load chat data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'loadChatData'
    );
  }
};

/**
 * Saves chat data to file with atomic write operation
 * 
 * @param data - UserChats data to save
 */
const saveChatData = (data: UserChats): void => {
  try {
    ensureDataDirectory();

    // Update timestamp
    data.updatedAt = new Date();

    // Atomic write: write to temp file first, then rename
    const tempFile = `${CHAT_FILE}.tmp.${Date.now()}`;
    const jsonContent = JSON.stringify(data, null, 2);
    
    fs.writeFileSync(tempFile, jsonContent, 'utf-8');
    fs.renameSync(tempFile, CHAT_FILE);

    console.log(`[Storage] Saved chat data (${data.threads.length} threads)`);

  } catch (error) {
    throw new ChatStorageError(
      `Failed to save chat data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'saveChatData'
    );
  }
};

/**
 * Validates thread data
 * 
 * @param thread - Thread to validate
 * @throws Error if validation fails
 */
const validateThread = (thread: any): void => {
  if (!thread.id || typeof thread.id !== 'string') {
    throw new Error('Thread must have a valid ID');
  }
  
  if (!thread.title || typeof thread.title !== 'string') {
    throw new Error('Thread must have a valid title');
  }
  
  if (!Array.isArray(thread.messages)) {
    throw new Error('Thread must have a messages array');
  }
};

/**
 * Validates message data
 * 
 * @param message - Message to validate
 * @throws Error if validation fails
 */
const validateMessage = (message: any): void => {
  if (!message.id || typeof message.id !== 'string') {
    throw new Error('Message must have a valid ID');
  }
  
  if (!message.role || !['user', 'assistant'].includes(message.role)) {
    throw new Error('Message must have a valid role (user or assistant)');
  }
  
  if (!message.content || typeof message.content !== 'string') {
    throw new Error('Message must have valid content');
  }
};

/**
 * Chat storage service implementation
 */
class ChatStorageServiceImpl implements ChatStorageService {
  private data: UserChats;

  constructor() {
    console.log('[Storage] Initializing chat storage service');
    this.data = loadChatData();
    console.log(`[Storage] Storage initialized with ${this.data.threads.length} threads`);
  }

  /**
   * Get all chat threads
   * 
   * @returns Array of chat threads sorted by update time (newest first)
   */
  getAllThreads(): ChatThread[] {
    try {
      // Return copy to prevent external modification and sort by update time
      const threads = [...this.data.threads].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      console.log(`[Storage] Retrieved ${threads.length} threads`);
      return threads;
    } catch (error) {
      throw new ChatStorageError(
        `Failed to get all threads: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getAllThreads'
      );
    }
  }

  /**
   * Get specific thread by ID
   * 
   * @param threadId - ID of the thread to get
   * @returns Thread data or null if not found
   */
  getThread(threadId: string): ChatThread | null {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      const thread = this.data.threads.find(t => t.id === threadId);
      
      if (thread) {
        console.log(`[Storage] Retrieved thread: ${thread.title} (${thread.messages.length} messages)`);
        // Return copy to prevent external modification
        return JSON.parse(JSON.stringify(thread));
      }

      console.log(`[Storage] Thread not found: ${threadId}`);
      return null;
    } catch (error) {
      throw new ChatStorageError(
        `Failed to get thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getThread'
      );
    }
  }

  /**
   * Create new chat thread
   * 
   * @param title - Title for the new thread
   * @returns Created thread data
   */
  createThread(title: string): ChatThread {
    try {
      if (!title?.trim()) {
        throw new Error('Thread title is required');
      }

      const thread: ChatThread = {
        id: randomUUID(),
        title: title.trim(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      validateThread(thread);

      this.data.threads.push(thread);
      saveChatData(this.data);

      console.log(`[Storage] Created new thread: ${thread.title} (${thread.id})`);
      return JSON.parse(JSON.stringify(thread));
    } catch (error) {
      throw new ChatStorageError(
        `Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'createThread'
      );
    }
  }

  /**
   * Delete chat thread
   * 
   * @param threadId - ID of the thread to delete
   * @returns True if deleted, false if not found
   */
  deleteThread(threadId: string): boolean {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      const initialCount = this.data.threads.length;
      this.data.threads = this.data.threads.filter(t => t.id !== threadId);
      
      const deleted = this.data.threads.length < initialCount;
      
      if (deleted) {
        saveChatData(this.data);
        console.log(`[Storage] Deleted thread: ${threadId}`);
      } else {
        console.log(`[Storage] Thread not found for deletion: ${threadId}`);
      }

      return deleted;
    } catch (error) {
      throw new ChatStorageError(
        `Failed to delete thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'deleteThread'
      );
    }
  }

  /**
   * Update thread title
   * 
   * @param threadId - ID of the thread to update
   * @param title - New title
   * @returns Updated thread data or null if not found
   */
  updateThreadTitle(threadId: string, title: string): ChatThread | null {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      if (!title?.trim()) {
        throw new Error('Thread title is required');
      }

      const thread = this.data.threads.find(t => t.id === threadId);
      
      if (!thread) {
        console.log(`[Storage] Thread not found for title update: ${threadId}`);
        return null;
      }

      const oldTitle = thread.title;
      thread.title = title.trim();
      thread.updatedAt = new Date();

      saveChatData(this.data);

      console.log(`[Storage] Updated thread title: "${oldTitle}" -> "${thread.title}"`);
      return JSON.parse(JSON.stringify(thread));
    } catch (error) {
      throw new ChatStorageError(
        `Failed to update thread title: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateThreadTitle'
      );
    }
  }

  /**
   * Create new message
   * 
   * @param content - Message content
   * @param role - Message role (user or assistant)
   * @param imageUrl - Optional image URL
   * @returns Created message data
   */
  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string): ChatMessage {
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
        ...(imageUrl?.trim() && { imageUrl: imageUrl.trim() })
      };

      validateMessage(message);

      console.log(`[Storage] Created ${role} message (${message.content.length} characters)${imageUrl ? ' with image' : ''}`);
      return message;
    } catch (error) {
      throw new ChatStorageError(
        `Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'createMessage'
      );
    }
  }

  /**
   * Add message to thread
   * 
   * @param threadId - ID of the thread to add message to
   * @param message - Message to add
   */
  addMessageToThread(threadId: string, message: ChatMessage): void {
    try {
      if (!threadId?.trim()) {
        throw new Error('Thread ID is required');
      }

      validateMessage(message);

      const thread = this.data.threads.find(t => t.id === threadId);
      
      if (!thread) {
        throw new Error(`Thread not found: ${threadId}`);
      }

      thread.messages.push(message);
      thread.updatedAt = new Date();

      saveChatData(this.data);

      console.log(`[Storage] Added ${message.role} message to thread: ${thread.title} (now ${thread.messages.length} messages)`);
    } catch (error) {
      throw new ChatStorageError(
        `Failed to add message to thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'addMessageToThread'
      );
    }
  }
}

// Export singleton instance
export const chatStorage: ChatStorageService = new ChatStorageServiceImpl(); 