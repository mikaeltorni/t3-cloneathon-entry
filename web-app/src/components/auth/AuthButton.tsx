/**
 * AuthButton.tsx
 * 
 * Simple authentication button component
 * 
 * Component:
 *   AuthButton - Shows user state and sign out option
 * 
 * Usage: <AuthButton />
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Authentication button component
 * Shows user info when signed in, nothing when signed out
 * 
 * @returns Authentication button
 */
export const AuthButton: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-sm text-gray-500">
        Not signed in
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {user.email}
          </span>
          <span className="text-xs text-gray-500">
            Signed in
          </span>
        </div>
      </div>
      <button
        onClick={signOut}
        className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}; 