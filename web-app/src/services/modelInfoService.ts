/**
 * modelInfoService.ts
 * 
 * Service for model information management and provider detection
 * 
 * Classes:
 *   ModelInfoService
 * 
 * Features:
 *   - Model database management using shared configuration
 *   - Provider auto-detection based on model names
 *   - Model information lookup and validation
 *   - Provider-specific model filtering
 * 
 * Usage: import { modelInfoService } from './modelInfoService'
 */

import { logger } from '../utils/logger';
import { SHARED_MODEL_CONFIG, type SharedModelConfig } from '../../../src/shared/modelConfig';
import type { TokenizerProvider, ModelInfo } from './types/api';

/**
 * Convert shared model configuration to ModelInfo format
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
 * Service for managing model information and provider detection
 */
export class ModelInfoService {
  private readonly modelDatabase: Record<string, ModelInfo>;

  constructor() {
    // Build model database from shared configuration
    this.modelDatabase = Object.fromEntries(
      Object.entries(SHARED_MODEL_CONFIG).map(([modelId, config]) => [
        modelId,
        convertSharedConfigToModelInfo(config)
      ])
    );
    
    logger.debug(`ModelInfoService initialized with ${Object.keys(this.modelDatabase).length} models`);
  }

  /**
   * Get model information from the database
   * 
   * @param model - Model identifier
   * @returns ModelInfo object with provider, pricing, and limits
   */
  getModelInfo(model: string): ModelInfo {
    const modelInfo = this.modelDatabase[model];
    if (!modelInfo) {
      // Try to auto-detect provider based on model name
      const provider = this.detectProvider(model);
      logger.warn(`Model ${model} not found in database, using detected provider: ${provider}`);
      
      return {
        provider,
        modelName: model,
        maxTokens: 128000, // Default context window
        inputCostPer1k: 0.001, // Default input cost
        outputCostPer1k: 0.002 // Default output cost
      };
    }
    return modelInfo;
  }

  /**
   * Auto-detect provider based on model name patterns
   * 
   * @param model - Model identifier
   * @returns Detected TokenizerProvider
   */
  detectProvider(model: string): TokenizerProvider {
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
   * Map model names to the format expected by gpt-tokenizer
   * 
   * @param model - Original model identifier
   * @returns Mapped model name or undefined for default
   */
  mapModelNameForTokenizer(model: string): string | undefined {
    if (model.includes('gpt-4o')) {
      return 'gpt-4o';
    }
    // Return undefined to let the tokenizer use its default
    return undefined;
  }

  /**
   * Get all supported models
   * 
   * @returns Array of supported model identifiers
   */
  getSupportedModels(): string[] {
    return Object.keys(this.modelDatabase);
  }

  /**
   * Get models filtered by provider
   * 
   * @param provider - TokenizerProvider to filter by
   * @returns Array of model identifiers for the specified provider
   */
  getModelsByProvider(provider: TokenizerProvider): string[] {
    return Object.entries(this.modelDatabase)
      .filter(([_, info]) => info.provider === provider)
      .map(([model, _]) => model);
  }

  /**
   * Check if a model is supported
   * 
   * @param model - Model identifier to check
   * @returns True if model is in the database
   */
  isModelSupported(model: string): boolean {
    return model in this.modelDatabase;
  }

  /**
   * Get provider-specific configuration
   * 
   * @param provider - TokenizerProvider
   * @returns Configuration object for the provider
   */
  getProviderConfig(provider: TokenizerProvider): {
    charactersPerToken: number;
    supportsChat: boolean;
    requiresTokenizer: boolean;
  } {
    switch (provider) {
      case 'openai':
        return {
          charactersPerToken: 4,
          supportsChat: true,
          requiresTokenizer: true
        };
      case 'anthropic':
        return {
          charactersPerToken: 4,
          supportsChat: false,
          requiresTokenizer: false
        };
      case 'deepseek':
        return {
          charactersPerToken: 3.5,
          supportsChat: false,
          requiresTokenizer: false
        };
      case 'google':
        return {
          charactersPerToken: 3.8,
          supportsChat: false,
          requiresTokenizer: false
        };
      default:
        return {
          charactersPerToken: 4,
          supportsChat: false,
          requiresTokenizer: false
        };
    }
  }
}

// Singleton instance
export const modelInfoService = new ModelInfoService(); 