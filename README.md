# OpenRouter AI Analysis Platform

A powerful dual-platform application for analyzing images and text using Google's Gemini 2.5 Flash model via OpenRouter API. Available as both a command-line tool and a modern web application.

## 🚀 Features

### 🖼️ **Image Analysis**
- Analyze any image from a URL
- Custom prompts for specific analysis needs
- High-quality results from Google Gemini 2.5 Flash
- Support for various image formats

### 💬 **Text Analysis** 
- Ask questions and get AI-powered responses
- Creative writing assistance
- Technical explanations
- General knowledge queries

### 🛠️ **Dual Platform Support**
- **CLI Version**: Perfect for automation and scripting
- **Web Version**: Beautiful, modern interface with React + Tailwind CSS

## 📦 Project Structure

```
├── 📁 CLI Application (Node.js + TypeScript)
│   ├── src/
│   │   └── index.ts          # Main CLI application
│   ├── package.json          # CLI dependencies
│   ├── tsconfig.json         # TypeScript config
│   └── openrouterkey.txt     # API key file
│
├── 🌐 Web Application (React + TypeScript + Tailwind)
│   └── web-app/
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── services/     # API integration
│       │   └── App.tsx       # Main React app
│       ├── package.json      # Web dependencies
│       └── dist/             # Built files
│
└── README.md                 # This file
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm
- OpenRouter API key from [OpenRouter.ai](https://openrouter.ai/)

### 1. Clone and Install
```bash
# Install CLI dependencies
npm install

# Install web app dependencies
cd web-app
npm install
cd ..
```

### 2. Get Your API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Create an account and generate an API key
3. **For CLI**: Add your key to `openrouterkey.txt`
4. **For Web**: Enter your key in the web interface (stored locally)

## 🖥️ CLI Usage

### Basic Commands
```bash
# Analyze the default demo image
npm run dev

# Analyze a custom image
npm run dev "https://example.com/image.jpg"

# Analyze with custom prompt
npm run dev "https://example.com/image.jpg" "Describe the colors in detail"

# Text-only analysis
npm run dev --text "Explain quantum physics in simple terms"

# Alternative text command
npm run text "Write a short story about AI"
```

### CLI Examples
```bash
# Image analysis examples
npm run dev "https://picsum.photos/800/600" "What's the mood of this image?"
npm run dev "https://example.com/photo.jpg" "Count the objects in this image"

# Text analysis examples  
npm run dev --text "How do I implement a binary search in Python?"
npm run text "What are the differences between React and Vue?"
```

## 🌐 Web Application Usage

### Start the Web Server
```bash
cd web-app
npm run dev
```

Then visit: **http://localhost:5173**

### Web Features
- 🎨 **Beautiful UI** with glass morphism effects
- 📱 **Fully responsive** design
- 🔄 **Real-time analysis** with loading states
- 🎯 **Tab-based interface** for images and text
- 🔐 **Secure API key management**
- ✨ **Smooth animations** and modern UX

### Production Build
```bash
cd web-app
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🛠️ Development

### CLI Development
```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run compiled version
npm start

# Clean build files
npm run clean
```

### Web Development
```bash
cd web-app

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## 🔑 API Configuration

### CLI Configuration
Edit `openrouterkey.txt`:
```
sk-or-v1-your-api-key-here
```

### Web Configuration
- API key is entered through the web interface
- Stored securely in browser's localStorage
- Never sent to external servers (except OpenRouter)

## 🎯 Use Cases

### Image Analysis
- **Content Moderation**: Analyze uploaded images
- **Accessibility**: Generate alt text for images
- **E-commerce**: Describe product images
- **Social Media**: Analyze visual content

### Text Analysis
- **Customer Support**: AI-powered responses
- **Content Creation**: Writing assistance
- **Education**: Explain complex topics
- **Development**: Code explanations and help

## 🏗️ Tech Stack

### CLI Application
- **Runtime**: Node.js
- **Language**: TypeScript
- **HTTP Client**: Native Node.js https module
- **Build**: TypeScript Compiler

### Web Application
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **Build Tool**: Vite
- **HTTP Client**: Fetch API

## 🔒 Security

- API keys stored locally (never transmitted to our servers)
- HTTPS communication with OpenRouter API
- No data logging or storage
- Client-side processing for web app

## 🤖 AI Model

**Google Gemini 2.5 Flash Preview** via OpenRouter
- Multimodal capabilities (text + images)
- High-quality responses
- Fast processing
- Latest AI technology

## 📋 Scripts Reference

### CLI Scripts
```bash
npm run dev      # Development mode
npm run build    # Build TypeScript
npm start        # Run built version
npm run clean    # Clean build files
npm run text     # Text-only shortcut
```

### Web Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Code linting
```

## 🚀 Getting Started Quickly

### Try CLI Right Now
```bash
# 1. Add your API key to openrouterkey.txt
echo "your-api-key-here" > openrouterkey.txt

# 2. Test with demo image
npm run dev

# 3. Try text analysis
npm run text "Hello AI, explain machine learning!"
```

### Try Web App Right Now
```bash
# 1. Start web server
cd web-app && npm run dev

# 2. Open http://localhost:5173
# 3. Enter your API key in the web interface
# 4. Start analyzing!
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests! This project demonstrates:
- Modern TypeScript development
- React best practices
- Beautiful UI design with Tailwind
- API integration patterns
- Dual-platform architecture

## 📝 License

MIT License - Feel free to use this code for your own projects!

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Google Gemini AI**
