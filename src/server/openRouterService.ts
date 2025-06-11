/**
 * openRouterService.ts
 * 
 * OpenRouter API service for AI model communication
 * 
 * Functions:
 *   createOpenRouterService - Factory function for creating service instance
 * 
 * Features:
 *   - Google Gemini 2.5 Flash integration via OpenRouter
 *   - Image and text analysis support
 *   - Conversation history management
 *   - Comprehensive error handling and logging
 *   - Request/response validation
 *   - Retry logic for failed requests
 * 
 * Usage: const service = createOpenRouterService(apiKey);
 */
import type { OpenRouterRequest, OpenRouterResponse } from '../shared/types';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.5-flash-preview-05-20';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * OpenRouter API error class for structured error handling
 */
class OpenRouterError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * Message format interface for conversation history
 */
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

/**
 * OpenRouter service interface
 */
interface OpenRouterService {
  sendMessage(messages: ConversationMessage[]): Promise<string>;
}

/**
 * Utility function to add delay for retry logic
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates conversation messages
 * 
 * @param messages - Array of conversation messages
 * @throws Error if validation fails
 */
const validateMessages = (messages: ConversationMessage[]): void => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  for (const message of messages) {
    if (!message.role || !['user', 'assistant'].includes(message.role)) {
      throw new Error('Invalid message role. Must be "user" or "assistant"');
    }

    if (!message.content?.trim() && !message.imageUrl?.trim()) {
      throw new Error('Message must have either content or imageUrl');
    }
  }
};

/**
 * Formats messages for OpenRouter API
 * 
 * @param messages - Conversation messages
 * @returns Formatted messages for API
 */
const formatMessagesForAPI = (messages: ConversationMessage[]): OpenRouterRequest['messages'] => {
  return messages.map(msg => {
    const content: any[] = [];

    // Add text content if present
    if (msg.content?.trim()) {
      content.push({
        type: 'text',
        text: msg.content.trim()
      });
    }

    // Add image if present
    if (msg.imageUrl?.trim()) {
      content.push({
        type: 'image_url',
        image_url: {
          url: msg.imageUrl.trim()
        }
      });
    }

    return {
      role: msg.role,
      content: content.length === 1 && content[0].type === 'text' 
        ? content[0].text  // Use string format for text-only messages
        : content          // Use array format for multimodal messages
    };
  });
};

/**
 * Makes HTTP request to OpenRouter API with retry logic
 * 
 * @param apiKey - OpenRouter API key
 * @param requestData - Request payload
 * @param retryCount - Current retry attempt
 * @returns Promise with API response
 */
const makeOpenRouterRequest = async (
  apiKey: string,
  requestData: OpenRouterRequest,
  retryCount = 0
): Promise<OpenRouterResponse> => {
  const startTime = Date.now();

  try {
    console.log(`[OpenRouter] Making API request (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    console.log(`[OpenRouter] Model: ${requestData.model}`);
    console.log(`[OpenRouter] Messages: ${requestData.messages.length}`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.com', // Required by OpenRouter
        'X-Title': 'OpenRouter Chat App', // Optional but recommended
      },
      body: JSON.stringify(requestData),
    });

    const duration = Date.now() - startTime;
    console.log(`[OpenRouter] API response: ${response.status} (${duration}ms)`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData: any = null;

      try {
        errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // If we can't parse error response, use default message
      }

      console.error(`[OpenRouter] API error: ${errorMessage}`, errorData);

      // Retry on specific error codes
      if (retryCount < MAX_RETRIES && [429, 500, 502, 503, 504].includes(response.status)) {
        const delayMs = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`[OpenRouter] Retrying after ${delayMs}ms...`);
        await delay(delayMs);
        return makeOpenRouterRequest(apiKey, requestData, retryCount + 1);
      }

      throw new OpenRouterError(
        response.status,
        response.statusText,
        errorMessage,
        errorData
      );
    }

    const responseData: OpenRouterResponse = await response.json();
    
    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error('No response choices received from OpenRouter API');
    }

    console.log(`[OpenRouter] Successfully received response (${duration}ms)`);
    return responseData;

  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }

    console.error(`[OpenRouter] Request failed:`, error);

    // Retry on network errors
    if (retryCount < MAX_RETRIES && error instanceof Error) {
      const delayMs = RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`[OpenRouter] Retrying network error after ${delayMs}ms...`);
      await delay(delayMs);
      return makeOpenRouterRequest(apiKey, requestData, retryCount + 1);
    }

    throw new Error(
      error instanceof Error 
        ? `OpenRouter API request failed: ${error.message}`
        : 'OpenRouter API request failed with unknown error'
    );
  }
};

/**
 * Creates an OpenRouter service instance
 * 
 * @param apiKey - OpenRouter API key
 * @returns OpenRouter service instance
 */
export const createOpenRouterService = (apiKey: string): OpenRouterService => {
  if (!apiKey?.trim()) {
    throw new Error('OpenRouter API key is required');
  }

  console.log(`[OpenRouter] Service initialized with model: ${MODEL_NAME}`);

  return {
    /**
     * Send messages to OpenRouter API and get AI response
     * 
     * @param messages - Array of conversation messages
     * @returns Promise with AI response text
     */
    async sendMessage(messages: ConversationMessage[]): Promise<string> {
      try {
        // Validate input
        validateMessages(messages);

        console.log(`[OpenRouter] Processing ${messages.length} message(s)`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages);

        // Prepare request
        const requestData: OpenRouterRequest = {
          model: MODEL_NAME,
          messages: formattedMessages,
        };

        // Make API request
        const response = await makeOpenRouterRequest(apiKey, requestData);

        // Extract response content
        const aiResponse = response.choices[0]?.message?.content;
        
        if (!aiResponse?.trim()) {
          throw new Error('Empty response received from OpenRouter API');
        }

        console.log(`[OpenRouter] Response received (${aiResponse.length} characters)`);
        return aiResponse.trim();

      } catch (error) {
        console.error('[OpenRouter] Service error:', error);

        if (error instanceof OpenRouterError) {
          throw new Error(`OpenRouter API error: ${error.statusCode} - ${error.message}`);
        }

        throw new Error(
          error instanceof Error 
            ? `Failed to get response from AI: ${error.message}`
            : 'Failed to get response from AI: Unknown error'
        );
      }
    }
  };
}; 