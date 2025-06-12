/**
 * ErrorBanner.tsx
 * 
 * Component for displaying dismissible error banners
 * Extracted from App.tsx for better organization and reusability
 * 
 * Components:
 *   ErrorBanner
 * 
 * Features:
 *   - Dismissible error banner
 *   - Icon-based error indication
 *   - Accessible design with proper ARIA labels
 *   - Responsive layout
 * 
 * Usage: <ErrorBanner error={errorMessage} onDismiss={handleDismiss} />
 */
import React from 'react';

/**
 * Props for the ErrorBanner component
 */
interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

/**
 * Dismissible error banner component
 * 
 * Displays a non-critical error message with the ability
 * to dismiss it. Used for transient errors that don't
 * require full page error states.
 * 
 * @param error - Error message to display
 * @param onDismiss - Callback function for dismissing the error
 * @returns React component
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss
}) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-red-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors duration-200"
          aria-label="Dismiss error"
        >
          <span className="sr-only">Dismiss</span>
          <svg 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}; 