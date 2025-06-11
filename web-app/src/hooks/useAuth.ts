/**
 * useAuth.ts
 * 
 * Custom hook for Firebase Authentication state management
 * 
 * Hook:
 *   useAuth - Manages authentication state and provides auth methods
 * 
 * Usage: const { user, loading, signIn, signOut, signUp } = useAuth()
 */

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthMethods {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface UseAuthReturn extends AuthState, AuthMethods {}

/**
 * Custom hook for Firebase Authentication
 * 
 * @returns Auth state and methods
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  /**
   * Listen for authentication state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user,
        loading: false,
      });
    });

    return unsubscribe;
  }, []);

  /**
   * Sign in with email and password
   * 
   * @param email - User email
   * @param password - User password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  /**
   * Sign up with email and password
   * 
   * @param email - User email
   * @param password - User password
   */
  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
} 