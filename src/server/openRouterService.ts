/**
 * openRouterService.ts
 * 
 * OpenRouter API service for AI model communication
 * 
 * Functions:
 *   createOpenRouterService - Factory function for creating service instance
 * 
 * Features:
 *   - Complete model support via shared configuration
 *   - Web search support using :online suffix and web_search_options
 *   - Image and text analysis support
 *   - Conversation history management
 *   - Comprehensive error handling and logging
 *   - Request/response validation
 *   - Retry logic for failed requests
 * 
 * Usage: const service = createOpenRouterService(apiKey);
 */
import { SHARED_MODEL_CONFIG, type ModelId, type SharedModelConfig, DEFAULT_MODEL } from '../shared/modelConfig';
import type { OpenRouterRequest, OpenRouterResponse } from '../shared/types';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Available AI models configuration
 * Now uses shared model configuration for consistency
 */
export const AVAILABLE_MODELS = SHARED_MODEL_CONFIG;

// Re-export types that other services need
export type { ModelId };

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
  role: 'user' | 'assistant' | 'system';
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
  sendMessage(messages: ConversationMessage[], modelId?: ModelId, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high', systemPrompt?: string): Promise<{ content: string; reasoning?: string; annotations?: any[] }>;
  sendMessageStream(messages: ConversationMessage[], modelId?: ModelId, useReasoning?: boolean, reasoningEffort?: 'low' | 'medium' | 'high', useWebSearch?: boolean, webSearchEffort?: 'low' | 'medium' | 'high', systemPrompt?: string): Promise<AsyncIterable<string>>;
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
 * @param systemPrompt - Optional system prompt to prepend
 * @returns Formatted messages for API
 */
const formatMessagesForAPI = (messages: ConversationMessage[], systemPrompt?: string): OpenRouterRequest['messages'] => {
  const formattedMessages = messages.map(msg => {
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

  // Prepend system message if system prompt is provided
  if (systemPrompt?.trim()) {
    formattedMessages.unshift({
      role: 'system',
      content: systemPrompt.trim()
    });
  }

  return formattedMessages;
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
        'X-Title': 'Vibe Chat App', // Optional but recommended
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
     * @param reasoningEffort - Reasoning effort level (low, medium, high)
     * @param useWebSearch - Whether to enable web search for supported models
     * @param webSearchEffort - Web search effort level (low, medium, high)
     * @param systemPrompt - Optional system prompt for app-based conversations
     * @returns Promise with AI response text, reasoning, and annotations
     */
    async sendMessage(
      messages: ConversationMessage[], 
      modelId: ModelId = DEFAULT_MODEL, 
      useReasoning: boolean = false, 
      reasoningEffort: 'low' | 'medium' | 'high' = 'high',
      useWebSearch: boolean = false,
      webSearchEffort: 'low' | 'medium' | 'high' = 'medium',
      systemPrompt?: string
    ): Promise<{ content: string; reasoning?: string; annotations?: any[] }> {
      try {
        // Validate input
        validateMessages(messages);

        // Validate model
        if (!AVAILABLE_MODELS[modelId]) {
          throw new Error(`Invalid model ID: ${modelId}`);
        }

        const modelConfig = AVAILABLE_MODELS[modelId];
        
        // Determine the actual model to use based on web search and reasoning
        let actualModelId = modelId;
        
        // Handle web search - Use :online suffix for models that support web search
        if (useWebSearch && modelConfig.webSearchMode === 'optional') {
          actualModelId = `${modelId}:online` as ModelId;
        }
        
        // All reasoning models now use 'effort' type - no special model ID modifications needed
        
        console.log(`[OpenRouter] Processing ${messages.length} message(s) with model: ${modelConfig.name}${useReasoning && modelConfig.hasReasoning ? ' (with reasoning)' : ''}${useWebSearch ? ' (with web search)' : ''}`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages, systemPrompt);

        // Prepare request
        const requestData: OpenRouterRequest = {
          model: actualModelId,
          messages: formattedMessages,
        };

        // Add reasoning configuration for reasoning models
        if (useReasoning && modelConfig.hasReasoning) {
          // All reasoning models now use effort parameter
          requestData.reasoning = {
            effort: reasoningEffort,
            exclude: false  // Include reasoning in response
          };
          console.log(`[OpenRouter] Configured reasoning for ${actualModelId} (${modelConfig.name}) - type: ${modelConfig.reasoningType}, effort: ${reasoningEffort}`);
        }

        // Add web search configuration for models that support web search effort control
        if (useWebSearch && modelConfig.supportsWebEffortControl) {
          // Only add web_search_options for models that actually support the parameter
          // OpenAI models (via Azure) support :online suffix but NOT web_search_options
          // Google models support both :online suffix AND web_search_options
          const supportsWebSearchOptions = modelConfig.provider === 'google';
          
          if (modelConfig.webSearchMode !== 'forced' && supportsWebSearchOptions) {
            const effortToContextSize: Record<string, 'low' | 'medium' | 'high'> = {
              low: 'low',
              medium: 'medium', 
              high: 'high'
            };
            
            requestData.web_search_options = {
              search_context_size: effortToContextSize[webSearchEffort]
            };
            
            console.log(`[OpenRouter] Configured web search with options for ${actualModelId} (${modelConfig.name}) - effort: ${webSearchEffort}, pricing: ${modelConfig.webSearchPricing}`);
          } else {
            console.log(`[OpenRouter] Using web search via :online suffix for ${actualModelId} (${modelConfig.name}) - effort: ${webSearchEffort}, pricing: ${modelConfig.webSearchPricing}`);
          }
        }

        // Make API request
        const response = await makeOpenRouterRequest(apiKey, requestData);

        // Extract response content
        const aiResponse = response.choices[0]?.message?.content;
        const reasoning = response.choices[0]?.message?.reasoning; // Real reasoning from API
        const annotations = response.choices[0]?.message?.annotations; // Web search annotations
        
        if (!aiResponse?.trim()) {
          throw new Error('Empty response received from OpenRouter API');
        }

        // Log reasoning token status
        if (useReasoning && modelConfig.hasReasoning) {
          if (reasoning) {
            console.log(`[OpenRouter] Reasoning tokens received (${reasoning.length} characters)`);
          } else {
            console.log(`[OpenRouter] No reasoning tokens received from ${actualModelId} - this model may not return reasoning tokens`);
          }
        }

        // Log web search status
        if (useWebSearch) {
          if (annotations && annotations.length > 0) {
            console.log(`[OpenRouter] Web search enabled for ${actualModelId} with ${annotations.length} citations`);
          } else {
          console.log(`[OpenRouter] Web search enabled for ${actualModelId}`);
          }
        }

        console.log(`[OpenRouter] Response received (${aiResponse.length} characters)${reasoning ? ` with reasoning (${reasoning.length} characters)` : ''}${annotations ? ` with ${annotations.length} citations` : ''}`);
          
        return {
          content: aiResponse.trim(),
          reasoning: reasoning || undefined, // Real reasoning tokens from OpenRouter
          annotations: annotations || undefined // Web search annotations
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
     * @param reasoningEffort - Reasoning effort level (low, medium, high)
     * @param useWebSearch - Whether to enable web search for supported models
     * @param webSearchEffort - Web search effort level (low, medium, high)
     * @returns Async iterable with AI response stream
     */
    async sendMessageStream(
      messages: ConversationMessage[], 
      modelId: ModelId = DEFAULT_MODEL, 
      useReasoning: boolean = false, 
      reasoningEffort: 'low' | 'medium' | 'high' = 'high',
      useWebSearch: boolean = false,
      webSearchEffort: 'low' | 'medium' | 'high' = 'medium',
      systemPrompt?: string
    ): Promise<AsyncIterable<string>> {
      try {
        // Validate input
        validateMessages(messages);

        // Validate model
        if (!AVAILABLE_MODELS[modelId]) {
          throw new Error(`Invalid model ID: ${modelId}`);
        }

        const modelConfig = AVAILABLE_MODELS[modelId];
        
        // Determine the actual model to use based on web search and reasoning
        let actualModelId = modelId;
        
        // Handle web search - Use :online suffix for models that support web search
        if (useWebSearch && modelConfig.webSearchMode === 'optional') {
          actualModelId = `${modelId}:online` as ModelId;
        }
        
        // All reasoning models now use 'effort' type - no special model ID modifications needed
        
        console.log(`[OpenRouter] Processing ${messages.length} message(s) with model: ${modelConfig.name}${useReasoning && modelConfig.hasReasoning ? ' (with reasoning)' : ''}${useWebSearch ? ' (with web search)' : ''}`);
        
        // Format messages for API
        const formattedMessages = formatMessagesForAPI(messages, systemPrompt);

        // Prepare streaming request with reasoning tokens
        const requestData: OpenRouterRequest & { stream: true } = {
          model: actualModelId,
          messages: formattedMessages,
          stream: true
        };

        // Add reasoning configuration for reasoning models
        if (useReasoning && modelConfig.hasReasoning) {
          // All reasoning models now use effort parameter
          requestData.reasoning = {
            effort: reasoningEffort,
            exclude: false  // Include reasoning in response
          };
          console.log(`[OpenRouter] Configured reasoning for ${actualModelId} (${modelConfig.name}) - type: ${modelConfig.reasoningType}, effort: ${reasoningEffort}`);
        }

        // Add web search configuration for models that support web search effort control
        if (useWebSearch && modelConfig.supportsWebEffortControl) {
          // Only add web_search_options for models that actually support the parameter
          // OpenAI models (via Azure) support :online suffix but NOT web_search_options
          // Google models support both :online suffix AND web_search_options
          const supportsWebSearchOptions = modelConfig.provider === 'google';
          
          if (modelConfig.webSearchMode !== 'forced' && supportsWebSearchOptions) {
            const effortToContextSize: Record<string, 'low' | 'medium' | 'high'> = {
              low: 'low',
              medium: 'medium', 
              high: 'high'
            };
            
            requestData.web_search_options = {
              search_context_size: effortToContextSize[webSearchEffort]
            };
            
            console.log(`[OpenRouter] Configured web search with options for ${actualModelId} (${modelConfig.name}) - effort: ${webSearchEffort}, pricing: ${modelConfig.webSearchPricing}`);
          } else {
            console.log(`[OpenRouter] Using web search via :online suffix for ${actualModelId} (${modelConfig.name}) - effort: ${webSearchEffort}, pricing: ${modelConfig.webSearchPricing}`);
          }
        }

        console.log(`[OpenRouter] Making streaming API request`);

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://localhost:3000',
            'X-Title': 'Vibe Chat App'
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
          
          console.log(`[OpenRouter] Starting to read streaming response`);
          let totalChunks = 0;
          let totalContentChunks = 0;
          let totalAnnotationChunks = 0;
          let totalReasoningChunks = 0;
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log(`[OpenRouter] Stream ended. Total chunks processed: ${totalChunks}, content: ${totalContentChunks}, annotations: ${totalAnnotationChunks}, reasoning: ${totalReasoningChunks}`);
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              console.log(`[OpenRouter] Raw chunk received: length=${chunk.length}, preview="${chunk.substring(0, 100).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}..."`);
              
              // Add chunk to buffer
              buffer += chunk;
              
              // Split buffer into lines and process complete lines
              const lines = buffer.split('\n');
              // Keep the last line in buffer (might be incomplete)
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
                
                const data = trimmedLine.slice(6); // Remove 'data: ' prefix
                console.log(`[OpenRouter] Processing data line: "${data.substring(0, 100)}..."`);
                
                if (data === '[DONE]') {
                  console.log(`[OpenRouter] Received [DONE] signal`);
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  console.log(`[OpenRouter] Parsed JSON successfully: ${JSON.stringify(parsed).substring(0, 100)}...`);
                  
                  const delta = parsed.choices?.[0]?.delta;
                  console.log(`[OpenRouter] Delta object: ${JSON.stringify(delta).substring(0, 100)}...`);

                  if (delta) {
                    totalChunks++;
                    
                    // Handle reasoning tokens - yield with special prefix
                    if (delta.reasoning) {
                      totalReasoningChunks++;
                      console.log(`[OpenRouter] Yielding reasoning chunk ${totalReasoningChunks}: length=${delta.reasoning.length}, preview="${delta.reasoning.substring(0, 50)}..."`);
                      yield `reasoning:${delta.reasoning}`;
                    }
                    
                    // Handle content tokens
                    if (delta.content) {
                      totalContentChunks++;
                      console.log(`[OpenRouter] Yielding content chunk ${totalContentChunks}: length=${delta.content.length}, preview="${delta.content.substring(0, 50)}..."`);
                      yield `content:${delta.content}`;
                    }
                    
                    // Handle web search annotations - yield with special prefix
                    if (delta.annotations) {
                      totalAnnotationChunks++;
                      console.log(`[OpenRouter] Yielding annotations chunk ${totalAnnotationChunks}: count=${delta.annotations.length}, preview="${JSON.stringify(delta.annotations).substring(0, 100)}..."`);
                      yield `annotations:${JSON.stringify(delta.annotations)}`;
                    }
                    
                    // Log if delta exists but has no recognized content
                    if (!delta.reasoning && !delta.content && !delta.annotations) {
                      console.log(`[OpenRouter] Delta exists but no recognized content: ${JSON.stringify(delta)}`);
                    }
                  } else {
                    console.log(`[OpenRouter] No delta in parsed response: ${JSON.stringify(parsed)}`);
                  }
                } catch (parseError) {
                  console.warn('[OpenRouter] Failed to parse streaming chunk:', data.substring(0, 100), 'Error:', parseError);
                  // Don't throw, just log and continue - this might be a partial JSON chunk
                }
              }
            }
            
            // Process any remaining data in buffer
            if (buffer.trim()) {
              const trimmedBuffer = buffer.trim();
              if (trimmedBuffer.startsWith('data: ')) {
                const data = trimmedBuffer.slice(6);
                if (data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta;
                    if (delta?.content) {
                      console.log(`[OpenRouter] Yielding final buffered content: length=${delta.content.length}`);
                      yield `content:${delta.content}`;
                    }
                    if (delta?.reasoning) {
                      console.log(`[OpenRouter] Yielding final buffered reasoning: length=${delta.reasoning.length}`);
                      yield `reasoning:${delta.reasoning}`;
                    }
                    if (delta?.annotations) {
                      console.log(`[OpenRouter] Yielding final buffered annotations: count=${delta.annotations.length}`);
                      yield `annotations:${JSON.stringify(delta.annotations)}`;
                    }
                  } catch (parseError) {
                    console.warn('[OpenRouter] Failed to parse final buffer:', data.substring(0, 100), 'Error:', parseError);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
            console.log(`[OpenRouter] Reader released. Final stats - Total: ${totalChunks}, Content: ${totalContentChunks}, Annotations: ${totalAnnotationChunks}, Reasoning: ${totalReasoningChunks}`);
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