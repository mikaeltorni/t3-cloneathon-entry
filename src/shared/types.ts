/**
 * types.ts
 * 
 * Shared TypeScript type definitions for the OpenRouter Chat application
 * Enhanced with strict typing, discriminated unions, and comprehensive coverage
 * 
 * Types:
 *   - Core Domain Types: ChatMessage, ChatThread, UserChats
 *   - API Types: Request/Response interfaces with strict validation
 *   - OpenRouter Integration: Enhanced with proper reasoning types
 *   - Error Handling: Comprehensive error type definitions
 *   - Utility Types: Helper types for better developer experience
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
 * @property documents - Optional array of document attachments
 * @property modelId - AI model used for processing (for assistant messages)
 * @property reasoning - Optional reasoning content for reasoning models (raw text)
 * @property annotations - Optional web search annotations with URL citations
 * @property tokenMetrics - Optional token usage and performance metrics (for assistant messages)
 * @property metadata - Optional metadata for additional message information
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // For image analysis messages (deprecated, use images)
  images?: ImageAttachment[]; // Multiple image support
  documents?: DocumentAttachment[]; // Multiple document support
  modelId?: string; // AI model used (for assistant messages)
  reasoning?: string; // Raw reasoning content for reasoning models
  annotations?: WebSearchAnnotation[]; // Web search citations
  tokenMetrics?: TokenMetrics; // Token usage and performance metrics (for assistant messages)
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
 * @property isUploading - Whether the file is currently being processed
 * @property progress - Upload/processing progress (0-100)
 * @property error - Error message if processing failed
 */
export interface ImageAttachment {
  id: string;
  url: string; // Data URL or external URL
  name: string;
  size: number;
  type: string; // MIME type like 'image/jpeg'
  isUploading?: boolean; // Whether the file is currently being processed
  progress?: number; // Upload/processing progress (0-100)
  error?: string; // Error message if processing failed
}

/**
 * Document attachment structure
 * 
 * @interface DocumentAttachment
 * @property id - Unique attachment identifier
 * @property url - Document URL (data URL for uploaded files or external URL)
 * @property name - Original filename
 * @property size - File size in bytes
 * @property type - MIME type
 * @property content - Extracted text content from the document
 * @property category - Document category for UI display
 * @property isUploading - Whether the file is currently being processed
 * @property progress - Upload/processing progress (0-100)
 * @property error - Error message if processing failed
 */
export interface DocumentAttachment {
  id: string;
  url: string; // Data URL or external URL
  name: string;
  size: number;
  type: string; // MIME type like 'application/pdf', 'text/plain', etc.
  content: string; // Extracted text content
  category: 'pdf' | 'text' | 'markdown' | 'other';
  isUploading?: boolean; // Whether the file is currently being processed
  progress?: number; // Upload/processing progress (0-100)
  error?: string; // Error message if processing failed
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
 * @property currentModel - Currently selected model for this thread
 * @property lastUsedModel - Last model that was actually used for a message in this thread
 * @property isPinned - Whether the thread is pinned to the top of the list
 * @property tags - Array of tag IDs associated with this thread
 */
export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  currentModel?: string; // Currently selected model ID for this thread
  lastUsedModel?: string; // Last model ID that was actually used in this thread
  isPinned?: boolean; // Whether the thread is pinned to the top
  tags?: string[]; // Array of tag IDs associated with this thread
  contextWindowUsage?: { // Current context window utilization
    used: number;
    total: number;
    percentage: number;
    modelId: string;
    lastUpdated: Date;
  };
}

/**
 * Chat tag structure for organizing and filtering chats
 * 
 * @interface ChatTag
 * @property id - Unique tag identifier
 * @property name - Tag display name
 * @property color - Tag color in RGB format
 * @property createdAt - Tag creation timestamp
 */
export interface ChatTag {
  id: string;
  name: string;
  color: {
    r: number; // 0-255
    g: number; // 0-255
    b: number; // 0-255
  };
  createdAt: Date;
}

/**
 * User-created app structure for custom AI assistants
 * 
 * @interface App
 * @property id - Unique app identifier
 * @property name - App display name
 * @property systemPrompt - System prompt that defines the app's behavior
 * @property createdAt - App creation timestamp
 * @property updatedAt - Last modification timestamp
 * @property isActive - Whether the app is currently active/selected
 */
export interface App {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
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
 * @property documents - Optional array of document attachments
 * @property modelId - AI model to use for processing the message
 * @property useReasoning - Whether to enable reasoning for supported models
 * @property reasoningEffort - Reasoning effort level for supported models
 * @property useWebSearch - Whether to enable web search for supported models
 * @property webSearchEffort - Web search effort level for supported models
 */
export interface CreateMessageRequest {
  threadId?: string; // If not provided, creates new thread
  content: string;
  imageUrl?: string; // Deprecated, use images
  images?: ImageAttachment[]; // Multiple image support
  documents?: DocumentAttachment[]; // Multiple document support
  modelId?: string; // AI model identifier
  useReasoning?: boolean; // Enable reasoning for supported models
  reasoningEffort?: 'low' | 'medium' | 'high'; // Reasoning effort level
  useWebSearch?: boolean; // Enable web search for supported models
  webSearchEffort?: 'low' | 'medium' | 'high'; // Web search effort level
}

/**
 * Token metrics for tracking tokenization performance
 * 
 * @interface TokenMetrics
 * @property inputTokens - Total input tokens
 * @property outputTokens - Total output tokens generated
 * @property totalTokens - Total tokens (input + output)
 * @property tokensPerSecond - Tokens per second during generation
 * @property startTime - Generation start time
 * @property endTime - Generation end time
 * @property duration - Generation duration in milliseconds
 * @property estimatedCost - Estimated cost based on token count
 */
export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  estimatedCost?: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
  contextWindow?: {
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  };
}

/**
 * Response payload for message creation
 * 
 * @interface CreateMessageResponse
 * @property threadId - ID of the thread containing the messages
 * @property message - The user's message that was created
 * @property assistantResponse - The AI assistant's response message
 * @property tokenMetrics - Token usage and performance metrics
 */
export interface CreateMessageResponse {
  threadId: string;
  message: ChatMessage;
  assistantResponse: ChatMessage;
  tokenMetrics?: TokenMetrics;
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
 * @property web_search_options - Web search configuration options
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
  web_search_options?: {
    search_context_size?: 'low' | 'medium' | 'high';
  };
}

/**
 * Web search URL citation annotation structure
 * Based on OpenRouter's standardized annotation schema
 */
export interface UrlCitation {
  url: string;
  title: string;
  content?: string; // Added by OpenRouter if available
  start_index: number; // The index of the first character of the URL citation in the message
  end_index: number; // The index of the last character of the URL citation in the message
}

/**
 * Web search annotation structure
 * Based on OpenRouter's annotation schema
 */
export interface WebSearchAnnotation {
  type: 'url_citation';
  url_citation: UrlCitation;
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
      annotations?: WebSearchAnnotation[]; // Web search citations
    };
    delta?: {
      content?: string;
      reasoning?: string; // Streaming reasoning tokens
      annotations?: WebSearchAnnotation[]; // Streaming web search citations
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
 * @property hasReasoning - Whether the model supports reasoning capabilities
 * @property reasoningType - Type of reasoning implementation
 * @property reasoningMode - Whether reasoning is forced, optional, or unavailable
 * @property supportsEffortControl - Whether model supports effort level control
 * @property webSearchMode - Whether web search is forced, optional, or unavailable
 * @property webSearchPricing - Pricing tier for web search
 * @property supportsWebEffortControl - Whether model supports web search effort control
 * @property hasVision - Whether the model supports vision/image capabilities
 * @property color - Brand color for the model (hex code)
 * @property bgColor - Background color for selected state (hex code)
 * @property textColor - Text color for selected state (hex code)
 * @property released - Release date in ISO format (YYYY-MM-DD) for sorting
 * @property contextLength - Context window size in tokens
 */
export interface ModelConfig {
  name: string;
  description: string;
  hasReasoning: boolean;
  reasoningType: 'effort' | 'internal';
  reasoningMode: 'forced' | 'optional' | 'none';
  supportsEffortControl?: boolean; // Whether model supports effort level control
  webSearchMode: 'forced' | 'optional' | 'none'; // Whether web search is forced, optional, or unavailable
  webSearchPricing: 'standard' | 'perplexity' | 'openai'; // Pricing tier for web search
  supportsWebEffortControl?: boolean; // Whether model supports web search effort control
  hasVision: boolean; // Whether the model supports vision/image capabilities
  color: string;
  bgColor: string;
  textColor: string;
  released: string;
  contextLength: number; // Context window size in tokens
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

// ===== Enhanced Error Handling Types =====

/**
 * Comprehensive error categorization for better error handling
 */
export type ErrorCategory = 
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR' 
  | 'API_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Enhanced error interface with categorization and context
 */
export interface AppError {
  category: ErrorCategory;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
  path?: string;
  retryable?: boolean;
}

/**
 * Result type for operations that may fail
 */
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// ===== Enhanced Utility Types =====

/**
 * Loading state management
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async operation state with error handling
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  lastUpdated?: Date;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> = Result<T, ApiErrorResponse>;