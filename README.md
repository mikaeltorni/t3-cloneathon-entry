# 🎯 T3 Cloneathon Entry - AI Chat Application

A modern full-stack chat application built with React, TypeScript, Express.js, and Firebase, featuring AI-powered conversations and simplified rate limiting.

## 🚀 Features

- **Modern Tech Stack**: React 18+ with TypeScript, Express.js backend, Firebase integration
- **AI Chat Integration**: OpenRouter API integration for AI conversations
- **Model Selection Sidebar**: Right-side hover-to-reveal sidebar for easy AI model switching
- **Firebase Rate Limiting**: Simple and effective rate limiting using firebase-functions-rate-limiter
- **Real-time User Experience**: Client-side throttling with visual feedback
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

## 🎨 Model Selection Sidebar

### **Right-Side Hover Interface**
The application features an innovative model selection sidebar that provides seamless AI model switching without interrupting the conversation flow:

#### **Key Features**
- **Hover-to-Reveal**: Compact 64px tab on the right edge that expands to 320px on hover
- **Visual Model Indicators**: Each model displays with custom brand colors and capability badges
- **Real-time Model Info**: Shows reasoning capabilities, release dates, and pricing tiers
- **Smooth Animations**: 300ms transition animations for professional feel
- **Mobile Responsive**: Adapts gracefully to different screen sizes

#### **Model Capabilities Display**
- **Reasoning Indicators**: 🧠 icons with opacity levels (forced, optional, none)
- **Web Search Pricing**: Color-coded badges for different pricing tiers (cheap, premium, standard)
- **Release Dates**: Automatic sorting by newest models first
- **Active Selection**: Clear visual feedback for currently selected model

#### **Technical Implementation**
```tsx
// Hover state management with smooth transitions
const [isExpanded, setIsExpanded] = useState(false);

// Fixed positioning with z-index layering
className="fixed right-0 top-0 h-full z-50 transition-all duration-300 ease-in-out"
onMouseEnter={() => setIsExpanded(true)}
onMouseLeave={() => setIsExpanded(false)}
```

#### **Layout Integration**
- **Right Margin Compensation**: Chat area automatically adjusts with `mr-16` to accommodate the sidebar tab
- **Z-Index Management**: Positioned above chat content but below modals (z-50)
- **Non-intrusive**: Doesn't interfere with existing left sidebar or chat functionality
- **Connected State**: ModelSidebar selection directly controls ChatInput's model for message sending
- **Visual Feedback**: ChatInput shows current selected model with color indicator and instructions

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
