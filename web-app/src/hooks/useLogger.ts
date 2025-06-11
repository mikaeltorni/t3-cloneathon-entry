/**
 * useLogger.ts
 * 
 * Custom hook for logging in React components
 * 
 * Hook:
 *   useLogger
 * 
 * Usage: import { useLogger } from '../hooks/useLogger'
 */
import { useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook for component-scoped logging
 * 
 * @param componentName - Name of the component for log prefixing
 * @returns Object with logging methods (log, debug, warn, error)
 */
export function useLogger(componentName: string) {
  const logPrefix = `[${componentName}]`;
  
  const log = useCallback((message: string, ...args: any[]) => {
    logger.info(`${logPrefix} ${message}`, ...args);
  }, [logPrefix]);
  
  const debug = useCallback((message: string, ...args: any[]) => {
    logger.debug(`${logPrefix} ${message}`, ...args);
  }, [logPrefix]);
  
  const warn = useCallback((message: string, ...args: any[]) => {
    logger.warn(`${logPrefix} ${message}`, ...args);
  }, [logPrefix]);
  
  const error = useCallback((message: string, err?: Error, ...args: any[]) => {
    logger.error(`${logPrefix} ${message}`, err, ...args);
  }, [logPrefix]);
  
  return { log, debug, warn, error };
} 