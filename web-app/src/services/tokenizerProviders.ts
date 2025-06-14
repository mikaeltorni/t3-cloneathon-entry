/**
 * tokenizerProviders.ts
 * 
 * Individual tokenizer provider implementations
 * 
 * Classes:
 *   OpenAITokenizerProvider, AnthropicTokenizerProvider, DeepSeekTokenizerProvider, GoogleTokenizerProvider
 * 
 * Features:
 *   - Provider-specific tokenization logic
 *   - GPT tokenizer integration for OpenAI models
 *   - Character-based estimation for other providers
 *   - Chat message tokenization support
 * 
 * Usage: import { OpenAITokenizerProvider } from './tokenizerProviders'
 */

import { logger } from '../utils/logger';
import type { GPTTokenizerModule } from './types/tokenizer';
import type { TokenizationResult, ModelInfo } from './types/api';
import { costCalculationService } from './costCalculationService';

/**
 * Base tokenizer provider interface
 */
export interface TokenizerProvider {
  tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult>;
  tokenizeChat?(messages: any[], model: string, modelInfo: ModelInfo): Promise<TokenizationResult>;
  countTokens(text: string, model: string, modelInfo: ModelInfo): Promise<number>;
  estimateTokensInChunk(chunk: string, model: string, modelInfo: ModelInfo): Promise<number>;
  estimateTokensInChunkSync(chunk: string, model: string, modelInfo: ModelInfo): number;
}

/**
 * OpenAI tokenizer provider using gpt-tokenizer library
 */
export class OpenAITokenizerProvider implements TokenizerProvider {
  private gptTokenizerCache = new Map<string, GPTTokenizerModule>();

  /**
   * Load appropriate gpt-tokenizer module for OpenAI models
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
   */
  private mapModelNameForTokenizer(model: string): string | undefined {
    if (model.includes('gpt-4o')) {
      return 'gpt-4o';
    }
    return undefined;
  }

  async tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokens = tokenizer.encode(text);
      
      const estimatedCost = costCalculationService.calculateCost(tokens.length, 0, modelInfo);

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

  async tokenizeChat(messages: any[], model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokenizerModel = this.mapModelNameForTokenizer(model);
      const tokens = tokenizer.encodeChat(messages, tokenizerModel);
      
      const estimatedCost = costCalculationService.calculateCost(tokens.length, 0, modelInfo);

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

  async estimateTokensInChunk(chunk: string, model: string, _modelInfo: ModelInfo): Promise<number> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokens = tokenizer.encode(chunk);
      return tokens.length;
    } catch (error) {
      logger.warn(`Failed to use gpt-tokenizer for chunk estimation, falling back to character-based estimation`, error as Error);
      return Math.ceil(chunk.length / 4);
    }
  }

  estimateTokensInChunkSync(chunk: string, model: string, _modelInfo: ModelInfo): number {
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

/**
 * Anthropic tokenizer provider using character-based estimation
 */
export class AnthropicTokenizerProvider implements TokenizerProvider {
  private readonly charactersPerToken = 4;

  async tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const estimatedTokens = Math.ceil(text.length / this.charactersPerToken);
      const tokens = new Array(estimatedTokens).fill(0).map((_, i) => i);
      
      const estimatedCost = costCalculationService.calculateCost(estimatedTokens, 0, modelInfo);

      logger.debug(`Anthropic token estimation for ${model}: ${estimatedTokens} tokens`);

      return {
        tokens,
        tokenCount: estimatedTokens,
        text,
        model,
        provider: 'anthropic',
        estimatedCost: estimatedCost.total
      };
    } catch (error) {
      logger.error(`Anthropic tokenization failed for model: ${model}`, error as Error);
      throw new Error(`Failed to estimate tokens for Anthropic model: ${error}`);
    }
  }

  async countTokens(text: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(text.length / this.charactersPerToken);
  }

  async estimateTokensInChunk(chunk: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }

  estimateTokensInChunkSync(chunk: string, _model: string, _modelInfo: ModelInfo): number {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }
}

/**
 * DeepSeek tokenizer provider using character-based estimation
 */
export class DeepSeekTokenizerProvider implements TokenizerProvider {
  private readonly charactersPerToken = 3.5;

  async tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const estimatedTokens = Math.ceil(text.length / this.charactersPerToken);
      const tokens = new Array(estimatedTokens).fill(0).map((_, i) => i);
      
      const estimatedCost = costCalculationService.calculateCost(estimatedTokens, 0, modelInfo);

      logger.debug(`DeepSeek token estimation for ${model}: ${estimatedTokens} tokens`);

      return {
        tokens,
        tokenCount: estimatedTokens,
        text,
        model,
        provider: 'deepseek',
        estimatedCost: estimatedCost.total
      };
    } catch (error) {
      logger.error(`DeepSeek tokenization failed for model: ${model}`, error as Error);
      throw new Error(`Failed to estimate tokens for DeepSeek model: ${error}`);
    }
  }

  async countTokens(text: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(text.length / this.charactersPerToken);
  }

  async estimateTokensInChunk(chunk: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }

  estimateTokensInChunkSync(chunk: string, _model: string, _modelInfo: ModelInfo): number {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }
}

/**
 * Google tokenizer provider using character-based estimation
 */
export class GoogleTokenizerProvider implements TokenizerProvider {
  private readonly charactersPerToken = 3.8;

  async tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult> {
    try {
      const estimatedTokens = Math.ceil(text.length / this.charactersPerToken);
      const tokens = new Array(estimatedTokens).fill(0).map((_, i) => i);
      
      const estimatedCost = costCalculationService.calculateCost(estimatedTokens, 0, modelInfo);

      logger.debug(`Google token estimation for ${model}: ${estimatedTokens} tokens`);

      return {
        tokens,
        tokenCount: estimatedTokens,
        text,
        model,
        provider: 'google',
        estimatedCost: estimatedCost.total
      };
    } catch (error) {
      logger.error(`Google tokenization failed for model: ${model}`, error as Error);
      throw new Error(`Failed to estimate tokens for Google model: ${error}`);
    }
  }

  async countTokens(text: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(text.length / this.charactersPerToken);
  }

  async estimateTokensInChunk(chunk: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }

  estimateTokensInChunkSync(chunk: string, _model: string, _modelInfo: ModelInfo): number {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }
} 