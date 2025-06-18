/**
 * SignInForm.tsx
 * 
 * Google sign-in form component with Karpathy background image
 * Enhanced with comprehensive dark mode support and left-side image layout
 * 
 * Component:
 *   SignInForm - Google authentication form with background image
 * 
 * Usage: <SignInForm />
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import karpathyImage from '../../assets/karpathy.jpg';

/**
 * Google sign-in form component with Karpathy background image
 * Enhanced with comprehensive dark mode support and split layout
 * 
 * @returns Sign-in form with background image
 */
export const SignInForm: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle Google sign-in
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-slate-900/50 overflow-hidden border border-gray-200 dark:border-slate-600">
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Side - Karpathy Image with Overlay */}
        <div className="lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-purple-700 dark:from-slate-800 dark:to-slate-900">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${karpathyImage})`,
            }}
          />
          
          {/* Dark Mode Overlay - Blends the image with dark mode */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/70 via-purple-700/60 to-slate-900/80 dark:from-slate-900/85 dark:via-slate-800/90 dark:to-slate-900/95" />
          
          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center p-8 text-white">
            <div className="text-center space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Welcome to
                <span className="block bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                  Vibe Chat
                </span>
              </h1>
              <p className="text-l lg:text-2xl text-blue-100 dark:text-slate-300 font-light leading-relaxed max-w-md">
                Andrej Karpathy coined the term "vibe coding" on 2nd of February 2025
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                Continue with your Google account to access the chat interface
              </p>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-300 dark:border-slate-500 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mr-3"></div>
              ) : (
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-gray-400 dark:text-slate-500">
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
                <span className="text-sm font-medium">Sign In with Google</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600"></div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  By signing in, you agree that this project is a proof-of-concept and that the host and/or the repository owner is not liable for ANYTHING, such as loss of data, loss of money, or any other damages. This project is not intended to be used for any other purpose than testing, do not enter any confidential information! For any GDPR inquiries contact the repository owner at{' '}
                  <a 
                    href="mailto:mikaeltorni25@gmail.com" 
                    className="text-blue-500 dark:text-blue-400 hover:underline transition-colors"
                  >
                    mikaeltorni25@gmail.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 