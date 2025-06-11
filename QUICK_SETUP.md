# Quick Setup Guide

## Environment Variables Setup

### Server-Side Configuration Only

All environment variables are now managed server-side for better security.

Copy `env.template` to `.env` in the root directory:
```bash
cp env.template .env
```

Add your configuration to `.env`:
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
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id
```

## Firebase Google Auth Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Enable Authentication > Sign-in method > Google
4. Get your web app configuration from Project Settings
5. Add the values to `web-app/.env` as shown above

## Run the Application

```bash
npm install
cd web-app && npm install
cd ..
npm run dev
```

The app will now:
- Require Google sign-in before accessing chat
- Load all configuration from server-side environment variables
- Automatically fetch Firebase config from `/api/config/firebase`
- Keep all sensitive data secure on the server

See `FIREBASE_AUTH_SETUP.md` for detailed instructions. 