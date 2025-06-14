/**
 * TokenMetricsDisplay.tsx
 * 
 * Main token metrics display component that renders either compact or detailed view
 * 
 * Components:
 *   TokenMetricsDisplay
 * 
 * Features:
 *   - Switches between compact and detailed variants
 *   - Handles null metrics gracefully
 *   - Delegates to specialized components
 * 
 * Usage: <TokenMetricsDisplay metrics={message.tokenMetrics} variant="compact" />
 */
import React from 'react';
import { CompactTokenMetrics } from './metrics/CompactTokenMetrics';
import { DetailedTokenMetrics } from './metrics/DetailedTokenMetrics';
import type { TokenMetrics } from '../../../src/shared/types';

interface TokenMetricsDisplayProps {
  /** Token metrics data */
  metrics?: TokenMetrics;
  /** Display variant */
  variant?: 'compact' | 'detailed';
  /** Whether to show cost information */
  showCost?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Display token metrics for assistant messages
 * 
 * @param metrics - Token metrics data
 * @param variant - Display variant (compact or detailed)
 * @param showCost - Whether to show cost information
 * @param className - Additional CSS classes
 * @returns React component or null if no metrics
 */
export const TokenMetricsDisplay: React.FC<TokenMetricsDisplayProps> = React.memo(({
  metrics,
  variant = 'compact',
  showCost = true,
  className = ''
}) => {
  if (!metrics) return null;

  if (variant === 'compact') {
    return (
      <CompactTokenMetrics
        metrics={metrics}
        showCost={showCost}
        className={className}
      />
    );
  }

  return (
    <DetailedTokenMetrics
      metrics={metrics}
      showCost={showCost}
      className={className}
    />
  );
});

TokenMetricsDisplay.displayName = 'TokenMetricsDisplay'; 