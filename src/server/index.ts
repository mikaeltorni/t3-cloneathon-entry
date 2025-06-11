/**
 * index.ts
 * 
 * Main Express server for the OpenRouter Chat application
 * 
 * Features:
 *   - Express.js server with CORS support
 *   - RESTful API endpoints for chat management
 *   - Static file serving for React frontend
 *   - Comprehensive error handling and logging
 *   - OpenRouter API integration
 *   - File-based chat storage
 * 
 * Routes:
 *   GET /api/chats - Get all chat threads
 *   GET /api/chats/:threadId - Get specific chat thread
 *   POST /api/chats/message - Send message and get AI response
 *   DELETE /api/chats/:threadId - Delete chat thread
 *   PUT /api/chats/:threadId/title - Update thread title
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { chatStorage } from './chatStorage';
import { createOpenRouterService, type ModelId } from './openRouterService';
import type { 
  CreateMessageRequest, 
  CreateMessageResponse, 
  GetChatsResponse 
} from '../shared/types';

const app = express();
const PORT = process.env.PORT || 3001;

// Get API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable is required');
  console.error('💡 Set it with: $env:OPENROUTER_API_KEY="sk-or-v1-your-key-here"');
  process.exit(1);
}

const openRouterService = createOpenRouterService(OPENROUTER_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from web-app dist
app.use(express.static(path.join(__dirname, '../../web-app/dist')));

/**
 * Global error handler middleware
 * 
 * @param error - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, error);
  
  // Don't leak internal errors to client
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? error.message : 'Internal server error';
  
  res.status(500).json({ 
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

/**
 * Request logging middleware
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

// Apply request logging
app.use(requestLogger);

// API Routes

/**
 * Get available AI models
 * 
 * @route GET /api/models
 * @returns Available models configuration
 */
app.get('/api/models', (req: Request, res: Response) => {
  try {
    console.log('Fetching available AI models...');
    const models = openRouterService.getAvailableModels();
    
    console.log(`Successfully fetched ${Object.keys(models).length} available models`);
    res.json({ models });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({ 
      error: 'Failed to get available models',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get all chat threads
 * 
 * @route GET /api/chats
 * @returns Array of chat threads
 */
app.get('/api/chats', (req: Request, res: Response) => {
  try {
    console.log('Fetching all chat threads...');
    const threads = chatStorage.getAllThreads();
    const response: GetChatsResponse = { threads };
    
    console.log(`Successfully fetched ${threads.length} chat threads`);
    res.json(response);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ 
      error: 'Failed to get chats',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get specific chat thread by ID
 * 
 * @route GET /api/chats/:threadId
 * @param threadId - ID of the thread to fetch
 * @returns Chat thread data
 */
app.get('/api/chats/:threadId', (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    
    if (!threadId?.trim()) {
      return res.status(400).json({ 
        error: 'Thread ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Fetching chat thread: ${threadId}`);
    const thread = chatStorage.getThread(threadId);
    
    if (!thread) {
      return res.status(404).json({ 
        error: 'Thread not found',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Successfully fetched thread: ${thread.title}`);
    res.json(thread);
  } catch (error) {
    console.error('Error getting thread:', error);
    res.status(500).json({ 
      error: 'Failed to get thread',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Create new message and get AI response
 * 
 * @route POST /api/chats/message
 * @body CreateMessageRequest
 * @returns CreateMessageResponse with user message and AI response
 */
app.post('/api/chats/message', async (req: Request, res: Response) => {
  try {
    const { threadId, content, imageUrl, modelId }: CreateMessageRequest = req.body;
    
    // Validate request
    if (!content?.trim() && !imageUrl?.trim()) {
      return res.status(400).json({ 
        error: 'Content or image URL is required',
        timestamp: new Date().toISOString()
      });
    }

    let thread;
    let currentThreadId = threadId;

    // Create new thread if none provided
    if (!currentThreadId) {
      const title = content?.length > 50 
        ? content.substring(0, 50) + '...' 
        : content || 'Image Analysis';
      
      console.log(`Creating new thread: ${title}`);
      thread = chatStorage.createThread(title);
      currentThreadId = thread.id;
    } else {
      console.log(`Using existing thread: ${currentThreadId}`);
      thread = chatStorage.getThread(currentThreadId);
      if (!thread) {
        return res.status(404).json({ 
          error: 'Thread not found',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Create user message
    const userMessage = chatStorage.createMessage(
      content || 'Analyze this image', 
      'user', 
      imageUrl
    );
    chatStorage.addMessageToThread(currentThreadId, userMessage);

    // Prepare conversation history for AI
    const conversationHistory = thread.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      imageUrl: msg.imageUrl
    }));

    // Add the new user message to history
    conversationHistory.push({
      role: 'user',
      content: content || 'Analyze this image',
      imageUrl
    });

    console.log(`Sending message to OpenRouter AI (${conversationHistory.length} messages in history)`);
    
    // Get AI response
    const aiResponse = await openRouterService.sendMessage(conversationHistory, modelId as ModelId);
    
    // Create assistant message with model information
    const assistantMessage = chatStorage.createMessage(aiResponse, 'assistant', undefined, modelId);
    chatStorage.addMessageToThread(currentThreadId, assistantMessage);

    const response: CreateMessageResponse = {
      threadId: currentThreadId,
      message: userMessage,
      assistantResponse: assistantMessage
    };

    console.log(`Successfully processed message for thread: ${currentThreadId}`);
    res.json(response);
  } catch (error) {
    console.error('Error creating message:', error);
    
    // Handle specific OpenRouter errors
    if (error instanceof Error && error.message.includes('OpenRouter API error')) {
      return res.status(502).json({ 
        error: `AI service error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create message',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Delete chat thread
 * 
 * @route DELETE /api/chats/:threadId
 * @param threadId - ID of the thread to delete
 * @returns Success confirmation
 */
app.delete('/api/chats/:threadId', (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    
    if (!threadId?.trim()) {
      return res.status(400).json({ 
        error: 'Thread ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Deleting chat thread: ${threadId}`);
    const success = chatStorage.deleteThread(threadId);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Thread not found',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Successfully deleted thread: ${threadId}`);
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ 
      error: 'Failed to delete thread',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update chat thread title
 * 
 * @route PUT /api/chats/:threadId/title
 * @param threadId - ID of the thread to update
 * @body { title: string }
 * @returns Updated thread data
 */
app.put('/api/chats/:threadId/title', (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { title } = req.body;
    
    if (!threadId?.trim()) {
      return res.status(400).json({ 
        error: 'Thread ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!title?.trim()) {
      return res.status(400).json({ 
        error: 'Title is required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Updating thread title: ${threadId} -> ${title}`);
    const thread = chatStorage.updateThreadTitle(threadId, title.trim());
    
    if (!thread) {
      return res.status(404).json({ 
        error: 'Thread not found',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Successfully updated thread title: ${thread.title}`);
    res.json(thread);
  } catch (error) {
    console.error('Error updating thread title:', error);
    res.status(500).json({ 
      error: 'Failed to update thread title',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint
 * 
 * @route GET /api/health
 * @returns Server health status
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Serve React app for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../web-app/dist/index.html'));
});

// Apply error handler last
app.use(errorHandler);

/**
 * Start the server
 */
const server = app.listen(PORT, () => {
  console.log(`🚀 Chat server running on http://localhost:${PORT}`);
  console.log(`📁 Chat data will be saved to: ${path.join(process.cwd(), 'data', 'userChats.json')}`);
  console.log(`🤖 OpenRouter API key: ${OPENROUTER_API_KEY.substring(0, 10)}...`);
  console.log(`📱 Web interface available at: http://localhost:${PORT}`);
});

/**
 * Graceful shutdown handling
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
}); 