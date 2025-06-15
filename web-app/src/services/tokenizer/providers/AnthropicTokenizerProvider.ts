/**
 * AnthropicTokenizerProvider.ts
 * 
 * Anthropic-specific tokenizer provider using character-based estimation
 * 
 * Classes:
 *   AnthropicTokenizerProvider - Handles Anthropic model tokenization
 * 
 * Features:
 *   - Character-based token estimation optimized for Claude models
 *   - Cost calculation integration
 *   - Consistent estimation across sync/async methods
 * 
 * Usage: import { AnthropicTokenizerProvider } from './providers/AnthropicTokenizerProvider'
 */

import { logger } from '../../../utils/logger';
import { costCalculationService } from '../../costCalculationService';
import type { TokenizationResult, ModelInfo } from '../../types/api';
import type { TokenizerProvider } from '../TokenizerProvider';

/**
 * Anthropic tokenizer provider using character-based estimation
 * 
 * Uses empirically-determined character-to-token ratios for Claude models
 * since Anthropic doesn't provide a public tokenizer library.
 */
export class AnthropicTokenizerProvider implements TokenizerProvider {
  private readonly charactersPerToken = 4;

  /**
   * Tokenize text using character-based estimation
   * 
   * @param text - Text to tokenize
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Tokenization result with estimated tokens
   */
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

  /**
   * Count tokens using character-based estimation
   * 
   * @param text - Text to count tokens for
   * @returns Estimated token count
   */
  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / this.charactersPerToken);
  }

  /**
   * Estimate tokens in a chunk (async)
   * 
   * @param chunk - Text chunk to estimate
   * @returns Estimated token count
   */
  async estimateTokensInChunk(chunk: string): Promise<number> {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }

  /**
   * Estimate tokens in a chunk (synchronous)
   * 
   * @param chunk - Text chunk to estimate
   * @returns Estimated token count
   */
  estimateTokensInChunkSync(chunk: string): number {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }
} 