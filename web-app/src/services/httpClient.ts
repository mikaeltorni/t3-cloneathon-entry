/**
 * httpClient.ts
 * 
 * Enhanced HTTP client with retry logic, caching, and advanced error handling
 * Part of Phase 3: Service Layer Enhancement
 * 
 * Classes:
 *   EnhancedHttpClient
 * 
 * Features:
 *   - Automatic retry with exponential backoff
 *   - Request/response caching
 *   - Comprehensive error handling
 *   - Request timeouts and cancellation
 *   - Performance monitoring
 *   - Request deduplication
 * 
 * Usage: const client = new EnhancedHttpClient(baseUrl);
 */
import { logger } from '../utils/logger';
import { 
  EnhancedApiError, 
  ApiErrorCodes,
  transformErrorResponse 
} from './types/api';
import type { ApiRequestConfig } from './types/api';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Request metrics for performance monitoring
 */
interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  retries: number;
  cacheHit: boolean;
  timestamp: number;
}

/**
 * Enhanced HTTP client with advanced features
 */
export class EnhancedHttpClient {
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10 seconds
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private requestMetrics: RequestMetrics[] = [];
  private maxMetricsHistory = 100;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    logger.info(`EnhancedHttpClient initialized with base URL: ${baseUrl}`);
  }

  /**
   * Make HTTP request with all enhancements
   */
  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = config.method || 'GET';
    const cacheKey = config.cacheKey || this.generateCacheKey(method, url, config.body);
    
    const startTime = Date.now();
    let retries = 0;
    let cacheHit = false;

    try {
      // Check cache first (for GET requests)
      if (method === 'GET' && config.cacheTTL && config.cacheTTL > 0) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) {
          logger.debug(`Cache hit for ${method} ${endpoint}`);
          cacheHit = true;
          this.recordMetrics(url, method, Date.now() - startTime, 200, 0, true);
          return cached;
        }
      }

      // Check for duplicate in-flight requests
      const pendingKey = `${method}:${url}`;
      if (this.pendingRequests.has(pendingKey)) {
        logger.debug(`Deduplicating request: ${method} ${endpoint}`);
        return await this.pendingRequests.get(pendingKey)!;
      }

      // Create the request promise
      const requestPromise = this.executeRequestWithRetry<T>(url, config);
      
      // Store pending request for deduplication
      this.pendingRequests.set(pendingKey, requestPromise);

      try {
        const result = await requestPromise;

        // Cache successful GET responses
        if (method === 'GET' && config.cacheTTL && config.cacheTTL > 0) {
          this.setCache(cacheKey, result, config.cacheTTL);
        }

        this.recordMetrics(url, method, Date.now() - startTime, 200, retries, cacheHit);
        return result;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(pendingKey);
      }
    } catch (error) {
      const status = error instanceof EnhancedApiError ? error.status : 0;
      this.recordMetrics(url, method, Date.now() - startTime, status, retries, cacheHit);
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetry<T>(
    url: string,
    config: ApiRequestConfig
  ): Promise<T> {
    const maxRetries = config.retries || 3;
    const baseDelay = config.retryDelay || 1000;
    const timeout = config.timeout || this.defaultTimeout;

    let lastError: EnhancedApiError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorBody: unknown;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = await response.text();
          }

          const apiError = transformErrorResponse(
            response.status,
            response.statusText,
            errorBody
          );

          // Check if we should retry this error
          if (attempt < maxRetries && this.shouldRetry(apiError, config)) {
            lastError = apiError;
            const delay = this.calculateRetryDelay(attempt, baseDelay);
            
            logger.warn(
              `Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`,
              apiError.toJSON()
            );

            config.onRetry?.(attempt + 1, apiError);
            await this.sleep(delay);
            continue;
          }

          throw apiError;
        }

        const data = await response.json();
        return data;
      } catch (error: unknown) {
        if ((error as any)?.name === 'AbortError') {
          const timeoutError = new EnhancedApiError(0, 'Timeout', {
            message: `Request timeout after ${timeout}ms`,
            code: ApiErrorCodes.TIMEOUT_ERROR
          });

          if (attempt < maxRetries) {
            lastError = timeoutError;
            const delay = this.calculateRetryDelay(attempt, baseDelay);
            logger.warn(`Request timeout (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`);
            config.onRetry?.(attempt + 1, timeoutError);
            await this.sleep(delay);
            continue;
          }

          throw timeoutError;
        }

        if (error instanceof EnhancedApiError) {
          if (attempt < maxRetries && this.shouldRetry(error, config)) {
            lastError = error;
            const delay = this.calculateRetryDelay(attempt, baseDelay);
            logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`);
            config.onRetry?.(attempt + 1, error);
            await this.sleep(delay);
            continue;
          }
          throw error;
        }

        // Network or other errors
        const networkError = new EnhancedApiError(0, 'Network Error', {
          message: error instanceof Error ? error.message : 'Unknown network error',
          code: ApiErrorCodes.NETWORK_ERROR
        });

        if (attempt < maxRetries) {
          lastError = networkError;
          const delay = this.calculateRetryDelay(attempt, baseDelay);
          logger.warn(`Network error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`);
          config.onRetry?.(attempt + 1, networkError);
          await this.sleep(delay);
          continue;
        }

        throw networkError;
      }
    }

    throw lastError!;
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: EnhancedApiError, config: ApiRequestConfig): boolean {
    // Use custom retry condition if provided
    if (config.retryCondition) {
      return config.retryCondition(error);
    }

    // Default retry logic
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.isNetworkError() ||
      error.isType(ApiErrorCodes.TIMEOUT_ERROR) ||
      error.isServerError() ||
      error.status === 429 // Rate limited
    );
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(method: string, url: string, body?: any): string {
    const bodyHash = body ? btoa(JSON.stringify(body)).slice(0, 8) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Record request metrics
   */
  private recordMetrics(
    url: string,
    method: string,
    duration: number,
    status: number,
    retries: number,
    cacheHit: boolean
  ): void {
    const metric: RequestMetrics = {
      url,
      method,
      duration,
      status,
      retries,
      cacheHit,
      timestamp: Date.now()
    };

    this.requestMetrics.push(metric);

    // Keep only recent metrics
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics.shift();
    }

    logger.debug(`Request metrics: ${method} ${url} - ${duration}ms (status: ${status}, retries: ${retries}, cache: ${cacheHit})`);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): RequestMetrics[] {
    return [...this.requestMetrics];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('HTTP client cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
} 