# 🎯 T3 Cloneathon Entry - AI Chat Application

A modern full-stack chat application built with React, TypeScript, Express.js, and Firebase, featuring AI-powered conversations and simplified rate limiting.

## 🚀 Features

- **Modern Tech Stack**: React 18+ with TypeScript, Express.js backend, Firebase integration
- **AI Chat Integration**: OpenRouter API integration for AI conversations
- **Firebase Rate Limiting**: Simple and effective rate limiting using firebase-functions-rate-limiter
- **Real-time User Experience**: Client-side throttling with visual feedback
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Production Ready**: Firebase/Google Cloud optimized architecture

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Rate Limiting**: firebase-functions-rate-limiter
- **AI Integration**: OpenRouter API

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS 3+ with responsive design
- **State Management**: React hooks + context
- **HTTP Client**: Fetch API with error handling

### DevOps & Deployment
- **Hosting**: Firebase Hosting
- **Functions**: Firebase Cloud Functions
- **Development**: Hot reload, TypeScript compilation
- **Linting**: ESLint with TypeScript rules

## 🛡️ Rate Limiting

Simple server-side rate limiting using `firebase-functions-rate-limiter`:

### Rate Limit
- **All API Requests**: 100 requests per 15 minutes
- **Per User/IP**: Tracks authenticated users by user ID, anonymous by IP
- **Firebase Storage**: Uses Firestore for persistence

### Implementation
```typescript
// Server - applies to ALL /api/* routes
const rateLimiter = new RateLimiter({
  database: admin.firestore(),
  collection: 'rateLimits',
  periodSeconds: 15 * 60, // 15 minutes
  maxCalls: 100,
});

app.use('/api', rateLimit); // Applied to all API routes
```

### Error Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait before trying again.",
  "retryAfter": 900
}
```

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
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

4. **Required Environment Variables:**
   ```bash
   # Firebase Configuration
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   
   # OpenRouter API (for AI chat)
   OPENROUTER_API_KEY=your_openrouter_key
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

## 🏃‍♂️ Development

### Start Development Servers

**Backend server:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

**Frontend (in separate terminal):**
```bash
cd web-app
npm run dev
# Frontend runs on http://localhost:5173
```

### Available Scripts

**Root project:**
- `npm run dev` - Start backend development server
- `npm run build` - Build backend for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint on backend code

**Web app (cd web-app):**
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint on frontend code

## 🏗️ Production Build

For production deployment:

```bash
# Build backend
npm run build

# Build frontend
cd web-app && npm run build

# For monorepo builds
npm run web:build

# Full TypeScript compilation and Vite build
tsc -b && cd web-app && vite build
```

## 📁 Project Structure

```
t3-cloneathon-entry/
├── src/                    # Backend source code
│   ├── server/            # Express.js server
│   │   ├── controllers/   # API route controllers
│   │   ├── middleware/    # Express middleware (auth, rate limiting)
│   │   ├── services/      # Business logic services
│   │   └── config/        # Configuration files
│   └── shared/            # Shared utilities and types
├── web-app/               # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # Reusable UI components
│   │   │   ├── auth/      # Authentication components
│   │   │   └── examples/  # Example components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services and utilities
│   │   └── utils/         # Utility functions
├── functions/             # Firebase Cloud Functions
├── firebase_config/       # Firebase configuration
├── dataconnect/          # Firebase Data Connect
└── docs/                 # Documentation
```

## 🎨 Usage

Rate limiting is applied automatically on the server side to all API requests. When the limit is exceeded, the server returns a `429` status code with a JSON error response.

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Firebase Authentication
4. Download configuration and update `.env`

### OpenRouter Setup
1. Sign up at https://openrouter.ai
2. Generate API key
3. Add to `.env` as `OPENROUTER_API_KEY`

### Rate Limiting Configuration
Rate limits are configured in `src/server/middleware/rateLimit.ts`:

```typescript
const RATE_LIMITERS = {
  chat: new RateLimiter({
    database: admin.firestore(),
    collection: 'rateLimits',
    periodSeconds: 15 * 60, // 15 minutes
    maxCalls: 50,           // 50 requests max
  }),
  // ... other configurations
};
```

## 🧪 Testing Rate Limits

1. Make more than 100 API requests within 15 minutes
2. Server will return `429` status with rate limit error
3. Check `/api/rate-limit-status` to see current rate limit info

## 🚀 Deployment

### Firebase Hosting + Functions
```bash
# Build everything
npm run build
cd web-app && npm run build && cd ..

# Deploy to Firebase
firebase deploy
```

### Manual Deployment
1. Build both backend and frontend
2. Deploy backend to your server/cloud platform
3. Deploy frontend static files to CDN/hosting
4. Configure environment variables in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 🙏 Acknowledgments

- Firebase team for firebase-functions-rate-limiter
- OpenRouter for AI API access
- React and TypeScript communities
- Tailwind CSS for styling utilities

---

**🎯 T3 Cloneathon Entry**: This project demonstrates modern full-stack development with effective rate limiting using Firebase-native solutions, providing an excellent balance of simplicity and functionality.
