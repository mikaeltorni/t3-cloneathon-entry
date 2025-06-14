/**
 * ErrorFallback.tsx
 * 
 * User-friendly error fallback component for displaying errors
 * 
 * Components:
 *   ErrorFallback
 * 
 * Features:
 *   - User-friendly error presentation
 *   - Category-specific icons and messages
 *   - Recovery action buttons
 *   - Auto-retry for retryable errors
 *   - Development error details
 * 
 * Usage: <ErrorFallback error={appError} errorId={id} onReset={reset} onAutoRetry={autoRetry} />
 */
import React from 'react';
import { getErrorTitle, getErrorMessage, getErrorIcon } from '../../utils/errorUtils';
import type { AppError } from '../../../../src/shared/types';

interface ErrorFallbackProps {
  /** The categorized application error */
  error: AppError;
  /** Unique error identifier for tracking */
  errorId: string | null;
  /** Callback to reset error state */
  onReset: () => void;
  /** Callback to initiate auto-retry */
  onAutoRetry: () => void;
}

/**
 * User-friendly error fallback component
 * 
 * @param error - Categorized application error
 * @param errorId - Unique error identifier
 * @param onReset - Reset error state callback
 * @param onAutoRetry - Auto-retry callback
 * @returns React component displaying error with recovery options
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  onReset,
  onAutoRetry
}) => {
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