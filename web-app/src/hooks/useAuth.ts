/**
 * useAuth.ts
 * 
 * Custom hook for Firebase authentication management
 * 
 * Hook:
 *   useAuth
 * 
 * Features:
 *   - Google Sign-In with popup
 *   - Automatic session cache clearing on sign out for security
 *   - Auth state persistence across browser sessions
 * 
 * Usage: const { user, loading, signInWithGoogle, signOut } = useAuth();
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
  type Auth
} from 'firebase/auth';
import { initializeFirebaseAuth } from '../config/firebase';
import { clearThreadsCache } from '../utils/sessionCache';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthMethods {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

type UseAuthReturn = AuthState & AuthMethods;

/**
 * Custom hook for authentication state management
 * 
 * @returns Authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  /**
   * Initialize Firebase auth when component mounts
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing Firebase Auth...');
        const auth = await initializeFirebaseAuth();
        setAuthInstance(auth);

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setAuthState({
            user,
            loading: false,
            initialized: true,
          });
        });

        console.log('✅ Firebase Auth initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Auth:', error);
        setAuthState({
          user: null,
          loading: false,
          initialized: false,
        });
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Sign in with Google using popup
   */
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      await signInWithPopup(authInstance, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }, [authInstance]);

  /**
   * Sign out the current user and clear cached data
   */
  const signOut = useCallback(async (): Promise<void> => {
    if (!authInstance) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      console.log('🔒 Signing out user and clearing cache...');
      
      // Clear session cache before signing out for security
      clearThreadsCache();
      console.log('🗑️ Session cache cleared');
      
      await firebaseSignOut(authInstance);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }, [authInstance]);

  return {
    ...authState,
    signInWithGoogle,
    signOut,
  };
} 