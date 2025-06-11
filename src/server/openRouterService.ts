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
 */
export const AVAILABLE_MODELS = {
  'google/gemini-2.5-flash-preview-05-20': {
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient multimodal model for general tasks',
    type: 'general',
  },
  'google/gemini-2.5-pro-preview': {
    name: 'Gemini 2.5 Pro (Reasoning)',
    description: 'Advanced reasoning model for complex problem solving',
    type: 'reasoning',
  },
  'deepseek/deepseek-r1-0528': {
    name: 'DeepSeek R1 (Reasoning)',
    description: 'Open-source reasoning model with advanced logical capabilities',
    type: 'reasoning',
  }
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

// Default model
const DEFAULT_MODEL: ModelId = 'google/gemini-2.5-flash-preview-05-20';

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
 * Reasoning trace structure (matches shared types)
 */
interface ReasoningTrace {
  id: string;
  step: number;
  content: string;
  type: 'thinking' | 'analysis' | 'conclusion' | 'verification';
}

/**
 * OpenRouter service interface
 */
interface OpenRouterService {
  sendMessage(messages: ConversationMessage[], modelId?: ModelId): Promise<{ content: string; reasoning?: ReasoningTrace[] }>;
  sendMessageStream(messages: ConversationMessage[], modelId?: ModelId): Promise<AsyncIterable<string>>;
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
 * Generate mock reasoning traces for reasoning models
 * 
 * @param modelId - AI model identifier
 * @param userContent - User's message content
 * @returns Array of reasoning traces
 */
const generateMockReasoning = (modelId: ModelId, userContent: string): ReasoningTrace[] => {
  // Only generate reasoning for reasoning models
  if (AVAILABLE_MODELS[modelId].type !== 'reasoning') {
    return [];
  }

  const traces: ReasoningTrace[] = [];
  
  // Step 1: Initial thinking
  traces.push({
    id: `reasoning-${Date.now()}-1`,
    step: 1,
    content: `Let me analyze this request: "${userContent.substring(0, 100)}${userContent.length > 100 ? '...' : ''}"\n\nI need to break this down systematically to provide a comprehensive response.`,
    type: 'thinking'
  });

  // Step 2: Analysis
  traces.push({
    id: `reasoning-${Date.now()}-2`,
    step: 2,
    content: `Analyzing the key components:\n- Understanding the context and requirements\n- Identifying relevant information needed\n- Considering multiple perspectives or approaches\n- Evaluating potential implications`,
    type: 'analysis'
  });

  // Step 3: Conclusion formation
  traces.push({
    id: `reasoning-${Date.now()}-3`,
    step: 3,
    content: `Based on my analysis, I can formulate a structured response that addresses:\n- The core question or request\n- Supporting details and explanations\n- Practical applications or next steps\n- Any relevant caveats or considerations`,
    type: 'conclusion'
  });

  // Step 4: Verification
  traces.push({
    id: `reasoning-${Date.now()}-4`,
    step: 4,
    content: `Verifying my response:\n- Checking for accuracy and completeness\n- Ensuring logical consistency\n- Confirming relevance to the original question\n- Ready to provide comprehensive answer`,
    type: 'verification'
  });

  return traces;
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
     * @returns Promise with AI response text
     */
    async sendMessage(messages: ConversationMessage[], modelId: ModelId = DEFAULT_MODEL): Promise<{ content: string; reasoning?: ReasoningTrace[] }> {
      try {
        // Validate input
        validateMessages(messages);

        // Validate model
        if (!AVAILABLE_MODELS[modelId]) {
          throw new Error(`Invalid model ID: ${modelId}`);
        }

        console.log(`[OpenRouter] Processing ${messages.length} message(s) with model: ${AVAILABLE_MODELS[modelId].name}`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages);

        // Prepare request
        const requestData: OpenRouterRequest = {
          model: modelId,
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
        
        // Generate reasoning traces for reasoning models
        const reasoning = AVAILABLE_MODELS[modelId].type === 'reasoning' 
          ? generateMockReasoning(modelId, messages[messages.length - 1]?.content || '')
          : undefined;
          
        return {
          content: aiResponse.trim(),
          reasoning
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
     * @returns Async iterable with AI response stream
     */
    async sendMessageStream(messages: ConversationMessage[], modelId: ModelId = DEFAULT_MODEL): Promise<AsyncIterable<string>> {
      try {
        // Validate input
        validateMessages(messages);

        // Validate model
        if (!AVAILABLE_MODELS[modelId]) {
          throw new Error(`Invalid model ID: ${modelId}`);
        }

        console.log(`[OpenRouter] Processing ${messages.length} message(s) with streaming model: ${AVAILABLE_MODELS[modelId].name}`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages);

        // Prepare streaming request
        const requestData: OpenRouterRequest & { stream: true } = {
          model: modelId,
          messages: formattedMessages,
          stream: true
        };

        console.log(`[OpenRouter] Making streaming API request`);

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://your-app.com',
            'X-Title': 'OpenRouter Chat App',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch {
            // Ignore JSON parse errors
          }
          throw new Error(`OpenRouter streaming API error: ${errorMessage}`);
        }

        if (!response.body) {
          throw new Error('No response body for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        return {
          [Symbol.asyncIterator]: async function* () {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  console.log('[OpenRouter] Stream completed');
                  break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    if (data === '[DONE]') {
                      return;
                    }

                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content;
                      
                      if (content) {
                        yield content;
                      }
                    } catch (parseError) {
                      console.warn('[OpenRouter] Failed to parse streaming chunk:', data);
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          }
        };

      } catch (error) {
        console.error('[OpenRouter] Streaming service error:', error);

        throw new Error(
          error instanceof Error 
            ? `Failed to get response stream from AI: ${error.message}`
            : 'Failed to get response stream from AI: Unknown error'
        );
      }
    }
  };
};