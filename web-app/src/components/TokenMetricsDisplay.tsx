/**
 * TokenMetricsDisplay.tsx
 * 
 * Component for displaying token metrics for assistant messages
 * 
 * Components:
 *   TokenMetricsDisplay
 * 
 * Features:
 *   - Real-time tokens per second display
 *   - Cost estimation with hover details
 *   - Token count breakdown
 *   - Animated updates
 *   - Compact design suitable for message cards
 * 
 * Usage: <TokenMetricsDisplay metrics={message.tokenMetrics} />
 */
import React from 'react';
import { Activity, Clock, DollarSign, Hash } from 'lucide-react';
import type { TokenMetrics } from '../../../src/shared/types';

interface TokenMetricsDisplayProps {
  metrics?: TokenMetrics;
  variant?: 'compact' | 'detailed';
  showCost?: boolean;
  className?: string;
}

/**
 * Display token metrics for assistant messages
 * 
 * @param metrics - Token metrics data
 * @param variant - Display variant (compact or detailed)
 * @param showCost - Whether to show cost information
 * @param className - Additional CSS classes
 * @returns React component
 */
export const TokenMetricsDisplay: React.FC<TokenMetricsDisplayProps> = ({
  metrics,
  variant = 'compact',
  showCost = true,
  className = ''
}) => {
  if (!metrics) return null;

  const {
    inputTokens = 0,
    outputTokens = 0,
    totalTokens = 0,
    tokensPerSecond = 0,
    duration = 0,
    estimatedCost
  } = metrics;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost < 0.001) return `$${(cost * 1000).toFixed(2)}‰`; // Show in per-mille for very small costs
    return `$${cost.toFixed(6)}`;
  };

  const tpsColor = tokensPerSecond > 50 ? 'text-green-600' : 
                   tokensPerSecond > 20 ? 'text-yellow-600' : 
                   'text-gray-600';

  if (variant === 'compact') {
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
  }

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
}; 