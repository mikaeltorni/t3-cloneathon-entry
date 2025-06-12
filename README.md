# OpenRouter Chat App

A modern chat application with AI integration using OpenRouter API, Google Authentication, and React + TypeScript.

## Quick Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd t3-cloneathon-entry
   npm install
   cd web-app && npm install && cd ..
   ```

2. **Set up environment variables:**
   ```bash
   cp env.template .env
   ```
   Edit `.env` with your actual values:
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - Firebase configuration variables
   - `PORT=3000` (server port)

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```
   - Server runs on: http://localhost:3000
   - Frontend dev server: http://localhost:5173
   - API endpoints: http://localhost:3000/api

5. **Start production:**
   ```bash
   npm start
   ```
   - Full app runs on: http://localhost:3000

## Port Configuration

- **Backend Server**: PORT=3000 (configurable via .env)
- **Frontend Dev Server**: 5173 (Vite default)
- **Frontend Proxy**: `/api/*` requests → `http://localhost:3000`
- **Production**: Single server on PORT=3000 serving both API and static files

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + TypeScript
- **Authentication**: Firebase Google Auth (server-side config)
- **AI Integration**: OpenRouter API with multiple model support
- **Build System**: TypeScript compilation + Vite bundling

## Available Scripts

- `npm run dev` - Start both server and frontend in development
- `npm run build` - Build both server and frontend for production
- `npm run server:dev` - Start only the backend server
- `npm run web:dev` - Start only the frontend dev server
- `npm start` - Start production server

## Environment Variables

All environment variables are server-side only for security:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Server Configuration  
PORT=3000
NODE_ENV=development

# Firebase Configuration (Server-side)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id
```

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/config/firebase` - Firebase configuration for frontend
- `POST /api/chats/message` - Send chat message
- `GET /api/models` - Available AI models

## Production Build Commands

```bash
# Full build process
npm run build

# Individual builds
npm run server:build  # TypeScript compilation
npm run web:build     # Vite build

# Alternative build commands
cd web-app && npm run build  # Build from web-app directory
tsc -b && vite build         # Direct TypeScript + Vite build
```

## 🔐 Authentication

- **Google Sign-In**: Users must authenticate before accessing chat
- **Server-Side Config**: All Firebase configuration served securely from `/api/config/firebase`
- **Protected Routes**: Chat interface only accessible when signed in

## 💾 Session Caching

- **Smart Caching**: Chat threads are cached in browser session storage
- **No Unnecessary Reloads**: Eliminates awkward reloading after sending messages
- **Instant Response**: Cached threads load instantly on app restart
- **Manual Refresh**: Refresh button in sidebar to sync with server when needed
- **Auto Fallback**: Falls back to cache if server is unavailable
- **Smart Ordering**: Recently active conversations automatically move to the top
- **Security**: Cache is automatically cleared when users sign out to prevent data leakage between users

## 🤖 Supported AI Models

- Google Gemini 2.5 Flash Preview
- OpenAI GPT-4o
- OpenAI o1-Preview (reasoning)
- DeepSeek R1 (reasoning)
- Claude 3.7 Sonnet

## 🛠️ Development

### Available Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run server:dev       # Backend only
npm run web:dev         # Frontend only

# Production
npm run build           # Build both
npm run server:build    # Build backend
npm run web:build       # Build frontend

# Utilities
npm run lint           # Lint frontend code
npm run type-check     # TypeScript validation
```

### API Endpoints

```
GET    /api/config/firebase     # Firebase configuration
GET    /api/chats              # Get all chat threads
POST   /api/chats/message      # Send message & get AI response
DELETE /api/chats/:threadId    # Delete thread
GET    /api/models             # Get available AI models
GET    /api/health             # System health check
```

**Note**: In development, Vite proxies `/api/*` requests from frontend (port 5173) to backend (port 3000).

## 📁 Project Structure

```
├── .env                    # Environment variables (create from env.template)
├── src/server/            # Express backend
│   ├── controllers/       # API endpoints
│   ├── services/         # Business logic
│   └── repositories/     # Data access
├── web-app/              # React frontend
│   ├── src/components/   # React components
│   ├── src/hooks/        # Custom hooks (useAuth, useChat)
│   └── src/config/       # Firebase configuration
└── data/                 # JSON storage (development)
```

## 🔧 Troubleshooting

### Common Issues

**Server exits with "OPENROUTER_API_KEY environment variable is required"**
- Ensure you've created `.env` from `env.template`
- Add your actual OpenRouter API key to `.env`

**"Firebase configuration incomplete"**
- Check all `FIREBASE_*` variables are set in `.env`
- Verify your Firebase project configuration is correct

**Google sign-in popup blocked**
- Allow popups for localhost in your browser
- Check Firebase authorized domains include localhost

**Port conflicts (5173 or 3000 already in use)**
- Frontend: Vite automatically tries the next available port (5174, 5175, etc.)
- Backend: Change PORT in `.env` file to use a different port (e.g., 3001, 3002)
- Or kill the process: `npx kill-port 5173` or `npx kill-port 3000`

### Getting Help

1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase project has Google authentication enabled
4. Check that your OpenRouter API key is valid

## 🏗️ Architecture

This application uses a **Controller → Service → Repository** pattern:

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic and AI operations
- **Repositories**: Manage data access (currently file-based, easily replaceable with database)
- **Frontend**: React with TypeScript, Firebase Auth, Tailwind CSS

## 📝 License

MIT License - see LICENSE.md for details.

---

**Ready to chat with AI models!** 🎉

After setup, sign in with Google and start chatting with multiple AI models in a modern, responsive interface.
