/**
 * tokenizerServiceRefactored.ts
 * 
 * Refactored tokenizer service using focused service composition
 * 
 * Classes:
 *   TokenizerService - Main orchestrator service
 *   TokenTracker - Real-time token tracking (preserved from original)
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
import type { TokenMetrics } from '../../../src/shared/types';
import type { 
  TokenizerProvider as TokenizerProviderType, 
  TokenizationResult 
} from './types/api';

// Import focused services
import { modelInfoService } from './modelInfoService';
import { costCalculationService } from './costCalculationService';
import { contextWindowService } from './contextWindowService';
import { 
  OpenAITokenizerProvider,
  AnthropicTokenizerProvider,
  DeepSeekTokenizerProvider,
  GoogleTokenizerProvider,
  type TokenizerProvider
} from './tokenizerProviders';

/**
 * Real-time token tracking for streaming responses
 * Preserved from original implementation
 */
export class TokenTracker {
  private startTime: number;
  private tokenCount: number = 0;
  private tokensPerSecondHistory: number[] = [];
  private readonly maxHistorySize = 10;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Add tokens to the tracker and calculate current TPS
   */
  addTokens(count: number): number {
    this.tokenCount += count;
    const currentTime = Date.now();
    const duration = (currentTime - this.startTime) / 1000; // Convert to seconds
    
    if (duration > 0) {
      const currentTPS = this.tokenCount / duration;
      this.tokensPerSecondHistory.push(currentTPS);
      
      // Keep only recent history for smoother TPS calculation
      if (this.tokensPerSecondHistory.length > this.maxHistorySize) {
        this.tokensPerSecondHistory.shift();
      }
      
      return currentTPS;
    }
    
    return 0;
  }

  /**
   * Get current tokens per second (smoothed average)
   */
  getCurrentTPS(): number {
    if (this.tokensPerSecondHistory.length === 0) return 0;
    
    const sum = this.tokensPerSecondHistory.reduce((a, b) => a + b, 0);
    return sum / this.tokensPerSecondHistory.length;
  }

  /**
   * Get total tokens counted
   */
  getTotalTokens(): number {
    return this.tokenCount;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Reset the tracker
   */
  reset(): void {
    this.startTime = Date.now();
    this.tokenCount = 0;
    this.tokensPerSecondHistory = [];
  }
}

/**
 * Refactored tokenizer service using focused service composition
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
  async tokenizeChat(messages: any[], model: string): Promise<TokenizationResult> {
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
   * Create token metrics object for tracking
   * 
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param startTime - Start timestamp
   * @param endTime - End timestamp (optional)
   * @param modelId - Model identifier (optional)
   * @returns TokenMetrics object
   */
  createTokenMetrics(
    inputTokens: number,
    outputTokens: number = 0,
    startTime: number,
    endTime?: number,
    modelId?: string
  ): TokenMetrics {
    const modelInfo = modelId ? modelInfoService.getModelInfo(modelId) : undefined;
    
    return costCalculationService.createTokenMetricsWithCost(
      inputTokens,
      outputTokens,
      startTime,
      endTime,
      modelInfo
    );
  }

  /**
   * Calculate context window usage for a specific model
   * 
   * @param usedTokens - Number of tokens currently used
   * @param modelId - Model identifier
   * @returns Context window usage information
   */
  calculateContextWindowUsage(usedTokens: number, modelId: string) {
    const modelInfo = modelInfoService.getModelInfo(modelId);
    return contextWindowService.calculateUsage(usedTokens, modelInfo);
  }

  /**
   * Calculate total context window usage including all messages in a conversation
   * 
   * @param messages - Array of chat messages
   * @param modelId - Model identifier
   * @returns Context window usage information
   */
  async calculateConversationContextUsage(messages: any[], modelId: string) {
    const result = await this.tokenizeChat(messages, modelId);
    return this.calculateContextWindowUsage(result.tokenCount, modelId);
  }

  /**
   * Check if text is within token limit for a model
   * 
   * @param text - Text to check
   * @param model - Model identifier
   * @param limit - Optional custom limit
   * @returns True if within limit
   */
  async isWithinTokenLimit(text: string, model: string, limit?: number): Promise<boolean> {
    const modelInfo = modelInfoService.getModelInfo(model);
    const tokenCount = await this.countTokens(text, model);
    
    return contextWindowService.isWithinLimit(tokenCount, modelInfo, limit);
  }

  /**
   * Estimate tokens in streaming chunks (for real-time counting)
   * 
   * @param chunk - Text chunk to estimate
   * @param model - Model identifier
   * @returns Estimated token count
   */
  async estimateTokensInChunk(chunk: string, model: string): Promise<number> {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);
    
    return provider.estimateTokensInChunk(chunk, model, modelInfo);
  }

  /**
   * Synchronous version of estimateTokensInChunk for when async is not possible
   * 
   * @param chunk - Text chunk to estimate
   * @param model - Model identifier
   * @returns Estimated token count
   */
  estimateTokensInChunkSync(chunk: string, model: string): number {
    const modelInfo = modelInfoService.getModelInfo(model);
    const provider = this.getProvider(model);
    
    return provider.estimateTokensInChunkSync(chunk, model, modelInfo);
  }

  /**
   * Get supported models list
   * 
   * @returns Array of supported model identifiers
   */
  getSupportedModels(): string[] {
    return modelInfoService.getSupportedModels();
  }

  /**
   * Get models by provider
   * 
   * @param provider - TokenizerProvider to filter by
   * @returns Array of model identifiers for the provider
   */
  getModelsByProvider(provider: TokenizerProviderType): string[] {
    return modelInfoService.getModelsByProvider(provider);
  }

  /**
   * Get model information
   * 
   * @param model - Model identifier
   * @returns Model information object
   */
  getModelInfo(model: string) {
    return modelInfoService.getModelInfo(model);
  }
}

// Singleton instance for backwards compatibility
export const tokenizerService = new TokenizerService(); 