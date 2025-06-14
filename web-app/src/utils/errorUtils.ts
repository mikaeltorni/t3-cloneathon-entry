/**
 * errorUtils.ts
 * 
 * Utility functions for error handling and categorization
 * 
 * Functions:
 *   categorizeError - Converts Error to AppError with categorization
 *   getErrorTitle - Gets user-friendly error titles
 *   getErrorMessage - Gets user-friendly error messages
 *   getErrorIcon - Gets appropriate icons for error types
 *   generateErrorId - Generates unique error identifiers
 * 
 * Usage: import { categorizeError, getErrorTitle } from './utils/errorUtils'
 */
import type { AppError, ErrorCategory } from '../../../src/shared/types';

/**
 * Convert JavaScript Error to AppError with intelligent categorization
 * 
 * @param error - Raw JavaScript Error object
 * @returns Categorized AppError with metadata
 */
export function categorizeError(error: Error): AppError {
  let category: ErrorCategory = 'UNKNOWN_ERROR';
  
  // Categorize based on error type and message
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    category = 'NETWORK_ERROR';
  } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
    category = 'NETWORK_ERROR';
  } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    category = 'AUTH_ERROR';
  } else if (error.message.includes('404') || error.message.includes('Not Found')) {
    category = 'NOT_FOUND_ERROR';
  } else if (error.message.includes('500') || error.message.includes('Server Error')) {
    category = 'SERVER_ERROR';
  } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    category = 'VALIDATION_ERROR';
  }

  return {
    category,
    message: error.message,
    code: error.name,
    details: {
      stack: error.stack,
      cause: (error as any).cause // Type assertion for newer Error properties
    },
    timestamp: new Date(),
    retryable: category === 'NETWORK_ERROR' || category === 'SERVER_ERROR'
  };
}

/**
 * Get user-friendly error title based on category
 * 
 * @param category - Error category
 * @returns Human-readable error title
 */
export function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case 'NETWORK_ERROR':
      return 'Connection Problem';
    case 'AUTH_ERROR':
      return 'Authentication Required';
    case 'NOT_FOUND_ERROR':
      return 'Page Not Found';
    case 'SERVER_ERROR':
      return 'Server Issue';
    case 'VALIDATION_ERROR':
      return 'Invalid Data';
    default:
      return 'Something Went Wrong';
  }
}

/**
 * Get user-friendly error message based on category
 * 
 * @param category - Error category
 * @returns Human-readable error message with guidance
 */
export function getErrorMessage(category: ErrorCategory): string {
  switch (category) {
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.';
    case 'AUTH_ERROR':
      return 'Please sign in to continue.';
    case 'NOT_FOUND_ERROR':
      return 'The page you\'re looking for doesn\'t exist.';
    case 'SERVER_ERROR':
      return 'Our servers are having issues. Please try again in a moment.';
    case 'VALIDATION_ERROR':
      return 'There was a problem with the data. Please refresh and try again.';
    default:
      return 'An unexpected error occurred. Please try refreshing the page.';
  }
}

/**
 * Get appropriate icon emoji for error category
 * 
 * @param category - Error category
 * @returns Emoji icon representing the error type
 */
export function getErrorIcon(category: ErrorCategory): string {
  switch (category) {
    case 'NETWORK_ERROR':
      return '🌐';
    case 'AUTH_ERROR':
      return '🔐';
    case 'NOT_FOUND_ERROR':
      return '🔍';
    case 'SERVER_ERROR':
      return '🔧';
    case 'VALIDATION_ERROR':
      return '⚠️';
    default:
      return '❌';
  }
}

/**
 * Generate unique error identifier for tracking
 * 
 * @returns Unique error ID string
 */
export function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 