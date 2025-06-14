/**
 * messageService.ts
 * 
 * Message management service
 * 
 * Services:
 *   MessageService
 * 
 * Features:
 *   - Send messages
 *   - Get available models
 *   - Message validation
 *   - Error handling
 * 
 * Usage: import { MessageService } from './messageService'
 */
import { logger } from '../utils/logger';
import { HttpClient } from './httpClient';
import type { 
  CreateMessageRequest, 
  CreateMessageResponse,
  AvailableModelsResponse 
} from '../../../src/shared/types';

/**
 * Message service for chat message operations
 * 
 * Handles message sending, model management, and validation.
 */
export class MessageService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Send message to chat thread
   * 
   * @param request - Create message request
   * @returns Promise with create message response
   */
  async sendMessage(request: CreateMessageRequest): Promise<CreateMessageResponse> {
    if (!request.content?.trim() && !request.imageUrl?.trim() && (!request.images || request.images.length === 0)) {
      throw new Error('Message content or image URL is required');
    }

    try {
      logger.info('Sending message to chat', {
        threadId: request.threadId || 'new',
        hasContent: !!request.content,
        hasImage: !!request.imageUrl,
        hasImages: !!(request.images && request.images.length > 0),
        imageCount: request.images?.length || 0
      });

      const response = await this.httpClient.post<CreateMessageResponse>('/chats/message', request);

      logger.info(`Message sent successfully to thread: ${response.threadId}`, {
        messageId: response.message.id,
        assistantResponseId: response.assistantResponse.id,
        tokenMetrics: response.tokenMetrics
      });

      return response;
    } catch (error) {
      logger.error('Failed to send message', error as Error);
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Get available AI models
   * 
   * @returns Promise with available models response
   */
  async getAvailableModels(): Promise<AvailableModelsResponse> {
    try {
      logger.info('Fetching available models');

      const response = await this.httpClient.get<AvailableModelsResponse>('/models');

      logger.info(`Successfully fetched ${response.models.length} available models`);

      return response;
    } catch (error) {
      logger.error('Failed to fetch available models', error as Error);
      throw new Error('Failed to load available models. Please try again.');
    }
  }

  /**
   * Validate message request
   * 
   * @param request - Message request to validate
   * @returns Validation result
   */
  validateMessageRequest(request: CreateMessageRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check content
    if (!request.content?.trim() && !request.imageUrl?.trim() && (!request.images || request.images.length === 0)) {
      errors.push('Message content or image is required');
    }

    // Check content length
    if (request.content && request.content.length > 50000) {
      errors.push('Message content is too long (maximum 50,000 characters)');
    }

    // Check image count
    if (request.images && request.images.length > 10) {
      errors.push('Too many images (maximum 10 images per message)');
    }

    // Check model ID
    if (request.modelId && typeof request.modelId !== 'string') {
      errors.push('Invalid model ID format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get message statistics
   * 
   * @param threadId - Optional thread ID for thread-specific stats
   * @returns Promise with message statistics
   */
  async getMessageStats(threadId?: string): Promise<{
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
  }> {
    try {
      logger.info(`Fetching message statistics${threadId ? ` for thread: ${threadId}` : ''}`);

      const params = threadId ? { threadId } : undefined;
      const stats = await this.httpClient.get<{
        totalMessages: number;
        totalTokens: number;
        totalCost: number;
        averageResponseTime: number;
      }>('/messages/stats', params);

      logger.info('Successfully fetched message statistics', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to fetch message statistics', error as Error);
      throw new Error('Failed to load message statistics. Please try again.');
    }
  }

  /**
   * Create message service instance
   * 
   * @param httpClient - HTTP client instance
   * @returns MessageService instance
   */
  static create(httpClient: HttpClient): MessageService {
    return new MessageService(httpClient);
  }
} 