/**
 * useApiService.ts
 * 
 * Service hooks for seamless API integration with React components
 * Part of Phase 3: Service Layer Enhancement
 * 
 * Hooks:
 *   useApiCall, useApiMutation, useApiCache
 * 
 * Features:
 *   - React-integrated API calls
 *   - Automatic loading states
 *   - Error handling with retry logic
 *   - Request cancellation on unmount
 *   - Cache management
 *   - Performance monitoring
 * 
 * Usage: import { useApiCall, useApiMutation } from './hooks/useApiService'
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedHttpClient } from '../services/httpClient';
import { EnhancedApiError } from '../services/types/api';
import type { ApiRequestConfig } from '../services/types/api';
import { logger } from '../utils/logger';

// Create a singleton HTTP client instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const httpClient = new EnhancedHttpClient(API_BASE_URL);

/**
 * State interface for API calls
 */
interface ApiState<TData> {
  data: TData | null;
  loading: boolean;
  error: EnhancedApiError | null;
  isSuccess: boolean;
  lastFetch: number | null;
}

/**
 * Configuration for useApiCall hook
 */
interface UseApiCallConfig extends Omit<ApiRequestConfig, 'method' | 'body'> {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  dependencies?: any[];
}

/**
 * Configuration for useApiMutation hook
 */
interface UseApiMutationConfig extends Omit<ApiRequestConfig, 'body'> {
  method?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: EnhancedApiError) => void;
  onSettled?: (data: any | null, error: EnhancedApiError | null) => void;
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
    ...requestConfig
  } = config;

  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false,
    lastFetch: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));

    try {
      logger.debug(`Executing API call: GET ${endpoint}`);

      const data = await httpClient.request<TData>(endpoint, {
        ...requestConfig,
        method: 'GET',
        signal: abortControllerRef.current.signal,
        cacheTTL: requestConfig.cacheTTL || staleTime
      });

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
      if (isMountedRef.current && error instanceof EnhancedApiError) {
        // Don't update state if request was aborted
        if (error.code !== 'ABORT_ERROR') {
          setState(prev => ({
            ...prev,
            loading: false,
            error,
            isSuccess: false
          }));
        }
      }
    }
  }, [endpoint, enabled, staleTime, requestConfig, state.data, state.lastFetch]);

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
      intervalRef.current = setInterval(() => {
        executeCall();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, executeCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
 * Hook for making mutations (POST, PUT, PATCH, DELETE)
 */
export function useApiMutation<TData, TVariables = any>(
  endpoint: string | ((variables: TVariables) => string),
  config: UseApiMutationConfig = {}
) {
  const {
    onSuccess,
    onError,
    onSettled,
    ...requestConfig
  } = config;

  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false,
    lastFetch: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Execute the mutation
   */
  const mutate = useCallback(async (
    variables: TVariables,
    mutationConfig: Partial<UseApiMutationConfig> = {}
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      isSuccess: false
    }));

    try {
      const resolvedEndpoint = typeof endpoint === 'function' 
        ? endpoint(variables) 
        : endpoint;

      logger.debug(`Executing API mutation: ${requestConfig.method || 'POST'} ${resolvedEndpoint}`);

      const data = await httpClient.request<TData>(resolvedEndpoint, {
        ...requestConfig,
        ...mutationConfig,
        method: requestConfig.method || 'POST',
        body: JSON.stringify(variables),
        signal: abortControllerRef.current.signal
      });

      if (isMountedRef.current) {
        setState({
          data,
          loading: false,
          error: null,
          isSuccess: true,
          lastFetch: Date.now()
        });

        // Call success callback
        onSuccess?.(data);
        mutationConfig.onSuccess?.(data);
        onSettled?.(data, null);
        mutationConfig.onSettled?.(data, null);
      }

      return data;
    } catch (error) {
      if (isMountedRef.current && error instanceof EnhancedApiError) {
        setState(prev => ({
          ...prev,
          loading: false,
          error,
          isSuccess: false
        }));

        // Call error callbacks
        onError?.(error);
        mutationConfig.onError?.(error);
        onSettled?.(null, error);
        mutationConfig.onSettled?.(null, error);
      }

      throw error;
    }
  }, [endpoint, requestConfig, onSuccess, onError, onSettled]);

  /**
   * Reset mutation state
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    mutate,
    reset,
    isLoading: state.loading,
    isIdle: !state.loading && !state.data && !state.error
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