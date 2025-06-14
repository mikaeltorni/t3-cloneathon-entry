/**
 * contextWindowService.ts
 * 
 * Service for context window management and usage calculations
 * 
 * Classes:
 *   ContextWindowService
 * 
 * Features:
 *   - Context window usage calculation
 *   - Token limit validation
 *   - Conversation context analysis
 *   - Usage percentage and warnings
 * 
 * Usage: import { contextWindowService } from './contextWindowService'
 */

import { logger } from '../utils/logger';
import type { ModelInfo } from './types/api';
import type { ContextWindowUsage } from './types/tokenizer';

/**
 * Service for managing context window usage and limits
 */
export class ContextWindowService {
  constructor() {
    logger.debug('ContextWindowService initialized');
  }

  /**
   * Calculate context window usage for a specific model
   * 
   * @param usedTokens - Number of tokens currently used
   * @param modelInfo - Model information with context limits
   * @returns Context window usage information
   */
  calculateUsage(usedTokens: number, modelInfo: ModelInfo): ContextWindowUsage {
    const maxTokens = modelInfo.maxTokens || 128000; // Default to 128k if not specified
    const percentage = Math.min((usedTokens / maxTokens) * 100, 100);

    const result: ContextWindowUsage = {
      used: usedTokens,
      total: maxTokens,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      modelId: modelInfo.modelName
    };

    logger.debug(`Context usage for ${modelInfo.modelName}: ${result.percentage}% (${usedTokens}/${maxTokens})`);
    return result;
  }

  /**
   * Calculate context window usage by model ID
   * 
   * @param usedTokens - Number of tokens currently used
   * @param modelId - Model identifier
   * @param modelInfo - Model information (optional, for efficiency)
   * @returns Context window usage information
   */
  calculateUsageById(usedTokens: number, modelId: string, modelInfo?: ModelInfo): ContextWindowUsage {
    // If modelInfo not provided, create a basic one
    const info = modelInfo || {
      provider: 'auto' as const,
      modelName: modelId,
      maxTokens: 128000
    };

    return {
      used: usedTokens,
      total: info.maxTokens || 128000,
      percentage: Math.round(((usedTokens / (info.maxTokens || 128000)) * 100) * 100) / 100,
      modelId
    };
  }

  /**
   * Check if token count is within the model's limit
   * 
   * @param tokenCount - Number of tokens to check
   * @param modelInfo - Model information with limits
   * @param customLimit - Optional custom limit (overrides model limit)
   * @returns True if within limit
   */
  isWithinLimit(tokenCount: number, modelInfo: ModelInfo, customLimit?: number): boolean {
    const limit = customLimit || modelInfo.maxTokens || 128000;
    const withinLimit = tokenCount <= limit;
    
    if (!withinLimit) {
      logger.warn(`Token count ${tokenCount} exceeds limit ${limit} for model ${modelInfo.modelName}`);
    }
    
    return withinLimit;
  }

  /**
   * Get remaining tokens available in context window
   * 
   * @param usedTokens - Number of tokens currently used
   * @param modelInfo - Model information with limits
   * @returns Number of remaining tokens
   */
  getRemainingTokens(usedTokens: number, modelInfo: ModelInfo): number {
    const maxTokens = modelInfo.maxTokens || 128000;
    return Math.max(0, maxTokens - usedTokens);
  }

  /**
   * Check if context window usage is approaching limit
   * 
   * @param usage - Context window usage information
   * @param warningThreshold - Percentage threshold for warning (default: 80%)
   * @returns True if approaching limit
   */
  isApproachingLimit(usage: ContextWindowUsage, warningThreshold: number = 80): boolean {
    return usage.percentage >= warningThreshold;
  }

  /**
   * Get usage status with color coding
   * 
   * @param usage - Context window usage information
   * @returns Status object with level and color
   */
  getUsageStatus(usage: ContextWindowUsage): {
    level: 'safe' | 'warning' | 'critical';
    color: 'green' | 'yellow' | 'red';
    message: string;
  } {
    if (usage.percentage < 60) {
      return {
        level: 'safe',
        color: 'green',
        message: 'Context usage is within safe limits'
      };
    } else if (usage.percentage < 85) {
      return {
        level: 'warning',
        color: 'yellow',
        message: 'Context usage is approaching limit'
      };
    } else {
      return {
        level: 'critical',
        color: 'red',
        message: 'Context usage is near maximum capacity'
      };
    }
  }

  /**
   * Estimate tokens needed for response
   * 
   * @param modelInfo - Model information
   * @param responseLength - Estimated response length ('short' | 'medium' | 'long')
   * @returns Estimated token count for response
   */
  estimateResponseTokens(modelInfo: ModelInfo, responseLength: 'short' | 'medium' | 'long' = 'medium'): number {
    const baseEstimates = {
      short: 100,
      medium: 500,
      long: 1500
    };

    // Adjust based on provider characteristics
    const multiplier = modelInfo.provider === 'anthropic' ? 1.2 : 1.0;
    return Math.round(baseEstimates[responseLength] * multiplier);
  }

  /**
   * Check if there's enough space for a response
   * 
   * @param currentUsage - Current context window usage
   * @param responseLength - Expected response length
   * @returns True if there's enough space
   */
  canFitResponse(
    currentUsage: ContextWindowUsage, 
    responseLength: 'short' | 'medium' | 'long' = 'medium'
  ): boolean {
    const estimatedResponseTokens = this.estimateResponseTokens(
      { provider: 'auto' as const, modelName: currentUsage.modelId },
      responseLength
    );
    
    const remainingTokens = currentUsage.total - currentUsage.used;
    return remainingTokens >= estimatedResponseTokens;
  }

  /**
   * Calculate optimal context window allocation
   * 
   * @param modelInfo - Model information
   * @param systemPromptTokens - Tokens used by system prompt
   * @param reserveForResponse - Tokens to reserve for response
   * @returns Available tokens for conversation history
   */
  calculateOptimalAllocation(
    modelInfo: ModelInfo,
    systemPromptTokens: number = 0,
    reserveForResponse: number = 1000
  ): {
    total: number;
    systemPrompt: number;
    conversation: number;
    response: number;
  } {
    const total = modelInfo.maxTokens || 128000;
    const conversation = Math.max(0, total - systemPromptTokens - reserveForResponse);

    return {
      total,
      systemPrompt: systemPromptTokens,
      conversation,
      response: reserveForResponse
    };
  }
}

// Singleton instance
export const contextWindowService = new ContextWindowService(); 