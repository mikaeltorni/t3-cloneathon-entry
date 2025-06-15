/**
 * apiTypes.ts
 * 
 * Shared API types and interfaces
 * 
 * Types:
 *   ApiError - Structured API error class
 *   ApiRequestOptions - Base request configuration
 *   StreamingCallbacks - Streaming operation callbacks
 * 
 * Usage: import { ApiError, ApiRequestOptions } from './types/apiTypes'
 */
import type { 
  CreateMessageRequest, 
  CreateMessageResponse, 
  TokenMetrics 
} from '../../../../src/shared/types';

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;

  constructor(
    status: number,
    statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Base API request options
 */
export interface ApiRequestOptions extends RequestInit {
  endpoint: string;
  requiresAuth?: boolean;
}

/**
 * Streaming operation callbacks interface
 */
export interface StreamingCallbacks {
  onChunk: (chunk: string, fullContent: string) => void;
  onComplete: (response: CreateMessageResponse) => void;
  onError: (error: Error) => void;
  onReasoningChunk?: (reasoningChunk: string, fullReasoning: string) => void;
  onTokenMetrics?: (metrics: Partial<TokenMetrics>) => void;
  onAnnotationsChunk?: (annotations: any[]) => void;
  onThreadCreated?: (threadId: string) => void;
  onUserMessageConfirmed?: (userMessage: any) => void;
}

/**
 * Streaming request configuration
 */
export interface StreamingRequest {
  request: CreateMessageRequest;
  callbacks: StreamingCallbacks;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null>;
  timeout?: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
} 