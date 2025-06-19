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
    console.log(`[ModelItem] Button clicked for model: ${modelId}`);
    
    if (loading || isPinning) {
      console.log(`[ModelItem] Click blocked - loading: ${loading}, pinning: ${isPinning}`);
      return;
    }
    
    if (!onSelect) {
      console.warn(`[ModelItem] onSelect callback is missing!`);
      return;
    }
    
    try {
      onSelect(modelId);
      console.log(`[ModelItem] onSelect completed for: ${modelId}`);
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
          'w-full flex flex-col p-4 rounded-xl font-medium transition-all duration-300',
          'border-2 text-left relative overflow-hidden',
          // Base styling
          'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700',
          // Hover effects (when not selected)
          !isSelected && 'hover:scale-[1.02] hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-750',
          // Selected state with enhanced styling
          isSelected && [
            'scale-[1.02] shadow-xl border-blue-500 dark:border-blue-400',
            'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
            'ring-2 ring-blue-200 dark:ring-blue-400/30',
            'transform-gpu' // Hardware acceleration for smooth animations
          ],
          // Pinned state styling
          isPinned && !isSelected && [
            'ring-2 ring-amber-300 dark:ring-amber-500/50',
            'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50',
            'border-amber-300 dark:border-amber-500'
          ],
          // Loading state
          loading && 'opacity-60 cursor-not-allowed',
          // Enhanced interaction states
          !loading && !isSelected && 'active:scale-[0.98] active:shadow-md',
          // Smooth transitions
          'transition-all duration-300 ease-out'
        )}
        style={{
          // Dynamic styling based on selection
          ...(isSelected && {
            backgroundColor: `color-mix(in srgb, ${model.bgColor} 85%, transparent 15%)`,
            borderColor: model.color,
            boxShadow: `0 8px 25px -5px ${model.color}20, 0 4px 10px -3px ${model.color}10`
          })
        }}
      >
        {/* Selected state glow effect */}
        {isSelected && (
          <div 
            className="absolute inset-0 rounded-xl opacity-20 blur-sm -z-10"
            style={{ 
              background: `linear-gradient(135deg, ${model.color}40, ${model.bgColor}20)`,
              transform: 'scale(1.05)'
            }}
          />
        )}

        {/* Model Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Model indicator dot */}
            <div 
              className={cn(
                'w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300',
                isSelected && 'ring-2 ring-white dark:ring-slate-900 ring-offset-1 shadow-lg'
              )}
              style={{ backgroundColor: model.color }}
            />
            <span className={cn(
              'text-sm font-bold transition-colors duration-300',
              isSelected 
                ? 'text-gray-900 dark:text-slate-100' 
                : 'text-gray-800 dark:text-slate-200'
            )}>
              {model.name}
            </span>
          </div>
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Selected</span>
            </div>
          )}
        </div>

        {/* Capability Badges */}
        <ModelBadges model={model} className="mb-3" />

        {/* Model Description (truncated) */}
        <p className={cn(
          'text-xs leading-relaxed line-clamp-2 transition-colors duration-300',
          isSelected 
            ? 'text-gray-700 dark:text-slate-300' 
            : 'text-gray-600 dark:text-slate-400'
        )}>
          {model.description}
        </p>

        {/* Bottom accent line for selected state */}
        {isSelected && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
            style={{ 
              background: `linear-gradient(90deg, ${model.color}, ${model.bgColor})`
            }}
          />
        )}
      </button>

      {/* Pin Button - Appears on hover with enhanced positioning */}
      <ModelPinButton
        modelId={modelId}
        isPinned={isPinned}
        isPinning={isPinning}
        onToggle={onTogglePin}
      />
    </div>
  );
}; 