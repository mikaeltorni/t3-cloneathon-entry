/**
 * ConnectionError.tsx
 * 
 * Component for displaying server connection errors
 * Extracted from App.tsx for better organization and reusability
 * 
 * Components:
 *   ConnectionError
 * 
 * Features:
 *   - Server connection error display
 *   - Helpful troubleshooting instructions
 *   - Retry functionality
 *   - Responsive design
 * 
 * Usage: <ConnectionError error={errorMessage} onRetry={handleRetry} />
 */
import React from 'react';
import { Button } from '../ui/Button';

/**
 * Props for the ConnectionError component
 */
interface ConnectionErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Server connection error component
 * 
 * Displays a user-friendly error message when the server
 * is not running or not reachable, with helpful instructions
 * for getting the server running.
 * 
 * @param error - Error message to display
 * @param onRetry - Callback function for retry action
 * @returns React component
 */
export const ConnectionError: React.FC<ConnectionErrorProps> = ({
  error,
  onRetry
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Server Connection Error
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="bg-red-100 rounded-lg p-3 text-left text-sm">
            <p className="text-red-800 font-medium mb-2">
              Make sure the server is running:
            </p>
            <code className="text-xs bg-red-200 px-2 py-1 rounded block">
              npm run server:dev
            </code>
          </div>
          <Button
            onClick={onRetry}
            variant="destructive"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}; 