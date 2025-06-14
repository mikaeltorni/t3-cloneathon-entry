/**
 * DetailedTokenMetrics.tsx
 * 
 * Detailed token metrics display component with full breakdown
 * 
 * Components:
 *   DetailedTokenMetrics
 * 
 * Features:
 *   - Performance metrics section
 *   - Token count breakdown
 *   - Cost breakdown with currency
 *   - Grid layout for organized display
 *   - Styled sections with borders
 * 
 * Usage: <DetailedTokenMetrics metrics={tokenMetrics} showCost={true} />
 */
import React from 'react';
import { formatDuration, formatCost, getTokensPerSecondColor } from '../../utils/tokenUtils';
import type { TokenMetrics } from '../../../../src/shared/types';

interface DetailedTokenMetricsProps {
  /** Token metrics data */
  metrics: TokenMetrics;
  /** Whether to show cost information */
  showCost?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Detailed token metrics display with full breakdown
 * 
 * @param metrics - Token metrics data
 * @param showCost - Whether to show cost information
 * @param className - Additional CSS classes
 * @returns React component displaying detailed metrics
 */
export const DetailedTokenMetrics: React.FC<DetailedTokenMetricsProps> = React.memo(({
  metrics,
  showCost = true,
  className = ''
}) => {
  const {
    inputTokens = 0,
    outputTokens = 0,
    totalTokens = 0,
    tokensPerSecond = 0,
    duration = 0,
    estimatedCost
  } = metrics;

  const tpsColor = getTokensPerSecondColor(tokensPerSecond);

  return (
    <div className={`bg-gray-50 rounded-lg p-3 border ${className}`}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Performance metrics */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 text-xs uppercase tracking-wide">
            Performance
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Speed:</span>
              <span className={`font-mono ${tpsColor}`}>
                {tokensPerSecond.toFixed(1)} tokens/sec
              </span>
            </div>
            {duration > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-mono text-gray-800">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Token breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 text-xs uppercase tracking-wide">
            Tokens
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Input:</span>
              <span className="font-mono text-gray-800">
                {inputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Output:</span>
              <span className="font-mono text-gray-800">
                {outputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span className="text-gray-700">Total:</span>
              <span className="font-mono text-gray-900">
                {totalTokens.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        {showCost && estimatedCost && (
          <div className="col-span-2 space-y-2 border-t pt-3">
            <h4 className="font-medium text-gray-700 text-xs uppercase tracking-wide">
              Estimated Cost
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Input cost:</span>
                <span className="font-mono text-gray-800">
                  {formatCost(estimatedCost.input)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Output cost:</span>
                <span className="font-mono text-gray-800">
                  {formatCost(estimatedCost.output)}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span className="text-gray-700">Total cost:</span>
                <span className="font-mono text-gray-900">
                  {formatCost(estimatedCost.total)} {estimatedCost.currency}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DetailedTokenMetrics.displayName = 'DetailedTokenMetrics'; 