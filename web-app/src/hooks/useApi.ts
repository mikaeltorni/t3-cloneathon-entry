/**
 * useApi.ts
 * 
 * Custom hooks for API operations
 * 
 * Hooks:
 *   useApiCall, useApiMutation
 * 
 * Usage: const { data, loading, error } = useApiCall(fetchUsers);
 */
import { useState, useEffect, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { logger } from '../utils/logger';
import { EnhancedApiError } from '../services/types/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for making API calls with automatic execution
 * 
 * @param apiFunction - Function that returns a Promise
 * @param dependencies - Dependency array for useEffect
 * @returns API state and refetch function
 */
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  
  const { handleError } = useErrorHandler();
  
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logger.debug('Making API call...');
      const data = await apiFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof EnhancedApiError 
        ? error.message
        : 'An unexpected error occurred';
      
      setState({ data: null, loading: false, error: errorMessage });
      handleError(error as Error, 'API Call');
    }
  }, [apiFunction, handleError]);
  
  useEffect(() => {
    fetchData();
  }, dependencies);
  
  return { ...state, refetch: fetchData };
}

/**
 * Custom hook for API mutations (POST, PUT, DELETE)
 * 
 * @param apiFunction - Function that takes variables and returns a Promise
 * @returns API state and mutate function
 */
export function useApiMutation<TData, TVariables>(
  apiFunction: (variables: TVariables) => Promise<TData>
) {
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const { handleError } = useErrorHandler();
  
  const mutate = useCallback(async (variables: TVariables) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logger.debug('Making API mutation...');
      const data = await apiFunction(variables);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof EnhancedApiError 
        ? error.message
        : 'An unexpected error occurred';
      
      setState({ data: null, loading: false, error: errorMessage });
      handleError(error as Error, 'API Mutation');
      throw error;
    }
  }, [apiFunction, handleError]);
  
  return { ...state, mutate };
} 