/**
 * TokenizerProvider.ts
 * 
 * Base interface for tokenizer providers
 * 
 * Interfaces:
 *   TokenizerProvider - Common interface for all tokenizer implementations
 * 
 * Features:
 *   - Standardized tokenization methods
 *   - Support for both text and chat tokenization
 *   - Async and sync token estimation
 *   - Provider-agnostic API
 * 
 * Usage: import { TokenizerProvider } from './TokenizerProvider'
 */

import type { TokenizationResult, ModelInfo } from '../types/api';

/**
 * Base tokenizer provider interface
 * 
 * Defines the contract that all tokenizer providers must implement
 * to ensure consistent behavior across different AI model providers.
 */
export interface TokenizerProvider {
  /**
   * Tokenize text and return detailed results
   * 
   * @param text - Text to tokenize
   * @param model - Model identifier
   * @param modelInfo - Model configuration and pricing info
   * @returns Promise with tokenization result including tokens, count, and cost
   */
  tokenize(text: string, model: string, modelInfo: ModelInfo): Promise<TokenizationResult>;

  /**
   * Tokenize chat messages (optional - not all providers support this)
   * 
   * @param messages - Array of chat messages
   * @param model - Model identifier
   * @param modelInfo - Model configuration and pricing info
   * @returns Promise with tokenization result
   */
  tokenizeChat?(messages: any[], model: string, modelInfo: ModelInfo): Promise<TokenizationResult>;

  /**
   * Count tokens in text (optimized for speed)
   * 
   * @param text - Text to count tokens for
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Promise with token count
   */
  countTokens(text: string, model: string, modelInfo: ModelInfo): Promise<number>;

  /**
   * Estimate tokens in a text chunk (async)
   * 
   * @param chunk - Text chunk to estimate
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Promise with estimated token count
   */
  estimateTokensInChunk(chunk: string, model: string, modelInfo: ModelInfo): Promise<number>;

  /**
   * Estimate tokens in a text chunk (synchronous)
   * 
   * @param chunk - Text chunk to estimate
   * @param model - Model identifier
   * @param modelInfo - Model configuration
   * @returns Estimated token count
   */
  estimateTokensInChunkSync(chunk: string, model: string, modelInfo: ModelInfo): number;
} 