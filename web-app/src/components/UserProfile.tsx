/**
 * UserProfile.tsx
 * 
 * User profile component with logout functionality
 * 
 * Components:
 *   UserProfile
 * 
 * Features:
 *   - User avatar and name display
 *   - Logout button with confirmation
 *   - Responsive design
 *   - Loading states
 */
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useLogger } from '../hooks/useLogger';
import { cn } from '../utils/cn';

/**
 * User profile component for sidebar footer
 * 
 * @returns React component
 */
export const UserProfile: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { log, error } = useLogger('UserProfile');

  /**
   * Handle user logout
   */
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      log('User signing out...');
      await signOut();
      log('User signed out successfully');
    } catch (err) {
      error('Failed to sign out', err as Error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-slate-600">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* User Avatar */}
          <div className="relative">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            {(!user.photoURL || !user.photoURL) && (
              <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 dark:bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
              {user.displayName || 'Anonymous User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            "ml-2 px-2 py-1 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950",
            "transition-colors duration-200"
          )}
          title="Sign out"
        >
          {isSigningOut ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
        </Button>
      </div>

      {/* Project Information */}
      <div className="mt-2 text-xs text-gray-400 dark:text-slate-500 space-y-1">
        <div>v19062025</div>
        <div>Made in one week by Mikael Törni</div>
        <a 
          href="https://github.com/mikaeltorni/t3-cloneathon-entry" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}; 