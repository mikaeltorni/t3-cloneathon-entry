/**
 * useApiCall.ts
 * 
 * Focused hook for GET API requests with caching and state management
 * 
 * Hook:
 *   useApiCall
 * 
 * Features:
 *   - Automatic data fetching
 *   - Request caching with TTL
 *   - Stale data handling
 *   - Loading states
 *   - Error handling
 *   - Refetch capabilities
 * 
 * Usage: import { useApiCall } from '../hooks/api/useApiCall'
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { HttpClient } from '../../services/httpClient';
import { ApiError } from '../../services/types/apiTypes';
import { logger } from '../../utils/logger';

// Create a singleton HTTP client instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const httpClient = new HttpClient({ baseUrl: API_BASE_URL });

/**
 * State interface for API calls
 */
interface ApiCallState<TData> {
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
  lastFetch: number | null;
}

/**
 * Configuration for useApiCall hook
 */
export interface UseApiCallConfig {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  dependencies?: unknown[];
}

/**
 * Return interface for useApiCall hook
 */
export interface UseApiCallReturn<TData> extends ApiCallState<TData> {
  refetch: () => Promise<void>;
  reset: () => void;
  isFetching: boolean;
  isStale: boolean;
}

/**
 * Hook for making GET requests with automatic data fetching
 * 
 * Provides comprehensive GET request functionality including:
 * - Automatic fetching with dependency tracking
 * - Intelligent caching with staleness detection
 * - Loading and error state management
 * - Manual refetch capabilities
 * - Cleanup on unmount
 * 
 * @param endpoint - API endpoint to fetch from
 * @param config - Configuration options
 * @returns API call state and operations
 */
export function useApiCall<TData>(
  endpoint: string,
  config: UseApiCallConfig = {}
): UseApiCallReturn<TData> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    dependencies = [],
  } = config;

  const [state, setState] = useState<ApiCallState<TData>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false,
    lastFetch: null
  });

  const isMountedRef = useRef(true);

  /**
   * Execute the API call
   * 
   * @param force - Force fetch even if data is fresh
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