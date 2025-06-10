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

export class OpenRouterService {
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

    return this.makeRequest(requestBody);
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

    return this.makeRequest(requestBody);
  }

  private async makeRequest(requestBody: OpenRouterRequest): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "OpenRouter Image Analysis App",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
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
}

export const createOpenRouterService = (apiKey: string) => new OpenRouterService(apiKey); 