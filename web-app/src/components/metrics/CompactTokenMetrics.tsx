/**
 * CompactTokenMetrics.tsx
 * 
 * Compact inline token metrics display component
 * 
 * Components:
 *   CompactTokenMetrics
 * 
 * Features:
 *   - Inline metrics with icons
 *   - Tokens per second with color coding
 *   - Token count display
 *   - Duration display
 *   - Cost with hover tooltip
 * 
 * Usage: <CompactTokenMetrics metrics={tokenMetrics} showCost={true} />
 */
import React from 'react';
import { Activity, Clock, DollarSign, Hash } from 'lucide-react';
import { formatDuration, formatCost, getTokensPerSecondColor } from '../../utils/tokenUtils';
import type { TokenMetrics } from '../../../../src/shared/types';

interface CompactTokenMetricsProps {
  /** Token metrics data */
  metrics: TokenMetrics;
  /** Whether to show cost information */
  showCost?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact token metrics display for inline use
 * 
 * @param metrics - Token metrics data
 * @param showCost - Whether to show cost information
 * @param className - Additional CSS classes
 * @returns React component displaying compact metrics
 */
export const CompactTokenMetrics: React.FC<CompactTokenMetricsProps> = React.memo(({
  metrics,
  showCost = true,
  className = ''
}) => {
  const {
    totalTokens = 0,
    tokensPerSecond = 0,
    duration = 0,
    estimatedCost
  } = metrics;

  const tpsColor = getTokensPerSecondColor(tokensPerSecond);

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      {/* Tokens per second with icon */}
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3" />
        <span className={`font-mono ${tpsColor}`}>
          {tokensPerSecond.toFixed(1)} t/s
        </span>
      </div>

      {/* Token count */}
      <div className="flex items-center gap-1">
        <Hash className="w-3 h-3" />
        <span className="font-mono">
          {totalTokens.toLocaleString()}
        </span>
      </div>

      {/* Duration */}
      {duration > 0 && (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="font-mono">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Cost */}
      {showCost && estimatedCost && (
        <div 
          className="flex items-center gap-1 cursor-help" 
          title={`Input: ${formatCost(estimatedCost.input)} • Output: ${formatCost(estimatedCost.output)}`}
        >
          <DollarSign className="w-3 h-3" />
          <span className="font-mono">
            {formatCost(estimatedCost.total)}
          </span>
        </div>
      )}
    </div>
  );
});

CompactTokenMetrics.displayName = 'CompactTokenMetrics'; 