import type { ChatThread, CreateMessageRequest, CreateMessageResponse, GetChatsResponse } from '../../../src/shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export class ChatApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getAllChats(): Promise<ChatThread[]> {
    const response = await fetch(`${this.baseUrl}/api/chats`);
    if (!response.ok) {
      throw new Error(`Failed to get chats: ${response.statusText}`);
    }
    const data: GetChatsResponse = await response.json();
    return data.threads;
  }

  async getChat(threadId: string): Promise<ChatThread> {
    const response = await fetch(`${this.baseUrl}/api/chats/${threadId}`);
    if (!response.ok) {
      throw new Error(`Failed to get chat: ${response.statusText}`);
    }
    return await response.json();
  }

  async sendMessage(request: CreateMessageRequest): Promise<CreateMessageResponse> {
    const response = await fetch(`${this.baseUrl}/api/chats/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteChat(threadId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/chats/${threadId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }
  }

  async updateChatTitle(threadId: string, title: string): Promise<ChatThread> {
    const response = await fetch(`${this.baseUrl}/api/chats/${threadId}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update chat title: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const chatApiService = new ChatApiService(); 