/**
 * OpenAITokenizerProvider.ts
 * 
 * OpenAI-specific tokenizer provider using gpt-tokenizer library
 * 
 * Classes:
 *   OpenAITokenizerProvider - Handles OpenAI model tokenization
 * 
 * Features:
 *   - GPT tokenizer integration with model-specific encodings
 *   - Chat message tokenization support
 *   - Token caching for performance
 *   - Fallback handling for unsupported models
 * 
 * Usage: import { OpenAITokenizerProvider } from './providers/OpenAITokenizerProvider'
 */

import { logger } from '../../../utils/logger';
import { costCalculationService } from '../../costCalculationService';
import type { GPTTokenizerModule } from '../../types/tokenizer';
import type { TokenizationResult, ModelInfo } from '../../types/api';
import type { TokenizerProvider } from '../TokenizerProvider';
import type { ChatMessage } from '../../../../../src/shared/types';

/**
 * OpenAI tokenizer provider using gpt-tokenizer library
 * 
 * Provides accurate tokenization for OpenAI models using the official
 * gpt-tokenizer library with model-specific encoding support.
 */
export class OpenAITokenizerProvider implements TokenizerProvider {
  private gptTokenizerCache = new Map<string, GPTTokenizerModule>();

  /**
   * Load appropriate gpt-tokenizer module for OpenAI models
   * 
   * @param model - Model identifier
   * @returns GPT tokenizer module
   */
  private async loadGPTTokenizer(model: string): Promise<GPTTokenizerModule> {
    if (this.gptTokenizerCache.has(model)) {
      return this.gptTokenizerCache.get(model)!;
    }

    try {
      let tokenizer: GPTTokenizerModule;
      
      // Import the appropriate tokenizer based on model
      if (model.includes('gpt-4o') || model.includes('o1')) {
        // Modern models use o200k_base encoding
        tokenizer = await import('gpt-tokenizer');
      } else if (model.includes('gpt-4') || model.includes('gpt-3.5')) {
        // Legacy models use cl100k_base encoding
        tokenizer = await import('gpt-tokenizer/model/gpt-3.5-turbo');
      } else {
        // Default to latest encoding
        tokenizer = await import('gpt-tokenizer');
      }

      this.gptTokenizerCache.set(model, tokenizer);
      logger.debug(`Loaded gpt-tokenizer for model: ${model}`);
      
      return tokenizer;
    } catch (error) {
      logger.error(`Failed to load gpt-tokenizer for model: ${model}`, error as Error);
      // Fallback to default tokenizer
      const defaultTokenizer = await import('gpt-tokenizer');
      this.gptTokenizerCache.set(model, defaultTokenizer);
      return defaultTokenizer;
    }
  }

  /**
   * Map model names to the format expected by gpt-tokenizer
   * 
   * @param model - Our model identifier
   * @returns Tokenizer-compatible model name or undefined for default
   */
  private mapModelNameForTokenizer(model: string): string | undefined {
    if (model.includes('gpt-4o')) {
      return 'gpt-4o';
    }
    return undefined;
  }

  /**
   * Tokenize text using OpenAI's gpt-tokenizer
   * 
   * @param text - Text to tokenize
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Tokenization result with tokens and cost
   */
  async tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokens = tokenizer.encode(text);
      
      const estimatedCost = costCalculationService.calculateCost(tokens.length, 0, modelInfo);

      logger.debug(`OpenAI tokenization: ${tokens.length} tokens for model ${model}`);

      return {
        tokens,
        tokenCount: tokens.length,
        text,
        model,
        provider: 'openai',
        estimatedCost: estimatedCost.total
      };
    } catch (error) {
      logger.error(`OpenAI tokenization failed for model: ${model}`, error as Error);
      throw new Error(`Failed to tokenize with OpenAI tokenizer: ${error}`);
    }
  }

  /**
   * Tokenize chat messages using OpenAI's chat tokenization
   * 
   * @param messages - Array of chat messages
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Tokenization result
   */
  async tokenizeChat(messages: ChatMessage[], model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokenizerModel = this.mapModelNameForTokenizer(model);
      const tokens = tokenizer.encodeChat(messages, tokenizerModel);
      
      const estimatedCost = costCalculationService.calculateCost(tokens.length, 0, modelInfo);

      logger.debug(`OpenAI chat tokenization: ${tokens.length} tokens for ${messages.length} messages`);

      return {
        tokens,
        tokenCount: tokens.length,
        text: JSON.stringify(messages),
        model,
        provider: 'openai',
        estimatedCost: estimatedCost.total
      };
    } catch (error) {
      logger.error(`OpenAI chat tokenization failed`, error as Error);
      // Fallback to concatenated message content
      const combinedText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      return this.tokenize(combinedText, model, modelInfo);
    }
  }

  /**
   * Count tokens in text (optimized for speed)
   * 
   * @param text - Text to count tokens for
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Token count
   */
  async countTokens(text: string, model: string, modelInfo: ModelInfo): Promise<number> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const result = tokenizer.isWithinTokenLimit(text, Infinity);
      return typeof result === 'number' ? result : tokenizer.encode(text).length;
    } catch (error) {
      logger.error(`OpenAI token counting failed`, error as Error);
      const result = await this.tokenize(text, model, modelInfo);
      return result.tokenCount;
    }
  }

  /**
   * Estimate tokens in a chunk (async)
   * 
   * @param chunk - Text chunk to estimate
   * @param model - Model identifier
   * @returns Estimated token count
   */
  async estimateTokensInChunk(chunk: string, model: string): Promise<number> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokens = tokenizer.encode(chunk);
      return tokens.length;
    } catch (error) {
      logger.warn(`Failed to use gpt-tokenizer for chunk estimation, falling back to character-based estimation`, error as Error);
      return Math.ceil(chunk.length / 4);
    }
  }

  /**
   * Estimate tokens in a chunk (synchronous)
   * 
   * @param chunk - Text chunk to estimate
   * @param model - Model identifier
   * @returns Estimated token count
   */
  estimateTokensInChunkSync(chunk: string, model: string): number {
    if (this.gptTokenizerCache.has(model)) {
      try {
        const tokenizer = this.gptTokenizerCache.get(model)!;
        const tokens = tokenizer.encode(chunk);
        return tokens.length;
      } catch (error) {
        logger.warn(`Failed to use cached gpt-tokenizer for chunk estimation`, error as Error);
      }
    }
    
    // Fallback to character-based estimation
    return Math.ceil(chunk.length / 4);
  }
} 