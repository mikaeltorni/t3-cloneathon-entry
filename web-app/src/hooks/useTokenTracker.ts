/**
 * useTokenTracker.ts
 * 
 * Custom hook for tracking tokens per second during message generation
 * 
 * Hook:
 *   useTokenTracker - Real-time token tracking with TPS calculation
 * 
 * Features:
 *   - Real-time token counting during streaming
 *   - Smoothed tokens-per-second calculation
 *   - Cost estimation integration
 *   - Performance metrics collection
 *   - Multiple model support
 * 
 * Usage: 
 *   const { tokenMetrics, updateTokens, reset } = useTokenTracker('gpt-4o');
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';
import { tokenizerService } from '../services/tokenizerService';
import { TokenTracker } from '../services/tokenizer';
import type { TokenMetrics } from '../../../src/shared/types';
import type { CostBreakdown } from '../services/types/tokenizer';

/**
 * Token tracking state interface
 */
interface TokenTrackingState {
  isTracking: boolean;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  startTime: number;
  endTime?: number;
  duration: number;
  estimatedCost?: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
}

/**
 * Hook options interface
 */
interface UseTokenTrackerOptions {
  model: string;
  autoStart?: boolean;
  updateInterval?: number;
  onComplete?: (metrics: TokenMetrics) => void;
  onUpdate?: (metrics: Partial<TokenMetrics>) => void;
}

/**
 * Hook return interface
 */
interface UseTokenTrackerReturn {
  tokenMetrics: TokenTrackingState;
  isTracking: boolean;
  startTracking: (inputText?: string) => Promise<void>;
  updateTokens: (chunk: string) => void;
  addOutputTokens: (count: number) => void;
  stopTracking: () => TokenMetrics;
  reset: () => void;
  getCurrentTPS: () => number;
  getFormattedMetrics: () => {
    tps: string;
    totalTokens: string;
    cost: string;
    duration: string;
  };
}

/**
 * Custom hook for tracking tokens per second during message generation
 */
export function useTokenTracker(
  defaultModel: string,
  options: Partial<UseTokenTrackerOptions> = {}
): UseTokenTrackerReturn {
  const {
    autoStart = false,
    updateInterval = 100,
    onComplete,
    onUpdate
  } = options;

  const [model] = useState(defaultModel); // setModel available for future use
  const tokenTrackerRef = useRef<TokenTracker | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [tokenMetrics, setTokenMetrics] = useState<TokenTrackingState>({
    isTracking: false,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    tokensPerSecond: 0,
    startTime: 0,
    duration: 0,
    estimatedCost: undefined
  });

  /**
   * Update the model and reset tracking (currently unused but available for future use)
   */
  // const updateModel = useCallback((newModel: string) => {
  //   if (newModel !== model) {
  //     setModel(newModel);
  //     reset();
  //   }
  // }, [model]);

  /**
   * Calculate cost for current token usage
   */
  const calculateCost = useCallback((inputTokens: number, outputTokens: number): CostBreakdown | null => {
    try {
      return tokenizerService.calculateCost(inputTokens, outputTokens, model);
    } catch (error) {
      logger.warn('Failed to calculate cost', error as Error);
      return null;
    }
  }, [model]);

  /**
   * Update metrics state with current values
   */
  const updateMetricsState = useCallback(() => {
    if (!tokenTrackerRef.current) return;

    const tracker = tokenTrackerRef.current;
    const currentTime = Date.now();
    const duration = currentTime - tokenMetrics.startTime;
    const cost = calculateCost(tokenMetrics.inputTokens, tracker.getTotalTokens());

    const updatedMetrics: TokenTrackingState = {
      ...tokenMetrics,
      outputTokens: tracker.getTotalTokens(),
      totalTokens: tokenMetrics.inputTokens + tracker.getTotalTokens(),
      tokensPerSecond: tracker.getCurrentTPS(),
      duration,
      estimatedCost: cost ? {
        input: cost.input,
        output: cost.output,
        total: cost.total,
        currency: cost.currency
      } : undefined
    };

    setTokenMetrics(updatedMetrics);

    // Call update callback if provided
    onUpdate?.({
      outputTokens: updatedMetrics.outputTokens,
      totalTokens: updatedMetrics.totalTokens,
      tokensPerSecond: updatedMetrics.tokensPerSecond,
      duration: updatedMetrics.duration,
      estimatedCost: updatedMetrics.estimatedCost
    });
  }, [tokenMetrics, calculateCost, onUpdate]);

  /**
   * Start tracking token generation
   */
  const startTracking = useCallback(async (inputText?: string) => {
    logger.debug(`Starting token tracking for model: ${model}`);

    // Calculate input tokens if text provided
    let inputTokens = 0;
    if (inputText) {
      try {
        inputTokens = await tokenizerService.countTokens(inputText, model);
      } catch (error) {
        logger.warn('Failed to count input tokens, using estimation', error as Error);
        inputTokens = tokenizerService.estimateTokensInChunkSync(inputText, model);
      }
    }

    // Initialize token tracker
    tokenTrackerRef.current = new TokenTracker();
    
    const startTime = Date.now();
    const cost = calculateCost(inputTokens, 0);

    setTokenMetrics({
      isTracking: true,
      inputTokens,
      outputTokens: 0,
      totalTokens: inputTokens,
      tokensPerSecond: 0,
      startTime,
      duration: 0,
      estimatedCost: cost ? {
        input: cost.input,
        output: cost.output,
        total: cost.total,
        currency: cost.currency
      } : undefined
    });

    // Start update interval
    intervalRef.current = setInterval(updateMetricsState, updateInterval);

    logger.debug(`Token tracking started with ${inputTokens} input tokens`);
  }, [model, calculateCost, updateMetricsState, updateInterval]);

  /**
   * Update tokens based on streaming chunk
   */
  const updateTokens = useCallback((chunk: string) => {
    if (!tokenTrackerRef.current || !tokenMetrics.isTracking) return;

    const estimatedTokens = tokenizerService.estimateTokensInChunkSync(chunk, model);
    tokenTrackerRef.current.addTokens(estimatedTokens);

    logger.debug(`Added ${estimatedTokens} tokens from chunk: "${chunk.substring(0, 50)}..."`);
  }, [model, tokenMetrics.isTracking]);

  /**
   * Add specific number of output tokens
   */
  const addOutputTokens = useCallback((count: number) => {
    if (!tokenTrackerRef.current || !tokenMetrics.isTracking) return;

    tokenTrackerRef.current.addTokens(count);
    logger.debug(`Added ${count} output tokens`);
  }, [tokenMetrics.isTracking]);

  /**
   * Stop tracking and return final metrics
   */
  const stopTracking = useCallback((): TokenMetrics => {
    if (!tokenTrackerRef.current) {
      logger.warn('Attempted to stop tracking but no tracker exists');
      return {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        tokensPerSecond: 0,
        startTime: Date.now()
      };
    }

    const tracker = tokenTrackerRef.current;
    const endTime = Date.now();
    const duration = endTime - tokenMetrics.startTime;
    const outputTokens = tracker.getTotalTokens();
    const totalTokens = tokenMetrics.inputTokens + outputTokens;
    const tokensPerSecond = tracker.getCurrentTPS();
    const cost = calculateCost(tokenMetrics.inputTokens, outputTokens);

    const finalMetrics: TokenMetrics = {
      inputTokens: tokenMetrics.inputTokens,
      outputTokens,
      totalTokens,
      tokensPerSecond,
      startTime: tokenMetrics.startTime,
      endTime,
      duration,
      estimatedCost: cost ? {
        input: cost.input,
        output: cost.output,
        total: cost.total,
        currency: cost.currency
      } : undefined
    };

    // Update state
    setTokenMetrics(prev => ({
      ...prev,
      isTracking: false,
      outputTokens,
      totalTokens,
      tokensPerSecond,
      endTime,
      duration,
      estimatedCost: cost ? {
        input: cost.input,
        output: cost.output,
        total: cost.total,
        currency: cost.currency
      } : undefined
    }));

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Call completion callback
    onComplete?.(finalMetrics);

    logger.info(`Token tracking completed:`, {
      inputTokens: finalMetrics.inputTokens,
      outputTokens: finalMetrics.outputTokens,
      totalTokens: finalMetrics.totalTokens,
      tokensPerSecond: finalMetrics.tokensPerSecond,
      duration: finalMetrics.duration,
      cost: finalMetrics.estimatedCost?.total
    });

    return finalMetrics;
  }, [tokenMetrics, calculateCost, onComplete]);

  /**
   * Reset tracking state
   */
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    tokenTrackerRef.current = null;
    
    setTokenMetrics({
      isTracking: false,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      tokensPerSecond: 0,
      startTime: 0,
      duration: 0,
      estimatedCost: undefined
    });

    logger.debug('Token tracking reset');
  }, []);

  /**
   * Get current tokens per second
   */
  const getCurrentTPS = useCallback((): number => {
    return tokenTrackerRef.current?.getCurrentTPS() || 0;
  }, []);

  /**
   * Get formatted metrics for display
   */
  const getFormattedMetrics = useCallback(() => {
    return {
      tps: `${tokenMetrics.tokensPerSecond.toFixed(1)} tokens/s`,
      totalTokens: `${tokenMetrics.totalTokens.toLocaleString()} tokens`,
      cost: `$${tokenMetrics.estimatedCost?.total?.toFixed(4) || 'N/A'}`,
      duration: `${(tokenMetrics.duration / 1000).toFixed(1)}s`
    };
  }, [tokenMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !tokenMetrics.isTracking) {
      startTracking();
    }
  }, [autoStart, startTracking, tokenMetrics.isTracking]);

  return {
    tokenMetrics,
    isTracking: tokenMetrics.isTracking,
    startTracking,
    updateTokens,
    addOutputTokens,
    stopTracking,
    reset,
    getCurrentTPS,
    getFormattedMetrics
  };
} 