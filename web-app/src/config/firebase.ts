/**
 * firebase.ts
 * 
 * Firebase configuration and initialization
 * 
 * Setup:
 *   Firebase Auth instance with server-side config
 * 
 * Usage: 
 *   import { auth, initializeFirebaseAuth } from '../config/firebase'
 *   await initializeFirebaseAuth(); // Call this before using auth
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase/auth';

/**
 * Firebase configuration interface
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Firebase app and auth instances
 */
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let initPromise: Promise<Auth> | null = null;

/**
 * Fetch Firebase configuration from server
 */
async function fetchFirebaseConfig(): Promise<FirebaseConfig> {
  try {
    const response = await fetch('/api/config/firebase');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Firebase config from server:', error);
    throw error;
  }
}

/**
 * Initialize Firebase with config from server
 */
async function initializeFirebaseAuth(): Promise<Auth> {
  if (authInstance) {
    return authInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('🔥 Initializing Firebase with server config...');
      const firebaseConfig = await fetchFirebaseConfig();
      
      app = initializeApp(firebaseConfig);
      authInstance = firebaseGetAuth(app);
      
      console.log('✅ Firebase initialized successfully');
      return authInstance;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      initPromise = null; // Reset promise to allow retry
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get Firebase auth instance (initializes if needed)
 */
async function getAuthInstance(): Promise<Auth> {
  return await initializeFirebaseAuth();
}

/**
 * Get Firebase app instance
 */
function getAppInstance(): FirebaseApp | null {
  return app;
}

/**
 * Check if Firebase is initialized
 */
function isInitialized(): boolean {
  return authInstance !== null;
}

export { 
  initializeFirebaseAuth, 
  getAuthInstance as getAuth, 
  getAppInstance as getApp, 
  isInitialized 
};

// For backward compatibility, export auth as a promise
export const auth = initializeFirebaseAuth(); 