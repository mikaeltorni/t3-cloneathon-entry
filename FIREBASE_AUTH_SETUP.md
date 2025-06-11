# Firebase Authentication Setup Guide

This guide walks you through setting up Firebase Authentication for the OpenRouter Chat App.

## 🎯 Overview

Firebase Authentication has been integrated into the frontend with:
- ✅ **Email/Password Authentication** 
- ✅ **React Hook** for auth state management
- ✅ **Sign In/Sign Up Forms** with error handling
- ✅ **Protected Routes** - chat only available when signed in
- ✅ **Auth Button** in sidebar showing user state
- ✅ **Environment Variable** configuration

## 📋 Quick Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable Authentication → Sign-in method → Email/Password

### 2. Get Firebase Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web app" icon to add a web app
4. Copy the configuration object

### 3. Configure Environment Variables
Create `web-app/.env` file with your Firebase config:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id-here
```

### 4. Test Authentication
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. You should see the sign-in form
4. Create an account and test sign in/out

## 🏗️ What's Been Added

### Components Added
```
web-app/src/
├── config/
│   └── firebase.ts              # Firebase configuration and auth instance
├── hooks/
│   └── useAuth.ts               # Authentication state management hook
└── components/auth/
    ├── AuthButton.tsx           # User status and sign out button
    └── SignInForm.tsx           # Sign in/sign up form
```

### Key Features
- **Protected App**: Users must sign in to access chat
- **Auth State**: Persistent login across browser sessions  
- **Error Handling**: User-friendly auth error messages
- **Loading States**: Proper loading indicators
- **Responsive Design**: Works on all screen sizes

## 🔧 How It Works

### Authentication Flow
1. **App starts** → Check if user is signed in
2. **Not signed in** → Show sign-in form
3. **Sign in successful** → Show main chat interface
4. **Sign out** → Return to sign-in form

### Auth Hook Usage
```typescript
import { useAuth } from '../hooks/useAuth';

const { user, loading, signIn, signUp, signOut } = useAuth();

// Check if user is authenticated
if (user) {
  // User is signed in
  console.log('User email:', user.email);
}

// Sign in
await signIn('user@example.com', 'password');

// Sign up
await signUp('user@example.com', 'password');

// Sign out
await signOut();
```

### Firebase Config Usage
```typescript
import { auth } from '../config/firebase';

// The auth instance is available throughout the app
// It automatically uses environment variables for configuration
```

## 🚦 Current State

### ✅ What's Working
- Email/password authentication
- User state management
- Protected routes
- Sign in/sign up forms
- User interface integration
- Environment-based configuration

### 🔄 What's Still Using File Storage
- Chat threads (stored in `data/` folder)
- User data is NOT yet connected to chats
- Each user currently sees all chats (not user-specific yet)

### 🔮 Future Enhancements (NOT IMPLEMENTED YET)
- User-specific chat storage
- Remove shared `data/` folder
- Connect auth to backend
- User profiles and preferences

## 🐛 Troubleshooting

### Common Issues

**"Firebase config not found"**
- Make sure `web-app/.env` exists with all Firebase variables
- Check that variables start with `VITE_` prefix
- Restart the dev server after adding environment variables

**"Authentication failed"**
- Check Firebase Console → Authentication → Sign-in method
- Ensure Email/Password is enabled
- Check if user exists (create account first)

**"User not redirected after sign in"**
- Check browser console for errors
- Ensure Firebase config is correct
- Try clearing browser cache/localStorage

### Debugging Tips
```typescript
// Check current auth state
import { auth } from './config/firebase';
console.log('Current user:', auth.currentUser);

// Check Firebase config
console.log('Firebase config loaded:', !!auth.app);
```

## 📚 Firebase Auth Documentation

- [Firebase Auth Web Guide](https://firebase.google.com/docs/auth/web/start)
- [Email/Password Authentication](https://firebase.google.com/docs/auth/web/password-auth)
- [Firebase Console](https://console.firebase.google.com/)

---

**🎉 Firebase Authentication is now integrated!** Users must sign in to access the chat interface, but the existing file-based chat storage remains unchanged for now. 