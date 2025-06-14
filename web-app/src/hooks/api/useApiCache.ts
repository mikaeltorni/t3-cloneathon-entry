/**
 * useApiCache.ts
 * 
 * Focused hook for API cache management and metrics
 * 
 * Hook:
 *   useApiCache
 * 
 * Features:
 *   - Cache management utilities
 *   - Performance monitoring helpers
 *   - Future cache implementation foundation
 * 
 * Usage: import { useApiCache } from '../hooks/api/useApiCache'
 */
import { useCallback } from 'react';
import { logger } from '../../utils/logger';

/**
 * Cache statistics interface
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * HTTP client metrics interface
 */
export interface ClientMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  successRate: number;
}

/**
 * Return interface for useApiCache hook
 */
export interface UseApiCacheReturn {
  clearCache: () => void;
  getCacheStats: () => CacheStats | null;
  getMetrics: () => ClientMetrics | null;
}

/**
 * Hook for managing API cache and monitoring performance
 * 
 * Provides cache management functionality including:
 * - Manual cache clearing (localStorage-based)
 * - Cache statistics placeholder
 * - HTTP client performance metrics placeholder
 * - Foundation for future cache implementation
 * 
 * @returns Cache management operations and metrics
 */
export function useApiCache(): UseApiCacheReturn {
  /**
   * Clear cached API responses from localStorage
   */
  const clearCache = useCallback(() => {
    try {
      // Clear any localStorage-based cache entries
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('api-cache-'));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      logger.info(`API cache cleared: ${cacheKeys.length} entries removed`);
    } catch (error) {
      logger.warn('Failed to clear cache:', error);
    }
  }, []);

  /**
   * Get current cache statistics
   * 
   * @returns Cache statistics or null if not available
   */
  const getCacheStats = useCallback((): CacheStats | null => {
    try {
      // Count localStorage cache entries
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('api-cache-'));
      
      return {
        size: cacheKeys.length,
        hits: 0, // Placeholder - would need implementation
        misses: 0, // Placeholder - would need implementation
        hitRate: 0 // Placeholder - would need implementation
      };
    } catch (error) {
      logger.warn('Failed to get cache stats:', error);
      return null;
    }
  }, []);

  /**
   * Get HTTP client performance metrics
   * 
   * @returns Client metrics or null if not available
   */
  const getMetrics = useCallback((): ClientMetrics | null => {
    try {
      // Placeholder implementation - would need actual metrics tracking
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        successRate: 0
      };
    } catch (error) {
      logger.warn('Failed to get client metrics:', error);
      return null;
    }
  }, []);

  return {
    clearCache,
    getCacheStats,
    getMetrics
  };
} 