# Firebase Authentication Setup Guide

This guide walks you through setting up Firebase Authentication with Google Sign-In for the OpenRouter Chat application.

## Prerequisites

- A Google/Firebase account
- A Firebase project

## Step 1: Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project
4. Enable Google Analytics (optional but recommended)

## Step 2: Enable Authentication

1. In your Firebase project console, navigate to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Enable **Google** as a sign-in provider:
   - Click on **Google**
   - Toggle the **Enable** switch
   - Enter your project's public-facing name
   - Select your support email
   - Click **Save**

## Step 3: Register Your Web App

1. In the Firebase console, click the **Web** icon (</>)
2. Register your app with a nickname (e.g., "OpenRouter Chat Web")
3. **Optional**: Enable Firebase Hosting (not required for this setup)
4. Click **Register app**

## Step 4: Get Configuration Keys

After registering, you'll see a configuration object. Copy these values:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 5: Configure Environment Variables

### Server-Side Configuration (.env)

All configuration is now managed server-side for better security.

1. Copy the `env.template` file to `.env` in the root directory:
   ```bash
   cp env.template .env
   ```

2. Update the `.env` file with your actual configuration:
   ```env
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   
   # Server Configuration  
   PORT=3001
   NODE_ENV=development
   
   # Firebase Configuration (Server-side)
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789012
   FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

**Security Note**: All environment variables are now server-side only. The frontend fetches Firebase configuration from `/api/config/firebase` endpoint.

## Step 6: Configure Authorized Domains

1. In the Firebase console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your development domain (usually `localhost`) if not already present
3. For production, add your actual domain

## Step 7: Install Dependencies and Run

1. Install the required dependencies:
   ```bash
   npm install
   cd web-app && npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

**Note**: The frontend will automatically fetch Firebase configuration from the server at `/api/config/firebase`.

## How It Works

### Google Authentication Flow

1. User clicks "Continue with Google" button
2. Firebase opens Google's OAuth popup
3. User signs in with their Google account
4. Firebase returns user information and authentication token
5. App saves auth state and redirects to chat interface

### Key Features

- **Secure**: Uses Google's OAuth 2.0 for authentication
- **Persistent**: Auth state persists across browser sessions
- **Protected Routes**: Chat interface only accessible when signed in
- **Easy Sign Out**: One-click sign out from any page

### Authentication Components

- `useAuth.ts` - Custom hook managing auth state and methods
- `SignInForm.tsx` - Google sign-in interface
- `AuthButton.tsx` - Shows user status and sign-out option
- `App.tsx` - Route protection based on auth state

## Testing the Setup

1. Start the application (`npm run dev`)
2. You should see the Google sign-in page
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. You should be redirected to the chat interface
6. Your name should appear in the sidebar with a sign-out option

## Security Notes

- Environment variables in `.env` files are git-ignored
- Firebase API keys are safe to expose in frontend code
- Auth tokens are automatically managed by Firebase
- Google handles all password security

## Troubleshooting

### Common Issues

1. **"auth/invalid-api-key"**
   - Check your `VITE_FIREBASE_API_KEY` in `web-app/.env`

2. **"auth/auth-domain-config-required"**  
   - Verify `VITE_FIREBASE_AUTH_DOMAIN` is correct

3. **"auth/unauthorized-domain"**
   - Add your domain to Firebase Console > Authentication > Settings > Authorized domains

4. **Popup blocked**
   - Ensure popup blockers allow Firebase auth domains
   - Try using `signInWithRedirect` instead of `signInWithPopup`

### Getting Help

- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure Firebase project has Google auth enabled
- Check Firebase project settings match your configuration

## Next Steps

- Add user profile management
- Implement user-specific chat storage
- Add additional authentication providers
- Set up custom claims for role-based access

For more Firebase Auth documentation, visit: https://firebase.google.com/docs/auth

 