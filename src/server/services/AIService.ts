/**
 * AIService.ts
 * 
 * Service layer for AI operations and model management
 * Abstracts OpenRouter integration and provides consistent interface
 * 
 * Service:
 *   AIService
 * 
 * Features:
 *   - AI model configuration and availability
 *   - Message generation with different models
 *   - Support for images and reasoning modes
 *   - Extensible for multiple AI providers
 *   - Database-ready for conversation logging
 * 
 * Usage: const aiService = new AIService(openRouterKey);
 */
import { createOpenRouterService, type ModelId } from '../openRouterService';
import type { ChatMessage } from '../../shared/types';

/**
 * Interface for AI provider operations
 * This abstraction allows for multiple AI providers (OpenRouter, OpenAI, etc.)
 */
export interface IAIProvider {
  getAvailableModels(): Record<string, any>;
  generateResponse(
    messages: ChatMessage[], 
    modelId: ModelId, 
    useReasoning?: boolean,
    reasoningEffort?: 'low' | 'medium' | 'high'
  ): Promise<{ content: string; reasoning?: string }>;
}

/**
 * OpenRouter AI provider implementation
 */
class OpenRouterProvider implements IAIProvider {
  private openRouterService: ReturnType<typeof createOpenRouterService>;

  constructor(apiKey: string) {
    this.openRouterService = createOpenRouterService(apiKey);
  }

  getAvailableModels(): Record<string, any> {
    return this.openRouterService.getAvailableModels();
  }

  async generateResponse(
    messages: ChatMessage[], 
    modelId: ModelId, 
    useReasoning?: boolean,
    reasoningEffort?: 'low' | 'medium' | 'high'
  ): Promise<{ content: string; reasoning?: string }> {
    try {
      const response = await this.openRouterService.sendMessage(
        messages,
        modelId,
        useReasoning,
        reasoningEffort
      );

      return {
        content: response.content,
        reasoning: response.reasoning
      };
    } catch (error) {
      console.error('[OpenRouterProvider] Error generating response:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}

/**
 * AI service providing high-level operations for AI interactions
 * 
 * This service abstracts the AI provider and provides consistent
 * interfaces for chat applications. It's designed to be database-ready
 * for future conversation logging and analytics.
 */
export class AIService {
  private aiProvider: IAIProvider;

  constructor(openRouterApiKey: string, provider?: IAIProvider) {
    // Default to OpenRouter, but allow injection of other providers
    this.aiProvider = provider || new OpenRouterProvider(openRouterApiKey);
  }

  /**
   * Get all available AI models
   * 
   * @returns Record of available models with their configurations
   */
  getAvailableModels(): Record<string, any> {
    try {
      const models = this.aiProvider.getAvailableModels();
      console.log(`[AIService] Retrieved ${Object.keys(models).length} available models`);
      return models;
    } catch (error) {
      console.error('[AIService] Error getting available models:', error);
      throw new Error('Failed to retrieve available models');
    }
  }

  /**
   * Generate AI response for a conversation
   * 
   * @param messages - Conversation history
   * @param modelId - AI model to use
   * @param useReasoning - Whether to use reasoning mode (for compatible models)
   * @param reasoningEffort - Reasoning effort level (low, medium, high)
   * @returns AI response with optional reasoning
   */
  async generateResponse(
    messages: ChatMessage[],
    modelId: ModelId,
    useReasoning?: boolean,
    reasoningEffort?: 'low' | 'medium' | 'high'
  ): Promise<{ content: string; reasoning?: string; modelId: ModelId }> {
    try {
      // Validate inputs
      if (!messages || messages.length === 0) {
        throw new Error('Messages array is required and cannot be empty');
      }

      if (!modelId) {
        throw new Error('Model ID is required');
      }

      console.log(`[AIService] Generating response with model: ${modelId}, reasoning: ${useReasoning || false}, effort: ${reasoningEffort || 'high'}`);
      
      // Generate response using the AI provider
      const response = await this.aiProvider.generateResponse(messages, modelId, useReasoning, reasoningEffort);

      // Log successful generation (could be stored in database for analytics)
      console.log(`[AIService] Successfully generated response with ${response.content.length} characters`);
      if (response.reasoning) {
        console.log(`[AIService] Reasoning provided: ${response.reasoning.length} characters`);
      }

      return {
        ...response,
        modelId
      };

    } catch (error) {
      console.error(`[AIService] Error generating response with model ${modelId}:`, error);
      
      // Specific error handling for different scenarios
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('AI service rate limit exceeded. Please try again later.');
        } else if (error.message.includes('invalid model')) {
          throw new Error(`Model "${modelId}" is not available or invalid.`);
        } else if (error.message.includes('authentication')) {
          throw new Error('AI service authentication failed. Please check configuration.');
        }
      }

      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  /**
   * Validate if a model supports reasoning mode
   * 
   * @param modelId - Model to check
   * @returns True if model supports reasoning
   */
  supportsReasoning(modelId: ModelId): boolean {
    try {
      const models = this.getAvailableModels();
      const model = models[modelId];
      
      return model?.reasoning === 'supported' || model?.reasoning === 'required';
    } catch (error) {
      console.error(`[AIService] Error checking reasoning support for ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get model information
   * 
   * @param modelId - Model to get info for
   * @returns Model configuration or null if not found
   */
  getModelInfo(modelId: ModelId): any | null {
    console.log(`[AIService] Getting model info for ${modelId}`);
    try {
      const models = this.getAvailableModels();
      return models[modelId] || null;
    } catch (error) {
      console.error(`[AIService] Error getting model info for ${modelId}:`, error);
      return null;
    }
  }

  // /**
  //  * Estimate token count for messages (placeholder for future implementation)
  //  * This could be used for cost estimation and database storage optimization
  //  * 
  //  * @param messages - Messages to estimate
  //  * @returns Rough token estimate
  //  */
  // estimateTokens(messages: ChatMessage[]): number {
  //   // Simple estimation - could be replaced with actual tokenization
  //   const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  //   return Math.ceil(totalChars / 4); // Rough estimate: 4 characters per token
  // }

  /**
   * Health check for the AI service
   * 
   * @returns True if service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const models = this.getAvailableModels();
      return Object.keys(models).length > 0;
    } catch (error) {
      console.error('[AIService] Health check failed:', error);
      return false;
    }
  }
}

// Export factory function for easier testing and configuration
export const createAIService = (openRouterApiKey: string): AIService => {
  return new AIService(openRouterApiKey);
}; 