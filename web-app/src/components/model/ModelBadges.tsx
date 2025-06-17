/**
 * ModelBadges.tsx
 * 
 * Component for displaying model capability badges
 * Enhanced with comprehensive dark mode support
 * 
 * Components:
 *   ModelBadges - Badge collection for model capabilities
 * 
 * Usage: <ModelBadges model={modelConfig} />
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

/**
 * Props for the ModelBadges component
 */
interface ModelBadgesProps {
  /** Model configuration */
  model: ModelConfig;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format release date for display
 */
const formatReleaseDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short' 
  });
};

/**
 * Model capability badges component
 * Enhanced with dark mode support
 * 
 * @param model - Model configuration object
 * @param className - Additional CSS classes
 * @returns JSX element containing the capability badges
 */
export const ModelBadges: React.FC<ModelBadgesProps> = ({
  model,
  className = ''
}) => {
  const badges: React.ReactNode[] = [];

  // Release date badge - Enhanced with dark mode
  badges.push(
    <span 
      key="release" 
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-200"
    >
      {formatReleaseDate(model.released)}
    </span>
  );

  // Reasoning badge (compact) - Enhanced with dark mode
  if (model.hasReasoning) {
    badges.push(
      <span 
        key="reasoning"
        className={cn(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
          model.reasoningMode === 'forced' 
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
        )}
      >
        🧠 
        {model.reasoningMode === 'forced' ? 'Always' : 'Optional'}
      </span>
    );
  }

  // Vision badge - Enhanced with dark mode
  if (model.hasVision) {
    badges.push(
      <span 
        key="vision"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
      >
        👁️ Vision
      </span>
    );
  }

  // Web search badge - Enhanced with dark mode
  if (model.webSearchPricing === 'perplexity') {
    badges.push(
      <span 
        key="search"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
      >
        🔍 Cheap
      </span>
    );
  } else if (model.webSearchPricing === 'openai') {
    badges.push(
      <span 
        key="search"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
      >
        🔍 Premium
      </span>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {badges}
    </div>
  );
}; 