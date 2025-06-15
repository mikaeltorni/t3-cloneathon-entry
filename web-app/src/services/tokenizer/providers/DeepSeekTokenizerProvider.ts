/**
 * DeepSeekTokenizerProvider.ts
 * 
 * DeepSeek-specific tokenizer provider using character-based estimation
 * 
 * Classes:
 *   DeepSeekTokenizerProvider - Handles DeepSeek model tokenization
 * 
 * Features:
 *   - Character-based token estimation optimized for DeepSeek models
 *   - Cost calculation integration
 *   - Consistent estimation across sync/async methods
 * 
 * Usage: import { DeepSeekTokenizerProvider } from './providers/DeepSeekTokenizerProvider'
 */

import { logger } from '../../../utils/logger';
import { costCalculationService } from '../../costCalculationService';
import type { TokenizationResult, ModelInfo } from '../../types/api';
import type { TokenizerProvider } from '../TokenizerProvider';

/**
 * DeepSeek tokenizer provider using character-based estimation
 * 
 * Uses empirically-determined character-to-token ratios for DeepSeek models
 * with slightly more efficient tokenization than other providers.
 */
export class DeepSeekTokenizerProvider implements TokenizerProvider {
  private readonly charactersPerToken = 3.5;

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