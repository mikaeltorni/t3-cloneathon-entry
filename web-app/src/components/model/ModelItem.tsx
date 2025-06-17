/**
 * ModelItem.tsx
 * 
 * Component for rendering individual model items
 * 
 * Components:
 *   ModelItem - Complete model item with selection, badges, and pin functionality
 * 
 * Usage: <ModelItem model={model} modelId={modelId} isSelected={isSelected} />
 */

import React from 'react';
import { ModelBadges } from './ModelBadges';
import { ModelPinButton } from './ModelPinButton';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

/**
 * Props for the ModelItem component
 */
interface ModelItemProps {
  /** Model ID */
  modelId: string;
  /** Model configuration */
  model: ModelConfig;
  /** Whether the model is selected */
  isSelected: boolean;
  /** Whether the model is pinned */
  isPinned: boolean;
  /** Whether the model is being pinned/unpinned */
  isPinning: boolean;
  /** Whether loading */
  loading?: boolean;
  /** Callback for model selection */
  onSelect: (modelId: string) => void;
  /** Callback for pin toggle */
  onTogglePin: (modelId: string, event: React.MouseEvent) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Individual model item component with full functionality
 * 
 * @param modelId - Model ID
 * @param model - Model configuration
 * @param isSelected - Whether the model is selected
 * @param isPinned - Whether the model is pinned
 * @param isPinning - Whether the model is being pinned/unpinned
 * @param loading - Whether loading
 * @param onSelect - Callback for model selection
 * @param onTogglePin - Callback for pin toggle
 * @param className - Additional CSS classes
 * @returns JSX element containing the model item
 */
export const ModelItem: React.FC<ModelItemProps> = ({
  modelId,
  model,
  isSelected,
  isPinned,
  isPinning,
  loading = false,
  onSelect,
  onTogglePin,
  className
}) => {
  // Click handler with debugging
  const handleClick = () => {
    console.debug(`[ModelItem] Button clicked for model: ${modelId}`);
    
    if (loading || isPinning) {
      console.debug(`[ModelItem] Click blocked - loading: ${loading}, pinning: ${isPinning}`);
      return;
    }
    
    if (!onSelect) {
      console.warn(`[ModelItem] onSelect callback is missing!`);
      return;
    }
    
    try {
      onSelect(modelId);
      console.debug(`[ModelItem] onSelect completed for: ${modelId}`);
    } catch (error) {
      console.error(`[ModelItem] Error in onSelect for ${modelId}:`, error);
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'w-full flex flex-col p-3 rounded-lg font-medium transition-all duration-200',
          'border-2 hover:scale-[1.02] hover:shadow-md text-left',
          isSelected
            ? 'shadow-lg transform scale-[1.02]'
            : 'hover:shadow-sm bg-white',
          isPinned && 'ring-2 ring-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50',
          loading && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          backgroundColor: isSelected ? model.bgColor : (isPinned ? undefined : '#ffffff'),
          borderColor: isSelected ? model.color : (isPinned ? '#f59e0b' : '#e5e7eb'),
          color: isSelected ? model.textColor : '#374151',
        }}
      >
        {/* Model Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {model.name}
            </span>
          </div>
        </div>

        {/* Capability Badges */}
        <ModelBadges model={model} className="mb-2" />

        {/* Model Description (truncated) */}
        <p className="text-xs text-gray-600 line-clamp-2">
          {model.description}
        </p>
      </button>

      {/* Pin Button - Appears on hover */}
      <ModelPinButton
        modelId={modelId}
        isPinned={isPinned}
        isPinning={isPinning}
        onToggle={onTogglePin}
      />
    </div>
  );
}; 