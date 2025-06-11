# 🚀 OpenRouter Chat Application

A modern, full-stack chat application powered by OpenRouter's API with Google's Gemini 2.5 Flash model. Features a beautiful React frontend with TypeScript and a robust Express.js backend with file-based chat persistence.

## ✨ Features

### 💬 Real-Time Chat Interface
- **Conversational AI** - Natural language understanding with Google Gemini 2.5 Flash
- **Multiple Chat Threads** - Create, manage, and organize multiple conversations
- **Image Analysis** - Upload and analyze images with custom prompts
- **Persistent Storage** - File-based chat history with automatic saving

### 🖼️ Multimodal Capabilities
- **Image Upload & Analysis** - Support for JPEG, PNG, WebP, and other formats
- **Visual Understanding** - Describe, analyze, and answer questions about images
- **Custom Prompts** - Ask specific questions about uploaded images
- **URL-based Images** - Analyze images from web URLs

### 🎨 Modern UI/UX
- **Beautiful Interface** - Clean, responsive design with Tailwind CSS
- **Model Selector** - Stunning horizontal buttons with brand colors (Google Blue, OpenAI Green, etc.)
- **One-Click Switching** - Instantly switch between AI models with visual feedback
- **Reasoning Indicators** - Smart opacity-based reasoning capability indicators
- **Dynamic Descriptions** - Live model descriptions and capability badges
- **Real-time Updates** - Instant message delivery and status updates
- **Sidebar Navigation** - Easy chat thread management and organization
- **Error Handling** - Comprehensive error boundaries and user feedback

### 🔧 Enterprise-Grade Architecture
- **TypeScript Throughout** - Full type safety across frontend and backend
- **Express.js Backend** - Robust server with middleware and error handling
- **React 18 Frontend** - Modern hooks-based architecture with best practices
- **Structured Logging** - Comprehensive logging and debugging utilities

## 🛠️ Tech Stack

### Frontend (React Web App)
- **React 18.3** - Modern UI library with hooks and concurrent features
- **TypeScript 5.5** - Full type safety and modern language features
- **Vite 5.3** - Lightning-fast build tool and development server
- **Tailwind CSS 3.4** - Utility-first styling with responsive design
- **Zustand 4.5** - Lightweight state management
- **Axios 1.7** - HTTP client with interceptors and error handling

### Backend (Express.js Server)
- **Node.js 20+** - Modern runtime environment
- **Express.js 4.19** - Web framework with middleware support
- **TypeScript 5.5** - Type-safe server development
- **File-based Storage** - JSON-based chat persistence
- **CORS & Security** - Cross-origin and security middleware

### AI & API Integration
- **OpenRouter API** - Multi-model API gateway
- **Google Gemini 2.5 Flash** - State-of-the-art multimodal AI model
- **Retry Logic** - Exponential backoff for reliability
- **Error Handling** - Comprehensive error tracking and recovery

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** installed ([Download here](https://nodejs.org/))
- **OpenRouter API key** from [openrouter.ai](https://openrouter.ai/)

### 🔑 Get Your API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/) and create an account
2. Navigate to your dashboard and generate an API key
3. **IMPORTANT**: Visit [Privacy Settings](https://openrouter.ai/settings/privacy) 
4. Enable **"Allow providers that may train on inputs"** (required for API access)

### ⚡ One-Command Setup & Run
```bash
# Clone the repository
git clone <your-repo-url>
cd openrouter-chat-app

# Install all dependencies (both frontend and backend)
npm install
cd web-app && npm install && cd ..

# Set your API key (replace with your actual key)
$env:OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# Start both servers simultaneously
npm run dev
```

The application will be running at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 🛠️ Manual Setup (Alternative)

If you prefer to run the frontend and backend separately:

### Backend Server
```bash
# Install backend dependencies
npm install

# Set your API key
$env:OPENROUTER_API_KEY="your-key-here"

# Start the Express server
npm run server:dev
```
Server runs on: http://localhost:3000

### Frontend Web App
```bash
# Navigate to web app directory
cd web-app

# Install frontend dependencies
npm install

# Start React development server
npm run dev
```
Frontend runs on: http://localhost:5173

## 🌐 Application Features

### 💬 Chat Interface
- **Multiple Conversations**: Create and manage multiple chat threads
- **Real-time Messaging**: Instant AI responses with loading indicators
- **Chat History**: Persistent storage of all conversations
- **Thread Management**: Easy switching between different chat sessions

### 🖼️ Image Analysis
- **File Upload**: Drag & drop or click to upload images
- **URL Support**: Analyze images from web URLs
- **Custom Prompts**: Ask specific questions about uploaded images
- **Multiple Formats**: Support for JPEG, PNG, WebP, GIF, and more

### 🎨 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Beautiful UI**: Modern design with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Visual feedback during AI processing
- **Sidebar Navigation**: Easy chat thread organization

### 🔧 Developer Experience
- **TypeScript**: Full type safety across the entire application
- **Hot Reload**: Instant updates during development
- **Structured Logging**: Comprehensive debugging and monitoring
- **Error Boundaries**: Graceful error handling and recovery

## 📋 Available Scripts

### Main Commands
```bash
# Start both frontend and backend simultaneously
npm run dev

# Start only the backend server
npm run server:dev

# Start only the frontend
npm run web:dev

# Build everything for production
npm run build

# Build only the server (TypeScript compilation)
npm run server:build

# Build only the React app
npm run web:build

# Start production server
npm start
```

### Development Scripts (Web App)
```bash
# Run from web-app/ directory
cd web-app

# Start React development server
npm run dev

# Build React app for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Production Deployment

#### Complete Production Build
```bash
# Build everything at once (recommended)
npm run build

# This runs:
# 1. npm run server:build - Compiles TypeScript server to dist/
# 2. npm run web:build - Builds React app to web-app/dist/
```

#### Manual Build Steps (Alternative)
```bash
# Build the server (TypeScript compilation)
npm run server:build

# Build the React app for production  
npm run web:build

# Or step by step:
cd web-app
npm run build
cd ..
npm run server:build
```

#### Start Production Server
```bash
# Start the production server (serves both API and static files)
npm start
```

#### Build Verification
After building, you should see these output directories:
```bash
# Server build output
dist/
├── server/
│   ├── index.js              # Main Express server
│   │   ├── chatStorage.js        # Chat storage service
│   │   └── openRouterService.js  # OpenRouter API service
│   └── shared/
│       └── types.js              # Shared TypeScript types

# React app build output  
web-app/dist/
├── assets/
│   ├── index-[hash].css    # Compiled & minified CSS
│   └── index-[hash].js     # Compiled & minified JavaScript
└── index.html              # Main HTML file

# Verify builds were successful
Get-ChildItem -Recurse dist       # Check server build (Windows)
Get-ChildItem web-app\dist        # Check React app build (Windows)
# Or on Linux/macOS:
# find dist -type f              # Check server build
# ls -la web-app/dist            # Check React app build
```

## 🔑 Environment Variables

The application uses the `OPENROUTER_API_KEY` environment variable:

```bash
# Windows PowerShell (recommended)
$env:OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# Windows Command Prompt
set OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Linux/macOS
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

**Note**: Only the backend requires the API key. The frontend communicates with the backend via HTTP requests.

## 📁 Project Structure

```
openrouter-chat-app/
├── src/
│   ├── server/
│   │   ├── index.ts         # Express server entry point
│   │   ├── services/        # OpenRouter API service
│   │   └── storage/         # File-based chat storage
│   └── shared/
│       └── types.ts         # Shared TypeScript types
├── web-app/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ChatSidebar.tsx
│   │   ├── services/        # API service layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main React application
│   ├── index.html           # Entry point
│   ├── vite.config.ts       # Vite configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
├── data/
│   └── chats.json          # Chat storage file
├── package.json            # Backend dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This documentation
```

## 🔒 Security & Best Practices

- **Environment Variables**: API keys are stored as environment variables, never in code
- **Server-Side API**: Frontend never directly accesses OpenRouter API
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Error Boundaries**: Graceful error handling prevents app crashes
- **Input Validation**: All user inputs are validated and sanitized
- **CORS Protection**: Configured for secure cross-origin requests

## 🚀 Production Deployment

### Environment Setup
1. Set the `OPENROUTER_API_KEY` environment variable on your server
2. Configure your web server to serve the built React app
3. Set up proper CORS headers for your domain
4. Consider using PM2 or similar for process management

### Docker Deployment (Optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🛠️ Development Workflow

### Adding New Features
1. **Backend**: Add new routes in `src/server/index.ts`
2. **Types**: Update shared types in `src/shared/types.ts`
3. **Frontend**: Create new components in `web-app/src/components/`
4. **API Client**: Update service layer in `web-app/src/services/`

### Testing
- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint` (in web-app directory)
- **Build Test**: `npm run build`

## 🔧 Troubleshooting

### Common Issues

**"Server Connection Error"**
- Ensure backend server is running on port 3000
- Check that `OPENROUTER_API_KEY` is set
- Verify API key has "train on inputs" permission enabled

**"Build Errors"**
- Run `npm run type-check` to identify TypeScript issues
- Ensure all dependencies are installed
- Check for unused imports or missing type definitions

**"Chat Not Saving"**
- Verify write permissions in the project directory
- Check `data/` folder exists and is writable
- Review server logs for storage errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature"`
5. Push and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenRouter** for providing excellent API gateway services
- **Google** for the powerful Gemini 2.5 Flash model
- **React and Vite teams** for outstanding development tools
- **Tailwind CSS** for the beautiful, utility-first styling system
- **TypeScript team** for making JavaScript development so much better

---

**Ready to chat with AI?** 🚀 Start the application and begin your conversation with Google's Gemini 2.5 Flash model!

## 🎉 Quick Test

Once running, try these prompts to test the application:

**Text Prompts:**
- "Write a short poem about coding"
- "Explain quantum computing in simple terms"
- "What are the benefits of TypeScript over JavaScript?"

**Image Analysis:**
- Upload an image and ask "What do you see in this image?"
- Try a photo and ask "What colors are most prominent?"
- Upload a screenshot and ask "Describe the layout and design"
