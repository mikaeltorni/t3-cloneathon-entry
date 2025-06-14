/**
 * api/index.ts
 * 
 * Centralized exports for focused API hooks
 * 
 * Exports:
 *   - useApiCall: Basic GET requests with caching
 *   - useApiMutation: POST/PUT/DELETE/PATCH requests
 *   - useApiCache: Cache management and metrics
 *   - useOptimizedApiCall: Pre-configured optimized calls
 *   - useRobustMutation: Pre-configured robust mutations
 * 
 * Usage: import { useApiCall, useApiMutation } from '../hooks/api'
 */

// Core API hooks
export { useApiCall, type UseApiCallConfig, type UseApiCallReturn } from './useApiCall';
export { useApiMutation, type UseApiMutationConfig, type UseApiMutationReturn } from './useApiMutation';
export { useApiCache, type CacheStats, type ClientMetrics, type UseApiCacheReturn } from './useApiCache';

// Optimized patterns
export { useOptimizedApiCall, useRobustMutation } from './useOptimizedApi'; 