/**
 * ErrorBoundary.tsx
 * 
 * Global error boundary component for catching and handling React errors - refactored with extracted components
 * Now uses smaller, focused components and utilities for better maintainability
 * 
 * Components:
 *   ErrorBoundary - Main error boundary wrapper
 * 
 * Features:
 *   - Catches all React component errors  
 *   - Uses extracted error utilities for categorization
 *   - Delegates UI rendering to ErrorFallback component
 *   - Supports custom fallback components
 *   - Includes error reporting capabilities
 *   - Auto-retry for retryable errors
 * 
 * Usage: <ErrorBoundary><YourApp /></ErrorBoundary>
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { categorizeError, generateErrorId } from '../utils/errorUtils';
import { ErrorFallback } from './error/ErrorFallback';
import type { AppError } from '../../../src/shared/types';

interface Props {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // Whether to isolate errors to this boundary
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

/**
 * Enhanced error boundary component with comprehensive error handling
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = generateErrorId();
    
    return {
      hasError: true,
      error: {
        category: 'UNKNOWN_ERROR',
        message: error.message,
        code: error.name,
        timestamp: new Date(),
        details: { stack: error.stack }
      } as AppError,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const categorizedError = categorizeError(error);
    const errorId = generateErrorId();
    
    // Update state with categorized error
    this.setState({
      error: categorizedError,
      errorId
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', categorizedError);
      console.error('Error info:', errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(categorizedError, errorInfo);

    // TODO: Send to error reporting service in production
    // this.reportError(categorizedError, errorInfo);
  }

  /**
   * Reset error state and allow retry
   */
  private handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: null
    });
  };

  /**
   * Automatic retry for retryable errors
   */
  private handleAutoRetry = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.resetTimeoutId = window.setTimeout(() => {
      this.handleReset();
    }, 3000);
  };

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error fallback UI
      return (
        <ErrorFallback 
          error={this.state.error}
          errorId={this.state.errorId}
          onReset={this.handleReset}
          onAutoRetry={this.handleAutoRetry}
        />
      );
    }

    return this.props.children;
  }
} 