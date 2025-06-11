# OpenRouter Chat App 🚀

A modern, responsive chat application built with React, TypeScript, and Tailwind CSS, featuring multiple AI models through OpenRouter API integration.

## 🌟 Recent Major Refactoring (Database-Ready Architecture)

**✅ COMPLETED: Comprehensive refactoring following best practices**

The application has been completely refactored using **modern architecture patterns** to prepare for **database integration** and **authentication systems**:

### 🏗️ **New Architecture Pattern**
```
Controllers -> Services -> Repositories -> Storage
```

**Benefits:**
- ✅ **Database-Ready**: Easy switch from file storage to database
- ✅ **Authentication-Ready**: Clean middleware integration points
- ✅ **Service Layer**: AI operations abstracted and testable
- ✅ **Repository Pattern**: Data access abstracted for multiple backends
- ✅ **Single Responsibility**: Each component has one clear purpose
- ✅ **Dependency Injection**: Easy testing and configuration
- ✅ **Error Handling**: Consistent error patterns throughout

### 📁 **New Server Structure**
```
src/server/
├── controllers/
│   ├── ChatController.ts       # HTTP endpoints for chat operations
│   └── ModelsController.ts     # HTTP endpoints for AI models
├── services/
│   └── AIService.ts           # AI operations abstraction layer
├── repositories/
│   └── ChatRepository.ts      # Data access pattern implementation
├── chatStorage.ts             # File storage (ready to be replaced)
├── openRouterService.ts       # OpenRouter API integration
└── index.ts                   # Clean server setup with new architecture
```

### 🔄 **Migration Benefits**

**Before Refactoring:**
- ❌ Monolithic server file (608+ lines)
- ❌ Mixed concerns (HTTP + Business Logic + Data Access)
- ❌ Hard to add authentication
- ❌ Difficult to switch storage backends
- ❌ Complex error handling

**After Refactoring:**
- ✅ Clean separation of concerns
- ✅ Easy to add JWT authentication middleware
- ✅ Simple to switch from files to database
- ✅ Testable service layer
- ✅ Consistent error handling
- ✅ API documentation built-in

## 🚀 Features

### 💬 **Chat Features**
- **Multi-threaded conversations** with persistent storage
- **Multiple AI models** with real-time model switching
- **Image analysis support** with drag-and-drop upload
- **Reasoning mode** for compatible AI models (o1-preview, DeepSeek R1)
- **Real-time streaming responses** with Server-Sent Events
- **Thread management** (create, delete, rename)
- **Responsive design** that works on all devices

### 🤖 **AI Model Support**
- **Google Gemini 2.5 Flash Preview** (latest model)
- **OpenAI GPT-4o** (most capable general model)
- **OpenAI o1-Preview** (advanced reasoning)
- **DeepSeek R1** (latest reasoning model, Jan 2025)
- **Claude 3.7 Sonnet** (balanced performance)
- **Horizontal model selector** with brand colors and brain icons
- **Automatic sorting** by release date (newest first)
- **Visual reasoning indicators** with smart opacity levels

### 🎨 **User Experience**
- **Modern UI** with Tailwind CSS and glassmorphism effects
- **Dark/light mode** support
- **Dynamic spacing** prevents message overlap
- **Drag & drop images** from anywhere
- **One-click model switching** without losing context
- **Mobile-first responsive design**
- **Smooth animations** and visual feedback

## 🛠️ Technology Stack

### **Frontend Architecture**
- **React 18+** with TypeScript for type safety
- **Tailwind CSS 3+** for responsive, modern styling
- **Vite** for fast development and optimized builds
- **Custom hooks** for state management (useChat, useModels)
- **Error boundaries** for graceful error handling
- **Server-Sent Events** for real-time streaming

### **Backend Architecture (Newly Refactored)**
- **Express.js** with TypeScript
- **Controller-Service-Repository pattern**
- **OpenRouter API integration** with multiple model support
- **File-based storage** (easily replaceable with database)
- **Comprehensive error handling and logging**
- **RESTful API design** with proper HTTP status codes

### **Development & Build**
- **TypeScript** for end-to-end type safety
- **ESLint + Prettier** for code quality
- **Hot module replacement** for fast development
- **Production-optimized builds** with code splitting

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18+ and npm
- OpenRouter API key ([get one here](https://openrouter.ai/))

### **Quick Start**
```bash
# Clone the repository
git clone <repository-url>
cd t3-cloneathon-entry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Start development servers
npm run dev        # Frontend (http://localhost:5173)
npm run server:dev # Backend (http://localhost:3001)
```

### **Environment Variables**
```bash
# .env file
OPENROUTER_API_KEY=sk-or-v1-your-key-here
PORT=3001
NODE_ENV=development
```

## 🏃‍♂️ Development

### **Available Scripts**
```bash
# Frontend Development
npm run dev              # Start frontend dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run type-check       # TypeScript compilation check

# Backend Development  
npm run server:dev       # Start backend with nodemon
npm run server:build     # Build backend
npm run server:start     # Start production backend

# Full Application
npm run web:build        # Build both frontend and backend
```

### **API Endpoints**
```bash
# Chat Operations
GET    /api/chats              # Get all threads
GET    /api/chats/:threadId    # Get specific thread
POST   /api/chats/message      # Send message & get AI response
DELETE /api/chats/:threadId    # Delete thread
PUT    /api/chats/:threadId/title # Update thread title
GET    /api/chats/health       # Chat service health

# Model Operations (New!)
GET    /api/models             # Get available AI models
GET    /api/models/:modelId    # Get specific model info
GET    /api/models/stats       # Model usage statistics
POST   /api/models/validate    # Validate model config
GET    /api/models/health      # Models service health

# System
GET    /api                    # API documentation
GET    /api/health             # Overall system health
```

## 🏗️ Project Structure

```
├── src/                    # Backend source code
│   ├── server/             # Express server (REFACTORED)
│   │   ├── controllers/    # HTTP endpoint handlers
│   │   ├── services/       # Business logic layer
│   │   ├── repositories/   # Data access layer
│   │   ├── chatStorage.ts  # File storage implementation
│   │   ├── openRouterService.ts # OpenRouter integration
│   │   └── index.ts        # Clean server setup
│   └── shared/             # Shared TypeScript types
├── web-app/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # Reusable UI components
│   │   │   └── ...        # Feature components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client services
│   │   └── utils/         # Utility functions
│   └── dist/              # Built frontend files
├── data/                  # Application data storage
└── README.md              # This file
```

## 🔧 Configuration

### **AI Model Configuration**
Models are automatically sorted by release date (newest first) with visual indicators:

- 🧠 **Full opacity brain**: Required reasoning (o1-preview, DeepSeek R1)
- 🧠 **Half opacity brain**: Optional reasoning (Gemini, Claude)  
- 🧠 **Low opacity brain**: No reasoning (GPT-4o)

### **Responsive Design Breakpoints**
- **Mobile**: < 768px (single column, compact UI)
- **Tablet**: 768px - 1024px (sidebar collapsible)
- **Desktop**: > 1024px (full sidebar, optimal layout)

### **Error Handling**
- **User-friendly error messages** with action suggestions
- **Automatic retry mechanisms** for network issues
- **Graceful degradation** when services are unavailable
- **Development vs production** error detail levels

## 🚀 Deployment

### **Production Build**
```bash
# Build everything for production
npm run web:build

# Or build separately
npm run build          # Frontend only
npm run server:build   # Backend only
```

### **Production Environment**
```bash
# Environment variables for production
NODE_ENV=production
PORT=3001
OPENROUTER_API_KEY=your-production-key
```

### **Docker Support** (Future Enhancement)
The new architecture makes it easy to containerize:
```dockerfile
# Could easily be added with:
# - Multi-stage build (frontend + backend)
# - Separate service containers
# - Database container integration
```

## 🔮 Next Steps (Database Integration Ready!)

The refactored architecture makes these additions straightforward:

### **🗄️ Database Integration**
```typescript
// Easy to add database providers
class DatabaseStorageProvider implements IChatStorageProvider {
  // Replace file operations with database queries
  async getAllThreads(): Promise<ChatThread[]> {
    return await db.threads.findMany({ where: { userId } });
  }
}
```

### **🔐 Authentication System**
```typescript
// Clean middleware integration points
app.use('/api/chats', authMiddleware, chatController.getRoutes());
app.use('/api/models', authMiddleware, modelsController.getRoutes());
```

### **📊 Analytics & Monitoring**
- Model usage tracking
- Performance metrics
- User behavior analytics
- Cost monitoring per model

### **🎯 Advanced Features**
- User preferences and settings
- Chat sharing and collaboration
- Model fine-tuning support
- Advanced reasoning controls

## 🧪 Testing

### **Current Testing Setup**
- TypeScript compilation verification
- Build process validation
- API endpoint functionality

### **Future Testing Enhancements**
- Unit tests for services and repositories
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance benchmarking

## 🤝 Contributing

### **Development Guidelines**
1. **Follow the architecture pattern**: Controllers -> Services -> Repositories
2. **Maintain type safety**: All functions must be properly typed
3. **Write descriptive JSDoc comments**: Document all public APIs
4. **Handle errors gracefully**: Use consistent error patterns
5. **Test your changes**: Ensure builds pass and functionality works

### **Making Changes**
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes following patterns
src/server/controllers/     # Add HTTP endpoints
src/server/services/        # Add business logic  
src/server/repositories/    # Add data access

# Test changes
npm run build              # Verify frontend builds
npm run server:dev         # Test backend changes

# Submit pull request
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenRouter** for providing access to multiple AI models
- **React & TypeScript** communities for excellent tooling
- **Tailwind CSS** for making styling enjoyable
- **Vite** for blazing fast development experience

---

**🎯 Ready for the next phase: Database integration and authentication!**

The solid architectural foundation is now in place for rapid feature development and enterprise-scale deployment.
