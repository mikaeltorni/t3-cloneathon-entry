/**
 * modelConfig.ts
 * 
 * Shared model configuration for both tokenizer and OpenRouter services
 * 
 * Types:
 *   SharedModelConfig - Complete model configuration
 *   ModelId - Available model identifiers
 * 
 * Constants:
 *   SHARED_MODEL_CONFIG - Complete model database
 * 
 * Usage: import { SHARED_MODEL_CONFIG, type ModelId } from './modelConfig'
 */

export interface SharedModelConfig {
  // Display information
  name: string;
  description: string;
  released: string;
  
  // Capabilities
  hasReasoning: boolean;
  reasoningType?: 'effort' | 'internal';
  reasoningMode: 'forced' | 'optional' | 'none';
  supportsEffortControl: boolean;
  
  // Web search capabilities
  webSearchMode: 'forced' | 'optional' | 'none';
  webSearchPricing?: 'standard' | 'perplexity' | 'openai';
  supportsWebEffortControl: boolean;
  
  // UI styling
  color: string;
  bgColor: string;
  textColor: string;
  
  // Technical specifications
  contextLength: number;
  maxOutputTokens?: number;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'perplexity' | 'meta' | 'cohere' | 'mistralai' | 'xai' | 'reka' | 'alibaba' | 'snowflake';
  
  // Tokenization (for tokenizerService)
  encoding?: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  
  // Vision capability
  hasVision: boolean;
}

/**
 * Complete model configuration based on latest OpenRouter models
 * Updated January 2025 with newest releases
 *
 * All reasoning toggles and modes are consistent:
 * - If hasReasoning: true, then reasoningMode is not 'none', reasoningType is 'effort', supportsEffortControl is true
 * - If hasReasoning: false, then reasoningMode is 'none', reasoningType is 'internal', supportsEffortControl is false
 * - Forced reasoning models use reasoningMode: 'forced' with reasoningType: 'effort'
 * - Optional reasoning models use reasoningMode: 'optional' with reasoningType: 'effort'
 */
export const SHARED_MODEL_CONFIG = {
  'x-ai/grok-3-mini-beta': {
    name: 'Grok 3 Mini Beta',
    description: 'xAI’s lightweight model for math, puzzles, and reasoning-heavy tasks. "Thinks" before responding. Transparent traces; defaults to low reasoning, can boost with effort.',
    released: '2025-04-09',
    hasReasoning: true,
    reasoningType: 'effort',
    reasoningMode: 'forced',
    supportsEffortControl: true,
    webSearchMode: 'optional',
    supportsWebEffortControl: false,
    color: '#495057',
    bgColor: '#F8F9FA',
    textColor: '#212529',
    contextLength: 131072,
    provider: 'xai',
    inputCostPer1k: 0.0003, 
    outputCostPer1k: 0.0005,
    hasVision: false
  },

  'x-ai/grok-3-beta': {
    name: 'Grok 3 Beta',
    description: 'xAI’s flagship model for coding, data extraction, summarization, and deep domain knowledge. Excels at enterprise and structured tasks.',
    released: '2025-04-09',
    hasReasoning: true,
    reasoningType: 'effort',
    reasoningMode: 'forced',
    supportsEffortControl: true,
    webSearchMode: 'optional',
    supportsWebEffortControl: false,
    color: '#495057',
    bgColor: '#F8F9FA',
    textColor: '#212529',
    contextLength: 131072,
    provider: 'xai',
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    hasVision: false
  },

  // === OpenAI Models ===
  'openai/gpt-4o': {
    name: 'GPT-4o',
    description: 'OpenAI’s flagship multimodal model with strong reasoning and vision. Excels at general tasks and supports large context windows.',
    released: '2024-05-13',
    hasReasoning: false,
    reasoningType: 'internal' as const,
    reasoningMode: 'none' as const,
    supportsEffortControl: false,
    webSearchMode: 'optional' as const,
    webSearchPricing: 'openai' as const,
    supportsWebEffortControl: true,
    color: '#10A37F',
    bgColor: '#F0FDF4',
    textColor: '#065F46',
    contextLength: 128000,
    maxOutputTokens: 4096,
    provider: 'openai' as const,
    encoding: 'o200k_base',
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    hasVision: true
  },
  
  // 'openai/gpt-4.5': {
  //   name: 'GPT-4.5 "Orion"',
  //   description: 'Next-generation OpenAI model with enhanced capabilities and larger output window',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'optional' as const,
  //   webSearchPricing: 'openai' as const,
  //   supportsWebEffortControl: true,
  //   color: '#10A37F',
  //   bgColor: '#F0FDF4',
  //   textColor: '#065F46',
  //   contextLength: 128000,
  //   maxOutputTokens: 32768,
  //   provider: 'openai' as const,
  //   encoding: 'o200k_base',
  //   inputCostPer1k: 0.005,
  //   outputCostPer1k: 0.02,
  //   hasVision: true
  // },
  
  // REQUIRES OPENAI API KEY TO BE SET UP IN THE OPENROUTER
  // 'openai/o3': {
  //   name: 'OpenAI o3',
  //   description: 'Advanced reasoning model with deep research capabilities',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: true,
  //   reasoningType: 'effort' as const,
  //   reasoningMode: 'forced' as const,
  //   supportsEffortControl: true,
  //   webSearchMode: 'optional' as const,
  //   webSearchPricing: 'openai' as const,
  //   supportsWebEffortControl: true,
  //   color: '#FF6B35',
  //   bgColor: '#FFF7ED',
  //   textColor: '#C2410C',
  //   contextLength: 128000,
  //   provider: 'openai' as const,
  //   encoding: 'o200k_base',
  //   inputCostPer1k: 0.02,
  //   outputCostPer1k: 0.08,
  //   hasVision: true
  // },

  'openai/o4-mini-2025-04-16': {
    name: 'OpenAI o4 Mini',
    description: 'Compact o-series model optimized for speed and cost. Delivers strong reasoning, coding, and vision for high-throughput scenarios.',
    released: '2025-04-16',
    hasReasoning: true,
    reasoningType: 'effort' as const,
    reasoningMode: 'forced' as const,
    supportsEffortControl: true,
    webSearchMode: 'optional' as const,
    webSearchPricing: 'openai' as const,
    supportsWebEffortControl: true,
    color: '#10A37F',
    bgColor: '#F0FDF4',
    textColor: '#065F46',
    contextLength: 200000,
    provider: 'openai' as const,
    encoding: 'o200k_base',
    inputCostPer1k: 1.10,
    outputCostPer1k: 4.40,
    hasVision: true,
    inputImageCostPer1k: 0.842
  },

  // === Anthropic Models ===
  'anthropic/claude-4-sonnet-20250522': {
    name: 'Claude 4 Sonnet',
    description: 'Anthropic’s Claude Sonnet 4 excels at coding and reasoning with high efficiency. Great for both everyday and complex software tasks.',
    released: '2025-05-22',
    hasReasoning: true,
    reasoningType: 'effort' as const,
    reasoningMode: 'optional' as const,
    supportsEffortControl: true,
    webSearchMode: 'optional' as const,
    webSearchPricing: 'standard' as const,
    supportsWebEffortControl: true,
    color: '#FF9800',
    bgColor: '#FFF3E0',
    textColor: '#E65100',
    contextLength: 200000,
    provider: 'anthropic' as const,
    inputCostPer1k: 0.000375,
    outputCostPer1k: 0.0015,
    hasVision: true
  },

  // === Google Models ===
  'google/gemini-2.5-pro-preview-06-05': {
    name: 'Gemini 2.5 Pro',
    description: 'Google’s top AI for advanced reasoning, coding, and science. Excels at complex problem-solving and nuanced context handling.',
    released: '2025-06-05',
    hasReasoning: true,
    reasoningType: 'effort' as const,
    reasoningMode: 'forced' as const,
    supportsEffortControl: true,
    webSearchMode: 'optional' as const,
    webSearchPricing: 'standard' as const,
    supportsWebEffortControl: true,
    color: '#4285F4',
    bgColor: '#E8F0FE',
    textColor: '#1A73E8',
    contextLength: 1048576,
    provider: 'google' as const,
    inputCostPer1k: 0.00175,
    outputCostPer1k: 0.007,
    hasVision: true
  },
  
  'google/gemini-2.5-flash-preview-05-20': {
    name: 'Gemini 2.5 Flash',
    description: 'Google’s fast, efficient model for reasoning, coding, and math. Delivers accurate results with low latency and large context.',
    released: '2025-05-20',
    hasReasoning: true,
    reasoningType: 'effort' as const,
    reasoningMode: 'optional' as const,
    supportsEffortControl: true,
    webSearchMode: 'optional' as const,
    webSearchPricing: 'standard' as const,
    supportsWebEffortControl: true,
    color: '#4285F4',
    bgColor: '#E8F0FE',
    textColor: '#1A73E8',
    contextLength: 1048576,
    provider: 'google' as const,
    inputCostPer1k: 0.000375,
    outputCostPer1k: 0.0015,
    hasVision: true
  },

  // // === Meta Models ===
  // 'meta/llama-4-maverick': {
  //   name: 'Llama 4 Maverick',
  //   description: 'Meta\'s flagship open-source model with massive context window',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'none' as const,
  //   supportsWebEffortControl: false,
  //   color: '#1877F2',
  //   bgColor: '#EBF3FF',
  //   textColor: '#1565C0',
  //   contextLength: 1000000,
  //   provider: 'meta' as const,
  //   inputCostPer1k: 0.0005,
  //   outputCostPer1k: 0.0015,
  //   hasVision: true
  // },

  // 'meta/llama-4-scout': {
  //   name: 'Llama 4 Scout',
  //   description: 'Ultra-large context Meta model with 10M token window',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'none' as const,
  //   supportsWebEffortControl: false,
  //   color: '#1877F2',
  //   bgColor: '#EBF3FF',
  //   textColor: '#1565C0',
  //   contextLength: 10000000,
  //   provider: 'meta' as const,
  //   inputCostPer1k: 0.001,
  //   outputCostPer1k: 0.003,
  //   hasVision: true
  // },

  'deepseek/deepseek-r1-0528': {
    name: 'DeepSeek R1 0528',
    description: 'Open-source model with strong reasoning and performance, comparable to OpenAI o1. Updated May 2025.',
    released: '2025-05-28',
    hasReasoning: true,
    reasoningType: 'effort' as const,
    reasoningMode: 'forced' as const,
    supportsEffortControl: true,
    webSearchMode: 'optional' as const,
    webSearchPricing: 'standard' as const,
    supportsWebEffortControl: true,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    contextLength: 128000,
    provider: 'deepseek' as const,
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.00215,
    hasVision: false,
  },

  // === Perplexity Models ===
  'perplexity/sonar-reasoning': {
    name: 'Sonar Reasoning',
    description: 'Perplexity’s reasoning model with built-in web search. Based on DeepSeek R1.',
    released: '2025-01-29',
    hasReasoning: true,
    reasoningType: 'effort' as const,
    reasoningMode: 'forced' as const,
    supportsEffortControl: true,
    webSearchMode: 'forced' as const, // Always searches web
    webSearchPricing: 'perplexity' as const,
    supportsWebEffortControl: true,
    color: '#20B2AA',
    bgColor: '#F0FDFA',
    textColor: '#0D9488',
    contextLength: 127000,
    provider: 'deepseek' as const,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.005,
    hasVision: false
  },

  'perplexity/sonar-pro': {
    name: 'Sonar Pro',
    description: 'Advanced web-first model with professional search. Designed for fast, accurate information retrieval.',
    released: '2025-03-07',
    hasReasoning: false,
    reasoningType: 'internal' as const,
    reasoningMode: 'none' as const,
    supportsEffortControl: false,
    webSearchMode: 'forced' as const, // Always searches web
    webSearchPricing: 'perplexity' as const,
    supportsWebEffortControl: true,
    color: '#20B2AA',
    bgColor: '#F0FDFA',
    textColor: '#0D9488',
    contextLength: 200000,
    provider: 'deepseek' as const,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    hasVision: false
  },

  'perplexity/sonar': {
    name: 'Sonar',
    description: 'Lightweight, fast web search model optimized for speed and efficiency.',
    released: '2025-01-27',
    hasReasoning: false,
    reasoningType: 'internal' as const,
    reasoningMode: 'none' as const,
    supportsEffortControl: false,
    webSearchMode: 'forced' as const, // Always searches web
    webSearchPricing: 'perplexity' as const,
    supportsWebEffortControl: true,
    color: '#20B2AA',
    bgColor: '#F0FDFA',
    textColor: '#0D9488',
    contextLength: 127000,
    provider: 'deepseek' as const,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.001,
    hasVision: false
  }

  // // === Other Models ===
  // 'cohere/command-a': {
  //   name: 'Command A',
  //   description: 'Cohere\'s RAG-focused model with advanced retrieval capabilities',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'optional' as const,
  //   webSearchPricing: 'standard' as const,
  //   supportsWebEffortControl: true,
  //   color: '#39C6B4',
  //   bgColor: '#F0FDFA',
  //   textColor: '#0D9488',
  //   contextLength: 256000,
  //   maxOutputTokens: 8000,
  //   provider: 'cohere' as const,
  //   inputCostPer1k: 0.002,
  //   outputCostPer1k: 0.008,
  //   hasVision: false
  // },

  // 'mistralai/mistral-large-2': {
  //   name: 'Mistral Large 2',
  //   description: 'Next-generation Mistral model with multimodal capabilities via Pixtral',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'optional' as const,
  //   webSearchPricing: 'standard' as const,
  //   supportsWebEffortControl: true,
  //   color: '#FF7000',
  //   bgColor: '#FFF7ED',
  //   textColor: '#C2410C',
  //   contextLength: 128000,
  //   provider: 'mistralai' as const,
  //   inputCostPer1k: 0.003,
  //   outputCostPer1k: 0.012,
  //   hasVision: true
  // },

  // 'xai/grok-2': {
  //   name: 'Grok-2',
  //   description: 'xAI\'s flagship model with real-time capabilities and humor',
  //   released: '2025-01-01', // Anticipated
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'optional' as const,
  //   webSearchPricing: 'standard' as const,
  //   supportsWebEffortControl: true,
  //   color: '#000000',
  //   bgColor: '#F8F9FA',
  //   textColor: '#212529',
  //   contextLength: 128000,
  //   provider: 'xai' as const,
  //   inputCostPer1k: 0.005,
  //   outputCostPer1k: 0.02,
  //   hasVision: true
  // },

  // 'reka/reka-core': {
  //   name: 'Reka Core',
  //   description: 'Advanced multimodal model with strong vision and reasoning capabilities',
  //   released: '2024-10-15',
  //   hasReasoning: false,
  //   reasoningType: 'internal' as const,
  //   reasoningMode: 'none' as const,
  //   supportsEffortControl: false,
  //   webSearchMode: 'optional' as const,
  //   webSearchPricing: 'standard' as const,
  //   supportsWebEffortControl: true,
  //   color: '#6366F1',
  //   bgColor: '#EEF2FF',
  //   textColor: '#4338CA',
  //   contextLength: 128000,
  //   maxOutputTokens: 8192,
  //   provider: 'reka' as const,
  //   inputCostPer1k: 0.0025,
  //   outputCostPer1k: 0.01,
  //   hasVision: true
  // }
} as const;

export type ModelId = keyof typeof SHARED_MODEL_CONFIG;

// Default model
export const DEFAULT_MODEL: ModelId = 'google/gemini-2.5-flash-preview-05-20';

/**
 * Get available models by provider
 */
export function getModelsByProvider(provider: SharedModelConfig['provider']): ModelId[] {
  return Object.entries(SHARED_MODEL_CONFIG)
    .filter(([_, config]) => config.provider === provider)
    .map(([modelId]) => modelId as ModelId);
}

/**
 * Get models with specific capabilities
 */
export function getModelsByCapability(capability: keyof Pick<SharedModelConfig, 'hasReasoning' | 'hasVision'>): ModelId[] {
  return Object.entries(SHARED_MODEL_CONFIG)
    .filter(([_, config]) => config[capability])
    .map(([modelId]) => modelId as ModelId);
}

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: string): SharedModelConfig | undefined {
  return SHARED_MODEL_CONFIG[modelId as ModelId];
} 