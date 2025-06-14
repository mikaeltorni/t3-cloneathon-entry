/**
 * tokenizerService.ts
 * 
 * Comprehensive tokenizer service supporting multiple AI providers
 * 
 * Classes:
 *   TokenizerService - Main tokenization service with multi-provider support
 * 
 * Features:
 *   - OpenAI tokenization using gpt-tokenizer library
 *   - Anthropic, DeepSeek, Google estimation algorithms
 *   - Real-time tokens-per-second calculation
 *   - Cost estimation for supported models
 *   - Token counting for chat messages and streaming responses
 *   - Model auto-detection and appropriate tokenizer selection
 * 
 * Usage: 
 *   const tokenizer = new TokenizerService();
 *   const result = await tokenizer.tokenize(text, 'gpt-4o');
 */

import { logger } from '../utils/logger';
import { SHARED_MODEL_CONFIG, type SharedModelConfig } from '../../../src/shared/modelConfig';
import type { TokenMetrics } from '../../../src/shared/types';
import type { 
  TokenizerProvider, 
  ModelInfo, 
  TokenizationResult 
} from './types/api';

// Dynamic imports for gpt-tokenizer to support different models
type GPTTokenizerModule = {
  encode: (text: string, options?: any) => number[];
  decode: (tokens: number[]) => string;
  encodeChat: (messages: any[], model?: any) => number[];
  isWithinTokenLimit: (text: string | any[], limit: number) => boolean | number;
  estimateCost: (tokenCount: number, modelSpec?: any) => any;
};

/**
 * Model database with provider information and pricing
 * Now uses the shared model configuration for consistency
 */
const convertSharedConfigToModelInfo = (sharedConfig: SharedModelConfig): ModelInfo => {
  return {
    provider: sharedConfig.provider as TokenizerProvider,
    modelName: sharedConfig.name,
    encoding: sharedConfig.encoding,
    maxTokens: sharedConfig.contextLength,
    inputCostPer1k: sharedConfig.inputCostPer1k,
    outputCostPer1k: sharedConfig.outputCostPer1k
  };
};

/**
 * Legacy MODEL_DATABASE for backward compatibility
 * Automatically generated from SHARED_MODEL_CONFIG
 */
const MODEL_DATABASE: Record<string, ModelInfo> = Object.fromEntries(
  Object.entries(SHARED_MODEL_CONFIG).map(([modelId, config]) => [
    modelId,
    convertSharedConfigToModelInfo(config)
  ])
);

/**
 * Real-time token tracking for streaming responses
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
      
      // Track current time for future use
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
 * Comprehensive tokenizer service supporting multiple AI providers
 */
export class TokenizerService {
  private gptTokenizerCache = new Map<string, GPTTokenizerModule>();

  constructor() {
    logger.info('TokenizerService initialized');
  }

  /**
   * Get model information from the database
   */
  getModelInfo(model: string): ModelInfo {
    const modelInfo = MODEL_DATABASE[model];
    if (!modelInfo) {
      // Try to auto-detect provider based on model name
      const provider = this.detectProvider(model);
      logger.warn(`Model ${model} not found in database, using provider: ${provider}`);
      
      return {
        provider,
        modelName: model,
        maxTokens: 128000,
        inputCostPer1k: 0.001,
        outputCostPer1k: 0.002
      };
    }
    return modelInfo;
  }

  /**
   * Auto-detect provider based on model name
   */
  private detectProvider(model: string): TokenizerProvider {
    const lowerModel = model.toLowerCase();
    
    if (lowerModel.includes('gpt') || lowerModel.includes('o1')) {
      return 'openai';
    } else if (lowerModel.includes('claude')) {
      return 'anthropic';
    } else if (lowerModel.includes('deepseek')) {
      return 'deepseek';
    } else if (lowerModel.includes('gemini')) {
      return 'google';
    }
    
    return 'auto';
  }

  /**
   * Map our model names to the format expected by gpt-tokenizer
   */
  private mapModelNameForTokenizer(model: string): string | undefined {
    // Map our model names to the format expected by gpt-tokenizer
    if (model.includes('gpt-4o')) {
      return 'gpt-4o';
    }
    // Return undefined to let the tokenizer use its default
    return undefined;
  }

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
   * Tokenize text using OpenAI's gpt-tokenizer
   */
  private async tokenizeOpenAI(text: string, model: string): Promise<TokenizationResult> {
    try {
      const tokenizer = await this.loadGPTTokenizer(model);
      const tokens = tokenizer.encode(text);
      
      const modelInfo = this.getModelInfo(model);
      const estimatedCost = this.calculateCost(tokens.length, 0, modelInfo);

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
   * Estimate tokens for Anthropic models
   * Uses character-based estimation (approximately 4 characters per token)
   */
  private async tokenizeAnthropic(text: string, model: string): Promise<TokenizationResult> {
    try {
      // Anthropic estimation: ~4 characters per token
      const estimatedTokens = Math.ceil(text.length / 4);
      
      // Generate dummy token array for compatibility
      const tokens = new Array(estimatedTokens).fill(0).map((_, i) => i);
      
      const modelInfo = this.getModelInfo(model);
      const estimatedCost = this.calculateCost(estimatedTokens, 0, modelInfo);

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
   * Estimate tokens for DeepSeek models
   * Uses similar estimation to OpenAI models as a fallback
   */
  private async tokenizeDeepSeek(text: string, model: string): Promise<TokenizationResult> {
    try {
      // DeepSeek estimation: similar to OpenAI, use character-based estimation
      // Approximately 3.5 characters per token for code-focused models
      const estimatedTokens = Math.ceil(text.length / 3.5);
      
      // Generate dummy token array for compatibility
      const tokens = new Array(estimatedTokens).fill(0).map((_, i) => i);
      
      const modelInfo = this.getModelInfo(model);
      const estimatedCost = this.calculateCost(estimatedTokens, 0, modelInfo);

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
   * Estimate tokens for Google models
   * Uses SentencePiece-like estimation
   */
  private async tokenizeGoogle(text: string, model: string): Promise<TokenizationResult> {
    try {
      // Google/Gemini estimation: ~3.8 characters per token
      const estimatedTokens = Math.ceil(text.length / 3.8);
      
      // Generate dummy token array for compatibility
      const tokens = new Array(estimatedTokens).fill(0).map((_, i) => i);
      
      const modelInfo = this.getModelInfo(model);
      const estimatedCost = this.calculateCost(estimatedTokens, 0, modelInfo);

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
   * Main tokenization method - automatically selects appropriate tokenizer
   */
  async tokenize(text: string, model: string): Promise<TokenizationResult> {
    const modelInfo = this.getModelInfo(model);
    
    logger.debug(`Tokenizing text for model: ${model} (provider: ${modelInfo.provider})`);

    switch (modelInfo.provider) {
      case 'openai':
        return this.tokenizeOpenAI(text, model);
      case 'anthropic':
        return this.tokenizeAnthropic(text, model);
      case 'deepseek':
        return this.tokenizeDeepSeek(text, model);
      case 'google':
        return this.tokenizeGoogle(text, model);
      default:
        // Auto-detect or fallback to OpenAI
        logger.warn(`Unknown provider for model: ${model}, falling back to OpenAI tokenizer`);
        return this.tokenizeOpenAI(text, model);
    }
  }

  /**
   * Tokenize chat messages (for conversation context)
   */
  async tokenizeChat(messages: any[], model: string): Promise<TokenizationResult> {
    const modelInfo = this.getModelInfo(model);

    if (modelInfo.provider === 'openai') {
      try {
        const tokenizer = await this.loadGPTTokenizer(model);
        // Map model name to the format expected by gpt-tokenizer
        const tokenizerModel = this.mapModelNameForTokenizer(model);
        const tokens = tokenizer.encodeChat(messages, tokenizerModel);
        
        const estimatedCost = this.calculateCost(tokens.length, 0, modelInfo);

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
        // Don't rethrow the error, fall through to fallback method
      }
    }

    // Fallback: tokenize concatenated message content
    const combinedText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return this.tokenize(combinedText, model);
  }

  /**
   * Count tokens in text without full tokenization (faster)
   */
  async countTokens(text: string, model: string): Promise<number> {
    const modelInfo = this.getModelInfo(model);

    if (modelInfo.provider === 'openai') {
      try {
        const tokenizer = await this.loadGPTTokenizer(model);
        const result = tokenizer.isWithinTokenLimit(text, Infinity);
        return typeof result === 'number' ? result : tokenizer.encode(text).length;
      } catch (error) {
        logger.error(`OpenAI token counting failed`, error as Error);
      }
    }

    // Fallback to provider-specific estimation
    const result = await this.tokenize(text, model);
    return result.tokenCount;
  }

  /**
   * Calculate cost based on token counts
   */
  calculateCost(inputTokens: number, outputTokens: number, modelInfo: ModelInfo): {
    input: number;
    output: number;
    total: number;
    currency: string;
  } {
    const inputCost = (inputTokens / 1000) * (modelInfo.inputCostPer1k || 0);
    const outputCost = (outputTokens / 1000) * (modelInfo.outputCostPer1k || 0);
    
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
      currency: 'USD'
    };
  }

  /**
   * Create token metrics object for tracking
   */
  createTokenMetrics(
    inputTokens: number,
    outputTokens: number = 0,
    startTime: number,
    endTime?: number,
    modelId?: string
  ): TokenMetrics {
    const duration = endTime ? endTime - startTime : Date.now() - startTime;
    const tokensPerSecond = outputTokens > 0 ? (outputTokens / (duration / 1000)) : 0;
    
    const modelInfo = modelId ? this.getModelInfo(modelId) : null;
    const estimatedCost = modelInfo ? this.calculateCost(inputTokens, outputTokens, modelInfo) : undefined;
    
    // Calculate context window usage if model is provided
    const contextWindow = modelId ? this.calculateContextWindowUsage(inputTokens + outputTokens, modelId) : undefined;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      tokensPerSecond,
      startTime,
      endTime,
      duration,
      estimatedCost,
      contextWindow
    };
  }

  /**
   * Calculate context window usage for a specific model
   */
  calculateContextWindowUsage(usedTokens: number, modelId: string): {
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  } {
    const modelInfo = this.getModelInfo(modelId);
    const maxTokens = modelInfo.maxTokens || 128000; // Default to 128k if not specified
    const percentage = Math.min((usedTokens / maxTokens) * 100, 100);

    return {
      used: usedTokens,
      total: maxTokens,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      modelId
    };
  }

  /**
   * Calculate total context window usage including all messages in a conversation
   */
  async calculateConversationContextUsage(
    messages: any[], 
    modelId: string
  ): Promise<{
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  }> {
    const result = await this.tokenizeChat(messages, modelId);
    return this.calculateContextWindowUsage(result.tokenCount, modelId);
  }

  /**
   * Check if text is within token limit for a model
   */
  async isWithinTokenLimit(text: string, model: string, limit?: number): Promise<boolean> {
    const modelInfo = this.getModelInfo(model);
    const tokenLimit = limit || modelInfo.maxTokens || 128000;
    
    const tokenCount = await this.countTokens(text, model);
    return tokenCount <= tokenLimit;
  }

  /**
   * Estimate tokens in streaming chunks (for real-time counting)
   * Uses actual gpt-tokenizer for OpenAI models when available
   */
  async estimateTokensInChunk(chunk: string, model: string): Promise<number> {
    const modelInfo = this.getModelInfo(model);
    
    // Use actual tokenizer for OpenAI models
    if (modelInfo.provider === 'openai') {
      try {
        const tokenizer = await this.loadGPTTokenizer(model);
        const tokens = tokenizer.encode(chunk);
        return tokens.length;
      } catch (error) {
        logger.warn(`Failed to use gpt-tokenizer for chunk estimation, falling back to character-based estimation`, error as Error);
        // Fallback to character-based estimation if tokenizer fails
        return Math.ceil(chunk.length / 4);
      }
    }
    
     try {
       const fallbackTokenizer = await this.loadGPTTokenizer('gpt-4o');
       const tokens = fallbackTokenizer.encode(chunk);
       return tokens.length;
            } catch (error) {
         logger.error(`Failed to use gpt-tokenizer for non-OpenAI model`, error as Error);
         // Return basic character-based estimation as absolute fallback
         return 0;
       }
  }

  /**
   * Synchronous version of estimateTokensInChunk for when async is not possible
   * Falls back to character-based estimation
   */
  estimateTokensInChunkSync(chunk: string, model: string): number {
    const modelInfo = this.getModelInfo(model);
    
    // Check if we have a cached tokenizer for OpenAI models
    if (modelInfo.provider === 'openai' && this.gptTokenizerCache.has(model)) {
      try {
        const tokenizer = this.gptTokenizerCache.get(model)!;
        const tokens = tokenizer.encode(chunk);
        return tokens.length;
      } catch (error) {
        logger.warn(`Failed to use cached gpt-tokenizer for chunk estimation`, error as Error);
      }
    }
    
     const cachedTokenizer = this.gptTokenizerCache.get('gpt-4o');
     if (cachedTokenizer) {
       try {
         const tokens = cachedTokenizer.encode(chunk);
         return tokens.length;
       } catch (error) {
         logger.warn(`Failed to use cached gpt-tokenizer for non-OpenAI model`, error as Error);
       }
    }
            
     return 0;
  }

  /**
   * Get supported models list
   */
  getSupportedModels(): string[] {
    return Object.keys(SHARED_MODEL_CONFIG);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: TokenizerProvider): string[] {
    return Object.entries(MODEL_DATABASE)
      .filter(([_, info]) => info.provider === provider)
      .map(([model, _]) => model);
  }
}

// Singleton instance
export const tokenizerService = new TokenizerService(); 