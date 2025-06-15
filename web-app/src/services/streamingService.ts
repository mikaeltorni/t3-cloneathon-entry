/**
 * streamingService.ts
 * 
 * Server-Sent Events streaming service
 * 
 * Services:
 *   StreamingService
 * 
 * Features:
 *   - Real-time message streaming
 *   - Reasoning chunk processing
 *   - Token metrics streaming
 *   - Annotation chunk handling
 *   - Comprehensive error handling
 * 
 * Usage: import { StreamingService } from './streamingService'
 */
import { logger } from '../utils/logger';
import { HttpClient } from './httpClient';
import type { StreamingCallbacks } from './types/apiTypes';
import type { CreateMessageRequest, CreateMessageResponse, ChatMessage, TokenMetrics } from '../../../src/shared/types';

/**
 * Streaming service for real-time message processing
 * 
 * Handles real-time streaming of AI responses with support for
 * content chunks, reasoning, token metrics, and annotations.
 */
export class StreamingService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Stream message with real-time callbacks
   * 
   * @param request - Create message request
   * @param callbacks - Streaming event callbacks
   * @returns Promise that resolves when streaming starts
   */
  async streamMessage(
    request: CreateMessageRequest,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    if (!request.content?.trim() && !request.imageUrl?.trim() && (!request.images || request.images.length === 0)) {
      throw new Error('Message content or image URL is required');
    }

    try {
      logger.info('Starting streaming message to chat', {
        threadId: request.threadId || 'new',
        hasContent: !!request.content,
        hasImage: !!request.imageUrl,
        hasImages: !!(request.images && request.images.length > 0),
        imageCount: request.images?.length || 0
      });

      const reader = await this.httpClient.stream('/chats/message/stream', request);
      await this.processStreamingResponse(reader, callbacks);

    } catch (error) {
      logger.error('Failed to stream message', error as Error);
      callbacks.onError(
        error instanceof Error 
          ? error 
          : new Error('Failed to stream message. Please try again.')
      );
    }
  }

  /**
   * Process streaming response chunks
   * 
   * @param reader - ReadableStream reader
   * @param callbacks - Streaming event callbacks
   */
  private async processStreamingResponse(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const decoder = new TextDecoder();
    let threadId: string | null = null;
    let userMessage: ChatMessage | null = null;
    
    logger.info('Starting to read streaming response from server');
    let totalChunks = 0;
    let contentChunks = 0;
    let annotationChunks = 0;
    let reasoningChunks = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          logger.info(`Streaming completed. Total chunks: ${totalChunks}, content: ${contentChunks}, annotations: ${annotationChunks}, reasoning: ${reasoningChunks}`);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        logger.debug(`Raw chunk received: length=${chunk.length}, preview="${chunk.substring(0, 200)}..."`);
        
        const lines = chunk.split('\n').filter(line => line.trim());
        logger.debug(`Found ${lines.length} lines in chunk`);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            logger.debug(`Processing data line: "${data.substring(0, 200)}..."`);
            
            if (data === '[DONE]') {
              logger.info('Received [DONE] signal from server');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              totalChunks++;
              logger.debug(`Parsed chunk ${totalChunks}: type=${parsed.type}, data=${JSON.stringify(parsed).substring(0, 200)}...`);
              
              const result = this.processStreamingChunk(
                parsed,
                { threadId, userMessage },
                callbacks
              );

              if (result.threadId) threadId = result.threadId;
              if (result.userMessage) userMessage = result.userMessage;

              // Update counters
              if (parsed.type === 'ai_chunk') contentChunks++;
              if (parsed.type === 'annotations_chunk') annotationChunks++;
              if (parsed.type === 'reasoning_chunk') reasoningChunks++;

            } catch (parseError) {
              logger.warn('Failed to parse streaming chunk:', data.substring(0, 200), 'Error:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process individual streaming chunk
   * 
   * @param parsed - Parsed chunk data
   * @param context - Streaming context (threadId, userMessage)
   * @param callbacks - Event callbacks
   * @returns Updated context
   */
  private processStreamingChunk(
    parsed: unknown,
    context: { threadId: string | null; userMessage: ChatMessage | null },
    callbacks: StreamingCallbacks
  ): { threadId?: string; userMessage?: ChatMessage } {
    const result: { threadId?: string; userMessage?: ChatMessage } = {};
    const chunk = parsed as Record<string, unknown>;

    switch (chunk.type) {
      case 'thread_info':
        result.threadId = chunk.threadId as string;
        logger.debug(`Stream using thread: ${chunk.threadId}`);
        if (callbacks.onThreadCreated) {
          callbacks.onThreadCreated(chunk.threadId as string);
        }
        break;
        
      case 'user_message':
        result.userMessage = chunk.message as ChatMessage;
        logger.debug('User message confirmed', { 
          messageId: (chunk.message as ChatMessage)?.id, 
          imageCount: (chunk.message as ChatMessage & { imageCount?: number })?.imageCount 
        });
        if (callbacks.onUserMessageConfirmed) {
          callbacks.onUserMessageConfirmed(chunk.message as ChatMessage);
        }
        break;
        
      case 'ai_start':
        logger.debug('AI response started');
        break;
        
      case 'reasoning_chunk':
        logger.debug(`Reasoning chunk: length=${(chunk.content as string)?.length || 0}, fullLength=${(chunk.fullReasoning as string)?.length || 0}`);
        if (callbacks.onReasoningChunk) {
          callbacks.onReasoningChunk(chunk.content as string, chunk.fullReasoning as string);
        }
        // Handle token metrics if available
        if (callbacks.onTokenMetrics && chunk.tokenMetrics) {
          callbacks.onTokenMetrics(chunk.tokenMetrics as TokenMetrics);
        }
        break;
        
      case 'annotations_chunk':
        logger.debug(`Annotations chunk: count=${(chunk.annotations as unknown[])?.length || 0}`);
        if (callbacks.onAnnotationsChunk && chunk.annotations) {
          callbacks.onAnnotationsChunk(chunk.annotations as unknown[]);
        }
        break;
        
      case 'ai_chunk':
        logger.debug(`Content chunk: chunkLength=${(chunk.content as string)?.length || 0}, fullLength=${(chunk.fullContent as string)?.length || 0}, preview="${(chunk.content as string)?.substring(0, 50)}..."`);
        logger.debug(`Full content so far: "${(chunk.fullContent as string)?.substring(0, 100)}..."`);
        callbacks.onChunk(chunk.content as string, chunk.fullContent as string);
        // Handle token metrics if available
        if (callbacks.onTokenMetrics && chunk.tokenMetrics) {
          callbacks.onTokenMetrics(chunk.tokenMetrics as TokenMetrics);
        }
        break;
        
      case 'ai_complete': {
        logger.info(`AI response completed. Final content length: ${(chunk.assistantMessage as ChatMessage)?.content?.length || 0}`);
        logger.debug(`Final message content: "${(chunk.assistantMessage as ChatMessage)?.content?.substring(0, 100)}..."`);
        const completeResponse: CreateMessageResponse = {
          threadId: context.threadId!,
          message: context.userMessage!,
          assistantResponse: chunk.assistantMessage as ChatMessage,
          tokenMetrics: chunk.tokenMetrics as TokenMetrics // Include final token metrics
        };
        callbacks.onComplete(completeResponse);
        logger.info(`Streaming message completed for thread: ${context.threadId}`, {
          tokenMetrics: chunk.tokenMetrics
        });
        break;
      }
        
      case 'error':
        logger.error(`Received error from server: ${chunk.error}`);
        callbacks.onError(new Error(chunk.error as string));
        break;
        
      default:
        logger.warn(`Unknown chunk type: ${chunk.type}`);
    }

    return result;
  }

  /**
   * Create streaming service instance
   * 
   * @param httpClient - HTTP client instance
   * @returns StreamingService instance
   */
  static create(httpClient: HttpClient): StreamingService {
    return new StreamingService(httpClient);
  }
} 