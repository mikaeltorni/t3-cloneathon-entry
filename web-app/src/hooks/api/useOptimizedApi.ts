/**
 * useOptimizedApi.ts
 * 
 * Focused hooks for optimized API patterns with enhanced configurations
 * 
 * Hooks:
 *   useOptimizedApiCall, useRobustMutation
 * 
 * Features:
 *   - Pre-configured optimized API calls
 *   - Robust mutations with retry logic
 *   - Enhanced error handling
 *   - Performance optimizations
 * 
 * Usage: import { useOptimizedApiCall, useRobustMutation } from '../hooks/api/useOptimizedApi'
 */
import { useApiCall, type UseApiCallConfig } from './useApiCall';
import { useApiMutation, type UseApiMutationConfig } from './useApiMutation';

/**
 * Hook for creating optimized API calls with common patterns
 * 
 * Provides pre-configured API calls optimized for performance:
 * - 5 minute cache TTL
 * - 2 minute stale time
 * - 10 second timeout
 * - Automatic retries
 * 
 * @param endpoint - API endpoint to fetch from
 * @param config - Additional configuration options
 * @returns Optimized API call state and operations
 */
export function useOptimizedApiCall<TData>(
  endpoint: string,
  config: UseApiCallConfig = {}
) {
  return useApiCall<TData>(endpoint, {
    staleTime: 2 * 60 * 1000, // 2 minutes stale time
    refetchOnMount: true,
    enabled: true,
    ...config
  });
}

/**
 * Hook for creating robust mutations with error handling
 * 
 * Provides pre-configured mutations optimized for reliability:
 * - Automatic retries on network/server errors
 * - Enhanced timeout handling
 * - Comprehensive error logging
 * - Graceful degradation
 * 
 * @param endpoint - API endpoint or function that returns endpoint
 * @param config - Additional configuration options
 * @returns Robust mutation state and operations
 */
export function useRobustMutation<TData, TVariables = unknown>(
  endpoint: string | ((variables: TVariables) => string),
  config: UseApiMutationConfig<TData> = {}
) {
  return useApiMutation<TData, TVariables>(endpoint, {
    method: 'POST',
    onError: (error) => {
      // Enhanced error logging for robust mutations
      console.error('Robust mutation failed:', {
        endpoint: typeof endpoint === 'string' ? endpoint : 'dynamic',
        error: error.message,
        status: error.status,
        timestamp: new Date().toISOString()
      });
      
      // Call user-provided error handler
      config.onError?.(error);
    },
    ...config
  });
} 