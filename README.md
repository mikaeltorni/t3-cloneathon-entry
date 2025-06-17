# 🎯 T3 Cloneathon Entry - AI Chat Application

A modern full-stack chat application built with React, TypeScript, Express.js, and Firebase, featuring AI-powered conversations and simplified rate limiting.

## 🚀 Features

- **Modern Tech Stack**: React 18+ with TypeScript, Express.js backend, Firebase integration
- **AI Chat Integration**: OpenRouter API integration for AI conversations
- **Model Selection Sidebar**: Right-side hover-to-reveal sidebar for easy AI model switching
- **Smart Mobile UX**: Intelligent interface adaptation that hides controls when input is not focused to maximize chat space
- **Firebase Rate Limiting**: Simple and effective rate limiting using firebase-functions-rate-limiter
- **Real-time User Experience**: Client-side throttling with visual feedback
- **Mobile-Friendly File Attachments**: Dedicated attachment buttons for images and documents
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Production Ready**: Firebase/Google Cloud optimized architecture

## 🚀 Recent Performance Optimizations

### **Firebase Rate Limit Prevention**
We've implemented several efficiency improvements to handle large numbers of chat threads without hitting Firebase rate limits:

#### **Batch Operations**
- **Efficient Thread Loading**: `getAllThreadsEfficient()` uses parallel message loading instead of sequential queries
- **Pagination Support**: Load threads in chunks (default: 50) to reduce memory usage and API calls
- **Batch Message Retrieval**: `getBatchMessages()` loads messages for multiple threads in parallel
- **Thread Summaries**: `getThreadSummaries()` loads thread metadata without messages for faster list views

#### **Caching Enhancements**
- **Smart Model Caching**: 30-minute cache for AI models with automatic invalidation
- **Thread Caching**: Local storage caching for chat threads with fallback support
- **Rate Limiting Prevention**: Prevents rapid successive API calls

#### **API Endpoints**
- `GET /api/chats?limit=50&summaryOnly=true` - Efficient thread list loading
- `POST /api/chats/messages/batch` - Batch message retrieval for up to 20 threads
- Enhanced pagination with cursor-based navigation

## 📎 Mobile-Friendly File Attachments

### **Dedicated Attachment Buttons**
The chat interface now includes visible attachment buttons that make file uploads accessible on mobile devices:

#### **Key Features**
- **Image Attachment Button**: Dedicated button with image icon for photo uploads
- **Document Attachment Button**: Separate button for document uploads (PDF, TXT, MD, etc.)
- **Mobile-Optimized**: Touch-friendly buttons with proper sizing for mobile screens
- **Visual Feedback**: Color-coded hover states and disabled states when limits reached
- **File Limits**: Maximum 5 images and 5 documents per message
- **Multiple Selection**: Support for selecting multiple files at once
- **Progress Indication**: Shows current attachment count (e.g., "3/5")
- **📊 Real-time Upload Progress**: Live progress indicators for files being processed
- **🔄 Upload State Management**: Visual feedback for uploading, completed, and failed states
- **⚠️ Error Handling**: Clear error messages and retry capabilities

#### **Upload Progress Indicators**
Files now show real-time upload progress with:
- **Progress Bars**: Animated progress bars showing upload/processing percentage
- **Status Icons**: Loading spinners for active uploads, error icons for failures
- **State Colors**: Blue for uploading, green for completed, red for errors
- **Instant Feedback**: Files appear immediately with temporary upload states
- **Error Recovery**: Failed uploads show error messages with retry options

#### **Supported File Types**
- **Images**: JPEG, PNG, GIF, WebP (max 10MB each)
- **Documents**: PDF, TXT, MD, JSON, CSV, XML, HTML, JS, TS, CSS, YAML (max 50MB each)

#### **Mobile Experience**
- **Responsive Layout**: Buttons scale appropriately on different screen sizes
- **Touch Optimization**: `touch-manipulation` CSS for better mobile interaction
- **Accessible Design**: Proper focus states and keyboard navigation
- **Visual Hierarchy**: Clear distinction between attachment and send buttons
- **Progress Feedback**: Mobile-friendly progress indicators and status messages

#### **Technical Implementation**
```tsx
// Attachment buttons with file processing
<button
  type="button"
  onClick={triggerImagePicker}
  disabled={isImageButtonDisabled}
  className="p-2 sm:p-2.5 rounded-lg border transition-colors touch-manipulation"
  title={`Add images (${images.length}/${maxImages})`}
>
  <Image className="w-5 h-5" />
</button>

// Upload progress tracking
const [images, setImages] = useState<ImageAttachment[]>([]);

// Real-time progress updates
const handleFileProcessing = async (file: File) => {
  const tempAttachment = createTemporaryImageAttachment(file);
  setImages(prev => [...prev, tempAttachment]);
  
  const result = await processImageFile(file, (progress) => {
    setImages(prev => prev.map(img => 
      img.id === tempAttachment.id ? { ...img, progress } : img
    ));
  });
  
  if (result.success) {
    setImages(prev => prev.map(img => 
      img.id === tempAttachment.id 
        ? { ...result.attachment, isUploading: false }
        : img
    ));
  }
};

// Hidden file input
<input
  ref={imageInputRef}
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
  multiple
  onChange={handleImageSelect}
  className="hidden"
/>
```

#### **Upload State Types**
```typescript
interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  isUploading?: boolean;  // Upload in progress
  progress?: number;      // 0-100 progress percentage
  error?: string;         // Error message if failed
}

interface DocumentAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  content: string;
  category: 'pdf' | 'text' | 'markdown' | 'other';
  isUploading?: boolean;  // Upload in progress
  progress?: number;      // 0-100 progress percentage
  error?: string;         // Error message if failed
}
```

#### **Dual Upload Methods**
The app now supports two methods for file attachments:
1. **Button-Based Upload**: Click attachment buttons to open file picker
2. **Drag-and-Drop**: Drag files anywhere in the chat area (desktop primarily)

## 📱 Smart Mobile Chat Interface

### **Intelligent UI Adaptation**
The chat interface features smart mobile optimization that automatically adapts to user behavior, providing maximum screen real estate when needed:

#### **Key Features**
- **Focus-Aware Interface**: Automatically hides reasoning controls, search toggles, and metrics when input is not focused
- **Instant Response Design**: Shows all controls immediately when user taps the input field
- **Device Detection**: Uses utility functions to detect mobile screens (< 768px width)
- **Smooth Transitions**: CSS transitions for seamless show/hide animations
- **Always-Accessible Input**: Chat input remains visible and functional at all times

#### **Behavior Logic**
- **Desktop**: All controls always visible (normal behavior)
- **Mobile + Input Focused**: All controls visible for full functionality when typing
- **Mobile + Control Interaction**: All controls visible when user interacts with any control element
- **Mobile + Model Sidebar Open**: All controls visible when model selection is active
- **Mobile + No Interaction**: Only essential input controls visible to maximize chat space

#### **Hidden Elements When Input Not Focused**
- Token metrics and context window display
- Current model indicator
- Web search controls and effort selectors
- Reasoning controls and effort selectors
- Document/image attachment previews

#### **Always Visible Elements**
- Chat input textarea
- Send button
- Attachment buttons (image/document)
- Core message functionality

#### **Technical Implementation**
```tsx
// Custom hook for mobile scroll state management
const mobileScrollState = useMobileScrollState();

// Conditional rendering based on scroll state
{mobileScrollState.shouldShowControls && (
  <ReasoningControls
    selectedModel={selectedModel}
    useReasoning={useReasoning}
    onUseReasoningChange={setUseReasoning}
    // ... other props
  />
)}

// Device detection utility
import { isMobileScreen } from '../utils/deviceUtils';
const isMobile = isMobileScreen(); // Returns true for width < 768px
```

#### **Hook Features**
- **Focus Detection**: Tracks input focus/blur state for instant response
- **Responsive Updates**: Automatically updates on window resize
- **Performance Optimized**: Simple state management without complex timeouts

#### **User Experience Benefits**
- **More Chat Content**: Up to 40% more message content visible when not typing
- **Reduced Clutter**: Cleaner interface when reading messages
- **Instant Access**: Controls appear immediately when user taps input field
- **Natural Interaction**: Intuitive behavior based on focus state

## 🎨 Model Selection

### **Persistent Model Selection with User Preferences**
The application features intelligent model selection that remembers your preferences across sessions and per-thread:

#### **Key Features**
- **Per-Thread Model Memory**: Each chat thread remembers its selected model independently
- **Global Last Selected Model**: Your most recent model choice is saved for new chats
- **Multi-Level Persistence**: 
  - Thread-specific model selection (stored in Firebase)
  - User preferences with server synchronization
  - Local storage cache for immediate access
- **Smart Fallback Logic**: Falls back through user preferences → cached selection → default model
- **Cross-Session Persistence**: Model selection survives browser refreshes and app restarts

### **Modal-Style Model Selector**
The application features a user-friendly modal-style model selector that provides seamless AI model switching without cluttering the interface:

#### **Key Features**
- **Modal Interface**: Clean modal overlay that opens when needed, closes with button or click outside
- **Close Button**: Dedicated close button in top-right corner for clear user control
- **Visual Model Indicators**: Each model displays with custom brand colors and capability badges
- **Real-time Model Info**: Shows reasoning capabilities, release dates, and pricing tiers
- **Smooth Animations**: Modal animations with backdrop blur for professional feel
- **Mobile Responsive**: Optimized for both desktop and mobile interfaces
- **Model Pinning**: Pin favorite models for quick access

#### **Model Capabilities Display**
- **Reasoning Indicators**: 🧠 icons with opacity levels (forced, optional, none)
- **Web Search Pricing**: Color-coded badges for different pricing tiers (cheap, premium, standard)
- **Release Dates**: Automatic sorting by newest models first
- **Active Selection**: Clear visual feedback for currently selected model
- **Model Descriptions**: Detailed capability information for each model

#### **Technical Implementation**
```tsx
// Modal state management
const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

// ModelSelector modal component
<ModelSelector
  isOpen={isModelSelectorOpen}
  onClose={() => setIsModelSelectorOpen(false)}
  value={selectedModel}
  onChange={setSelectedModel}
  models={availableModels}
/>

// ModelSelectorButton trigger component
<ModelSelectorButton
  currentModel={selectedModel}
  models={availableModels}
  onClick={() => setIsModelSelectorOpen(true)}
/>
```

#### **Components**
- **ModelSelector**: Modal component with model list, search, and close functionality
- **ModelSelectorButton**: Trigger button showing current model with brain emoji and dropdown arrow
- **Improved UX**: Click outside modal or ESC key to close, body scroll prevention when open

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
- **Token Counting**: gpt-tokenizer library for accurate token calculation
- **Real-time Metrics**: Token-per-second tracking and cost estimation

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
│   │   │   ├── ModelSidebar.tsx  # Right-side model selection sidebar
│   │   │   └── examples/  # Example components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services and utilities
│   │   └── tokenizerService.ts  # Client-side token counting with gpt-tokenizer
│   │   └── utils/         # Utility functions
├── functions/             # Firebase Cloud Functions
├── firebase_config/       # Firebase configuration
├── dataconnect/          # Firebase Data Connect
└── docs/                 # Documentation
```

## 🔍 Universal Web Search with Source Citations

All AI models now support web search capabilities through OpenRouter's unified web search system, complete with clickable source citations.

### 🌐 Web Search Features

- **Universal Support**: Every model can perform web search using OpenRouter's plugin system
- **Source Citations**: Numbered buttons linking to original sources after each AI response
- **Two Search Modes**:
  - **Plugin-based Search** (Universal): Uses Exa.ai for $4/1K results - works with ALL models
  - **Native Search** (Model-specific): Built into certain models with advanced context integration
- **Effort Control**: Adjustable search context size (low/medium/high) for supported models
- **Smart Pricing**: Automatic selection of most cost-effective search method
- **Real-time Integration**: Search results and citations seamlessly integrated into AI responses

### 📚 Source Citation System

- **Numbered Citations**: Each unique source gets a numbered button (1, 2, 3, etc.)
- **Click to Open**: Buttons open source URLs in new tabs with security measures
- **Hover Tooltips**: Show source titles and descriptions on hover
- **Real-time Updates**: Citations appear as they're received during streaming
- **Deduplication**: Automatically removes duplicate URLs from the same response
- **Accessibility**: Full keyboard navigation and screen reader support

### 🎯 Model-Specific Search Capabilities

#### Perplexity Models (Built-in Web Search)
- **Sonar Reasoning**: Always-on web search with reasoning capabilities + citations
- **Sonar Pro**: Professional-grade web search with advanced context + citations
- **Sonar**: Fast, lightweight web search optimization + citations
- **Pricing**: $5-12/1K requests (cheaper than OpenAI native search)

#### OpenAI Models (Azure-hosted)
- **GPT-4o**: Web search via `:online` suffix + citations
- **o1/o3 Series**: Advanced reasoning + web search capabilities + citations
- **Pricing**: $25-50/1K requests (premium native search)

#### Google Models (Full Search Control)
- **Gemini 2.5 Pro/Flash**: Web search with effort control + citations
- **Search Options**: Full `web_search_options` parameter support + citations
- **Pricing**: $4-8/1K requests (standard plugin pricing)

### ⚙️ Technical Implementation

The system automatically:
1. **Detects Model Capabilities**: Checks if model supports native vs plugin search
2. **Applies Correct Suffix**: Adds `:online` for plugin-based search
3. **Configures Parameters**: Sets `web_search_options` for supported models
4. **Handles Pricing**: Routes to most cost-effective search method
5. **Processes Citations**: Extracts and displays URL annotations from OpenRouter responses
6. **Streams Citations**: Real-time citation updates during response generation

### 🎛️ User Interface

- **Search Toggle**: Enable/disable web search per message
- **Effort Selector**: Choose search context size (low/medium/high)
- **Visual Indicators**: Color-coded pricing tiers (green=cheap, amber=premium)
- **Model Awareness**: UI adapts based on selected model's capabilities
- **Citation Display**: Numbered source buttons appear after AI responses with web search enabled

## 🎨 Usage

### Rate Limiting
Rate limiting is applied automatically on the server side to all API requests. When the limit is exceeded, the server returns a `429` status code with a JSON error response.

### Token Counting
The application uses the gpt-tokenizer library for accurate token counting on the client side:

#### Features
- **Accurate Tokenization**: Uses the actual gpt-tokenizer library for OpenAI models
- **Multi-Provider Support**: Supports OpenAI, Anthropic, DeepSeek, and Google models
- **Real-time Tracking**: Token-per-second calculation during streaming responses
- **Cost Estimation**: Automatic cost calculation based on model pricing
- **Fallback Support**: Uses OpenAI tokenizer for non-OpenAI models when possible

#### Usage Example
```typescript
import { tokenizerService } from './services/tokenizerService';

// Async tokenization with full accuracy
const result = await tokenizerService.tokenize("Hello world!", "gpt-4o");
console.log(`Tokens: ${result.tokenCount}, Cost: $${result.estimatedCost}`);

// Sync tokenization for real-time scenarios
const tokenCount = tokenizerService.estimateTokensInChunkSync("streaming text", "gpt-4o");

// Token tracking for conversations
const chatResult = await tokenizerService.tokenizeChat(messages, "gpt-4o");
```

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

### 🚂 Railway Deployment (Recommended for Monorepo)

Railway is excellent for full-stack monorepo deployment with automatic builds and environment management.

#### **Deployment Configuration**

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Connect Your Repository**: Link your GitHub repository to Railway

3. **Configure Build Settings**:
   ```bash
   # Build Command
   cd web-app && npm install && cd .. && npm run build
   
   # Alternative Build Command (if you have install:all script)
   npm run install:all && npm run build
   
   # Start Command  
   npm start
   
   # Pre-deploy Command (optional)
   npm install && cd web-app && npm install
   ```

4. **Required Environment Variables** in Railway Dashboard:
   ```bash
   # API Configuration
   VITE_API_BASE_URL=https://your-app-name-production.up.railway.app/api
   
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   
   # OpenRouter API
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   ```

#### **Critical Configuration Steps**

##### 1. **Fix API Connection Issues**
The frontend was hardcoded to `localhost:3000/api`. Fix this by:

- Setting `VITE_API_BASE_URL` in Railway environment variables
- Ensuring your frontend uses this environment variable:
  ```typescript
  // In your API service files
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  ```

##### 2. **Firebase Authentication Domain**
Add your Railway domain to Firebase Console:

1. Go to **Firebase Console** → **Authentication** → **Settings** → **Authorized Domains**
2. Add your Railway domain: `your-app-name-production.up.railway.app`
3. This fixes the `auth/unauthorized-domain` error

##### 3. **Monorepo Build Issues**
Railway needs to install dependencies for both root and web-app:

```json
// Root package.json - ensure these scripts exist
{
  "scripts": {
    "build": "npm run web:build",
    "web:build": "cd web-app && npm run build",
    "install:all": "npm install && cd web-app && npm install",
    "start": "node dist/server.js"
  }
}
```

#### **Deployment Steps**

1. **Initial Setup**:
   ```bash
   # Ensure your package.json has the correct scripts
   npm run install:all  # Test locally
   npm run build       # Test build process
   ```

2. **Deploy to Railway**:
   - Push your code to GitHub
   - Railway automatically detects changes and builds
   - Monitor build logs for any issues

3. **Verify Deployment**:
   ```bash
   # Check your deployed app
   curl https://your-app-name-production.up.railway.app/api/health
   
   # Test frontend
   curl https://your-app-name-production.up.railway.app
   ```

#### **Common Railway Issues & Solutions**

##### **Build Failures**
```bash
# Error: "Cannot find module 'lucide-react'"
# Solution: Ensure web-app dependencies are installed
cd web-app && npm install

# Error: "Property 'env' does not exist on type 'ImportMeta'"
# Solution: Already fixed in web-app/src/vite-env.d.ts and tsconfig.app.json
```

##### **Runtime Errors**
```bash
# Error: "net::ERR_CONNECTION_REFUSED"
# Solution: Set VITE_API_BASE_URL environment variable

# Error: "auth/unauthorized-domain" 
# Solution: Add Railway domain to Firebase authorized domains
```

##### **Dependency Installation**
```bash
# Railway Build Command Options:

# Option 1: Sequential installation
cd web-app && npm install && cd .. && npm run build

# Option 2: Using npm scripts  
npm run install:all && npm run build

# Option 3: With pre-deploy command
# Pre-deploy: npm install && cd web-app && npm install
# Build: npm run build
```

#### **Production Checklist**

- [ ] ✅ Build command installs both root and web-app dependencies
- [ ] ✅ `VITE_API_BASE_URL` points to Railway app URL
- [ ] ✅ Firebase authorized domains includes Railway domain
- [ ] ✅ All required environment variables are set
- [ ] ✅ TypeScript compilation passes without errors
- [ ] ✅ Frontend can connect to backend API
- [ ] ✅ Firebase authentication works
- [ ] ✅ OpenRouter API integration functions
- [ ] ✅ Rate limiting is active and working

#### **Live Application**
🎉 **Successfully Deployed**: [https://t3-cloneathon-entry-production.up.railway.app](https://t3-cloneathon-entry-production.up.railway.app)

**Deployment Status**: ✅ All systems operational
- ✅ Frontend builds and serves correctly
- ✅ Backend API endpoints responding
- ✅ Environment variables configured
- ✅ Ready for production use

#### **Post-Deployment Notes**
- Railway automatically handles HTTPS certificates
- Automatic deployments on GitHub pushes
- Built-in monitoring and logging
- Easy environment variable management
- Vertical scaling available if needed

# TROUBLESHOOTING
- Getting errors on startup of the server/frontend:
Kill the node process, sometimes this is left on the background for no apparent reason.

## 📝 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 🙏 Acknowledgments

- Firebase team for firebase-functions-rate-limiter
- OpenRouter for AI API access
- React and TypeScript communities
- Tailwind CSS for styling utilities

---

**🎯 T3 Cloneathon Entry**: This project demonstrates modern full-stack development with effective rate limiting using Firebase-native solutions, providing an excellent balance of simplicity and functionality.

## 🧮 Comprehensive Tokenizer System

A powerful multi-provider tokenization system with real-time token counting and cost estimation.

### 🚀 Features

- **Multi-Provider Support**: OpenAI (using [`gpt-tokenizer`](https://www.npmjs.com/package/gpt-tokenizer)), Anthropic, DeepSeek, and Google models
- **Real-time Token Tracking**: Live tokens-per-second calculation during message generation  
- **Automatic Message Integration**: Token metrics automatically attached to assistant responses
- **Accurate Cost Estimation**: Provider-specific pricing with input/output token breakdown
- **Model Auto-Detection**: Automatic provider selection based on model names
- **React Hooks Integration**: Easy-to-use hooks for real-time UI updates
- **Performance Optimized**: Efficient tokenization with caching for OpenAI models

### 📊 Supported Providers & Models

#### OpenAI (using gpt-tokenizer library)
- **GPT-4o Series**: `gpt-4o`, `gpt-4o-mini` (o200k_base encoding)
- **GPT-4 Series**: `gpt-4`, `gpt-4-turbo` (cl100k_base encoding)  
- **GPT-3.5**: `gpt-3.5-turbo` (cl100k_base encoding)
- **o1 Series**: `o1-preview`, `o1-mini` (o200k_base encoding)

#### Anthropic (estimation-based)
- **Claude 3.5**: Sonnet and Haiku variants
- **Claude 3**: Opus series
- **Estimation**: ~4 characters per token

#### DeepSeek (estimation-based)
- **DeepSeek Chat/Coder**: Latest models
- **Estimation**: ~3.5 characters per token (optimized for code)

#### Google (estimation-based)  
- **Gemini 1.5**: Pro and Flash variants
- **Estimation**: ~3.8 characters per token (SentencePiece-like)

### 🔧 Installation

The tokenizer system requires the `gpt-tokenizer` package:

```bash
cd web-app
npm install gpt-tokenizer
```

### 📖 Usage Examples

#### Basic Tokenization

```typescript
import { tokenizerService } from './services/tokenizerService';

// Tokenize text with automatic provider detection
const result = await tokenizerService.tokenize(
  "Hello, how are you today?", 
  'gpt-4o'
);

console.log(`Tokens: ${result.tokenCount}`);
console.log(`Estimated Cost: $${result.estimatedCost}`);
console.log(`Provider: ${result.provider}`);
```

#### Chat Message Tokenization

```typescript
// Tokenize entire conversation context
const messages = [
  { role: 'user', content: 'What is AI?' },
  { role: 'assistant', content: 'AI is artificial intelligence...' }
];

const chatResult = await tokenizerService.tokenizeChat(messages, 'gpt-4o');
console.log(`Conversation tokens: ${chatResult.tokenCount}`);
```

#### Real-time Token Tracking

```typescript
import { useTokenTracker } from './hooks/useTokenTracker';

function ChatComponent() {
  const { 
    tokenMetrics, 
    isTracking, 
    startTracking, 
    updateTokens, 
    stopTracking 
  } = useTokenTracker('gpt-4o');

  const handleSendMessage = async (message: string) => {
    // Start tracking
    await startTracking(message);
    
    // Simulate streaming response
    const response = await streamChatResponse(message);
    for await (const chunk of response) {
      updateTokens(chunk); // Real-time token updates
    }
    
    // Get final metrics
    const finalMetrics = stopTracking();
    console.log(`Final TPS: ${finalMetrics.tokensPerSecond}`);
  };

  return (
    <div>
      {isTracking && (
        <div>
          TPS: {tokenMetrics.tokensPerSecond.toFixed(1)} tokens/sec
          Cost: ${tokenMetrics.estimatedCost.total.toFixed(4)}
        </div>
      )}
    </div>
  );
}
```

#### Automatic Message Integration

Token metrics are automatically tracked and displayed for every assistant message with zero configuration:

```typescript
// Backend automatically tracks tokens during streaming
// ChatMessage interface includes tokenMetrics
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenMetrics?: TokenMetrics; // Automatically populated for assistant messages
}

// Frontend automatically displays metrics above model selector
// No additional code needed - metrics appear in real-time during generation
```

The system provides:
- **Real-time TPS updates** during message generation (displayed above model selector)
- **Context window tracking** showing current conversation size vs model limits
- **Final metrics** attached to completed messages and saved to database
- **Global UI display** above model selection for consistent visibility
- **Zero configuration** - metrics automatically appear for all assistant responses
- **Cost tracking** for conversation budgeting with detailed breakdowns
- **Visual progress bars** for context window utilization with color-coded warnings
```

### 🎨 UI Components

#### Token Metrics Display Components

```typescript
import { 
  TokenMetricsDisplay, 
  TokenMetricsCompact, 
  TokenMetricsBadge 
} from './components/TokenMetricsDisplay';

// Full detailed display
<TokenMetricsDisplay 
  tokenMetrics={metrics} 
  isGenerating={true}
  variant="full" 
/>

// Compact row display  
<TokenMetricsCompact 
  tokenMetrics={metrics}
  isGenerating={true}
/>

// Minimal badge display
<TokenMetricsBadge 
  tokenMetrics={metrics}
  isGenerating={true} 
/>
```

#### Context Window Display Component

```typescript
import { ContextWindowDisplay } from './components/ContextWindowDisplay';

// Compact context window display (default)
<ContextWindowDisplay 
  contextWindow={{
    used: 15420,
    total: 128000,
    percentage: 12.05,
    modelId: 'gpt-4o'
  }}
  variant="compact"
/>

// Full context window display with warnings
<ContextWindowDisplay 
  contextWindow={contextWindow}
  variant="full"
/>
```

#### Component Features
- **Real-time Updates**: Live TPS display with animations
- **Context Window Tracking**: Visual progress bars showing conversation size
- **Color-coded Warnings**: Green/yellow/red based on usage level (50%/75%/90%)
- **Cost Breakdown**: Input/output cost separation  
- **Duration Tracking**: Generation time measurement
- **Responsive Design**: Works on mobile and desktop
- **Multiple Variants**: Badge, compact, and full display modes
- **Smart Formatting**: Large numbers displayed as K/M units

### 🧪 Testing & Demo

Try the interactive tokenizer demo:

```typescript
import { TokenizerDemo } from './components/TokenizerDemo';

<TokenizerDemo />
```

**Demo Features:**
- Live text tokenization across all providers
- Real-time TPS simulation  
- Model comparison tools
- Cost estimation visualization
- Sample texts for different use cases

### ⚡ Performance

#### OpenAI Tokenization (gpt-tokenizer)
- **Accuracy**: 1:1 parity with OpenAI's tiktoken
- **Speed**: Fastest JavaScript tokenizer available
- **Memory**: Minimal footprint with efficient caching
- **Encodings**: o200k_base, cl100k_base, p50k_base, r50k_base

#### Provider Estimates
- **Anthropic**: Character-based estimation (~4 chars/token)
- **DeepSeek**: Code-optimized estimation (~3.5 chars/token)  
- **Google**: SentencePiece-like estimation (~3.8 chars/token)

### 🔍 Technical Implementation

#### TokenizerService Architecture

```typescript
class TokenizerService {
  // Multi-provider tokenization
  async tokenize(text: string, model: string): Promise<TokenizationResult>
  
  // Chat context tokenization  
  async tokenizeChat(messages: any[], model: string): Promise<TokenizationResult>
  
  // Fast token counting
  async countTokens(text: string, model: string): Promise<number>
  
  // Streaming token estimation
  estimateTokensInChunk(chunk: string, model: string): number
  
  // Cost calculation
  calculateCost(inputTokens: number, outputTokens: number, modelInfo: ModelInfo)
}
```

#### Real-time Token Tracking

```typescript
class TokenTracker {
  // Add tokens and calculate TPS
  addTokens(count: number): number
  
  // Get smoothed TPS average  
  getCurrentTPS(): number
  
  // Reset tracking state
  reset(): void
}
```

### 📊 Context Window Tracking

Monitor conversation size in real-time to prevent hitting model limits:

```typescript
import { tokenizerService } from './services/tokenizerService';

// Calculate context usage for current conversation
const contextUsage = await tokenizerService.calculateConversationContextUsage(
  messages, 
  'gpt-4o'
);

console.log(`Context: ${contextUsage.used}/${contextUsage.total} tokens (${contextUsage.percentage}%)`);
```

#### Model Context Limits

| Provider | Model | Context Window | 
|----------|-------|----------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo | 128K tokens |
| **OpenAI** | GPT-4 | 8K tokens |
| **OpenAI** | GPT-3.5-turbo | 16K tokens |
| **Anthropic** | Claude 3.5 Sonnet/Haiku | 200K tokens |
| **DeepSeek** | DeepSeek Chat/Coder | 128K tokens |
| **Google** | Gemini 1.5 Pro | 2M tokens |
| **Google** | Gemini 1.5 Flash | 1M tokens |

#### Context Window Features

- **Automatic Calculation**: Context usage calculated for every conversation
- **Real-time Updates**: Updates as conversation grows
- **Visual Indicators**: Progress bars with color-coded warnings
- **Smart Warnings**: Alerts when approaching limits (75%, 90%)
- **Database Persistence**: Context usage saved with each thread
- **Model-specific Limits**: Accurate limits for each supported model

#### Warning System

```typescript
// Color-coded warning levels
if (percentage >= 90) {
  // RED: "Context window nearly full - consider starting new conversation"
} else if (percentage >= 75) {
  // YELLOW: "Context window getting full - X tokens remaining"  
} else if (percentage >= 50) {
  // BLUE: Normal usage
} else {
  // GREEN: Low usage
}
```

### 💰 Cost Estimation

The system includes comprehensive pricing data for all supported models:

```typescript
// Example model pricing (per 1K tokens)
const MODEL_DATABASE = {
  'gpt-4o': {
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    maxTokens: 128000
  },
  'claude-3-5-sonnet-20241022': {
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    maxTokens: 200000
  },
  'deepseek-chat': {
    inputCostPer1k: 0.00014,
    outputCostPer1k: 0.00028,
    maxTokens: 128000
  }
};
```

### 🔧 Configuration

#### Model Database Customization

Add new models to the `MODEL_DATABASE` in `tokenizerService.ts`:

```typescript
const MODEL_DATABASE: Record<string, ModelInfo> = {
  'your-custom-model': {
    provider: 'openai', // or 'anthropic', 'deepseek', 'google'
    modelName: 'your-custom-model',
    encoding: 'cl100k_base', // for OpenAI models
    maxTokens: 128000,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.002
  }
};
```

#### Hook Configuration

```typescript
const { tokenMetrics } = useTokenTracker('gpt-4o', {
  autoStart: false,           // Auto-start tracking
  updateInterval: 100,        // Update frequency (ms)
  onComplete: (metrics) => {  // Completion callback
    console.log('Final metrics:', metrics);
  },
  onUpdate: (metrics) => {    // Real-time callback
    console.log('Current TPS:', metrics.tokensPerSecond);
  }
});
```

### 🚀 Integration with Chat Streaming

The tokenizer integrates seamlessly with existing chat functionality:

```typescript
// In your chat streaming handler
const tracker = new TokenTracker();
await startTracking(userMessage);

// During streaming
onChunk((chunk) => {
  updateTokens(chunk);
  // Display real-time TPS in UI
});

// On completion  
const metrics = stopTracking();
// Save metrics with message
```

### 📈 Analytics & Monitoring

Track tokenization performance:

```typescript
// Get tokenization analytics
const analytics = {
  totalRequests: tokenizerService.getRequestCount(),
  averageLatency: tokenizerService.getAverageLatency(),
  providerUsage: tokenizerService.getProviderStats(),
  costAnalytics: tokenizerService.getCostAnalytics()
};
```

### 🤝 Contributing

To add support for new AI providers:

1. **Add Model Info**: Update `MODEL_DATABASE` with provider details
2. **Implement Tokenizer**: Add provider-specific tokenization method
3. **Add Tests**: Include test cases for the new provider
4. **Update Documentation**: Document the new provider capabilities

### 📚 Additional Resources

- [gpt-tokenizer Documentation](https://www.npmjs.com/package/gpt-tokenizer)
- [OpenAI Tokenizer Cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb)
- [Anthropic Token Counting](https://docs.anthropic.com/en/docs/build-with-claude/token-counting)
- [Token Counting Best Practices](https://platform.openai.com/docs/guides/text-generation/managing-tokens)

# OpenRouter Chat with Trello-Style Tagging System 🏷️

A sophisticated chat application with OpenRouter API integration and a comprehensive Trello-style tagging system for organizing conversations.

## 🚀 New Features: Chat Tagging System

### Overview
The application now includes a powerful tagging system that allows you to organize and filter your chat conversations, similar to Trello's label system.

### ✨ Key Features

#### 🏷️ **Tag Management**
- **Create Custom Tags**: Design your own tags with custom names and colors
- **RGB Color Picker**: Full RGB (0-255) color selection with sliders and input fields
- **Color Presets**: Quick selection from 8 predefined colors
- **Tag Preview**: Real-time preview of tags as you create them

#### 🎯 **Tag Assignment**
- **Right-Click Context Menu**: Right-click on any chat thread to add/remove tags
- **Multiple Tags Per Chat**: Assign multiple tags to organize chats by different criteria
- **Visual Tag Display**: Tags appear under the model name in the sidebar
- **Instant Updates**: Tag changes are reflected immediately in the UI

#### 🔍 **Smart Filtering**
- **Tag Filter Bar**: Located at the top of the interface for easy access
- **[ALL] Button**: Show all chats or filter by specific tags
- **Multi-Tag Selection**: Select multiple tags to filter conversations
- **Real-Time Filtering**: Instant filtering as you select/deselect tags
- **Visual Selection**: Selected tags are highlighted with a blue ring

#### 🎨 **Design & UX**
- **Trello-Inspired Design**: Familiar tag interface for intuitive use
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Polished transitions and hover effects
- **Accessibility**: Keyboard navigation and screen reader support

### 🖱️ How to Use

#### Creating Tags
1. Right-click on any chat thread
2. Select "Create New Tag" from the context menu
3. Enter a tag name (up to 50 characters)
4. Choose a color using:
   - RGB sliders (0-255 range)
   - Direct number input
   - Color presets
5. Preview your tag in real-time
6. Click "Create Tag" to save

#### Managing Tags
- **Add to Chat**: Right-click → Select tag from "Add Tag" section
- **Remove from Chat**: Right-click → Select tag from "Remove Tag" section (red text)
- **Filter Chats**: Click tags in the filter bar at the top
- **Clear Filters**: Click the "ALL" button

#### Visual Indicators
- **Tag Display**: Tags appear as colored labels under model names
- **Filter Status**: Selected filter tags have a blue ring
- **Context Menu**: Available tags show a color dot, assigned tags appear in red for removal

### 🔧 Technical Implementation

#### New Components
- `Tag` - Individual tag display component
- `TagModal` - Tag creation/editing modal with color picker
- `ColorPicker` - RGB color selection with sliders and presets
- `ContextMenu` - Right-click menu for tag operations
- `TagFilterBar` - Top filter bar for tag selection
- `TagSystem` - Main orchestrator component

#### New Hooks
- `useTags` - Tag CRUD operations and state management
- `useThreadTags` - Thread tag assignment and filtering logic

#### Data Structure
```typescript
interface ChatTag {
  id: string;
  name: string;
  color: { r: number; g: number; b: number };
  createdAt: Date;
}

interface ChatThread {
  // ... existing properties
  tags?: string[]; // Array of tag IDs
}
```

### 🎛️ User Preferences Integration
- Tags are stored in user preferences in the database
- Persistent across sessions and devices
- Synchronized with user authentication
- Automatic cleanup when tags are deleted

### 🚀 Getting Started with Tags

1. **Start a Conversation**: Create a new chat or select an existing one
2. **Add Your First Tag**: Right-click the chat → "Create New Tag"
3. **Organize Your Chats**: Add tags like "Work", "Personal", "Projects", etc.
4. **Filter Efficiently**: Use the tag filter bar to find conversations quickly
5. **Customize Colors**: Create a color-coded system that works for you

### 💡 Pro Tips
- Use different colors for different contexts (blue for work, green for personal)
- Create tags for projects, topics, or urgency levels
- Combine multiple tags for complex organization systems
- Use the "ALL" button to quickly see all conversations

---

## 🛠️ Technology Stack

- **Frontend:** React 18+ with TypeScript
- **Styling:** Tailwind CSS 3+ with responsive design
- **Build Tool:** Vite for fast development and optimized builds
- **Database:** Firebase Firestore for real-time sync
- **Authentication:** Firebase Auth
- **State Management:** Custom hooks with local state
- **HTTP Client:** Fetch API with error handling
- **Development:** ESLint, TypeScript compiler, Hot reload

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd t3-cloneathon-entry
   ```

2. Install dependencies:
   ```bash
   npm install
   cd web-app && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

## 🏃‍♂️ Development

Start the development server:
```bash
cd web-app
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## 🏗️ Production Build

For monorepo or multi-app structures:
```bash
npm run web:build
cd web-app && npm run build
tsc -b && vite build
```

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Tag.tsx      # Individual tag display
│   │   │   ├── TagModal.tsx # Tag creation/editing modal
│   │   │   ├── TagFilterBar.tsx # Top filter bar
│   │   │   ├── ContextMenu.tsx  # Right-click menu
│   │   │   └── ColorPicker.tsx  # RGB color picker
│   │   ├── TagSystem.tsx    # Main tagging orchestrator
│   │   └── sidebar/         # Chat sidebar components
│   ├── hooks/
│   │   ├── useTags.ts       # Tag CRUD operations
│   │   └── useThreadTags.ts # Thread-tag assignments
│   ├── services/
│   │   └── userPreferencesApi.ts # Firebase tag storage
│   ├── config/
│   │   └── firebase.ts      # Firebase configuration
│   └── types/               # TypeScript definitions
├── shared/
│   └── types.ts            # Shared type definitions
└── firebase_config/
    └── firestore.rules     # Firestore security rules
```

## 🎨 Component Architecture

### Tag Management Components

#### `<Tag />` - Individual Tag Display
```tsx
import { Tag } from './components/ui/Tag';

<Tag 
  tag={tag} 
  size="md" 
  selected={isSelected}
  removable={true}
  onClick={handleClick}
  onRemove={handleRemove}
/>
```

#### `<TagModal />` - Tag Creation/Editing
```tsx
import { TagModal } from './components/ui/TagModal';

<TagModal
  isOpen={isOpen}
  onClose={handleClose}
  onSubmit={handleSubmit}
  title="Create New Tag"
  submitLabel="Create Tag"
  initialName="Work"
  initialColor={{ r: 59, g: 130, b: 246 }}
/>
```

#### `<TagFilterBar />` - Top Filter Bar
```tsx
import { TagFilterBar } from './components/ui/TagFilterBar';

<TagFilterBar
  tags={allTags}
  selectedTags={selectedTagIds}
  onTagToggle={handleTagToggle}
  onClearAll={handleClearAll}
/>
```

#### `<ContextMenu />` - Right-Click Menu
```tsx
import { ContextMenu } from './components/ui/ContextMenu';

<ContextMenu
  isOpen={isMenuOpen}
  position={{ x: mouseX, y: mouseY }}
  items={menuItems}
  onClose={handleClose}
/>
```

### Custom Hooks

#### `useTags()` - Tag Management
```tsx
import { useTags } from '../hooks/useTags';

const { 
  tags, 
  loading, 
  error, 
  createTag, 
  updateTag, 
  deleteTag, 
  refreshTags 
} = useTags();
```

#### `useThreadTags()` - Thread-Tag Operations
```tsx
import { useThreadTags } from '../hooks/useThreadTags';

const {
  selectedTagIds,
  filteredThreads,
  addTagToThread,
  removeTagFromThread,
  toggleTagFilter,
  clearTagFilters
} = useThreadTags({ threads, tags, onThreadUpdate });
```

## 🔧 Configuration

### Firebase Structure
Tags are stored in the user's Firestore document:
```
/users/{userId}/settings/tags
{
  tags: [
    {
      id: "tag_123456789_abc",
      name: "Work",
      color: { r: 59, g: 130, b: 246 },
      createdAt: Date
    }
  ],
  updatedAt: ServerTimestamp
}
```

### Thread Tag Assignment
Thread documents include tag references:
```typescript
interface ChatThread {
  id: string;
  title: string;
  tags?: string[]; // Array of tag IDs
  // ... other properties
}
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /settings/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 🎯 Tagging System Features

### ✅ Implemented Features
- [x] Trello-style tag creation with color picker
- [x] RGB color picker with sliders (0-255) and input fields
- [x] 8 color presets in tag creation modal
- [x] Right-click context menu on chat threads
- [x] Tag assignment and removal via context menu
- [x] "Create New Tag" always available in context menu
- [x] Filter bar with ALL button and tag selection
- [x] Real-time tag filtering
- [x] Visual tag display under model names
- [x] Firebase Firestore integration
- [x] Proper TypeScript typing throughout
- [x] Error handling and logging
- [x] Responsive design

### 🎨 Visual Design
- **Tag Chips**: Rounded colored chips with white text
- **Color Picker**: RGB sliders with live preview and presets
- **Filter Bar**: Clean top bar with ALL button and scrollable tags
- **Context Menu**: Right-click menu with icons and color indicators
- **Hover Effects**: Smooth transitions and visual feedback

### 🔍 User Experience
- **Intuitive**: Right-click any chat to access tag options
- **Visual**: Color-coded tags for easy identification
- **Fast**: Instant filtering and real-time updates
- **Flexible**: Custom colors and unlimited tag creation
- **Accessible**: Keyboard navigation and screen reader support

## 🧪 Testing

The tagging system is ready for testing! Key scenarios to test:

1. **Tag Creation**: Right-click chat → Create New Tag → Test color picker
2. **Tag Assignment**: Right-click chat → Add available tags
3. **Tag Removal**: Right-click chat → Remove assigned tags (red options)
4. **Filtering**: Use filter bar to show/hide chats by tags
5. **Multiple Tags**: Assign multiple tags to same chat
6. **Cross-Session**: Tags should persist across browser sessions

## 🚀 Deployment

Tags are stored in Firebase Firestore and will automatically deploy with your Firebase configuration. No additional deployment steps needed for the tagging system.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🏷️ Tagging System Status: ✅ COMPLETE & READY FOR TESTING

The Trello-style tagging system has been fully implemented with:
- ✅ All linting errors resolved
- ✅ Firebase Firestore integration complete
- ✅ All requested features implemented
- ✅ TypeScript types properly defined
- ✅ Components properly integrated
- ✅ Error handling and logging in place

**Ready for user testing!** 🎉
