/**
 * types.ts
 * 
 * Shared TypeScript type definitions for the OpenRouter Chat application
 * 
 * Types:
 *   - ChatMessage: Individual chat message structure
 *   - ChatThread: Chat conversation thread structure
 *   - UserChats: User's complete chat data structure
 *   - API Request/Response types for client-server communication
 *   - OpenRouter API integration types
 * 
 * Usage: import type { ChatMessage, ChatThread } from '../shared/types'
 */

/**
 * Individual chat message structure
 * 
 * @interface ChatMessage
 * @property id - Unique message identifier (UUID)
 * @property role - Message sender role (user or AI assistant)
 * @property content - Message text content
 * @property timestamp - Message creation timestamp
 * @property imageUrl - Optional image URL for analysis (deprecated, use images)
 * @property images - Optional array of image attachments
 * @property modelId - AI model used for processing (for assistant messages)
 * @property reasoning - Optional reasoning content for reasoning models (raw text)
 * @property metadata - Optional metadata for additional message information
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // For image analysis messages (deprecated, use images)
  images?: ImageAttachment[]; // Multiple image support
  modelId?: string; // AI model used (for assistant messages)
  reasoning?: string; // Raw reasoning content for reasoning models
  metadata?: { // Additional message metadata
    reasoningDuration?: number; // Duration in milliseconds for reasoning
    isReasoning?: boolean; // Whether the message is currently reasoning
    [key: string]: any; // Allow other metadata
  };
}

/**
 * Image attachment structure
 * 
 * @interface ImageAttachment
 * @property id - Unique attachment identifier
 * @property url - Image URL (data URL for uploaded files)
 * @property name - Original filename
 * @property size - File size in bytes
 * @property type - MIME type
 */
export interface ImageAttachment {
  id: string;
  url: string; // Data URL or external URL
  name: string;
  size: number;
  type: string; // MIME type like 'image/jpeg'
}

/**
 * Chat conversation thread structure
 * 
 * @interface ChatThread
 * @property id - Unique thread identifier (UUID)
 * @property title - Human-readable thread title
 * @property messages - Array of messages in chronological order
 * @property createdAt - Thread creation timestamp
 * @property updatedAt - Last modification timestamp
 */
export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's complete chat data structure
 * 
 * @interface UserChats
 * @property userId - User identifier (currently defaults to 'default')
 * @property threads - Array of chat threads
 * @property createdAt - Account creation timestamp
 * @property updatedAt - Last data modification timestamp
 */
export interface UserChats {
  userId: string; // Will be 'default' for now, later for authentication
  threads: ChatThread[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== API Request/Response Types =====

/**
 * Request payload for creating a new message
 * 
 * @interface CreateMessageRequest
 * @property threadId - Optional thread ID (creates new thread if omitted)
 * @property content - Message text content
 * @property imageUrl - Optional single image URL (deprecated, use images)
 * @property images - Optional array of image attachments
 * @property modelId - AI model to use for processing the message
 */
export interface CreateMessageRequest {
  threadId?: string; // If not provided, creates new thread
  content: string;
  imageUrl?: string; // Deprecated, use images
  images?: ImageAttachment[]; // Multiple image support
  modelId?: string; // AI model identifier
}

/**
 * Response payload for message creation
 * 
 * @interface CreateMessageResponse
 * @property threadId - ID of the thread containing the messages
 * @property message - The user's message that was created
 * @property assistantResponse - The AI assistant's response message
 */
export interface CreateMessageResponse {
  threadId: string;
  message: ChatMessage;
  assistantResponse: ChatMessage;
}

/**
 * Response payload for retrieving all chat threads
 * 
 * @interface GetChatsResponse
 * @property threads - Array of all user's chat threads
 */
export interface GetChatsResponse {
  threads: ChatThread[];
}

// ===== OpenRouter API Types =====

/**
 * OpenRouter API request structure
 * 
 * @interface OpenRouterRequest
 * @property model - AI model identifier
 * @property messages - Array of conversation messages
 * @property stream - Enable streaming responses
 * @property reasoning - Reasoning tokens configuration
 */
export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  stream?: boolean;
  reasoning?: {
    effort?: 'high' | 'medium' | 'low';
    max_tokens?: number;
    exclude?: boolean;
    enabled?: boolean;
  };
}

/**
 * OpenRouter API response structure
 * 
 * @interface OpenRouterResponse
 * @property choices - Array of response choices
 * @property usage - Token usage information
 */
export interface OpenRouterResponse {
  choices: Array<{
    message?: {
      content: string;
      reasoning?: string; // Real reasoning tokens from OpenRouter
    };
    delta?: {
      content?: string;
      reasoning?: string; // Streaming reasoning tokens
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ===== Error Response Types =====

/**
 * Standard API error response structure
 * 
 * @interface ApiErrorResponse
 * @property error - Human-readable error message
 * @property timestamp - Error occurrence timestamp
 * @property path - API endpoint where error occurred (optional)
 */
export interface ApiErrorResponse {
  error: string;
  timestamp: string;
  path?: string;
}

/**
 * Success response structure for operations that don't return data
 * 
 * @interface SuccessResponse
 * @property success - Success indicator
 * @property timestamp - Operation completion timestamp
 * @property message - Optional success message
 */
export interface SuccessResponse {
  success: boolean;
  timestamp: string;
  message?: string;
}

// ===== Health Check Types =====

/**
 * Server health check response structure
 * 
 * @interface HealthResponse
 * @property status - Server health status
 * @property timestamp - Health check timestamp
 * @property uptime - Server uptime in seconds
 * @property version - Application version
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
}

// ===== AI Model Types =====

/**
 * AI model configuration structure
 * 
 * @interface ModelConfig
 * @property name - Human-readable model name
 * @property description - Model description and capabilities
 * @property type - Model type category
 */
export interface ModelConfig {
  name: string;
  description: string;
  type: 'general' | 'reasoning' | 'creative' | 'coding';
}

/**
 * Available models response structure
 * 
 * @interface AvailableModelsResponse
 * @property models - Object mapping model IDs to their configurations
 */
export interface AvailableModelsResponse {
  models: Record<string, ModelConfig>;
}

// ===== Utility Types =====

/**
 * Base entity interface with common fields
 * 
 * @interface BaseEntity
 * @property id - Unique identifier
 * @property createdAt - Creation timestamp
 * @property updatedAt - Last modification timestamp
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message role enumeration for type safety
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Content type enumeration for OpenRouter API
 */
export type ContentType = 'text' | 'image_url';

/**
 * Server environment enumeration
 */
export type Environment = 'development' | 'production' | 'test'; 