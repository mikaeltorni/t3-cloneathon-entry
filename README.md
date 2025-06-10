# t3-cloneathon-entry

https://cloneathon.t3.chat/

A TypeScript application that analyzes images using the OpenRouter API with Google's Gemini 2.5 Flash model.

## Features

- 🖼️ Analyze any image from a URL
- 🤖 Uses Google Gemini 2.5 Flash Preview model via OpenRouter
- 💬 Custom prompts for different analysis needs
- 🔧 Full TypeScript support with proper types
- ⚡ Simple command-line interface

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm
- An OpenRouter API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Get your OpenRouter API key:
   - Visit [OpenRouter](https://openrouter.ai/)
   - Sign up for an account
   - Generate an API key

3. Add your API key:
   - Edit the `openrouterkey.txt` file
   - Replace `YOUR_OPENROUTER_API_KEY_HERE` with your actual API key

## Usage

### Development Mode (Recommended)

Run with TypeScript directly:
```bash
# Analyze the default image
npm run dev

# Analyze a custom image
npm run dev "https://example.com/your-image.jpg"

# Analyze with a custom prompt
npm run dev "https://example.com/your-image.jpg" "Describe this image in detail"
```

### Production Mode

Build and run the compiled JavaScript:
```bash
# Build the project
npm run build

# Run the compiled version
npm start

# Or with arguments
node dist/index.js "https://example.com/your-image.jpg" "What colors are in this image?"
```

## Example

The application comes with a default image for testing:
```bash
npm run dev
```

This will analyze this sample image: https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg

## API Details

The application uses the exact API call structure you provided:

- **Model**: `google/gemini-2.5-flash-preview-05-20`
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Headers**: Includes Authorization, HTTP-Referer, X-Title, and Content-Type
- **Format**: Supports both text prompts and image URLs in the same request

## Project Structure

```
├── src/
│   └── index.ts          # Main TypeScript application
├── dist/                 # Compiled JavaScript (after build)
├── openrouterkey.txt     # Your API key (keep private!)
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Scripts

- `npm run dev` - Run with ts-node for development
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled JavaScript
- `npm run clean` - Remove the dist directory

## Security Notes

- Never commit your API key to version control
- The `openrouterkey.txt` file should be added to `.gitignore`
- Keep your OpenRouter API key secure and private

## Error Handling

The application includes comprehensive error handling for:
- Missing or invalid API keys
- Network errors
- Invalid image URLs
- API response errors
