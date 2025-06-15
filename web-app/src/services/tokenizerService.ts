/**
 * tokenizerService.ts
 * 
 * Refactored tokenizer service using focused service composition
 * 
 * Classes:
 *   TokenizerService - Main orchestrator service
 * 
 * Features:
 *   - Service composition following single responsibility principle
 *   - Multi-provider tokenization support
 *   - Real-time token tracking and metrics
 *   - Cost calculation and context window management
 *   - Backwards compatibility with original API
 * 
 * Usage: 
 *   const tokenizer = new TokenizerService();
 *   const result = await tokenizer.tokenize(text, 'gpt-4o');
 */

import { logger } from '../utils/logger';
import type { TokenMetrics, ChatMessage } from '../../../src/shared/types';
import type { 
  TokenizerProvider as TokenizerProviderType, 
  TokenizationResult 
} from './types/api';

// Import focused services
import { modelInfoService } from './modelInfoService';
import { costCalculationService } from './costCalculationService';
import { contextWindowService } from './contextWindowService';

// Import extracted tokenizer components
import { 
  type TokenizerProvider,
  OpenAITokenizerProvider,
  AnthropicTokenizerProvider,
  DeepSeekTokenizerProvider,
  GoogleTokenizerProvider
} from './tokenizer';

/**
 * Refactored tokenizer service using focused service composition
 * 
 * Orchestrates tokenization across multiple providers using extracted
 * components for better maintainability and single responsibility.
 */
export class TokenizerService {
  private providers: Map<TokenizerProviderType, TokenizerProvider>;

  constructor() {
    // Initialize provider instances using explicit set() calls to avoid TypeScript issues
    this.providers = new Map<TokenizerProviderType, TokenizerProvider>();
    this.providers.set('openai', new OpenAITokenizerProvider());
    this.providers.set('anthropic', new AnthropicTokenizerProvider());
    this.providers.set('deepseek', new DeepSeekTokenizerProvider());
    this.providers.set('google', new GoogleTokenizerProvider());

    logger.info('TokenizerService initialized with focused service composition');
  }

  /**
   * Get the appropriate tokenizer provider for a model
   * 
   * @param model - Model identifier
   * @returns Tokenizer provider instance
   */
  private getProvider(model: string): TokenizerProvider {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.providers.get(modelInfo.provider);
    
    if (!provider) {
      logger.warn(`No provider found for ${modelInfo.provider}, falling back to OpenAI`);
      return this.providers.get('openai')!;
    }
    
    return provider;
  }

  /**
   * Main tokenization method - automatically selects appropriate tokenizer
   * 
   * @param text - Text to tokenize
   * @param model - Model identifier
   * @returns Tokenization result with tokens, count, and cost
   */
  async tokenize(text: string, model: string): Promise<TokenizationResult> {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);
    
    logger.debug(`Tokenizing text for model: ${model} (provider: ${modelInfo.provider})`);
    
    return provider.tokenize(text, model, modelInfo);
  }

  /**
   * Tokenize chat messages (for conversation context)
   * 
   * @param messages - Array of chat messages
   * @param model - Model identifier
   * @returns Tokenization result
   */
  async tokenizeChat(messages: ChatMessage[], model: string): Promise<TokenizationResult> {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);

    // Use chat tokenization if provider supports it
    if (provider.tokenizeChat) {
      return provider.tokenizeChat(messages, model, modelInfo);
    }

    // Fallback: tokenize concatenated message content
    const combinedText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return this.tokenize(combinedText, model);
  }

  /**
   * Count tokens in text without full tokenization (faster)
   * 
   * @param text - Text to count tokens for
   * @param model - Model identifier
   * @returns Token count
   */
  async countTokens(text: string, model: string): Promise<number> {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);
    
    return provider.countTokens(text, model, modelInfo);
  }

  /**
   * Calculate cost based on token counts
   * 
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param model - Model identifier
   * @returns Cost breakdown
   */
  calculateCost(inputTokens: number, outputTokens: number, model: string) {
    const modelInfo = modelInfoService.getModelInfo(model);
    return costCalculationService.calculateCost(inputTokens, outputTokens, modelInfo);
  }

  /**
   * Create comprehensive token metrics
   * 
   * @param inputTokens - Input token count
   * @param outputTokens - Output token count
   * @param startTime - Start timestamp
   * @param endTime - End timestamp (optional)
   * @param modelId - Model identifier (optional)
   * @returns Token metrics object
   */
  createTokenMetrics(
    inputTokens: number,
    outputTokens: number = 0,
    startTime: number,
    endTime?: number,
    modelId?: string
  ): TokenMetrics {
    const totalTokens = inputTokens + outputTokens;
    const duration = endTime ? endTime - startTime : Date.now() - startTime;
    const tokensPerSecond = duration > 0 ? (totalTokens / duration) * 1000 : 0;

    const costBreakdown = modelId ? this.calculateCost(inputTokens, outputTokens, modelId) : undefined;
    const contextWindow = modelId ? this.calculateContextWindowUsage(totalTokens, modelId) : undefined;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      tokensPerSecond,
      estimatedCost: costBreakdown ? {
        input: costBreakdown.input,
        output: costBreakdown.output,
        total: costBreakdown.total,
        currency: costBreakdown.currency
      } : undefined,
      contextWindow,
      startTime,
      endTime: endTime || Date.now(),
      duration
    };
  }

  /**
   * Calculate context window usage
   * 
   * @param usedTokens - Number of tokens used
   * @param modelId - Model identifier
   * @returns Context window usage info
   */
  calculateContextWindowUsage(usedTokens: number, modelId: string) {
    const modelInfo = modelInfoService.getModelInfo(modelId);
    return contextWindowService.calculateUsage(usedTokens, modelInfo);
  }

  /**
   * Calculate conversation context usage
   * 
   * @param messages - Chat messages
   * @param modelId - Model identifier
   * @returns Context window usage for conversation
   */
  async calculateConversationContextUsage(messages: ChatMessage[], modelId: string) {
    const result = await this.tokenizeChat(messages, modelId);
    return this.calculateContextWindowUsage(result.tokenCount, modelId);
  }

  /**
   * Check if text is within token limit
   * 
   * @param text - Text to check
   * @param model - Model identifier
   * @param limit - Token limit (optional, uses model's context window if not provided)
   * @returns True if within limit
   */
  async isWithinTokenLimit(text: string, model: string, limit?: number): Promise<boolean> {
    const tokenCount = await this.countTokens(text, model);
    const modelInfo = modelInfoService.getModelInfo(model);
    const actualLimit = limit || modelInfo.maxTokens || 4096;
    
    return tokenCount <= actualLimit;
  }

  /**
   * Estimate tokens in a chunk (async)
   * 
   * @param chunk - Text chunk
   * @param model - Model identifier
   * @returns Estimated token count
   */
  async estimateTokensInChunk(chunk: string, model: string): Promise<number> {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);
    
    return provider.estimateTokensInChunk(chunk, model, modelInfo);
  }

  /**
   * Estimate tokens in a chunk (synchronous)
   * 
   * @param chunk - Text chunk
   * @param model - Model identifier
   * @returns Estimated token count
   */
  estimateTokensInChunkSync(chunk: string, model: string): number {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);
    
    return provider.estimateTokensInChunkSync(chunk, model, modelInfo);
  }

  /**
   * Get list of supported models
   * 
   * @returns Array of supported model identifiers
   */
  getSupportedModels(): string[] {
    return modelInfoService.getSupportedModels();
  }

  /**
   * Get models by provider
   * 
   * @param provider - Provider identifier
   * @returns Array of model identifiers for the provider
   */
  getModelsByProvider(provider: TokenizerProviderType): string[] {
    return modelInfoService.getModelsByProvider(provider);
  }

  /**
   * Get model information
   * 
   * @param model - Model identifier
   * @returns Model information
   */
  getModelInfo(model: string) {
    return modelInfoService.getModelInfo(model);
  }
}

// Create and export singleton instance
export const tokenizerService = new TokenizerService(); 