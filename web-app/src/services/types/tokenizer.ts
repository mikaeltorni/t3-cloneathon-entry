/**
 * tokenizer.ts
 * 
 * Type definitions for tokenizer services
 * 
 * Types:
 *   GPTTokenizerModule, TokenTrackingMetrics, ContextWindowUsage, CostBreakdown
 * 
 * Usage: import { GPTTokenizerModule } from './types/tokenizer'
 */

/**
 * GPT Tokenizer module interface - matches actual gpt-tokenizer library
 */
export type GPTTokenizerModule = {
  encode: (lineToEncode: string, encodeOptions?: any) => number[];
  decode: (tokens: number[]) => string;
  encodeChat: (messages: any[], model?: string) => number[];
  isWithinTokenLimit: (text: string | any[], limit: number) => boolean | number;
  estimateCost: (tokenCount: number, modelSpec?: any) => any;
};

/**
 * Token tracking metrics for real-time monitoring
 */
export interface TokenTrackingMetrics {
  totalTokens: number;
  tokensPerSecond: number;
  elapsedTime: number;
  averageTPS: number;
}

/**
 * Context window usage information
 */
export interface ContextWindowUsage {
  used: number;
  total: number;
  percentage: number;
  modelId: string;
}

/**
 * Cost breakdown for token usage
 */
export interface CostBreakdown {
  input: number;
  output: number;
  total: number;
  currency: string;
}

/**
 * Tokenizer provider configuration
 */
export interface TokenizerProviderConfig {
  charactersPerToken: number;
  supportsChat: boolean;
  requiresTokenizer: boolean;
} 