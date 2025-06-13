/**
 * tokenizerService.ts (Server-side)
 * 
 * Server-side tokenizer service for real-time token tracking during streaming
 * 
 * Classes:
 *   TokenTracker - Real-time token tracking for streaming responses
 * 
 * Features:
 *   - Real-time tokens-per-second calculation
 *   - Model-agnostic token estimation for streaming
 *   - Cost calculation based on estimated tokens
 *   - Performance metrics collection
 * 
 * Usage: 
 *   const tracker = new TokenTracker(model);
 *   tracker.startTracking(inputText);
 *   tracker.addTokensFromChunk(chunk);
 *   const metrics = tracker.stopTracking();
 */

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  estimatedCost?: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
  contextWindow?: {
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  };
}

export interface ModelInfo {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'google' | 'auto';
  modelName: string;
  maxTokens?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
}

/**
 * Model database with provider information and pricing
 */
const MODEL_DATABASE: Record<string, ModelInfo> = {
  // OpenAI Models
  'openai/gpt-4o': {
    provider: 'openai',
    modelName: 'gpt-4o',
    maxTokens: 128000,
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01
  },
  'openai/gpt-4o-mini': {
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    maxTokens: 128000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006
  },
  'openai/gpt-4-turbo': {
    provider: 'openai',
    modelName: 'gpt-4-turbo',
    maxTokens: 128000,
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03
  },
  'openai/gpt-4': {
    provider: 'openai',
    modelName: 'gpt-4',
    maxTokens: 8192,
    inputCostPer1k: 0.03,
    outputCostPer1k: 0.06
  },
  'openai/gpt-3.5-turbo': {
    provider: 'openai',
    modelName: 'gpt-3.5-turbo',
    maxTokens: 16385,
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015
  },
  'openai/o1-preview': {
    provider: 'openai',
    modelName: 'o1-preview',
    maxTokens: 128000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06
  },
  'openai/o1-mini': {
    provider: 'openai',
    modelName: 'o1-mini',
    maxTokens: 128000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.012
  },
  
  // Anthropic Models
  'anthropic/claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
    maxTokens: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015
  },
  'anthropic/claude-3-5-haiku-20241022': {
    provider: 'anthropic',
    modelName: 'claude-3-5-haiku-20241022',
    maxTokens: 200000,
    inputCostPer1k: 0.0008,
    outputCostPer1k: 0.004
  },
  'anthropic/claude-3-opus-20240229': {
    provider: 'anthropic',
    modelName: 'claude-3-opus-20240229',
    maxTokens: 200000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075
  },
  
  // DeepSeek Models
  'deepseek/deepseek-chat': {
    provider: 'deepseek',
    modelName: 'deepseek-chat',
    maxTokens: 128000,
    inputCostPer1k: 0.00014,
    outputCostPer1k: 0.00028
  },
  'deepseek/deepseek-coder': {
    provider: 'deepseek',
    modelName: 'deepseek-coder',
    maxTokens: 128000,
    inputCostPer1k: 0.00014,
    outputCostPer1k: 0.00028
  },
  
  // Google Models
  'google/gemini-1.5-pro': {
    provider: 'google',
    modelName: 'gemini-1.5-pro',
    maxTokens: 2097152,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005
  },
  'google/gemini-1.5-flash': {
    provider: 'google',
    modelName: 'gemini-1.5-flash',
    maxTokens: 1048576,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006
  },
  'google/gemini-2.5-flash-preview-05-20': {
    provider: 'google',
    modelName: 'gemini-2.5-flash-preview-05-20',
    maxTokens: 1048576,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006
  }
};

/**
 * Real-time token tracking for streaming responses (Server-side)
 */
export class TokenTracker {
  private startTime: number = 0;
  private endTime?: number;
  private inputTokens: number = 0;
  private outputTokens: number = 0;
  private tokensPerSecondHistory: number[] = [];
  private readonly maxHistorySize = 10;
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  /**
   * Start tracking with input text
   */
  startTracking(inputText: string): void {
    this.startTime = Date.now();
    this.inputTokens = this.estimateTokens(inputText);
    this.outputTokens = 0;
    this.tokensPerSecondHistory = [];
    
    console.log(`[TokenTracker] Started tracking for ${this.model} with ${this.inputTokens} input tokens`);
  }

  /**
   * Add tokens from a streaming chunk
   */
  addTokensFromChunk(chunk: string): number {
    const chunkTokens = this.estimateTokens(chunk);
    this.outputTokens += chunkTokens;
    
    const currentTime = Date.now();
    const duration = (currentTime - this.startTime) / 1000; // Convert to seconds
    
    if (duration > 0) {
      const currentTPS = this.outputTokens / duration;
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
   * Stop tracking and return final metrics
   */
  stopTracking(): TokenMetrics {
    this.endTime = Date.now();
    const duration = this.endTime - this.startTime;
    const tokensPerSecond = this.getCurrentTPS();
    const cost = this.calculateCost(this.inputTokens, this.outputTokens);
    const contextWindow = this.calculateContextWindow();

    const metrics: TokenMetrics = {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      tokensPerSecond,
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
      estimatedCost: cost,
      contextWindow
    };

    console.log(`[TokenTracker] Completed tracking: ${metrics.totalTokens} tokens, ${tokensPerSecond.toFixed(2)} TPS, $${cost.total.toFixed(6)} cost, ${contextWindow.percentage.toFixed(1)}% context`);
    
    return metrics;
  }

  /**
   * Estimate tokens in text based on model provider
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    
    const modelInfo = this.getModelInfo(this.model);
    
    // Provider-specific estimation
    switch (modelInfo.provider) {
      case 'openai':
        return Math.ceil(text.length / 4); // ~4 chars per token
      case 'anthropic':
        return Math.ceil(text.length / 4); // ~4 chars per token  
      case 'deepseek':
        return Math.ceil(text.length / 3.5); // ~3.5 chars per token (code-optimized)
      case 'google':
        return Math.ceil(text.length / 3.8); // ~3.8 chars per token
      default:
        return Math.ceil(text.length / 4); // Default fallback
    }
  }

  /**
   * Get model information
   */
  private getModelInfo(model: string): ModelInfo {
    const modelInfo = MODEL_DATABASE[model];
    if (!modelInfo) {
      // Try to auto-detect provider based on model name
      const provider = this.detectProvider(model);
      console.log(`[TokenTracker] Model ${model} not found in database, using provider: ${provider}`);
      
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
  private detectProvider(model: string): 'openai' | 'anthropic' | 'deepseek' | 'google' | 'auto' {
    const lowerModel = model.toLowerCase();
    
    if (lowerModel.includes('gpt') || lowerModel.includes('o1') || lowerModel.includes('openai')) {
      return 'openai';
    } else if (lowerModel.includes('claude') || lowerModel.includes('anthropic')) {
      return 'anthropic';
    } else if (lowerModel.includes('deepseek')) {
      return 'deepseek';
    } else if (lowerModel.includes('gemini') || lowerModel.includes('google')) {
      return 'google';
    }
    
    return 'auto';
  }

  /**
   * Calculate cost based on token counts
   */
  private calculateCost(inputTokens: number, outputTokens: number): {
    input: number;
    output: number;
    total: number;
    currency: string;
  } {
    const modelInfo = this.getModelInfo(this.model);
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
   * Calculate context window usage
   */
  private calculateContextWindow(): {
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  } {
    const totalTokens = this.inputTokens + this.outputTokens;
    const modelInfo = this.getModelInfo(this.model);
    const maxTokens = modelInfo.maxTokens || 128000; // Default to 128k
    const percentage = Math.min((totalTokens / maxTokens) * 100, 100);

    return {
      used: totalTokens,
      total: maxTokens,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      modelId: this.model
    };
  }

  /**
   * Get current metrics without stopping tracking
   */
  getCurrentMetrics(): Partial<TokenMetrics> {
    const currentTime = Date.now();
    const duration = currentTime - this.startTime;
    const tokensPerSecond = this.getCurrentTPS();
    const cost = this.calculateCost(this.inputTokens, this.outputTokens);
    const contextWindow = this.calculateContextWindow();

    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      tokensPerSecond,
      duration,
      estimatedCost: cost,
      contextWindow
    };
  }
} 