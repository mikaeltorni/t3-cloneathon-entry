/**
 * ModelList.tsx
 * 
 * Component for rendering a sorted list of models
 * 
 * Components:
 *   ModelList - Sorted model list with individual model items
 * 
 * Usage: <ModelList models={models} value={selectedModel} onChange={onChange} />
 */

import React, { useMemo } from 'react';
import { ModelItem } from './ModelItem';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

/**
 * Props for the ModelList component
 */
interface ModelListProps {
  /** Available models configuration */
  models: Record<string, ModelConfig>;
  /** Currently selected model ID */
  value: string;
  /** Pinned model IDs */
  pinnedModels: string[];
  /** Model being pinned/unpinned */
  pinningModel: string | null;
  /** Whether loading */
  loading?: boolean;
  /** Callback for model selection */
  onChange: (modelId: string) => void;
  /** Callback for pin toggle */
  onTogglePin: (modelId: string, event: React.MouseEvent) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Model list component with sorting and individual model rendering
 * 
 * @param models - Available models configuration
 * @param value - Currently selected model ID
 * @param pinnedModels - Pinned model IDs
 * @param pinningModel - Model being pinned/unpinned
 * @param loading - Whether loading
 * @param onChange - Callback for model selection
 * @param onTogglePin - Callback for pin toggle
 * @param className - Additional CSS classes
 * @returns JSX element containing the model list
 */
export const ModelList: React.FC<ModelListProps> = ({
  models,
  value,
  pinnedModels,
  pinningModel,
  loading = false,
  onChange,
  onTogglePin,
  className
}) => {
  /**
   * Sort models with pinned models first, then by release date
   */
  const sortedModels = useMemo(() => {
    return Object.entries(models).sort(([aId, a], [bId, b]) => {
      const aIsPinned = pinnedModels.includes(aId);
      const bIsPinned = pinnedModels.includes(bId);
      
      // First, sort by pinned status (pinned models first)
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // Then sort by release date descending (newest first)
      return new Date(b.released).getTime() - new Date(a.released).getTime();
    });
  }, [models, pinnedModels]);

  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-3', className)}>
      {sortedModels.map(([modelId, model]) => (
        <ModelItem
          key={modelId}
          modelId={modelId}
          model={model}
          isSelected={value === modelId}
          isPinned={pinnedModels.includes(modelId)}
          isPinning={pinningModel === modelId}
          loading={loading}
          onSelect={onChange}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}; 