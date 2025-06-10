import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }> | string;
}

interface OpenRouterRequest {
  model: string;
  messages: ChatMessage[];
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ImageAnalyzer {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = this.loadApiKey();
  }

  private loadApiKey(): string {
    try {
      const keyPath = join(process.cwd(), 'openrouterkey.txt');
      const apiKey = readFileSync(keyPath, 'utf-8').trim();
      
      if (!apiKey) {
        throw new Error('API key is empty');
      }
      
      return apiKey;
    } catch (error) {
      console.error('Error loading API key from openrouterkey.txt:', error);
      console.log('Please create an openrouterkey.txt file in the project root with your OpenRouter API key.');
      process.exit(1);
    }
  }

  async analyzeText(prompt: string): Promise<string> {
    const requestBody: OpenRouterRequest = {
      model: "google/gemini-2.5-flash-preview-05-20",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://localhost:3000", // Optional. Site URL for rankings on openrouter.ai.
          "X-Title": "Text Analysis App", // Optional. Site title for rankings on openrouter.ai.
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json() as OpenRouterResponse;
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response content received');
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  async analyzeImage(imageUrl: string, prompt: string = "What is in this image?"): Promise<string> {
    const requestBody: OpenRouterRequest = {
      model: "google/gemini-2.5-flash-preview-05-20",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://localhost:3000", // Optional. Site URL for rankings on openrouter.ai.
          "X-Title": "Image Analysis App", // Optional. Site title for rankings on openrouter.ai.
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json() as OpenRouterResponse;
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response content received');
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  async analyzeTextOnly(prompt: string): Promise<void> {
    console.log('💬 Analyzing text...');
    console.log(`📝 Prompt: ${prompt}`);
    console.log('⏳ Please wait...\n');

    try {
      const result = await this.analyzeText(prompt);
      console.log('✅ Analysis Result:');
      console.log('='.repeat(50));
      console.log(result);
      console.log('='.repeat(50));
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }

  async analyzeImageFromUrl(imageUrl: string, customPrompt?: string): Promise<void> {
    console.log('🔍 Analyzing image...');
    console.log(`📷 Image URL: ${imageUrl}`);
    console.log(`💭 Prompt: ${customPrompt || "What is in this image?"}`);
    console.log('⏳ Please wait...\n');

    try {
      const result = await this.analyzeImage(imageUrl, customPrompt);
      console.log('✅ Analysis Result:');
      console.log('='.repeat(50));
      console.log(result);
      console.log('='.repeat(50));
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const analyzer = new ImageAnalyzer();
  
  // Default image URL from the example
  const defaultImageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  console.log('🚀 OpenRouter Analysis MVP');
  console.log('='.repeat(50));
  
  // Check for text-only mode
  if (args[0] === '--text' || args[0] === '-t') {
    const textPrompt = args.slice(1).join(' ');
    if (!textPrompt) {
      console.log('❌ Error: Please provide a text prompt for text-only mode');
      console.log('💡 Usage: npm run dev --text "Your question here"');
      return;
    }
    await analyzer.analyzeTextOnly(textPrompt);
    return;
  }
  
  // Image analysis mode
  const imageUrl = args[0] || defaultImageUrl;
  const customPrompt = args[1];

  if (args.length === 0) {
    console.log('💡 Using default image from the example');
  }
  
  console.log('💡 Usage:');
  console.log('  Image: npm run dev [image_url] [custom_prompt]');
  console.log('  Text:  npm run dev --text "Your question here"');
  console.log('💡 Examples:');
  console.log('  npm run dev "https://example.com/image.jpg" "Describe this image"');
  console.log('  npm run dev --text "Explain quantum physics"');
  console.log('');
  
  await analyzer.analyzeImageFromUrl(imageUrl, customPrompt);
}

// Run the application
if (require.main === module) {
  main().catch(console.error);
}

export { ImageAnalyzer }; 