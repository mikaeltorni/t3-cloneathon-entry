/**
 * firebase.ts
 * 
 * Firebase configuration and initialization
 * 
 * Setup:
 *   Firebase Auth and Firestore instances with server-side config
 * 
 * Usage: 
 *   import { auth, firestore, initializeFirebaseAuth } from '../config/firebase'
 *   await initializeFirebaseAuth(); // Call this before using auth or firestore
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase/auth';
import { getFirestore as firebaseGetFirestore, type Firestore } from 'firebase/firestore';

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
 * Firebase app, auth, and firestore instances
 */
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
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
      console.log('Initializing Firebase with server config...');
      const firebaseConfig = await fetchFirebaseConfig();
      
      app = initializeApp(firebaseConfig);
      authInstance = firebaseGetAuth(app);
      firestoreInstance = firebaseGetFirestore(app);
      
      console.log('Firebase initialized successfully');
      return authInstance;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
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
 * Get Firebase Firestore instance (initializes if needed)
 */
async function getFirestoreInstance(): Promise<Firestore> {
  if (!firestoreInstance) {
    await initializeFirebaseAuth(); // This will initialize both auth and firestore
  }
  
  if (!firestoreInstance) {
    throw new Error('Firestore instance not initialized');
  }
  
  return firestoreInstance;
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
  return authInstance !== null && firestoreInstance !== null;
}

export { 
  initializeFirebaseAuth, 
  getAuthInstance as getAuth, 
  getFirestoreInstance as getFirestore,
  getAppInstance as getApp, 
  isInitialized 
};

// For backward compatibility, export auth as a promise
export const auth = initializeFirebaseAuth(); 