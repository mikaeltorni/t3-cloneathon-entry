/**
 * useErrorHandler.ts
 * 
 * Custom hook for handling errors in components
 * 
 * Hook:
 *   useErrorHandler
 * 
 * Usage: const handleError = useErrorHandler();
 */
import { useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook for standardized error handling
 * 
 * @returns Object with error handling functions
 */
export function useErrorHandler() {
  const handleError = useCallback((error: Error, context?: string) => {
    const contextMessage = context ? `[${context}] ` : '';
    logger.error(`${contextMessage}${error.message}`, error);
    
    // You can extend this to show user notifications, send to error tracking service, etc.
    // For example, using a toast notification system
  }, []);
  
  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError]);
  
  return { handleError, handleAsyncError };
} 