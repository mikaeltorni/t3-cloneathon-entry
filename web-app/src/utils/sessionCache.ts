/**
 * sessionCache.ts
 * 
 * Session storage utilities for caching chat data
 * Enhanced with comprehensive cache management across all layers
 * 
 * Functions:
 *   getCachedThreads, setCachedThreads, addThreadToCache, updateThreadInCache, removeThreadFromCache, clearThreadsCache, clearAllCaches
 * 
 * Features:
 *   - Session-based caching (cleared on browser close)
 *   - Thread management utilities
 *   - Automatic cache validation
 *   - Type-safe operations
 *   - Comprehensive cache clearing across all layers
 * 
 * Usage: import { getCachedThreads, setCachedThreads, clearAllCaches } from './utils/sessionCache'
 */
import type { ChatThread } from '../../../src/shared/types';
import { logger } from './logger';

const THREADS_CACHE_KEY = 'chat_threads_cache';
const CACHE_VERSION_KEY = 'chat_threads_cache_version';
const CURRENT_CACHE_VERSION = '1.0';

// Keep reference to HTTP client for cache clearing
let httpClientInstance: { clearCache?: () => void } | null = null;

/**
 * Set HTTP client instance for comprehensive cache clearing
 */
export function setHttpClientInstance(client: { clearCache?: () => void }): void {
  httpClientInstance = client;
  logger.debug('HTTP client instance set for comprehensive cache clearing');
}

/**
 * Get cached chat threads from session storage
 * 
 * @returns Cached threads array or null if not found/invalid
 */
export function getCachedThreads(): ChatThread[] | null {
  try {
    // Check cache version first
    const cacheVersion = sessionStorage.getItem(CACHE_VERSION_KEY);
    if (cacheVersion !== CURRENT_CACHE_VERSION) {
      logger.debug('Cache version mismatch, clearing cache');
      clearThreadsCache();
      return null;
    }

    const cached = sessionStorage.getItem(THREADS_CACHE_KEY);
    if (!cached) {
      logger.debug('No cached threads found');
      return null;
    }

    const threads = JSON.parse(cached) as ChatThread[];
    
    // Validate cache structure
    if (!Array.isArray(threads)) {
      logger.warn('Invalid cached threads format, clearing cache');
      clearThreadsCache();
      return null;
    }

    // Convert date strings back to Date objects
    const threadsWithDates = threads.map(thread => ({
      ...thread,
      createdAt: new Date(thread.createdAt),
      updatedAt: new Date(thread.updatedAt),
      messages: thread.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));

    logger.debug(`Retrieved ${threadsWithDates.length} cached threads`);
    return threadsWithDates;
  } catch (error) {
    logger.error('Failed to retrieve cached threads', error as Error);
    clearThreadsCache();
    return null;
  }
}

/**
 * Store chat threads in session storage
 * 
 * @param threads - Array of chat threads to cache
 */
export function setCachedThreads(threads: ChatThread[]): void {
  try {
    // Set cache version
    sessionStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    
    // Store threads
    sessionStorage.setItem(THREADS_CACHE_KEY, JSON.stringify(threads));
    logger.debug(`Cached ${threads.length} threads to session storage`);
  } catch (error) {
    logger.error('Failed to cache threads', error as Error);
    // Clear cache if storage fails (might be full)
    clearThreadsCache();
  }
}

/**
 * Add a new thread to the cached threads list or move existing thread to top
 * 
 * @param newThread - New thread to add to cache
 */
export function addThreadToCache(newThread: ChatThread): void {
  try {
    const cachedThreads = getCachedThreads() || [];
    
    // Remove existing thread if it exists (we'll add it to the top)
    const filteredThreads = cachedThreads.filter(t => t.id !== newThread.id);
    
    // Add thread to the beginning of the list (most recent activity first)
    const updatedThreads = [newThread, ...filteredThreads];
    
    setCachedThreads(updatedThreads);
    logger.debug(`Moved thread to top of cache: ${newThread.id} (${newThread.title})`);
  } catch (error) {
    logger.error('Failed to add thread to cache', error as Error);
  }
}

/**
 * Update an existing thread in the cache
 * 
 * @param updatedThread - Updated thread data
 */
export function updateThreadInCache(updatedThread: ChatThread): void {
  try {
    const cachedThreads = getCachedThreads() || [];
    
    const threadIndex = cachedThreads.findIndex(t => t.id === updatedThread.id);
    if (threadIndex >= 0) {
      cachedThreads[threadIndex] = updatedThread;
      setCachedThreads(cachedThreads);
      logger.debug(`Updated thread in cache: ${updatedThread.id}`);
    } else {
      logger.warn(`Thread not found in cache for update: ${updatedThread.id}`);
      // Add as new thread if not found
      addThreadToCache(updatedThread);
    }
  } catch (error) {
    logger.error('Failed to update thread in cache', error as Error);
  }
}

/**
 * Remove a thread from the cache
 * 
 * @param threadId - ID of thread to remove
 */
export function removeThreadFromCache(threadId: string): void {
  try {
    const cachedThreads = getCachedThreads() || [];
    
    const filteredThreads = cachedThreads.filter(t => t.id !== threadId);
    setCachedThreads(filteredThreads);
    logger.debug(`Removed thread from cache: ${threadId}`);
  } catch (error) {
    logger.error('Failed to remove thread from cache', error as Error);
  }
}

/**
 * Clear all cached threads from session storage
 */
export function clearThreadsCache(): void {
  try {
    sessionStorage.removeItem(THREADS_CACHE_KEY);
    sessionStorage.removeItem(CACHE_VERSION_KEY);
    logger.debug('Cleared threads cache');
  } catch (error) {
    logger.error('Failed to clear threads cache', error as Error);
  }
}

/**
 * Check if threads cache exists and is valid
 * 
 * @returns Whether cache exists and is valid
 */
export function hasCachedThreads(): boolean {
  try {
    const cacheVersion = sessionStorage.getItem(CACHE_VERSION_KEY);
    const cached = sessionStorage.getItem(THREADS_CACHE_KEY);
    
    return cacheVersion === CURRENT_CACHE_VERSION && !!cached;
  } catch {
    return false;
  }
}

/**
 * Get cache statistics for debugging
 * 
 * @returns Cache statistics object
 */
export function getCacheStats(): {
  hasCache: boolean;
  threadCount: number;
  cacheVersion: string | null;
  cacheSize: number;
} {
  try {
    const hasCache = hasCachedThreads();
    const threads = getCachedThreads() || [];
    const cacheVersion = sessionStorage.getItem(CACHE_VERSION_KEY);
    const cached = sessionStorage.getItem(THREADS_CACHE_KEY);
    const cacheSize = cached ? new Blob([cached]).size : 0;

    return {
      hasCache,
      threadCount: threads.length,
      cacheVersion,
      cacheSize
    };
  } catch {
    return {
      hasCache: false,
      threadCount: 0,
      cacheVersion: null,
      cacheSize: 0
    };
  }
}

/**
 * Clear ALL cache layers for complete security
 * 
 * This clears:
 * - Session storage cache (threads)
 * - HTTP client in-memory cache 
 * - React component states will be reset on re-render
 */
export function clearAllCaches(): void {
  try {
    logger.info('Clearing ALL cache layers for security...');
    
    // 1. Clear session storage cache
    clearThreadsCache();
          logger.debug('Session storage cache cleared');
    
    // 2. Clear HTTP client cache if available
    if (httpClientInstance && typeof httpClientInstance.clearCache === 'function') {
      httpClientInstance.clearCache();
      logger.debug('HTTP client cache cleared');
    } else {
      logger.warn('HTTP client instance not available for cache clearing');
    }
    
    // 3. Clear any other browser storage that might contain user data
    try {
      // Clear any localStorage that might exist (defensive)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('chat') || 
          key.includes('thread') || 
          key.includes('message') ||
          key.includes('firebase') ||
          key.includes('auth')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        logger.debug(`Removed localStorage key: ${key}`);
      });
      
      if (keysToRemove.length > 0) {
        logger.debug(`Cleared ${keysToRemove.length} localStorage entries`);
      }
    } catch (error) {
      logger.warn('Failed to clear localStorage entries:', error);
    }
    
    // 4. Clear any other session storage entries that might contain user data
    try {
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key !== THREADS_CACHE_KEY && key !== CACHE_VERSION_KEY && (
          key.includes('chat') || 
          key.includes('thread') || 
          key.includes('message') ||
          key.includes('user') ||
          key.includes('firebase')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        logger.debug(`Removed sessionStorage key: ${key}`);
      });
      
      if (sessionKeysToRemove.length > 0) {
        logger.debug(`Cleared ${sessionKeysToRemove.length} sessionStorage entries`);
      }
    } catch (error) {
      logger.warn('Failed to clear sessionStorage entries:', error);
    }
    
    logger.info('All cache layers cleared successfully');
  } catch (error) {
    logger.error('Failed to clear all caches:', error as Error);
  }
} 