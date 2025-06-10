# 🚀 OpenRouter AI Analysis Platform

A dual-platform TypeScript application that leverages OpenRouter's API with Google's Gemini 2.5 Flash model to provide powerful image analysis and text processing capabilities. Available as both a CLI tool and a beautiful React web application.

## ✨ Features

### 🖼️ Image Analysis
- **URL-based image analysis** - Analyze any image from a web URL
- **Custom prompts** - Ask specific questions about images
- **Detailed descriptions** - Get comprehensive analysis of visual content
- **Multiple formats** - Support for various image formats (JPEG, PNG, WebP, etc.)

### 💬 Text Analysis  
- **AI-powered text processing** - Get intelligent responses to any text query
- **Conversational AI** - Natural language understanding and generation
- **Knowledge base** - Access to vast information through Gemini 2.5 Flash
- **Context-aware responses** - Sophisticated understanding of context and nuance

### 🔧 Dual Platform Support
- **CLI Tool** - Perfect for developers, automation, and scripting
- **Web Application** - Beautiful, modern UI for interactive use
- **Consistent API** - Same powerful analysis capabilities across both platforms

## 🛠️ Tech Stack

### CLI Application
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe development
- **Native HTTPS** - Built-in HTTP client for API calls

### Web Application  
- **React 18** - Modern UI library with hooks
- **TypeScript** - Full type safety
- **Tailwind CSS 3.4** - Utility-first styling with modern design
- **Vite** - Fast build tool and development server

### Shared Infrastructure
- **OpenRouter API** - Multi-model API gateway
- **Google Gemini 2.5 Flash** - State-of-the-art multimodal AI model
- **Modern ES2020** - Latest JavaScript features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- OpenRouter API key from [openrouter.ai](https://openrouter.ai/)

### Option 1: Environment Variables (Recommended)
Set up environment variables for seamless operation:
```bash
# For CLI usage
export OPENROUTER_API_KEY="your_api_key_here"

# For web app usage  
export VITE_OPENROUTER_API_KEY="your_api_key_here"
```

### Option 2: Manual Configuration
- **CLI**: Create `openrouterkey.txt` file with your API key
- **Web**: Enter API key in the browser interface

## 📱 CLI Application

### Installation & Setup
```bash
# Clone and install dependencies
git clone <repository-url>
cd openrouter-analysis
npm install

# Set environment variable (recommended)
export OPENROUTER_API_KEY="your_openrouter_api_key_here"

# OR create API key file
echo "your_openrouter_api_key_here" > openrouterkey.txt
```

### Usage Examples
```bash
# Image analysis with default prompt
npm run dev "https://example.com/image.jpg"

# Image analysis with custom prompt  
npm run dev "https://example.com/photo.jpg" "What colors are prominent in this image?"

# Text analysis
npm run dev --text "Explain quantum computing in simple terms"
npm run dev -t "Write a haiku about programming"

# Using default demo image
npm run dev
```

### Available Scripts
```bash
npm run dev        # Run with arguments
npm run build      # Compile TypeScript  
npm run text       # Quick text analysis mode
```

## 🌐 Web Application

### Installation & Setup
```bash
# Navigate to web app directory
cd web-app

# Install dependencies
npm install

# Set environment variable (recommended)
export VITE_OPENROUTER_API_KEY="your_openrouter_api_key_here"

# Start development server
npm run dev
```

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Web App Features
- **🔐 Secure API Key Management**: Environment variables or local storage
- **🖼️ Image Analysis Tab**: URL input, preview, and custom prompts
- **💬 Text Analysis Tab**: Example prompts and conversation interface  
- **🎨 Beautiful UI**: Glass morphism design with smooth animations
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **⚡ Real-time Processing**: Live loading states and error handling
- **🎯 User Experience**: Intuitive interface with helpful guidance

## 🔑 API Key Configuration

### Priority Order
1. **Environment Variable** (highest priority)
   - CLI: `OPENROUTER_API_KEY`
   - Web: `VITE_OPENROUTER_API_KEY`
2. **File-based** (CLI only): `openrouterkey.txt`
3. **Manual Entry** (Web only): Browser interface

### Getting Your API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Create an account
3. Generate an API key
4. Set up using your preferred method above

### Environment Variable Setup
```bash
# Linux/macOS - Add to ~/.bashrc or ~/.zshrc
export OPENROUTER_API_KEY="your_key_here"
export VITE_OPENROUTER_API_KEY="your_key_here"

# Windows PowerShell
$env:OPENROUTER_API_KEY="your_key_here"
$env:VITE_OPENROUTER_API_KEY="your_key_here"

# Windows Command Prompt
set OPENROUTER_API_KEY=your_key_here
set VITE_OPENROUTER_API_KEY=your_key_here
```

## 📁 Project Structure

```
openrouter-analysis/
├── src/
│   └── index.ts              # CLI application
├── web-app/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   └── App.tsx          # Main application
│   ├── index.html           # Entry point
│   └── vite.config.ts       # Vite configuration
├── package.json             # CLI dependencies
├── tsconfig.json           # TypeScript configuration
├── openrouterkey.txt       # API key file (if used)
└── README.md               # This file
```

## 🔒 Security Considerations

- **API keys are never logged or transmitted** to unauthorized endpoints
- **Local storage only** - Keys stay on your machine/browser
- **Environment variables** provide secure deployment options
- **HTTPS only** - All API communications are encrypted
- **No key persistence** in version control

## 🎯 Use Cases

### Developers
- **Code analysis** and documentation
- **Automated image processing** in CI/CD pipelines
- **Content moderation** and classification
- **Data extraction** from visual content

### Content Creators  
- **Image description** for accessibility
- **Content ideation** and brainstorming
- **Visual content analysis** for social media
- **Research assistance** and fact-checking

### Businesses
- **Product catalog** image analysis
- **Customer support** automation
- **Market research** and trend analysis
- **Document processing** and extraction

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

---

**Ready to analyze?** 🚀 Choose your platform and start exploring the power of AI-driven image and text analysis!
