import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UserChats, ChatThread, ChatMessage } from '../shared/types';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'userChats.json');
const DEFAULT_USER_ID = 'default';

class ChatStorage {
  private userChats: UserChats = {
    userId: DEFAULT_USER_ID,
    threads: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load existing data or create default
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(data);
        
        // Convert date strings back to Date objects
        this.userChats = {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
          threads: parsed.threads.map((thread: any) => ({
            ...thread,
            createdAt: new Date(thread.createdAt),
            updatedAt: new Date(thread.updatedAt),
            messages: thread.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
        };
      } else {
        this.userChats = {
          userId: DEFAULT_USER_ID,
          threads: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.saveToFile();
      }
    } catch (error) {
      console.error('Error loading chat storage:', error);
      // Create default if loading fails
      this.userChats = {
        userId: DEFAULT_USER_ID,
        threads: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.userChats, null, 2));
    } catch (error) {
      console.error('Error saving chat storage:', error);
    }
  }

  getAllThreads(): ChatThread[] {
    return this.userChats.threads;
  }

  getThread(threadId: string): ChatThread | null {
    return this.userChats.threads.find(thread => thread.id === threadId) || null;
  }

  createThread(title: string): ChatThread {
    const newThread: ChatThread = {
      id: uuidv4(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.userChats.threads.unshift(newThread); // Add to beginning for recent-first order
    this.userChats.updatedAt = new Date();
    this.saveToFile();

    return newThread;
  }

  addMessageToThread(threadId: string, message: ChatMessage): ChatThread | null {
    const thread = this.getThread(threadId);
    if (!thread) return null;

    thread.messages.push(message);
    thread.updatedAt = new Date();
    this.userChats.updatedAt = new Date();
    this.saveToFile();

    return thread;
  }

  createMessage(content: string, role: 'user' | 'assistant', imageUrl?: string): ChatMessage {
    return {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      imageUrl
    };
  }

  deleteThread(threadId: string): boolean {
    const index = this.userChats.threads.findIndex(thread => thread.id === threadId);
    if (index === -1) return false;

    this.userChats.threads.splice(index, 1);
    this.userChats.updatedAt = new Date();
    this.saveToFile();

    return true;
  }

  updateThreadTitle(threadId: string, title: string): ChatThread | null {
    const thread = this.getThread(threadId);
    if (!thread) return null;

    thread.title = title;
    thread.updatedAt = new Date();
    this.userChats.updatedAt = new Date();
    this.saveToFile();

    return thread;
  }
}

export const chatStorage = new ChatStorage(); 