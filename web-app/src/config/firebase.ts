/**
 * firebase.ts
 * 
 * Firebase configuration and initialization
 * 
 * Setup:
 *   Firebase Auth instance
 * 
 * Usage: import { auth } from '../config/firebase'
 */

import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase configuration object
 * Uses environment variables or fallback values
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

/**
 * Initialize Firebase app
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Auth and get a reference to the service
 */
export const auth: Auth = getAuth(app);

/**
 * Export the app instance for potential future use
 */
export default app; 