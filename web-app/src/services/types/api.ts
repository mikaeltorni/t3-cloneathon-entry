/**
 * api.ts
 * 
 * Enhanced API types and validators for bulletproof type safety
 * Part of Phase 3: Service Layer Enhancement
 * 
 * Types:
 *   ApiResponse, ApiError, ApiRequestConfig
 *   ResponseValidator utilities
 * 
 * Features:
 *   - Runtime type validation
 *   - Comprehensive error typing
 *   - Request configuration types
 *   - Response metadata tracking
 * 
 * Usage: import { ApiResponse, validateResponse } from './types/api'
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  requestId?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    duration?: number;
  };
}

/**
 * Enhanced API error with detailed information
 */
export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

/**
 * API error class with enhanced typing
 */
export class EnhancedApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly field?: string;
  public readonly requestId?: string;
  public readonly timestamp: string;

  constructor(
    status: number,
    statusText: string,
    errorDetails: Partial<ApiErrorDetails> & { message: string }
  ) {
    super(errorDetails.message);
    this.name = 'EnhancedApiError';
    this.status = status;
    this.statusText = statusText;
    this.code = errorDetails.code || 'UNKNOWN_ERROR';
    this.details = errorDetails.details;
    this.field = errorDetails.field;
    this.requestId = errorDetails.requestId;
    this.timestamp = errorDetails.timestamp || new Date().toISOString();
  }

  /**
   * Check if error is a specific type
   */
  isType(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if error is network related
   */
  isNetworkError(): boolean {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }

  /**
   * Check if error is server related (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is client related (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Convert to plain object for logging
   */
  toJSON(): ApiErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: this.stack
    };
  }
}

/**
 * Request configuration with retry and timeout options
 */
export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: EnhancedApiError) => boolean;
  onRetry?: (attempt: number, error: EnhancedApiError) => void;
  cacheKey?: string;
  cacheTTL?: number;
}

/**
 * Response validator function type
 */
export type ResponseValidator<T> = (data: unknown) => data is T;

/**
 * Common error codes
 */
export const ApiErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ApiErrorCode = typeof ApiErrorCodes[keyof typeof ApiErrorCodes];

/**
 * Create a response validator that checks required fields
 */
export function createValidator<T>(
  requiredFields: (keyof T)[]
): ResponseValidator<T> {
  return (data: unknown): data is T => {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Check all required fields exist
    for (const field of requiredFields) {
      if (!(String(field) in obj)) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(
  data: unknown,
  validator?: ResponseValidator<T>
): data is ApiResponse<T> {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const response = data as Record<string, unknown>;

  // Check basic response structure
  if (typeof response.success !== 'boolean') {
    return false;
  }

  if (!('data' in response)) {
    return false;
  }

  // If validator provided, check data structure
  if (validator && !validator(response.data)) {
    return false;
  }

  return true;
}

/**
 * Type guards for common API responses
 */
export const TypeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number',
  isArray: <T>(value: unknown, itemValidator?: (item: unknown) => item is T): value is T[] => {
    if (!Array.isArray(value)) return false;
    if (!itemValidator) return true;
    return value.every(itemValidator);
  },
  isObject: (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
};

/**
 * Utility to transform error response to EnhancedApiError
 */
export function transformErrorResponse(
  status: number,
  statusText: string,
  body: unknown
): EnhancedApiError {
  let errorDetails: Partial<ApiErrorDetails> & { message: string };

  if (TypeGuards.isObject(body) && TypeGuards.isString(body.message)) {
    errorDetails = {
      message: body.message,
      code: TypeGuards.isString(body.code) ? body.code : getDefaultErrorCode(status),
      details: TypeGuards.isObject(body.details) ? body.details : undefined,
      field: TypeGuards.isString(body.field) ? body.field : undefined,
      requestId: TypeGuards.isString(body.requestId) ? body.requestId : undefined,
      timestamp: TypeGuards.isString(body.timestamp) ? body.timestamp : new Date().toISOString()
    };
  } else {
    errorDetails = {
      message: TypeGuards.isString(body) ? body : `HTTP ${status}: ${statusText}`,
      code: getDefaultErrorCode(status),
      timestamp: new Date().toISOString()
    };
  }

  return new EnhancedApiError(status, statusText, errorDetails);
}

/**
 * Get default error code based on HTTP status
 */
function getDefaultErrorCode(status: number): ApiErrorCode {
  if (status === 401) return ApiErrorCodes.AUTHENTICATION_ERROR;
  if (status === 403) return ApiErrorCodes.AUTHORIZATION_ERROR;
  if (status === 404) return ApiErrorCodes.NOT_FOUND;
  if (status === 422) return ApiErrorCodes.VALIDATION_ERROR;
  if (status === 429) return ApiErrorCodes.RATE_LIMITED;
  if (status >= 500) return ApiErrorCodes.SERVER_ERROR;
  return ApiErrorCodes.UNKNOWN_ERROR;
}

/**
 * Token metrics for tracking tokenization performance
 */
export interface TokenMetrics {
  /** Total input tokens */
  inputTokens: number;
  /** Total output tokens generated */
  outputTokens: number;
  /** Total tokens (input + output) */
  totalTokens: number;
  /** Tokens per second during generation */
  tokensPerSecond: number;
  /** Generation start time */
  startTime: number;
  /** Generation end time */
  endTime?: number;
  /** Generation duration in milliseconds */
  duration?: number;
  /** Estimated cost based on token count */
  estimatedCost?: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
}

/**
 * Supported AI providers for tokenization
 */
export type TokenizerProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'deepseek' 
  | 'google' 
  | 'auto';

/**
 * Model-specific information for tokenization
 */
export interface ModelInfo {
  provider: TokenizerProvider;
  modelName: string;
  encoding?: string;
  maxTokens?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
}

/**
 * Tokenization result with detailed metrics
 */
export interface TokenizationResult {
  tokens: number[];
  tokenCount: number;
  text: string;
  model: string;
  provider: TokenizerProvider;
  estimatedCost?: number;
} 