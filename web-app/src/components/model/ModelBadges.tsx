/**
 * ModelBadges.tsx
 * 
 * Component for displaying model capability badges
 * 
 * Components:
 *   ModelBadges - Badge collection for model capabilities
 * 
 * Usage: <ModelBadges model={modelConfig} />
 */

import React from 'react';
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

  // Release date badge
  badges.push(
    <span 
      key="release" 
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700"
    >
      {formatReleaseDate(model.released)}
    </span>
  );

  // Reasoning badge (compact)
  if (model.hasReasoning) {
    badges.push(
      <span 
        key="reasoning"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
        style={{
          backgroundColor: model.reasoningMode === 'forced' 
            ? '#F3E8FF' // Purple background for forced
            : '#EFF6FF', // Blue background for optional
          color: model.reasoningMode === 'forced'
            ? '#7C3AED' // Purple text for forced
            : '#2563EB' // Blue text for optional
        }}
      >
        🧠 
        {model.reasoningMode === 'forced' ? 'Always' : 'Optional'}
      </span>
    );
  }

  // Web search badge - compact pricing tier info
  if (model.webSearchPricing === 'perplexity') {
    badges.push(
      <span 
        key="search"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
      >
        🔍 Cheap
      </span>
    );
  } else if (model.webSearchPricing === 'openai') {
    badges.push(
      <span 
        key="search"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
      >
        🔍 Premium
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges}
    </div>
  );
}; 