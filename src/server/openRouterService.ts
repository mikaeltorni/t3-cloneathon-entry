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
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Available AI models configuration
 * 
 * Note: According to OpenRouter docs, reasoning token support varies by model:
 * - OpenAI o-series: Use reasoning internally but do NOT return tokens
 * - Gemini/Claude models: Must use ":thinking" variant to return reasoning tokens
 * - DeepSeek R1: Returns reasoning tokens with effort configuration
 * - See: https://openrouter.ai/docs/use-cases/reasoning-tokens
 */
export const AVAILABLE_MODELS = {
  'google/gemini-2.5-flash-preview-05-20': {
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient multimodal model for general tasks',
    hasReasoning: true, // Supports :thinking variant
    reasoningType: 'thinking', // Uses :thinking suffix
    reasoningMode: 'optional', // Can toggle reasoning on/off
    color: '#4285F4', // Google Blue
    bgColor: '#E8F0FE', // Light Google Blue
    textColor: '#1A73E8', // Darker Google Blue for text
  },
  'openai/gpt-4o': {
    name: 'GPT-4o',
    description: 'Advanced multimodal model from OpenAI',
    hasReasoning: false, // No reasoning token support yet
    reasoningType: 'internal', // Internal reasoning only
    reasoningMode: 'none', // No reasoning capabilities
    color: '#10A37F', // OpenAI Green
    bgColor: '#F0FDF4', // Light Green
    textColor: '#065F46', // Dark Green for text
  },
  'openai/o1-preview': {
    name: 'OpenAI o1 Preview',
    description: 'Reasoning model that thinks before responding',
    hasReasoning: true, // Built-in reasoning
    reasoningType: 'internal', // Uses reasoning internally, no tokens returned
    reasoningMode: 'forced', // Always uses reasoning, can't be disabled
    color: '#FF6B35', // OpenAI Orange for reasoning models
    bgColor: '#FFF7ED', // Light Orange
    textColor: '#C2410C', // Dark Orange for text
  },
  'deepseek/deepseek-r1': {
    name: 'DeepSeek R1',
    description: 'Open-source reasoning model that returns reasoning tokens',
    hasReasoning: true, // Returns reasoning tokens
    reasoningType: 'effort', // Uses effort configuration
    reasoningMode: 'forced', // Always uses reasoning, can't be disabled
    color: '#3B82F6', // Tech Blue
    bgColor: '#EFF6FF', // Light Blue
    textColor: '#1D4ED8', // Dark Blue for text
  },
  'anthropic/claude-3.7-sonnet': {
    name: 'Claude 3.7 Sonnet',
    description: 'Advanced Claude model with reasoning capabilities',
    hasReasoning: true, // Supports :thinking variant
    reasoningType: 'thinking', // Uses :thinking suffix
    reasoningMode: 'optional', // Can toggle reasoning on/off
    color: '#FF7A00', // Anthropic Orange
    bgColor: '#FFF7ED', // Light Orange
    textColor: '#C2410C', // Dark Orange for text
  }
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

// Default model
const DEFAULT_MODEL: ModelId = 'google/gemini-2.5-flash-preview-05-20';

/**
 * Custom error class for OpenRouter API errors
 */
class OpenRouterError extends Error {
  public statusCode: number;
  public statusText: string;

  constructor(statusCode: number, statusText: string, message: string) {
    super(message);
    this.name = 'OpenRouterError';
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
}

/**
 * Message format interface for conversation history
 */
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string; // Single image (backward compatibility)
  images?: ImageAttachment[]; // Multiple images (new feature)
}

/**
 * Image attachment structure (matches shared types)
 */
interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * OpenRouter service interface
 */
interface OpenRouterService {
  sendMessage(messages: ConversationMessage[], modelId?: ModelId, useReasoning?: boolean): Promise<{ content: string; reasoning?: string }>;
  sendMessageStream(messages: ConversationMessage[], modelId?: ModelId, useReasoning?: boolean): Promise<AsyncIterable<string>>;
  getAvailableModels(): typeof AVAILABLE_MODELS;
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

    // Add single image if present (backward compatibility)
    if (msg.imageUrl?.trim()) {
      content.push({
        type: 'image_url',
        image_url: {
          url: msg.imageUrl.trim()
        }
      });
    }

    // Add multiple images if present (new feature)
    if (msg.images && msg.images.length > 0) {
      msg.images.forEach(image => {
        if (image.url?.trim()) {
          content.push({
            type: 'image_url',
            image_url: {
              url: image.url.trim()
            }
          });
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
        errorMessage
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

  console.log(`[OpenRouter] Service initialized with default model: ${DEFAULT_MODEL}`);

  return {
    /**
     * Get available AI models
     * 
     * @returns Available models configuration
     */
    getAvailableModels(): typeof AVAILABLE_MODELS {
      return AVAILABLE_MODELS;
    },

    /**
     * Send messages to OpenRouter API and get AI response
     * 
     * @param messages - Array of conversation messages
     * @param modelId - AI model to use (defaults to DEFAULT_MODEL)
     * @param useReasoning - Whether to enable reasoning for supported models
     * @returns Promise with AI response text
     */
    async sendMessage(messages: ConversationMessage[], modelId: ModelId = DEFAULT_MODEL, useReasoning: boolean = false): Promise<{ content: string; reasoning?: string }> {
      try {
        // Validate input
        validateMessages(messages);

        // Validate model
        if (!AVAILABLE_MODELS[modelId]) {
          throw new Error(`Invalid model ID: ${modelId}`);
        }

        const modelConfig = AVAILABLE_MODELS[modelId];
        
        // Determine the actual model to use (add :thinking suffix if needed)
        let actualModelId = modelId;
        if (useReasoning && modelConfig.hasReasoning && modelConfig.reasoningType === 'thinking') {
          actualModelId = `${modelId}:thinking` as ModelId;
        }
        
        console.log(`[OpenRouter] Processing ${messages.length} message(s) with model: ${modelConfig.name}${useReasoning && modelConfig.hasReasoning ? ' (with reasoning)' : ''}`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages);

        // Prepare request
        const requestData: OpenRouterRequest = {
          model: actualModelId,
          messages: formattedMessages,
        };

        // Add reasoning configuration for reasoning models
        if (useReasoning && modelConfig.hasReasoning) {
          if (modelConfig.reasoningType === 'thinking') {
            requestData.reasoning = {
              max_tokens: 2000, // Specific token limit for thinking models
              exclude: false  // Include reasoning in response
            };
          } else if (modelConfig.reasoningType === 'effort') {
            requestData.reasoning = {
              effort: 'high', // High effort for DeepSeek models
              exclude: false  // Include reasoning in response
            };
          } else if (modelConfig.reasoningType === 'internal') {
            requestData.reasoning = {
              effort: 'high', // High effort for internal reasoning models
              exclude: true   // Don't include reasoning in response (internal only)
            };
          }
          console.log(`[OpenRouter] Configured reasoning for ${actualModelId} (${modelConfig.name}) - type: ${modelConfig.reasoningType}`);
        }

        // Make API request
        const response = await makeOpenRouterRequest(apiKey, requestData);

        // Extract response content
        const aiResponse = response.choices[0]?.message?.content;
        const reasoning = response.choices[0]?.message?.reasoning; // Real reasoning from API
        
        if (!aiResponse?.trim()) {
          throw new Error('Empty response received from OpenRouter API');
        }

        // Log reasoning token status
        if (useReasoning && modelConfig.hasReasoning) {
          if (reasoning) {
            console.log(`[OpenRouter] ✅ Reasoning tokens received (${reasoning.length} characters)`);
          } else if (modelConfig.reasoningType !== 'internal') {
            console.log(`[OpenRouter] ⚠️  No reasoning tokens received from ${actualModelId} - this model may not return reasoning tokens`);
          } else {
            console.log(`[OpenRouter] ✅ Internal reasoning used (no tokens returned by design)`);
          }
        }

        console.log(`[OpenRouter] Response received (${aiResponse.length} characters)${reasoning ? ` with reasoning (${reasoning.length} characters)` : ''}`);
          
        return {
          content: aiResponse.trim(),
          reasoning: reasoning || undefined // Real reasoning tokens from OpenRouter
        };

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
    },

    /**
     * Send messages to OpenRouter API and get AI response stream
     * 
     * @param messages - Array of conversation messages
     * @param modelId - AI model to use (defaults to DEFAULT_MODEL)
     * @param useReasoning - Whether to enable reasoning for supported models
     * @returns Async iterable with AI response stream
     */
    async sendMessageStream(messages: ConversationMessage[], modelId: ModelId = DEFAULT_MODEL, useReasoning: boolean = false): Promise<AsyncIterable<string>> {
      try {
        // Validate input
        validateMessages(messages);

        // Validate model
        if (!AVAILABLE_MODELS[modelId]) {
          throw new Error(`Invalid model ID: ${modelId}`);
        }

        const modelConfig = AVAILABLE_MODELS[modelId];
        
        // Determine the actual model to use (add :thinking suffix if needed)
        let actualModelId = modelId;
        if (useReasoning && modelConfig.hasReasoning && modelConfig.reasoningType === 'thinking') {
          actualModelId = `${modelId}:thinking` as ModelId;
        }
        
        console.log(`[OpenRouter] Processing ${messages.length} message(s) with streaming model: ${modelConfig.name}${useReasoning && modelConfig.hasReasoning ? ' (with reasoning)' : ''}`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages);

        // Prepare streaming request with reasoning tokens
        const requestData: OpenRouterRequest & { stream: true } = {
          model: actualModelId,
          messages: formattedMessages,
          stream: true
        };

        // Add reasoning configuration for reasoning models
        if (useReasoning && modelConfig.hasReasoning) {
          if (modelConfig.reasoningType === 'thinking') {
            requestData.reasoning = {
              max_tokens: 2000, // Specific token limit for thinking models
              exclude: false  // Include reasoning in response
            };
          } else if (modelConfig.reasoningType === 'effort') {
            requestData.reasoning = {
              effort: 'high', // High effort for DeepSeek models
              exclude: false  // Include reasoning in response
            };
          } else if (modelConfig.reasoningType === 'internal') {
            requestData.reasoning = {
              effort: 'high', // High effort for internal reasoning models
              exclude: true   // Don't include reasoning in response (internal only)
            };
          }
          console.log(`[OpenRouter] Configured reasoning for ${actualModelId} (${modelConfig.name}) - type: ${modelConfig.reasoningType}`);
        }

        console.log(`[OpenRouter] Making streaming API request`);

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://localhost:3001',
            'X-Title': 'OpenRouter Chat App'
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new OpenRouterError(
            response.status,
            response.statusText,
            `HTTP ${response.status}: ${errorText}`
          );
        }

        if (!response.body) {
          throw new Error('No response body for streaming');
        }

        // Return async generator for streaming
        return (async function* () {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

              for (const line of lines) {
                const data = line.slice(6); // Remove 'data: ' prefix
                
                if (data === '[DONE]') {
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  if (delta) {
                    // Handle reasoning tokens - yield with special prefix
                    if (delta.reasoning) {
                      yield `reasoning:${delta.reasoning}`;
                    }
                    
                    // Handle content tokens
                    if (delta.content) {
                      yield `content:${delta.content}`;
                    }
                  }
                } catch (parseError) {
                  console.warn('[OpenRouter] Failed to parse streaming chunk:', data);
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        })();

      } catch (error) {
        console.error('[OpenRouter] Streaming error:', error);
        
        if (error instanceof OpenRouterError) {
          throw new Error(`OpenRouter streaming error: ${error.statusCode} - ${error.message}`);
        }
        
        throw new Error(
          error instanceof Error 
            ? `Failed to start streaming: ${error.message}`
            : 'Failed to start streaming: Unknown error'
        );
      }
    }
  };
};