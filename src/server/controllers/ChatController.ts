/**
 * ChatController.ts
 * 
 * Controller for chat-related HTTP endpoints
 * Separates HTTP handling from business logic for better maintainability
 * 
 * Controller:
 *   ChatController
 * 
 * Features:
 *   - Clean separation of concerns
 *   - Standardized error handling
 *   - Request validation
 *   - Response formatting
 *   - Database-ready architecture
 *   - Easy to add authentication middleware
 * 
 * Usage: app.use('/api/chats', chatController.getRoutes());
 */
import express, { Request, Response, NextFunction, Router } from 'express';
import { firestoreChatStorage } from '../firestoreChatStorage';
import { createAIService } from '../services/AIService';
import { authenticateUser, type AuthenticatedRequest } from '../middleware/auth';
import type { 
  CreateMessageRequest, 
  CreateMessageResponse, 
  GetChatsResponse,
  ChatThread,
  ChatMessage
} from '../../shared/types';

// Simple metrics tracking interface matching TokenMetrics
interface SimpleMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  startTime: number;
  duration: number;
  estimatedCost: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
}

/**
 * Controller for chat operations
 * 
 * Handles all chat-related HTTP endpoints and delegates
 * business logic to appropriate services and repositories.
 */
export class ChatController {
  private aiService: ReturnType<typeof createAIService>;

  constructor(openRouterApiKey: string) {
    this.aiService = createAIService(openRouterApiKey);
  }

  /**
   * Get all chat threads (with efficient pagination)
   * 
   * @route GET /api/chats
   * @query limit - Number of threads to fetch (default: 50)
   * @query startAfter - Pagination cursor
   * @query summaryOnly - If true, returns thread summaries without messages
   */
  getAllThreads = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const summaryOnly = req.query.summaryOnly === 'true';
      const startAfter = req.query.startAfter as string; // Cursor for pagination

      console.log(`[ChatController] Fetching chat threads for user: ${req.user.uid} (limit: ${limit}, summaryOnly: ${summaryOnly})`);
      
      if (summaryOnly) {
        // Use thread summaries for efficient list view
        const result = await firestoreChatStorage.getThreadSummaries(req.user.uid, limit);
        const response = {
          threads: result.threads,
          hasMore: result.hasMore,
          cursor: result.lastVisible?.id
        };
        
        console.log(`[ChatController] Successfully fetched ${result.threads.length} thread summaries`);
        res.json(response);
      } else {
        // Use efficient batch loading
        const result = await firestoreChatStorage.getAllThreadsEfficient(req.user.uid, limit);
        const response: GetChatsResponse & { hasMore?: boolean; cursor?: string } = { 
          threads: result.threads,
          hasMore: result.hasMore,
          cursor: result.lastVisible?.id
        };
        
        console.log(`[ChatController] Successfully fetched ${result.threads.length} chat threads efficiently`);
        res.json(response);
      }
    } catch (error) {
      console.error('[ChatController] Error getting chats:', error);
      next(error);
    }
  };

  /**
   * Get specific chat thread by ID
   * 
   * @route GET /api/chats/:threadId
   */
  getThread = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadId } = req.params;
      
      if (!threadId?.trim()) {
        res.status(400).json({ 
          error: 'Thread ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Fetching chat thread: ${threadId} for user: ${req.user.uid}`);
      const thread = await firestoreChatStorage.getThread(req.user.uid, threadId);
      
      if (!thread) {
        res.status(404).json({ 
          error: 'Thread not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Successfully fetched thread: ${thread.title}`);
      res.json(thread);
    } catch (error) {
      console.error('[ChatController] Error getting thread:', error);
      next(error);
    }
  };

  /**
   * Create new message and get AI response
   * 
   * @route POST /api/chats/message
   */
  createMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadId, content, imageUrl, images, modelId, useReasoning, reasoningEffort }: CreateMessageRequest = req.body;

      // Validate request
      if (!content?.trim()) {
        res.status(400).json({ 
          error: 'Message content is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!modelId) {
        res.status(400).json({ 
          error: 'Model ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`[ChatController] Creating message for thread: ${threadId || 'new'} for user: ${req.user.uid}`);

      let currentThread: ChatThread | null = null;

      // Get or create thread
      if (threadId) {
        currentThread = await firestoreChatStorage.getThread(req.user.uid, threadId);
        if (!currentThread) {
          res.status(404).json({ 
            error: 'Thread not found',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } else {
        // Create new thread with the message content as title (truncated)
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        currentThread = await firestoreChatStorage.createThread(req.user.uid, title);
        console.log(`[ChatController] Created new thread: ${currentThread.id}`);
      }

      // Create user message with multiple images support
      const userMessage = firestoreChatStorage.createMessage(
        content.trim(),
        'user',
        imageUrl // Keep backward compatibility for single imageUrl
      );

      // Add multiple images to the message if provided
      if (images && images.length > 0) {
        userMessage.images = images;
        console.log(`[ChatController] Added ${images.length} image(s) to user message`);
      }

      // Add user message to thread
      await firestoreChatStorage.addMessageToThread(req.user.uid, currentThread.id, userMessage);

      // Get conversation history for AI
      const updatedThread = await firestoreChatStorage.getThread(req.user.uid, currentThread.id);
      if (!updatedThread) {
        throw new Error('Failed to retrieve updated thread');
      }

      // Generate AI response
      console.log(`[ChatController] Generating AI response with model: ${modelId}${useReasoning ? ' (with reasoning)' : ''}`);
      const aiResponse = await this.aiService.generateResponse(
        updatedThread.messages,
        modelId as any, // Type assertion - could be improved with proper typing
        useReasoning || false, // Use reasoning from request
        reasoningEffort || 'high' // Use reasoning effort from request
      );

      // Create assistant message
      const assistantMessage = firestoreChatStorage.createMessage(
        aiResponse.content,
        'assistant',
        undefined,
        modelId
      );

      // Add reasoning if provided
      if (aiResponse.reasoning) {
        assistantMessage.reasoning = aiResponse.reasoning;
      }

      // Add assistant message to thread
      await firestoreChatStorage.addMessageToThread(req.user.uid, currentThread.id, assistantMessage);

      // Prepare response
      const response: CreateMessageResponse = {
        threadId: currentThread.id,
        message: userMessage,
        assistantResponse: assistantMessage
      };

      console.log(`[ChatController] Successfully created message exchange in thread: ${currentThread.id}`);
      res.json(response);

    } catch (error) {
      console.error('[ChatController] Error creating message:', error);
      next(error);
    }
  };

  /**
   * Delete chat thread
   * 
   * @route DELETE /api/chats/:threadId
   */
  deleteThread = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadId } = req.params;
      
      if (!threadId?.trim()) {
        res.status(400).json({ 
          error: 'Thread ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Deleting thread: ${threadId} for user: ${req.user.uid}`);
      const deleted = await firestoreChatStorage.deleteThread(req.user.uid, threadId);
      
      if (!deleted) {
        res.status(404).json({ 
          error: 'Thread not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Successfully deleted thread: ${threadId}`);
      res.json({ 
        success: true,
        message: 'Thread deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[ChatController] Error deleting thread:', error);
      next(error);
    }
  };

  /**
   * Update thread title
   * 
   * @route PUT /api/chats/:threadId/title
   */
  updateThreadTitle = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadId } = req.params;
      const { title } = req.body;
      
      if (!threadId?.trim()) {
        res.status(400).json({ 
          error: 'Thread ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      if (!title?.trim()) {
        res.status(400).json({ 
          error: 'Title is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Updating thread title: ${threadId} for user: ${req.user.uid}`);
      const updatedThread = await firestoreChatStorage.updateThreadTitle(req.user.uid, threadId, title.trim());
      
      if (!updatedThread) {
        res.status(404).json({ 
          error: 'Thread not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Successfully updated thread title: ${threadId}`);
      res.json(updatedThread);
    } catch (error) {
      console.error('[ChatController] Error updating thread title:', error);
      next(error);
    }
  };

  /**
   * Create new message and get AI response via streaming
   * 
   * @route POST /api/chats/message/stream
   */
  createMessageStream = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadId, content, imageUrl, images, modelId, useReasoning, reasoningEffort, useWebSearch, webSearchEffort }: any = req.body;

      // Validate request
      if (!content?.trim() && (!imageUrl?.trim()) && (!images || images.length === 0)) {
        res.status(400).json({ 
          error: 'Content, image URL, or images are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      console.log(`[ChatController] Starting streaming message for thread: ${threadId || 'new'} for user: ${req.user.uid}`);

      let currentThread: any = null;

      // Get or create thread
      if (threadId) {
        currentThread = await firestoreChatStorage.getThread(req.user.uid, threadId);
        if (!currentThread) {
          res.write(`data: ${JSON.stringify({ error: 'Thread not found' })}\n\n`);
          res.end();
          return;
        }
      } else {
        // Create new thread with the message content as title (truncated)
        const title = content?.length > 50 ? content.substring(0, 50) + '...' : content || 'Image Analysis';
        currentThread = await firestoreChatStorage.createThread(req.user.uid, title);
        console.log(`[ChatController] Created new thread for streaming: ${currentThread.id}`);
      }

      // Send thread info to client
      res.write(`data: ${JSON.stringify({ 
        type: 'thread_info', 
        threadId: currentThread.id 
      })}\n\n`);

      // Create user message with multiple images support
      const userMessage = firestoreChatStorage.createMessage(
        content || 'Analyze this image',
        'user',
        imageUrl // Keep backward compatibility for single imageUrl
      );

      // Add multiple images to the message if provided
      if (images && images.length > 0) {
        userMessage.images = images;
        console.log(`[ChatController] Added ${images.length} image(s) to streaming user message`);
      }

      // Add user message to thread
      await firestoreChatStorage.addMessageToThread(req.user.uid, currentThread.id, userMessage);

      // Send user message confirmation (simplified to avoid large JSON issues)
      res.write(`data: ${JSON.stringify({ 
        type: 'user_message', 
        message: {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          imageCount: images?.length || (imageUrl ? 1 : 0)
        }
      })}\n\n`);

      // Get conversation history for AI
      const updatedThread = await firestoreChatStorage.getThread(req.user.uid, currentThread.id);
      if (!updatedThread) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to retrieve updated thread' })}\n\n`);
        res.end();
        return;
      }

      console.log(`[ChatController] Streaming AI response with model: ${modelId}`);
      
      // Initialize simple metrics tracking for this response
      const streamStartTime = Date.now();
      let totalChunkCount = 0;
      
      // Simple metrics calculation
      const getSimpleMetrics = (): SimpleMetrics => {
        const duration = Date.now() - streamStartTime;
        const estimatedTokens = totalChunkCount * 10; // Rough estimate
        const tokensPerSecond = duration > 0 ? estimatedTokens / (duration / 1000) : 0;
        const cost = estimatedTokens * 0.00001; // Rough cost estimate
        return {
          inputTokens: 0,
          outputTokens: estimatedTokens,
          totalTokens: estimatedTokens,
          tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
          startTime: streamStartTime,
          duration,
          estimatedCost: {
            input: 0,
            output: cost,
            total: cost,
            currency: 'USD'
          }
        };
      };
      
      // Stream the AI response
      res.write(`data: ${JSON.stringify({ type: 'ai_start' })}\n\n`);
      
      let fullContent = '';
      let fullReasoning = '';
      let fullAnnotations: any[] = [];
      let hasContent = false;
      
      console.log(`[ChatController] Starting streaming for model: ${modelId}, useWebSearch: ${useWebSearch}, useReasoning: ${useReasoning}`);
      
      try {
        // Use OpenRouter service directly for streaming (could be abstracted to AIService)
        const { createOpenRouterService } = await import('../openRouterService');
        const openRouterService = createOpenRouterService(process.env.OPENROUTER_API_KEY!);
        
        // Prepare conversation history
        const conversationHistory = updatedThread.messages.map(msg => ({
          role: msg.role as any,
          content: msg.content,
          imageUrl: msg.imageUrl,
          images: msg.images
        }));
        
        console.log(`[ChatController] Conversation history prepared: ${conversationHistory.length} messages`);
        console.log(`[ChatController] Last user message: "${conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 100)}..."`);
        
        const responseStream = await openRouterService.sendMessageStream(
          conversationHistory, 
          modelId as any, 
          useReasoning || false,
          reasoningEffort || 'high',
          useWebSearch || false,
          webSearchEffort || 'medium'
        );
        
        console.log(`[ChatController] Stream started successfully`);
        let chunkCount = 0;
        
        for await (const chunk of responseStream) {
          chunkCount++;
          console.log(`[ChatController] Chunk ${chunkCount}: type="${chunk.split(':')[0]}", length=${chunk.length}, preview="${chunk.substring(0, 100)}..."`);
          
          // Handle reasoning and content chunks with prefixes from OpenRouter
          if (chunk.startsWith('reasoning:')) {
            // Extract reasoning content
            const reasoningChunk = chunk.slice(10); // Remove 'reasoning:' prefix
            console.log(`[ChatController] Processing reasoning chunk: length=${reasoningChunk.length}, preview="${reasoningChunk.substring(0, 50)}..."`);
            
            fullReasoning += reasoningChunk;
            hasContent = true;
            
            console.log(`[ChatController] Full reasoning so far: length=${fullReasoning.length}, preview="${fullReasoning.substring(0, 50)}..."`);
            
            // Update chunk count for metrics
            totalChunkCount++;
            const currentMetrics = getSimpleMetrics();
            
            // Stream reasoning in real-time with token metrics
            res.write(`data: ${JSON.stringify({ 
              type: 'reasoning_chunk', 
              content: reasoningChunk,
              fullReasoning: fullReasoning,
              tokenMetrics: currentMetrics
            })}\n\n`);
          } else if (chunk.startsWith('annotations:')) {
            // Extract annotations content
            try {
              const annotationsChunk = chunk.slice(12); // Remove 'annotations:' prefix
              console.log(`[ChatController] Processing annotations chunk: length=${annotationsChunk.length}, preview="${annotationsChunk.substring(0, 100)}..."`);
              
              const newAnnotations = JSON.parse(annotationsChunk);
              fullAnnotations = [...fullAnnotations, ...newAnnotations];
              
              console.log(`[ChatController] Annotations processed: ${newAnnotations.length} new, ${fullAnnotations.length} total`);
              console.log(`[ChatController] Full content at annotations time: length=${fullContent.length}, preview="${fullContent.substring(0, 50)}..."`);
              
              // Don't set hasContent=true for annotations alone - only for actual content
              // This fixes the issue where Google models with web search would send annotations first,
              // causing hasContent=true but fullContent="" which led to text being cut off
              
              // Stream annotations update
              res.write(`data: ${JSON.stringify({ 
                type: 'annotations_chunk', 
                annotations: fullAnnotations
              })}\n\n`);
            } catch (error) {
              console.warn('[ChatController] Failed to parse annotations chunk:', error);
            }
          } else if (chunk.startsWith('content:')) {
            // Extract content chunk
            const contentChunk = chunk.slice(8); // Remove 'content:' prefix
            console.log(`[ChatController] Processing content chunk: length=${contentChunk.length}, preview="${contentChunk.substring(0, 50)}..."`);
            console.log(`[ChatController] Full content BEFORE adding chunk: length=${fullContent.length}, preview="${fullContent.substring(0, 50)}..."`);
            
            fullContent += contentChunk;
            hasContent = true;
            
            console.log(`[ChatController] Full content AFTER adding chunk: length=${fullContent.length}, preview="${fullContent.substring(0, 50)}..."`);
            
            // Update chunk count for metrics
            totalChunkCount++;
            const currentMetrics = getSimpleMetrics();
            
            // Stream content chunk with token metrics
            res.write(`data: ${JSON.stringify({ 
              type: 'ai_chunk', 
              content: contentChunk, 
              fullContent: fullContent,
              tokenMetrics: currentMetrics
            })}\n\n`);
            
            console.log(`[ChatController] Sent ai_chunk to frontend: chunkLength=${contentChunk.length}, fullContentLength=${fullContent.length}`);
          } else {
            // Fallback for chunks without prefix (backward compatibility)
            console.log(`[ChatController] Processing fallback chunk: length=${chunk.length}, preview="${chunk.substring(0, 50)}..."`);
            console.log(`[ChatController] Full content BEFORE adding fallback chunk: length=${fullContent.length}, preview="${fullContent.substring(0, 50)}..."`);
            
            fullContent += chunk;
            hasContent = true;
            
            console.log(`[ChatController] Full content AFTER adding fallback chunk: length=${fullContent.length}, preview="${fullContent.substring(0, 50)}..."`);
            
            // Update chunk count for metrics
            totalChunkCount++;
            const currentMetrics = getSimpleMetrics();
            
            res.write(`data: ${JSON.stringify({ 
              type: 'ai_chunk', 
              content: chunk, 
              fullContent: fullContent,
              tokenMetrics: currentMetrics
            })}\n\n`);
            
            console.log(`[ChatController] Sent fallback ai_chunk to frontend: chunkLength=${chunk.length}, fullContentLength=${fullContent.length}`);
          }
        }

        console.log(`[ChatController] Streaming completed. Total chunks: ${chunkCount}, hasContent: ${hasContent}`);
        console.log(`[ChatController] Final fullContent: length=${fullContent.length}, preview="${fullContent.substring(0, 100)}..."`);
        console.log(`[ChatController] Final fullReasoning: length=${fullReasoning.length}, preview="${fullReasoning.substring(0, 50)}..."`);
        console.log(`[ChatController] Final fullAnnotations: count=${fullAnnotations.length}`);

        // Only create and save message if we actually received content
        if (hasContent && (fullContent.trim() || fullReasoning.trim())) {
          console.log(`[ChatController] Creating final message with content length: ${fullContent.length}`);
          
          // Get final metrics
          const finalTokenMetrics = getSimpleMetrics();
          
          // Create assistant message with full response
          const assistantMessage = firestoreChatStorage.createMessage(
            fullContent || 'No content received',
            'assistant',
            undefined,
            modelId
          );
          
          console.log(`[ChatController] Created assistant message with content: "${assistantMessage.content.substring(0, 100)}..."`);
          
          // Add real reasoning from OpenRouter if we collected any
          if (fullReasoning) {
            assistantMessage.reasoning = fullReasoning;
            console.log(`[ChatController] Added reasoning to message: length=${fullReasoning.length}`);
          }
          
          // Add web search annotations if we collected any
          if (fullAnnotations.length > 0) {
            assistantMessage.annotations = fullAnnotations;
            console.log(`[ChatController] Added annotations to message: count=${fullAnnotations.length}`);
          }
          
          // Attach token metrics to the assistant message
          assistantMessage.tokenMetrics = finalTokenMetrics;
          
          await firestoreChatStorage.addMessageToThread(req.user.uid, currentThread.id, assistantMessage);

          console.log(`[ChatController] Saved message to database`);

          // Send completion with final token metrics
          res.write(`data: ${JSON.stringify({ 
            type: 'ai_complete', 
            assistantMessage,
            fullContent: fullContent,
            tokenMetrics: finalTokenMetrics
          })}\n\n`);
          
          console.log(`[ChatController] Sent ai_complete to frontend with fullContent length: ${fullContent.length}`);
        } else {
          console.log(`[ChatController] No content received - hasContent: ${hasContent}, fullContent.trim(): "${fullContent.trim()}", fullReasoning.trim(): "${fullReasoning.trim()}"`);
          
          // No content received, send error
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            error: 'No response received from AI model. Check API configuration.' 
          })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

        const finalMetrics = getSimpleMetrics();
        console.log(`[ChatController] Successfully streamed message for thread: ${currentThread.id} (${fullContent.length} characters content, ${fullReasoning.length} characters reasoning, ${finalMetrics.totalTokens} tokens, ${finalMetrics.tokensPerSecond?.toFixed(2)} TPS)`);

      } catch (streamError) {
        console.error('[ChatController] Error in streaming:', streamError);
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          error: streamError instanceof Error ? streamError.message : 'Streaming failed' 
        })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('[ChatController] Error creating streaming message:', error);
      
      try {
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Failed to create streaming message' 
        })}\n\n`);
        res.end();
      } catch (writeError) {
        console.error('[ChatController] Error writing error response:', writeError);
      }
    }
  };

  /**
   * Toggle thread pin status
   * 
   * @route PATCH /api/chats/:threadId/pin
   */
  toggleThreadPin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadId } = req.params;
      const { isPinned } = req.body;
      
      if (!threadId?.trim()) {
        res.status(400).json({ 
          error: 'Thread ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (typeof isPinned !== 'boolean') {
        res.status(400).json({ 
          error: 'isPinned must be a boolean',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] ${isPinned ? 'Pinning' : 'Unpinning'} thread: ${threadId} for user: ${req.user.uid}`);
      
      // Check if thread exists first
      const existingThread = await firestoreChatStorage.getThread(req.user.uid, threadId);
      if (!existingThread) {
        res.status(404).json({ 
          error: 'Thread not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Update the pin status
      const updatedThread = await firestoreChatStorage.updateThreadPin(req.user.uid, threadId, isPinned);
      
      console.log(`[ChatController] Successfully ${isPinned ? 'pinned' : 'unpinned'} thread: ${threadId}`);
      res.json(updatedThread);
    } catch (error) {
      console.error('[ChatController] Error toggling thread pin:', error);
      next(error);
    }
  };

  /**
   * Get messages for multiple threads in batch
   * 
   * @route POST /api/chats/messages/batch
   * @body threadIds - Array of thread IDs to fetch messages for
   */
  getBatchMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ 
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { threadIds } = req.body;
      
      if (!Array.isArray(threadIds) || threadIds.length === 0) {
        res.status(400).json({ 
          error: 'threadIds array is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (threadIds.length > 20) {
        res.status(400).json({ 
          error: 'Maximum 20 threads per batch request',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Batch fetching messages for ${threadIds.length} threads for user: ${req.user.uid}`);
      
      const messagesMap = await firestoreChatStorage.getBatchMessages(req.user.uid, threadIds);
      
      // Convert Map to plain object for JSON response
      const messagesObject: Record<string, ChatMessage[]> = {};
      messagesMap.forEach((messages, threadId) => {
        messagesObject[threadId] = messages;
      });
      
      console.log(`[ChatController] Successfully batch fetched messages for ${threadIds.length} threads`);
      res.json({ messages: messagesObject });
    } catch (error) {
      console.error('[ChatController] Error batch fetching messages:', error);
      next(error);
    }
  };

  /**
   * Health check endpoint
   * 
   * @route GET /api/chats/health
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const aiHealthy = await this.aiService.healthCheck();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          ai: aiHealthy ? 'healthy' : 'unhealthy',
          storage: 'healthy' // Could add repository health check
        }
      });
    } catch (error) {
      console.error('[ChatController] Health check error:', error);
      next(error);
    }
  };

  /**
   * Get Express router with all chat routes
   * 
   * @returns Express router
   */
  getRoutes(): Router {
    const router = Router();

    // Public routes (no authentication required)
    router.get('/health', this.healthCheck);

    // Protected routes (authentication required)
    router.use(authenticateUser); // Apply authentication to all routes below
    router.get('/', this.getAllThreads);
    router.get('/:threadId', this.getThread);
    router.post('/message', this.createMessage);
    router.post('/message/stream', this.createMessageStream);
    router.post('/messages/batch', this.getBatchMessages);
    router.delete('/:threadId', this.deleteThread);
    router.put('/:threadId/title', this.updateThreadTitle);
    router.patch('/:threadId/pin', this.toggleThreadPin);

    return router;
  }
}

/**
 * Factory function to create chat controller
 * 
 * @param openRouterApiKey - OpenRouter API key
 * @returns ChatController instance
 */
export const createChatController = (openRouterApiKey: string): ChatController => {
  return new ChatController(openRouterApiKey);
}; 