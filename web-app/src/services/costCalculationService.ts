/**
 * costCalculationService.ts
 * 
 * Service for token-based cost calculations
 * 
 * Classes:
 *   CostCalculationService
 * 
 * Features:
 *   - Input/output token cost calculation
 *   - Multi-currency support (USD default)
 *   - Cost breakdown and total calculation
 *   - Model-specific pricing integration
 * 
 * Usage: import { costCalculationService } from './costCalculationService'
 */

import { logger } from '../utils/logger';
import type { ModelInfo } from './types/api';
import type { CostBreakdown } from './types/tokenizer';
import type { TokenMetrics } from '../../../src/shared/types';

/**
 * Service for calculating token-based costs
 */
export class CostCalculationService {
  constructor() {
    logger.debug('CostCalculationService initialized');
  }

  /**
   * Calculate cost breakdown based on token counts and model pricing
   * 
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param modelInfo - Model information with pricing
   * @returns Cost breakdown object
   */
  calculateCost(inputTokens: number, outputTokens: number, modelInfo: ModelInfo): CostBreakdown {
    const inputCost = (inputTokens / 1000) * (modelInfo.inputCostPer1k || 0);
    const outputCost = (outputTokens / 1000) * (modelInfo.outputCostPer1k || 0);
    
    const result: CostBreakdown = {
      input: Math.round(inputCost * 10000) / 10000, // Round to 4 decimal places
      output: Math.round(outputCost * 10000) / 10000,
      total: Math.round((inputCost + outputCost) * 10000) / 10000,
      currency: 'USD'
    };

    logger.debug(`Cost calculation: ${inputTokens} input + ${outputTokens} output = $${result.total}`);
    return result;
  }

  /**
   * Calculate cost for input tokens only
   * 
   * @param inputTokens - Number of input tokens
   * @param modelInfo - Model information with pricing
   * @returns Input cost in USD
   */
  calculateInputCost(inputTokens: number, modelInfo: ModelInfo): number {
    const cost = (inputTokens / 1000) * (modelInfo.inputCostPer1k || 0);
    return Math.round(cost * 10000) / 10000;
  }

  /**
   * Calculate cost for output tokens only
   * 
   * @param outputTokens - Number of output tokens
   * @param modelInfo - Model information with pricing
   * @returns Output cost in USD
   */
  calculateOutputCost(outputTokens: number, modelInfo: ModelInfo): number {
    const cost = (outputTokens / 1000) * (modelInfo.outputCostPer1k || 0);
    return Math.round(cost * 10000) / 10000;
  }

  /**
   * Estimate cost for a given token count (assuming all input tokens)
   * 
   * @param tokenCount - Total number of tokens
   * @param modelInfo - Model information with pricing
   * @returns Estimated cost in USD
   */
  estimateCost(tokenCount: number, modelInfo: ModelInfo): number {
    return this.calculateInputCost(tokenCount, modelInfo);
  }

  /**
   * Create enhanced token metrics with cost information
   * 
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param startTime - Start timestamp
   * @param endTime - End timestamp (optional)
   * @param modelInfo - Model information for cost calculation
   * @returns TokenMetrics with cost information
   */
  createTokenMetricsWithCost(
    inputTokens: number,
    outputTokens: number = 0,
    startTime: number,
    endTime?: number,
    modelInfo?: ModelInfo
  ): TokenMetrics {
    const duration = endTime ? endTime - startTime : Date.now() - startTime;
    const tokensPerSecond = outputTokens > 0 ? (outputTokens / (duration / 1000)) : 0;
    
    const estimatedCost = modelInfo ? this.calculateCost(inputTokens, outputTokens, modelInfo) : undefined;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      tokensPerSecond,
      startTime,
      endTime,
      duration,
      estimatedCost
    };
  }

  /**
   * Format cost for display
   * 
   * @param cost - Cost amount
   * @param currency - Currency code (default: USD)
   * @returns Formatted cost string
   */
  formatCost(cost: number, currency: string = 'USD'): string {
    if (cost < 0.0001) {
      return `<$0.0001 ${currency}`;
    }
    
    return `$${cost.toFixed(4)} ${currency}`;
  }

  /**
   * Calculate cost per token for a model
   * 
   * @param modelInfo - Model information with pricing
   * @param tokenType - 'input' or 'output'
   * @returns Cost per individual token
   */
  getCostPerToken(modelInfo: ModelInfo, tokenType: 'input' | 'output'): number {
    const costPer1k = tokenType === 'input' ? modelInfo.inputCostPer1k : modelInfo.outputCostPer1k;
    return (costPer1k || 0) / 1000;
  }

  /**
   * Compare costs between different models
   * 
   * @param tokenCount - Number of tokens to compare
   * @param models - Array of model information objects
   * @param tokenType - 'input' or 'output'
   * @returns Array of models sorted by cost (lowest first)
   */
  compareModelCosts(
    tokenCount: number,
    models: ModelInfo[],
    tokenType: 'input' | 'output' = 'input'
  ): Array<ModelInfo & { cost: number }> {
    return models
      .map(model => ({
        ...model,
        cost: tokenType === 'input' 
          ? this.calculateInputCost(tokenCount, model)
          : this.calculateOutputCost(tokenCount, model)
      }))
      .sort((a, b) => a.cost - b.cost);
  }
}

// Singleton instance
export const costCalculationService = new CostCalculationService(); 