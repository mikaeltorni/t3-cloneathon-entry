/**
 * httpClient.ts
 * 
 * Base HTTP client with authentication and error handling
 * 
 * Services:
 *   HttpClient
 * 
 * Features:
 *   - Authentication token management
 *   - Request/response logging
 *   - Structured error handling
 *   - Configurable base URL and timeouts
 * 
 * Usage: import { HttpClient } from './httpClient'
 */
import { logger } from '../utils/logger';
import { ApiError, type HttpClientConfig } from './types/apiTypes';

/**
 * HTTP client with authentication and error handling
 * 
 * Provides a base HTTP client with automatic authentication,
 * request/response logging, and structured error handling.
 */
export class HttpClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null>;
  private timeout: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getAuthToken = config.getAuthToken;
    this.timeout = config.timeout || 10000;
    logger.info(`HttpClient initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Make HTTP request with error handling and logging
   * 
   * @param endpoint - API endpoint (relative to base URL)
   * @param options - Fetch options
   * @returns Promise with response data
   */
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      logger.debug(`HTTP Request: ${options.method || 'GET'} ${endpoint}`);

      // Get auth token if available
      const authToken = this.getAuthToken ? await this.getAuthToken() : null;
      
      // Debug logging for auth token
      if (authToken) {
        logger.debug(`Auth token obtained: ${authToken.substring(0, 20)}...`);
      } else {
        logger.warn('No auth token available for request', {
          hasGetAuthToken: !!this.getAuthToken,
          endpoint,
          method: options.method || 'GET'
        });
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      // Add authorization header if token is available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      logger.debug(`HTTP Response: ${response.status} ${endpoint} (${duration}ms)`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }

        throw new ApiError(response.status, response.statusText, errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`HTTP Request failed: ${options.method || 'GET'} ${endpoint}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout: ${endpoint} took longer than ${this.timeout}ms`);
      }

      // Network or other errors
      throw new Error(
        error instanceof Error 
          ? `Network error: ${error.message}` 
          : 'Unknown HTTP error occurred'
      );
    }
  }

  /**
   * Make authenticated GET request
   * 
   * @param endpoint - API endpoint
   * @param params - URL search parameters
   * @returns Promise with response data
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const searchParams = params ? new URLSearchParams(params) : null;
    const url = searchParams ? `${endpoint}?${searchParams.toString()}` : endpoint;
    
    return this.makeRequest<T>(url, {
      method: 'GET',
    });
  }

  /**
   * Make authenticated POST request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with response data
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make authenticated PUT request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with response data
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make authenticated PATCH request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with response data
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make authenticated DELETE request
   * 
   * @param endpoint - API endpoint
   * @returns Promise with response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Make streaming request with Server-Sent Events
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise with ReadableStreamDefaultReader
   */
  async stream(endpoint: string, data?: any): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      logger.info(`Starting streaming request: POST ${endpoint}`);

      // Get auth token if available
      const authToken = this.getAuthToken ? await this.getAuthToken() : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token is available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new ApiError(response.status, response.statusText, errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      return response.body.getReader();
    } catch (error) {
      logger.error(`Streaming request failed: POST ${endpoint}`, error as Error);
      throw error;
    }
  }

  /**
   * Update base URL
   * 
   * @param baseUrl - New base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    logger.info(`HttpClient base URL updated to: ${baseUrl}`);
  }

  /**
   * Update auth token getter
   * 
   * @param getAuthToken - Auth token function
   */
  setAuthTokenGetter(getAuthToken: () => Promise<string | null>): void {
    this.getAuthToken = getAuthToken;
    logger.debug('HttpClient auth token getter updated');
  }

  /**
   * Get current base URL
   * 
   * @returns Current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
} 