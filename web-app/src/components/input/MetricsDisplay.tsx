/**
 * MetricsDisplay.tsx
 * 
 * Component for displaying token metrics and context window information
 * 
 * Components:
 *   MetricsDisplay
 * 
 * Usage: <MetricsDisplay currentTokenMetrics={metrics} contextWindowUsage={usage} isGenerating={isGenerating} />
 */
import React from 'react';
import { TokenMetricsDisplay } from '../TokenMetricsDisplay';
import { ContextWindowDisplay } from '../ContextWindowDisplay';
import type { TokenMetrics } from '../../../../src/shared/types';

interface MetricsDisplayProps {
  currentTokenMetrics?: TokenMetrics | null;
  isGenerating?: boolean;
  contextWindowUsage?: {
    used: number;
    total: number;
    percentage: number;
    modelId: string;
  } | null;
}

/**
 * Display component for token metrics and context window usage
 * 
 * @param currentTokenMetrics - Current token usage metrics
 * @param isGenerating - Whether a message is currently being generated
 * @param contextWindowUsage - Context window usage information
 * @returns React component
 */
export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  currentTokenMetrics,
  isGenerating = false,
  contextWindowUsage
}) => {
  // Only render if there's something to show
  if (!currentTokenMetrics && !isGenerating && !contextWindowUsage) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-1.5 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isGenerating && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full animate-pulse">
              Generating...
            </span>
          )}
          {currentTokenMetrics && (
            <TokenMetricsDisplay 
              metrics={currentTokenMetrics} 
              variant="compact"
              className="justify-start"
            />
          )}
        </div>
        
        {/* Context Window Display on the right */}
        {contextWindowUsage && (
          <ContextWindowDisplay 
            contextWindow={contextWindowUsage}
            variant="compact"
            className="flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}; 