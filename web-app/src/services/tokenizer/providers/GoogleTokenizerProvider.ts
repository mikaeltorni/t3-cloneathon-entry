/**
 * GoogleTokenizerProvider.ts
 * 
 * Google-specific tokenizer provider using character-based estimation
 * 
 * Classes:
 *   GoogleTokenizerProvider - Handles Google/Gemini model tokenization
 * 
 * Features:
 *   - Character-based token estimation optimized for Gemini models
 *   - Cost calculation integration
 *   - Consistent estimation across sync/async methods
 * 
 * Usage: import { GoogleTokenizerProvider } from './providers/GoogleTokenizerProvider'
 */

import { logger } from '../../../utils/logger';
import { costCalculationService } from '../../costCalculationService';
import type { TokenizationResult, ModelInfo } from '../../types/api';
import type { TokenizerProvider } from '../TokenizerProvider';

/**
 * Google tokenizer provider using character-based estimation
 * 
 * Uses empirically-determined character-to-token ratios for Gemini models
 * since Google doesn't provide a public tokenizer library.
 */
export class GoogleTokenizerProvider implements TokenizerProvider {
  private readonly charactersPerToken = 3.8;

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

  /**
   * Count tokens using character-based estimation
   * 
   * @param text - Text to count tokens for
   * @param _model - Model identifier (unused)
   * @param _modelInfo - Model configuration (unused)
   * @returns Estimated token count
   */
  async countTokens(text: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(text.length / this.charactersPerToken);
  }

  /**
   * Estimate tokens in a chunk (async)
   * 
   * @param chunk - Text chunk to estimate
   * @param _model - Model identifier (unused)
   * @param _modelInfo - Model configuration (unused)
   * @returns Estimated token count
   */
  async estimateTokensInChunk(chunk: string, _model: string, _modelInfo: ModelInfo): Promise<number> {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }

  /**
   * Estimate tokens in a chunk (synchronous)
   * 
   * @param chunk - Text chunk to estimate
   * @param _model - Model identifier (unused)
   * @param _modelInfo - Model configuration (unused)
   * @returns Estimated token count
   */
  estimateTokensInChunkSync(chunk: string, _model: string, _modelInfo: ModelInfo): number {
    return Math.ceil(chunk.length / this.charactersPerToken);
  }
} 