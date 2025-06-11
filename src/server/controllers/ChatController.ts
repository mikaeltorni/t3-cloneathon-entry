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
import { Request, Response, NextFunction, Router } from 'express';
import { chatRepository } from '../repositories/ChatRepository';
import { createAIService } from '../services/AIService';
import type { 
  CreateMessageRequest, 
  CreateMessageResponse, 
  GetChatsResponse,
  ChatThread,
  ChatMessage
} from '../../shared/types';

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
   * Get all chat threads
   * 
   * @route GET /api/chats
   */
  getAllThreads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('[ChatController] Fetching all chat threads...');
      
      const threads = await chatRepository.getAllThreads();
      const response: GetChatsResponse = { threads };
      
      console.log(`[ChatController] Successfully fetched ${threads.length} chat threads`);
      res.json(response);
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
  getThread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { threadId } = req.params;
      
      if (!threadId?.trim()) {
        res.status(400).json({ 
          error: 'Thread ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Fetching chat thread: ${threadId}`);
      const thread = await chatRepository.getThread(threadId);
      
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
  createMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { threadId, content, imageUrl, images, modelId }: CreateMessageRequest = req.body;

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

      console.log(`[ChatController] Creating message for thread: ${threadId || 'new'}`);

      let currentThread: ChatThread | null = null;

      // Get or create thread
      if (threadId) {
        currentThread = await chatRepository.getThread(threadId);
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
        currentThread = await chatRepository.createThread(title);
        console.log(`[ChatController] Created new thread: ${currentThread.id}`);
      }

      // Process images if provided
      let processedImageUrl = imageUrl;
      if (images && images.length > 0) {
        // Use the first image for now - could be enhanced to handle multiple images
        processedImageUrl = images[0].url;
        console.log(`[ChatController] Processing ${images.length} image(s)`);
      }

      // Create user message
      const userMessage = await chatRepository.createMessage(
        content.trim(),
        'user',
        processedImageUrl
      );

      // Add user message to thread
      await chatRepository.addMessageToThread(currentThread.id, userMessage);

      // Get conversation history for AI
      const updatedThread = await chatRepository.getThread(currentThread.id);
      if (!updatedThread) {
        throw new Error('Failed to retrieve updated thread');
      }

      // Generate AI response
      console.log(`[ChatController] Generating AI response with model: ${modelId}`);
      const aiResponse = await this.aiService.generateResponse(
        updatedThread.messages,
        modelId as any, // Type assertion - could be improved with proper typing
        false // useReasoning - could be extracted from request
      );

      // Create assistant message
      const assistantMessage = await chatRepository.createMessage(
        aiResponse.content,
        'assistant',
        undefined,
        modelId
      );

      // Add assistant message to thread
      await chatRepository.addMessageToThread(currentThread.id, assistantMessage);

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
  deleteThread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { threadId } = req.params;
      
      if (!threadId?.trim()) {
        res.status(400).json({ 
          error: 'Thread ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ChatController] Deleting thread: ${threadId}`);
      const deleted = await chatRepository.deleteThread(threadId);
      
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
  updateThreadTitle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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
      
      console.log(`[ChatController] Updating thread title: ${threadId}`);
      const updatedThread = await chatRepository.updateThreadTitle(threadId, title.trim());
      
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

    // Define routes
    router.get('/', this.getAllThreads);
    router.get('/health', this.healthCheck);
    router.get('/:threadId', this.getThread);
    router.post('/message', this.createMessage);
    router.delete('/:threadId', this.deleteThread);
    router.put('/:threadId/title', this.updateThreadTitle);

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