/**
 * ModelIcon.tsx
 * 
 * Component for displaying model brain emoji with reasoning-based opacity
 * 
 * Components:
 *   ModelIcon - Brain emoji with opacity based on reasoning capability
 * 
 * Usage: <ModelIcon model={modelConfig} />
 */

import React from 'react';
import type { ModelConfig } from '../../../../src/shared/types';

/**
 * Props for the ModelIcon component
 */
interface ModelIconProps {
  /** Model configuration */
  model: ModelConfig;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Brain emoji icon with proper opacity based on reasoning capability
 * 
 * @param model - Model configuration object
 * @param size - Size variant for the icon
 * @param className - Additional CSS classes
 * @returns JSX element containing the brain emoji
 */
export const ModelIcon: React.FC<ModelIconProps> = ({
  model,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (!model.hasReasoning) {
    // Very subtle for no reasoning
    return (
      <span 
        className={`opacity-30 text-gray-400 ${sizeClasses[size]} ${className}`}
        title="No reasoning capability"
        aria-label="No reasoning capability"
      >
        🧠
      </span>
    );
  }

  if (model.reasoningMode === 'forced') {
    // Full opacity for forced reasoning
    return (
      <span 
        className={`opacity-100 text-purple-600 ${sizeClasses[size]} ${className}`}
        title="Always uses reasoning"
        aria-label="Always uses reasoning"
      >
        🧠
      </span>
    );
  }

  // Half opacity for optional reasoning
  return (
    <span 
      className={`opacity-60 text-blue-600 ${sizeClasses[size]} ${className}`}
      title="Optional reasoning capability"
      aria-label="Optional reasoning capability"
    >
      🧠
    </span>
  );
}; 