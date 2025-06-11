/**
 * ErrorBoundary.tsx
 * 
 * Global error boundary component for catching and handling React errors
 * Enhanced with error categorization, logging, and user-friendly fallbacks
 * 
 * Components:
 *   ErrorBoundary - Main error boundary wrapper
 *   ErrorFallback - User-friendly error display component
 * 
 * Features:
 *   - Catches all React component errors
 *   - Categorizes errors for better handling
 *   - Provides user-friendly error messages
 *   - Includes error reporting capabilities
 *   - Supports error recovery actions
 * 
 * Usage: <ErrorBoundary><YourApp /></ErrorBoundary>
 */
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import type { AppError, ErrorCategory } from '../../../src/shared/types';

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

  /**
   * Convert JavaScript Error to AppError with categorization
   */
  private categorizeError(error: Error): AppError {
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

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
    const categorizedError = this.categorizeError(error);
    
    // Update state with categorized error
    this.setState({
      error: categorizedError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

/**
 * User-friendly error fallback component
 */
interface ErrorFallbackProps {
  error: AppError;
  errorId: string | null;
  onReset: () => void;
  onAutoRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  onReset,
  onAutoRetry
}) => {
  const getErrorTitle = (category: ErrorCategory): string => {
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
  };

  const getErrorMessage = (category: ErrorCategory): string => {
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
  };

  const getErrorIcon = (category: ErrorCategory): string => {
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
  };

  React.useEffect(() => {
    // Auto-retry for retryable errors
    if (error.retryable) {
      onAutoRetry();
    }
  }, [error.retryable, onAutoRetry]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {getErrorIcon(error.category)}
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {getErrorTitle(error.category)}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error.category)}
          </p>

          <div className="space-y-3">
            <button
              onClick={onReset}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Refresh Page
            </button>
          </div>

          {error.retryable && (
            <p className="text-xs text-blue-600 mt-4">
              🔄 Auto-retrying in 3 seconds...
            </p>
          )}

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                <p><strong>ID:</strong> {errorId}</p>
                <p><strong>Category:</strong> {error.category}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Code:</strong> {error.code}</p>
                <p><strong>Time:</strong> {error.timestamp.toISOString()}</p>
                {error.details?.stack && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                      {error.details.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}; 