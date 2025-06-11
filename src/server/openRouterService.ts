import { OpenRouterRequest, OpenRouterResponse } from '../shared/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-exp:free';

export class OpenRouterService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: Array<{role: 'user' | 'assistant', content: string, imageUrl?: string}>): Promise<string> {
    try {
      // Convert messages to OpenRouter format
      const openRouterMessages = messages.map(msg => {
        if (msg.imageUrl) {
          // For image messages, use the structured content format
          return {
            role: msg.role,
            content: [
              {
                type: 'text' as const,
                text: msg.content
              },
              {
                type: 'image_url' as const,
                image_url: {
                  url: msg.imageUrl
                }
              }
            ]
          };
        } else {
          // For text-only messages
          return {
            role: msg.role,
            content: msg.content
          };
        }
      });

      const requestBody: OpenRouterRequest = {
        model: MODEL,
        messages: openRouterMessages
      };

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3000',
          'X-Title': 'OpenRouter Chat App'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw new Error(`Failed to get response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createOpenRouterService = (apiKey: string): OpenRouterService => {
  return new OpenRouterService(apiKey);
}; 