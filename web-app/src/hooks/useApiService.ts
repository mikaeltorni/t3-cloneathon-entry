/**
 * useApiService.ts
 * 
 * REFACTORED: Now uses focused API hooks for clean architecture
 * 
 * This file now serves as a compatibility layer and re-exports
 * the focused API hooks for backward compatibility.
 * 
 * Hooks:
 *   - useApiCall: GET requests with caching (from api/useApiCall)
 *   - useApiMutation: POST/PUT/DELETE requests (from api/useApiMutation)
 *   - useApiCache: Cache management (from api/useApiCache)
 *   - useOptimizedApiCall: Optimized patterns (from api/useOptimizedApi)
 *   - useRobustMutation: Robust patterns (from api/useOptimizedApi)
 * 
 * Features:
 *   - Clean service composition
 *   - Single responsibility principle
 *   - Maintainable and testable code
 *   - Backward compatibility
 * 
 * Usage: import { useApiCall, useApiMutation } from '../hooks/useApiService'
 */

// Re-export all focused API hooks for backward compatibility
export {
  useApiCall,
  useApiMutation,
  useApiCache,
  useOptimizedApiCall,
  useRobustMutation,
  type UseApiCallConfig,
  type UseApiCallReturn,
  type UseApiMutationConfig,
  type UseApiMutationReturn,
  type UseApiCacheReturn,
  type CacheStats,
  type ClientMetrics
} from './api'; 