/**
 * TokenTracker.ts
 * 
 * Real-time token tracking for streaming responses
 * 
 * Classes:
 *   TokenTracker - Tracks tokens and calculates TPS in real-time
 * 
 * Features:
 *   - Real-time tokens-per-second calculation
 *   - Smoothed TPS averaging with configurable history
 *   - Token counting and elapsed time tracking
 *   - Reset functionality for new sessions
 * 
 * Usage: 
 *   const tracker = new TokenTracker();
 *   tracker.addTokens(5);
 *   const tps = tracker.getCurrentTPS();
 */

import { logger } from '../../utils/logger';

/**
 * Real-time token tracking for streaming responses
 * 
 * Tracks token counts and calculates tokens-per-second metrics
 * with smoothed averaging for more stable TPS readings.
 */
export class TokenTracker {
  private startTime: number;
  private tokenCount: number = 0;
  private tokensPerSecondHistory: number[] = [];
  private readonly maxHistorySize: number;

  /**
   * Create a new token tracker
   * 
   * @param maxHistorySize - Maximum number of TPS readings to keep for averaging (default: 10)
   */
  constructor(maxHistorySize: number = 10) {
    this.startTime = Date.now();
    this.maxHistorySize = maxHistorySize;
    logger.debug('TokenTracker initialized');
  }

  /**
   * Add tokens to the tracker and calculate current TPS
   * 
   * @param count - Number of tokens to add
   * @returns Current tokens per second
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
      
      logger.debug(`Added ${count} tokens, current TPS: ${currentTPS.toFixed(2)}`);
      return currentTPS;
    }
    
    return 0;
  }

  /**
   * Get current tokens per second (smoothed average)
   * 
   * @returns Smoothed TPS average
   */
  getCurrentTPS(): number {
    if (this.tokensPerSecondHistory.length === 0) return 0;
    
    const sum = this.tokensPerSecondHistory.reduce((a, b) => a + b, 0);
    return sum / this.tokensPerSecondHistory.length;
  }

  /**
   * Get total tokens counted
   * 
   * @returns Total token count
   */
  getTotalTokens(): number {
    return this.tokenCount;
  }

  /**
   * Get elapsed time in milliseconds
   * 
   * @returns Elapsed time since tracker creation/reset
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get elapsed time in seconds
   * 
   * @returns Elapsed time in seconds
   */
  getElapsedTimeSeconds(): number {
    return this.getElapsedTime() / 1000;
  }

  /**
   * Get current average TPS over the entire session
   * 
   * @returns Overall average TPS since start/reset
   */
  getOverallTPS(): number {
    const elapsedSeconds = this.getElapsedTimeSeconds();
    return elapsedSeconds > 0 ? this.tokenCount / elapsedSeconds : 0;
  }

  /**
   * Reset the tracker to initial state
   */
  reset(): void {
    this.startTime = Date.now();
    this.tokenCount = 0;
    this.tokensPerSecondHistory = [];
    logger.debug('TokenTracker reset');
  }

  /**
   * Get comprehensive tracking metrics
   * 
   * @returns Object with all tracking metrics
   */
  getMetrics() {
    return {
      totalTokens: this.getTotalTokens(),
      elapsedTimeMs: this.getElapsedTime(),
      elapsedTimeSeconds: this.getElapsedTimeSeconds(),
      currentTPS: this.getCurrentTPS(),
      overallTPS: this.getOverallTPS(),
      historySize: this.tokensPerSecondHistory.length
    };
  }
} 