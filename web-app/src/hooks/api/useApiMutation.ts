/**
 * useApiMutation.ts
 * 
 * Focused hook for API mutation requests (POST, PUT, DELETE, PATCH)
 * 
 * Hook:
 *   useApiMutation
 * 
 * Features:
 *   - Support for all HTTP mutation methods
 *   - Loading and error state management
 *   - Success/error callbacks
 *   - Automatic error handling
 *   - Reset functionality
 * 
 * Usage: import { useApiMutation } from '../hooks/api/useApiMutation'
 */
import { useState, useCallback } from 'react';
import { HttpClient } from '../../services/httpClient';
import { ApiError } from '../../services/types/apiTypes';
import { logger } from '../../utils/logger';

// Create a singleton HTTP client instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const httpClient = new HttpClient({ baseUrl: API_BASE_URL });

/**
 * State interface for API mutations
 */
interface ApiMutationState<TData> {
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
}

/**
 * Configuration for useApiMutation hook
 */
export interface UseApiMutationConfig {
  method?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  onSettled?: (data: any | null, error: ApiError | null) => void;
}

/**
 * Return interface for useApiMutation hook
 */
export interface UseApiMutationReturn<TData, TVariables> extends ApiMutationState<TData> {
  mutate: (variables?: TVariables) => Promise<TData>;
  reset: () => void;
  isLoading: boolean;
}

/**
 * Hook for making mutation requests (POST, PUT, DELETE, PATCH)
 * 
 * Provides comprehensive mutation functionality including:
 * - Support for all HTTP mutation methods
 * - Automatic error handling and state management
 * - Success/error/settled callbacks
 * - Loading state tracking
 * - Reset capabilities
 * 
 * @param endpoint - API endpoint or function that returns endpoint
 * @param config - Configuration options
 * @returns Mutation state and operations
 */
export function useApiMutation<TData, TVariables = any>(
  endpoint: string | ((variables: TVariables) => string),
  config: UseApiMutationConfig = {}
): UseApiMutationReturn<TData, TVariables> {
  const {
    method = 'POST',
    onSuccess,
    onError,
    onSettled
  } = config;

  const [state, setState] = useState<ApiMutationState<TData>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false
  });

  /**
   * Execute the mutation
   * 
   * @param variables - Variables to send with the request
   * @returns Promise with the response data
   */
  const mutate = useCallback(async (variables?: TVariables): Promise<TData> => {
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
      const apiError = error instanceof ApiError 
        ? error 
        : new ApiError(500, 'Internal Server Error', 'Unknown error occurred');
      
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

  /**
   * Reset state to initial values
   */
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