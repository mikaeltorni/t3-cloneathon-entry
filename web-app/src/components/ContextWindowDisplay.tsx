/**
 * ContextWindowDisplay.tsx
 * 
 * Component for displaying context window usage
 * 
 * Components:
 *   ContextWindowDisplay
 * 
 * Features:
 *   - Visual progress bar showing context window utilization
 *   - Token count and percentage display
 *   - Color-coded based on usage level (green, yellow, red)
 *   - Compact design suitable for chat input area
 * 
 * Usage: <ContextWindowDisplay contextWindow={metrics.contextWindow} />
 */
import React from 'react';
import { cn } from '../utils/cn';

/**
 * Context window information interface
 */
interface ContextWindow {
  used: number;
  total: number;
  percentage: number;
  modelId: string;
}

/**
 * Props for the ContextWindowDisplay component
 */
interface ContextWindowDisplayProps {
  contextWindow: ContextWindow;
  className?: string;
  variant?: 'compact' | 'full';
}

/**
 * Context Window Display Component
 * 
 * Shows the current context window usage with a visual progress bar
 * and detailed token information. Color-codes based on usage level.
 * 
 * @param contextWindow - Context window usage data
 * @param className - Additional CSS classes
 * @param variant - Display variant (compact or full)
 * @returns React component
 */
export const ContextWindowDisplay: React.FC<ContextWindowDisplayProps> = ({
  contextWindow,
  className,
  variant = 'compact'
}) => {
  const { used, total, percentage } = contextWindow;

  /**
   * Get color based on usage percentage
   */
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  /**
   * Get text color based on usage percentage
   */
  const getTextColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-700';
    if (percentage >= 75) return 'text-yellow-700';
    if (percentage >= 50) return 'text-blue-700';
    return 'text-green-700';
  };

  /**
   * Format large numbers with appropriate units
   */
  const formatTokenCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Context icon */}
        <span className="text-gray-500" title="Context Window Usage">
          📄
        </span>
        
        {/* Progress bar */}
        <div className="flex-1 max-w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-300', getUsageColor(percentage))}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {/* Usage text */}
        <span className={cn('text-xs font-medium', getTextColor(percentage))}>
          {formatTokenCount(used)}/{formatTokenCount(total)}
        </span>
        
        {/* Percentage */}
        <span className={cn('text-xs', getTextColor(percentage))}>
          ({percentage.toFixed(1)}%)
        </span>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">📄</span>
          <span className="text-sm font-medium text-gray-700">Context Window</span>
        </div>
        <span className={cn('text-sm font-medium', getTextColor(percentage))}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn('h-full transition-all duration-300', getUsageColor(percentage))}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Details */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{formatTokenCount(used)} used</span>
        <span>{formatTokenCount(total)} total</span>
      </div>
      
      {/* Warning for high usage */}
      {percentage >= 90 && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠️ Context window nearly full - consider starting a new conversation
        </div>
      )}
      {percentage >= 75 && percentage < 90 && (
        <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          ⚠️ Context window getting full - {formatTokenCount(total - used)} tokens remaining
        </div>
      )}
    </div>
  );
}; 