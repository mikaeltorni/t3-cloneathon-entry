# OpenRouter Chat App

A modern, full-stack chat application built with React + TypeScript + Tailwind CSS, featuring AI chat capabilities powered by OpenRouter's API with comprehensive Firebase authentication and security.

## 🚀 Features

### Core Functionality
- **Multi-Model AI Chat**: Switch between different AI models from OpenRouter
- **Real-time Streaming**: Live message streaming with reasoning display
- **Image Analysis**: Upload and analyze images with AI models
- **Persistent Chat History**: Firebase-backed conversation storage
- **Reasoning Models**: Advanced AI models with visible thinking process

### Security & Authentication
- **Firebase Authentication**: Secure Google Sign-In integration
- **Database-Level Security**: Firestore security rules for user data isolation
- **Comprehensive Cache Management**: Multi-layer cache clearing for privacy
- **Server-Side Validation**: Enhanced authentication middleware with user verification
- **Resource Ownership Validation**: Ensures users can only access their own data

### Modern Architecture
- **Component-Based Design**: Extracted and reusable UI components
- **Custom Hooks**: Organized state management with specialized hooks
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Responsive Design**: Mobile-first approach with sidebar management
- **Performance Optimized**: React.memo, memoized callbacks, and efficient re-renders

## 🛠️ Technology Stack

### Frontend
- **React 18+** with TypeScript for type safety
- **Tailwind CSS 3+** for responsive styling
- **Vite** for fast development and optimized builds
- **Custom Hooks** for state management and business logic

### Backend & Services
- **Express.js** server with TypeScript
- **Firebase Admin SDK** for server-side operations
- **Firestore** for persistent chat storage
- **OpenRouter API** for AI model integration

### Security & Infrastructure
- **Firebase Authentication** with ID token verification
- **Firestore Security Rules** for database-level protection
- **CORS Protection** and request validation
- **Comprehensive Logging** for debugging and monitoring

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mikaeltorni/t3-cloneathon-entry
   cd t3-cloneathon-entry
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your configuration
   ```

4. **Configure Firebase:**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Download service account key
   - **IMPORTANT**: After running `firebase init`, use our cleanup script:
     ```bash
     npm run setup:firebase
     ```

## 🚀 Development

### Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server:dev  # Backend server on port 3000
npm run web:dev     # Frontend on port 5173
```

### Firebase Setup
```bash
# Clean up after firebase init and deploy security rules
npm run setup:firebase

# Or for Windows PowerShell
npm run setup:firebase:windows

# Start Firebase emulators (optional)
firebase emulators:start
```

**📖 See detailed Firebase setup instructions below in the Firebase Setup section**

## 🔧 Available Scripts

- `npm run dev` - Start both frontend and backend servers
- `npm run server:dev` - Start Express server with hot reload
- `npm run web:dev` - Start Vite development server
- `npm run build` - Build both frontend and backend for production
- `npm run server:build` - Compile TypeScript server code
- `npm run web:build` - Build frontend with Vite
- `npm run lint` - Run ESLint on all files
- `npm run type-check` - Run TypeScript compiler checks
- `npm run setup:firebase` - Clean up and configure Firebase after `firebase init`
- `npm run setup:firebase:windows` - Windows PowerShell version of Firebase setup

## 🏗️ Production Build

For production deployment:

```bash
# Full production build
npm run build

# Individual builds
npm run server:build  # TypeScript compilation
npm run web:build     # Vite build

# Alternative build commands for complex setups
cd web-app && npm run build  # Build from web-app directory
tsc -b && vite build         # Direct TypeScript + Vite build
```

## 📁 Project Structure

```
├── src/                    # Backend server code
│   ├── server/            # Express server and API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Authentication and validation
│   │   ├── services/      # Business logic services
│   │   └── config/        # Configuration files
│   └── shared/            # Shared types and utilities
├── web-app/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── error/     # Error handling components
│   │   │   └── ui/        # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   │   ├── useAuth.ts        # Authentication management
│   │   │   ├── useChat.ts        # Chat state and operations
│   │   │   ├── useModels.ts      # AI model management
│   │   │   ├── useMessageForm.ts # Form handling
│   │   │   └── useReasoningState.ts # Reasoning UI state
│   │   ├── services/      # API and external services
│   │   ├── utils/         # Utility functions and helpers
│   │   └── config/        # Configuration files
├── firebase-config/       # Firebase configuration templates
│   ├── firestore.rules.template  # Security rules template
│   └── firebase.json.template    # Firebase config template
├── firestore.rules       # Firestore security rules (generated)
├── firebase.json          # Firebase project configuration (generated)
├── scripts/              # Setup and utility scripts
│   ├── setup-firebase.js # Cross-platform Firebase setup
│   └── setup-firebase.ps1 # Windows Firebase setup
└── README.md              # This file
```

## 🎨 Component Architecture

### Custom Hooks
- **`useAuth`** - Firebase authentication management
- **`useChat`** - Chat operations and state management
- **`useModels`** - AI model selection and configuration
- **`useMessageForm`** - Form handling with validation
- **`useReasoningState`** - Reasoning display state management
- **`useInputBarHeight`** - Dynamic UI spacing calculations

### Key Components
- **`ChatInterface`** - Main chat layout and orchestration
- **`ChatInput`** - Message composition with auto-resize
- **`MessageList`** - Optimized message rendering
- **`ChatSidebar`** - Thread management and navigation
- **`ConnectionError`** - Server connection error handling
- **`ErrorBanner`** - Dismissible error notifications

## 🔐 Security Features

### Firebase Security Rules
```javascript
// users/{userId}/chats/{chatId} - User can only access own chats
// users/{userId}/chats/{chatId}/messages/{messageId} - Message access control
```

### Authentication Flow
1. **Client Authentication**: Google Sign-In with Firebase
2. **Token Verification**: Server-side ID token validation
3. **Resource Ownership**: User ID verification for all operations
4. **Cache Security**: Comprehensive cache clearing on login/logout

### Data Protection
- **User Isolation**: Firestore collections scoped by user ID
- **Server-Side Validation**: All requests authenticated and authorized
- **Privacy Controls**: Multi-layer cache clearing prevents data leakage

## 🌐 API Endpoints

### Authentication Required
- `GET /api/chats` - Get all user chat threads
- `GET /api/chats/:threadId` - Get specific chat thread
- `POST /api/chats/message` - Send new message
- `DELETE /api/chats/:threadId` - Delete chat thread

### Public Endpoints
- `GET /api/health` - Server health check
- `GET /api/config/firebase` - Firebase client configuration
- `GET /api/models` - Available AI models

## 🎯 Performance Optimizations

- **React.memo** for component memoization
- **useCallback** and **useMemo** for expensive operations
- **Virtualization-ready** message list structure
- **Optimized re-renders** with targeted state updates
- **Efficient caching** with selective invalidation

## 🚀 Deployment

### Firebase Hosting
```bash
firebase deploy
```

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy server to your hosting platform
3. Configure environment variables
4. Deploy Firestore security rules

## 🔥 Firebase Setup Guide

### 🚨 Important: Firebase Init Cleanup Required

When you run `firebase init`, it creates many unnecessary files and can overwrite our carefully crafted security rules. This guide ensures you get a clean, secure setup.

### 📋 Quick Setup (Recommended)

After cloning the repository and running `firebase init`, use our automated cleanup script:

#### Option A: Cross-Platform (Node.js)
```bash
npm run setup:firebase
```

#### Option B: Windows PowerShell
```bash
npm run setup:firebase:windows
```

#### Option C: Manual Script Execution
```bash
# Cross-platform
node scripts/setup-firebase.js

# Windows
powershell -ExecutionPolicy Bypass -File scripts/setup-firebase.ps1
```

### 🔧 Manual Setup (Step by Step)

If you prefer to do it manually or the scripts don't work:

#### 1. Prerequisites
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

#### 2. Initialize Firebase (if not done)
```bash
firebase init
```

**Important**: When prompted, only select **Firestore** (not Functions, Hosting, etc.)

#### 3. Clean Up Unnecessary Files

Remove these directories (if they exist):
```bash
# Remove unnecessary directories
rm -rf functions/
rm -rf public/
rm -rf extensions/
rm -rf dataconnect/
rm -rf dataconnect-generated/

# Remove unnecessary files
rm database.rules.json
rm remoteconfig.template.json
rm storage.rules
```

#### 4. Restore Configuration Files

Replace `firebase.json` with minimal configuration:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Ensure `firestore.rules` contains our security rules:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only access their own chat collections
      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Users can only access messages within their own chats
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // Deny access to all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### 5. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 🔍 What the Setup Scripts Do

Our automated scripts perform these actions:

1. **Verify Firebase CLI** - Ensures Firebase CLI is installed and accessible
2. **Clean Up Files** - Removes unnecessary directories and files created by `firebase init`
3. **Restore Configuration** - Copies our secure configuration from templates
4. **Deploy Rules** - Automatically deploys the Firestore security rules
5. **Verify Setup** - Confirms everything is configured correctly

### 📁 File Structure After Setup

After proper setup, your Firebase files should look like this:

```
├── .firebaserc              # Firebase project configuration
├── firebase.json             # Minimal Firestore configuration
├── firestore.rules          # Security rules (CRITICAL)
├── firestore.indexes.json   # Database indexes
├── firebase-config/         # Template files directory
│   ├── firestore.rules.template
│   └── firebase.json.template
└── scripts/
    ├── setup-firebase.js    # Cross-platform setup script
    └── setup-firebase.ps1   # Windows PowerShell script
```

### 🚫 What Gets Removed

These files/directories are removed because they're not needed for our app:

- `functions/` - We don't use Cloud Functions
- `public/` - We don't use Firebase Hosting  
- `extensions/` - We don't use Firebase Extensions
- `dataconnect/` - We don't use Firebase Data Connect
- `dataconnect-generated/` - Generated code we don't need
- `database.rules.json` - We use Firestore, not Realtime Database
- `remoteconfig.template.json` - We don't use Remote Config
- `storage.rules` - We don't use Cloud Storage

### 🔐 Security Verification

After setup, verify your security rules are active:

1. **Check Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to "Firestore Database" → "Rules"
   - Confirm the rules match our secure configuration

2. **Test Access Control**:
   - Rules should restrict access to `/users/{userId}` where `userId` must match `request.auth.uid`
   - All other paths should be denied

### 🐛 Troubleshooting

#### "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

#### "Permission denied during deployment"
```bash
firebase login
firebase use --add  # If multiple projects
```

#### "Rules compilation failed"
Check `firestore.rules` syntax - ensure proper JavaScript formatting

#### "Template files not found"
Run the setup script from the project root directory:
```bash
cd /path/to/openrouter-chat-app
npm run setup:firebase
```

#### "Rules not taking effect"
Wait 1-2 minutes after deployment, then verify in Firebase Console

### 💡 Tips for Contributors

1. **Always run setup after `firebase init`** - Never commit the extra files
2. **Test security rules** - Verify user isolation is working
3. **Update templates** - If you modify rules, update the template files in `firebase-config/`
4. **Check .gitignore** - Ensure unnecessary Firebase files are ignored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code patterns and architecture
4. Add comprehensive tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Development Guidelines

- **TypeScript First**: All new code must be properly typed
- **Component Patterns**: Follow existing hook and component patterns
- **Error Handling**: Implement comprehensive error boundaries
- **Performance**: Use React optimization patterns (memo, callbacks)
- **Security**: Validate all user inputs and authenticate all requests
- **Documentation**: Update README and add JSDoc comments

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
- Ensure all TypeScript types are properly defined
- Check for missing dependencies in package.json

**Authentication Issues:**
- Verify Firebase configuration in environment variables
- Check Firestore security rules deployment

**Server Connection:**
- Ensure backend server is running on port 3000
- Verify OpenRouter API key configuration

**Cache Issues:**
- Clear browser cache and localStorage
- Restart development servers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with using React, Tailwind, TypeScript, and Firebase**
