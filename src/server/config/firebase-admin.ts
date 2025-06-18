/**
 * firebase-admin.ts
 * 
 * Firebase Admin SDK configuration for server-side operations
 * 
 * Features:
 *   - Firebase Admin SDK initialization
 *   - Firestore database connection
 *   - Authentication token verification
 *   - Service account authentication
 * 
 * Usage: import { admin, db } from './firebase-admin'
 */
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Load environment variables first
dotenv.config();

// Firebase Admin configuration
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

/**
 * Initialize Firebase Admin SDK
 */
let app: admin.app.App;
let db: admin.firestore.Firestore;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    console.log('Initializing Firebase Admin SDK...');

    // Validate required environment variables
    if (!firebaseConfig.projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }

    // Initialize with service account or default credentials
    if (firebaseConfig.clientEmail && firebaseConfig.privateKey) {
      // Use service account key
      console.log('Using service account authentication');
      app = admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig as ServiceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else {
      // Use default credentials (for production deployment)
      console.log('Using default credentials');
      app = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }

    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    console.log('Firebase Admin SDK initialized successfully');
    console.log(`Project ID: ${firebaseConfig.projectId}`);
  } else {
    app = admin.apps[0] as admin.app.App;
    db = admin.firestore();
    console.log('Using existing Firebase Admin SDK instance');
  }
} catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
  throw error;
}

/**
 * Verify Firebase ID token and extract user information
 * 
 * @param idToken - Firebase ID token from client
 * @returns Decoded token with user information
 */
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Failed to verify ID token:', error);
    throw new Error('Invalid authentication token');
  }
}

/**
 * Get user information by UID
 * 
 * @param uid - User UID
 * @returns User record
 */
export async function getUserByUid(uid: string) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error(`Failed to get user by UID (${uid}):`, error);
    throw new Error('User not found');
  }
}

// Export initialized instances
export { admin, app, db };
export default { admin, app, db }; 