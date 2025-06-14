/**
 * TokenizerMetrics.tsx
 * 
 * Component for displaying real-time token metrics during tokenization
 * 
 * Components:
 *   TokenizerMetrics - Displays token tracking metrics with different variants
 * 
 * Usage: <TokenizerMetrics metrics={tokenMetrics} isVisible={isTracking} />
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { TokenMetricsDisplay } from '../TokenMetricsDisplay';

/**
 * Interface for token metrics data (matching TokenTrackingState)
 */
interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  startTime: number;
  endTime?: number;
  duration: number;
  estimatedCost: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
}

/**
 * Props for the TokenizerMetrics component
 */
interface TokenizerMetricsProps {
  /** Token metrics data */
  metrics: TokenMetrics;
  /** Whether the metrics should be visible */
  isVisible: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Display variant */
  variant?: 'compact' | 'detailed';
}

/**
 * Component for displaying real-time token metrics
 * 
 * @param metrics - Token metrics data
 * @param isVisible - Whether the metrics should be visible
 * @param className - Additional CSS classes
 * @param variant - Display variant
 * @returns JSX element containing the metrics display
 */
export const TokenizerMetrics: React.FC<TokenizerMetricsProps> = ({
  metrics,
  isVisible,
  className,
  variant = 'detailed'
}) => {
  if (!isVisible || metrics.totalTokens === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="text-xl font-semibold text-gray-900">Real-time Metrics</h2>
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {variant === 'detailed' ? 'Full Display' : 'Compact Display'}
        </h3>
        <TokenMetricsDisplay 
          metrics={{
            inputTokens: metrics.inputTokens,
            outputTokens: metrics.outputTokens,
            totalTokens: metrics.totalTokens,
            tokensPerSecond: metrics.tokensPerSecond,
            startTime: metrics.startTime,
            endTime: metrics.endTime,
            duration: metrics.duration,
            estimatedCost: metrics.estimatedCost
          }}
          variant={variant}
        />
      </div>
    </div>
  );
}; 