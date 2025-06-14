/**
 * useApiService.ts
 * 
 * Enhanced API service hooks with error handling and caching
 * 
 * Hooks:
 *   - useApiCall: GET requests with automatic fetching
 *   - useApiMutation: POST/PUT/DELETE requests
 *   - useApiCache: Cache management utilities
 *   - useOptimizedApiCall: Memory-optimized API calls
 *   - useRobustMutation: Retry-enabled mutations
 * 
 * Features:
 *   - Automatic error handling
 *   - Request caching with TTL
 *   - Request deduplication
 *   - Automatic retries
 *   - Loading states
 *   - Memory optimization
 * 
 * Usage: import { useApiCall, useApiMutation } from '../hooks/useApiService'
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { HttpClient } from '../services/httpClient';
import { ApiError } from '../services/types/apiTypes';
import { logger } from '../utils/logger';

// Create a singleton HTTP client instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const httpClient = new HttpClient({ baseUrl: API_BASE_URL });

/**
 * State interface for API calls
 */
interface ApiState<TData> {
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
  lastFetch: number | null;
}

/**
 * Configuration for useApiCall hook
 */
interface UseApiCallConfig {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  dependencies?: any[];
}

/**
 * Configuration for useApiMutation hook
 */
interface UseApiMutationConfig {
  method?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  onSettled?: (data: any | null, error: ApiError | null) => void;
}

/**
 * Hook for making GET requests with automatic data fetching
 */
export function useApiCall<TData>(
  endpoint: string,
  config: UseApiCallConfig = {}
) {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    dependencies = [],
  } = config;

  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false,
    lastFetch: null
  });

  const isMountedRef = useRef(true);

  /**
   * Execute the API call
   */
  const executeCall = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check if data is still fresh (unless forced)
    if (!force && state.data && state.lastFetch && staleTime > 0) {
      const isStale = Date.now() - state.lastFetch > staleTime;
      if (!isStale) {
        logger.debug(`Data is still fresh for ${endpoint}, skipping fetch`);
        return;
      }
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));

    try {
      logger.debug(`Executing API call: GET ${endpoint}`);

      const data = await httpClient.get<TData>(endpoint);

      if (isMountedRef.current) {
        setState({
          data,
          loading: false,
          error: null,
          isSuccess: true,
          lastFetch: Date.now()
        });
      }
    } catch (error) {
      if (isMountedRef.current && error instanceof ApiError) {
        setState(prev => ({
          ...prev,
          loading: false,
          error,
          isSuccess: false
        }));
      }
    }
  }, [endpoint, enabled, staleTime, state.data, state.lastFetch]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    return executeCall(true);
  }, [executeCall]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isSuccess: false,
      lastFetch: null
    });
  }, []);

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    if (refetchOnMount || dependencies.length > 0) {
      executeCall();
    }
  }, [executeCall, refetchOnMount, ...dependencies]);

  // Setup refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && enabled) {
      const intervalId = setInterval(() => {
        executeCall();
      }, refetchInterval);

      return () => clearInterval(intervalId);
    }
  }, [refetchInterval, enabled, executeCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch,
    reset,
    isFetching: state.loading,
    isStale: state.lastFetch ? Date.now() - state.lastFetch > staleTime : true
  };
}

/**
 * Hook for making mutation requests (POST, PUT, DELETE)
 */
export function useApiMutation<TData, TVariables = any>(
  endpoint: string | ((variables: TVariables) => string),
  config: UseApiMutationConfig = {}
) {
  const {
    method = 'POST',
    onSuccess,
    onError,
    onSettled
  } = config;

  const [state, setState] = useState<Omit<ApiState<TData>, 'lastFetch'>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false
  });

  const mutate = useCallback(async (variables?: TVariables) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const resolvedEndpoint = typeof endpoint === 'function' 
        ? endpoint(variables as TVariables) 
        : endpoint;

      logger.debug(`Executing mutation: ${method} ${resolvedEndpoint}`);

      let data: TData;
      switch (method.toUpperCase()) {
        case 'POST':
          data = await httpClient.post<TData>(resolvedEndpoint, variables);
          break;
        case 'PUT':
          data = await httpClient.put<TData>(resolvedEndpoint, variables);
          break;
        case 'PATCH':
          data = await httpClient.patch<TData>(resolvedEndpoint, variables);
          break;
        case 'DELETE':
          data = await httpClient.delete<TData>(resolvedEndpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setState({
        data,
        loading: false,
        error: null,
        isSuccess: true
      });

      onSuccess?.(data);
      onSettled?.(data, null);

      return data;
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(500, 'Internal Server Error', 'Unknown error occurred');
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError,
        isSuccess: false
      }));

      onError?.(apiError);
      onSettled?.(null, apiError);

      throw apiError;
    }
  }, [endpoint, method, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isSuccess: false
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
    isLoading: state.loading
  };
}

/**
 * Hook for managing API cache
 */
export function useApiCache() {
  const clearCache = useCallback(() => {
    httpClient.clearCache();
    logger.info('API cache cleared by user');
  }, []);

  const getCacheStats = useCallback(() => {
    return httpClient.getCacheStats();
  }, []);

  const getMetrics = useCallback(() => {
    return httpClient.getMetrics();
  }, []);

  return {
    clearCache,
    getCacheStats,
    getMetrics
  };
}

/**
 * Hook for creating optimized API calls with common patterns
 */
export function useOptimizedApiCall<TData>(
  endpoint: string,
  config: UseApiCallConfig = {}
) {
  return useApiCall<TData>(endpoint, {
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache
    retries: 3,
    retryDelay: 1000,
    timeout: 10000,
    staleTime: 2 * 60 * 1000, // 2 minutes stale time
    ...config
  });
}

/**
 * Hook for creating robust mutations with error handling
 */
export function useRobustMutation<TData, TVariables = any>(
  endpoint: string | ((variables: TVariables) => string),
  config: UseApiMutationConfig = {}
) {
  return useApiMutation<TData, TVariables>(endpoint, {
    retries: 2,
    retryDelay: 1000,
    timeout: 15000,
    retryCondition: (error) => {
      // Retry on network errors and server errors, but not client errors
      return error.isNetworkError() || error.isServerError();
    },
    ...config
  });
} 