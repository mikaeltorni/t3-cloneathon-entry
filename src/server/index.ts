/**
 * index.ts
 * 
 * Main Express server for the OpenRouter Chat application - Refactored Architecture
 * 
 * Features:
 *   - Express.js server with CORS support
 *   - Controller-based routing for better organization
 *   - Service layer abstraction for AI operations
 *   - Repository pattern for data access
 *   - Comprehensive error handling and logging
 *   - Database-ready architecture
 *   - Easy to add authentication middleware
 *   - Static file serving for React frontend
 * 
 * Architecture:
 *   Controllers -> Services -> Repositories -> Storage
 *   
 * Routes:
 *   /api/chats/* - Chat operations (ChatController)
 *   /api/models/* - Model operations (ModelsController)
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createChatController } from './controllers/ChatController';
import { createModelsController } from './controllers/ModelsController';
import { createUserPreferencesController } from './controllers/UserPreferencesController';
import { createDocumentController } from './controllers/DocumentController';
import { rateLimit } from './middleware/rateLimit';
import { optionalAuth } from './middleware/auth';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Get API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable is required');
  console.error('💡 Set it with: $env:OPENROUTER_API_KEY="sk-or-v1-your-key-here"');
  process.exit(1);
}

// Initialize controllers
const chatController = createChatController(OPENROUTER_API_KEY);
const modelsController = createModelsController(OPENROUTER_API_KEY);
const userPreferencesController = createUserPreferencesController();
const documentController = createDocumentController();

/**
 * Get allowed origins from environment variables
 */
export const getAllowedOrigins = (): string[] => {
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = process.env.PRODUCTION_ORIGINS;
    if (!prodOrigins) {
      console.error('❌ PRODUCTION_ORIGINS not set in production environment');
      console.error('💡 Set it with: PRODUCTION_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"');
      return [];
    }
    const origins = prodOrigins.split(',').map(origin => origin.trim());
    
    // Validate production origins
    origins.forEach(origin => {
      if (!origin.startsWith('https://')) {
        console.warn(`⚠️ Production origin "${origin}" should use HTTPS`);
      }
    });
    
    return origins;
  } else {
    const devOrigins = process.env.DEVELOPMENT_ORIGINS;
    return devOrigins ? devOrigins.split(',').map(origin => origin.trim()) : 
           ['http://localhost:3000', 'http://localhost:5173'];
  }
};

// Initialize CORS with environment-based origins
const allowedOrigins = getAllowedOrigins();
console.log(`🔒 CORS Configuration: ${allowedOrigins.length} allowed origins:`, allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ 
  limit: '50mb' // Increased limit to handle multiple base64-encoded images
}));
app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true 
}));

// Serve static files from web-app dist
app.use(express.static(path.join(__dirname, '../../web-app/dist')));

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
  
  // Don't leak internal errors to client in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? error.message : 'Internal server error';
  
  res.status(500).json({ 
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

// Apply request logging
app.use(requestLogger);

/**
 * Critical endpoints that should NOT be rate limited - define BEFORE rate limiting middleware
 */

/**
 * Firebase configuration endpoint
 * 
 * @route GET /api/config/firebase
 */
app.get('/api/config/firebase', (req: Request, res: Response) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  // Check if all required Firebase config is present
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingKeys.length > 0) {
    return res.status(500).json({
      error: 'Firebase configuration incomplete',
      missingKeys,
      message: 'Please check your environment variables'
    });
  }

  res.json(firebaseConfig);
});

/**
 * Root health check endpoint
 * 
 * @route GET /api/health
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Rate limit status endpoint for debugging
 * 
 * @route GET /api/rate-limit-status
 */
app.get('/api/rate-limit-status', async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const key = authReq.user?.uid ? `user_${authReq.user.uid}` : `ip_${req.ip}`;
    
    res.json({
      userKey: key,
      userType: authReq.user ? 'authenticated' : 'anonymous',
      userId: authReq.user?.uid || null,
      ip: req.ip || 'unknown',
      rateLimit: {
        description: 'Rate limiting only applied to authenticated users',
        note: 'Anonymous users have no rate limits'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error);
    res.status(500).json({
      error: 'Failed to get rate limit status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * API information endpoint
 * 
 * @route GET /api
 */
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'OpenRouter Chat API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'AI chat application with multiple model support',
    endpoints: {
      chats: '/api/chats',
      models: '/api/models',
      health: '/api/health',
      'config/firebase': '/api/config/firebase'
    },
    documentation: {
      chats: {
        'GET /api/chats': 'Get all chat threads',
        'GET /api/chats/:threadId': 'Get specific chat thread',
        'POST /api/chats/message': 'Create message and get AI response',
        'POST /api/chats/message/stream': 'Create message and stream AI response',
        'DELETE /api/chats/:threadId': 'Delete chat thread',
        'PUT /api/chats/:threadId/title': 'Update thread title',
        'GET /api/chats/health': 'Chat service health check'
      },
      models: {
        'GET /api/models': 'Get available AI models',
        'GET /api/models/:modelId': 'Get specific model info',
        'GET /api/models/:modelId/reasoning': 'Check reasoning support',
        'GET /api/models/health': 'Models service health check',
        'GET /api/models/stats': 'Get model statistics',
        'POST /api/models/validate': 'Validate model configuration'
      },
      config: {
        'GET /api/config/firebase': 'Get Firebase configuration for frontend'
      }
    },
    rateLimit: {
      description: 'Rate limiting only applied to authenticated users',
      note: 'Anonymous users and critical endpoints have no rate limits'
    },
    timestamp: new Date().toISOString()
  });
});

// Apply optional authentication before rate limiting (so rate limiter can see authenticated users)
app.use('/api', optionalAuth);

// Apply rate limiting to remaining API requests (after critical endpoints and optional auth)
app.use('/api', rateLimit);

// API Routes using controllers
app.use('/api/chats', chatController.getRoutes());
app.use('/api/models', modelsController.getRoutes());
app.use('/api/preferences', userPreferencesController.getRoutes());
app.use('/api/documents', documentController.getRoutes());

// Catch-all handler for React frontend
app.get('*', (req: Request, res: Response) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      timestamp: new Date().toISOString(),
      availableEndpoints: ['/api/chats', '/api/models', '/api/health']
    });
  }
  
  // Serve React frontend
  res.sendFile(path.join(__dirname, '../../web-app/dist/index.html'));
});

// Apply global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('🚀 OpenRouter Chat Server Started!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chats`);
  console.log(`🤖 Models API: http://localhost:${PORT}/api/models`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔑 OpenRouter API Key: ${OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing (see env.template)'}`);
  console.log(`📂 Static files: ${path.join(__dirname, '../../web-app/dist')}`);
  console.log('');
  console.log('🎯 Ready for database integration and authentication!');
  console.log('🔥 Architecture: Controllers -> Services -> Repositories -> Storage');
});