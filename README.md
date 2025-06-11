# OpenRouter Chat App

A modern chat application with Google Authentication and multiple AI models via OpenRouter API.

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+
- OpenRouter API key ([get one here](https://openrouter.ai/))
- Firebase project ([create one here](https://firebase.google.com/))

### 1. Environment Configuration

Copy the environment template and configure your keys:

```bash
cp env.template .env
```

Edit `.env` with your actual values:

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

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. **Enable Authentication:**
   - Navigate to Authentication → Sign-in method
   - Enable **Google** provider
   - Add your domain (localhost for development)
4. **Get Configuration:**
   - Go to Project Settings → General
   - Find your web app configuration
   - Copy the values to your `.env` file

### 3. Install and Run

```bash
# Install dependencies
npm install
cd web-app && npm install && cd ..

# Start the application
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## 🔐 Authentication

- **Google Sign-In**: Users must authenticate before accessing chat
- **Server-Side Config**: All Firebase configuration served securely from `/api/config/firebase`
- **Protected Routes**: Chat interface only accessible when signed in

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

**Port 5173 already in use**
- Vite automatically tries the next available port (5174, 5175, etc.)
- Or kill the process using the port: `npx kill-port 5173`

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
