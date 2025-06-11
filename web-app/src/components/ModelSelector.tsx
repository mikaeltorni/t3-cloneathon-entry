/**
 * ModelSelector.tsx
 * 
 * Beautiful horizontal model selection with brain icons
 * 
 * Components:
 *   ModelSelector
 * 
 * Features:
 *   - Horizontal model buttons with brand colors
 *   - Brain emoji icons with smart opacity (full, half, very low)
 *   - One-click model switching with visual feedback
 *   - Selected model description below
 *   - Reasoning toggle positioned appropriately
 * 
 * Usage: <ModelSelector value={selectedModel} onChange={setSelectedModel} models={availableModels} />
 */
import React from 'react';
import { cn } from '../utils/cn';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
}

/**
 * Horizontal model selector with brain icons and beautiful design
 * 
 * @param value - Currently selected model ID
 * @param onChange - Callback when model is selected
 * @param models - Available models configuration
 * @param loading - Loading state
 * @returns React component
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  models,
  loading = false
}) => {
  const currentModel = models[value];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-64" />
      </div>
    );
  }

  /**
   * Get brain emoji with proper opacity based on reasoning capability
   */
  const getBrainIcon = (model: ModelConfig): React.ReactNode => {
    if (!model.hasReasoning) {
      // Very subtle for no reasoning
      return <span className="opacity-30 text-gray-400">🧠</span>;
    }
    if (model.reasoningMode === 'forced') {
      // Full opacity for forced reasoning
      return <span className="opacity-100 text-purple-600">🧠</span>;
    }
    // Half opacity for optional reasoning
    return <span className="opacity-60 text-blue-600">🧠</span>;
  };

  return (
    <div className="space-y-3">
      {/* Horizontal Model Buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(models).map(([modelId, model]) => {
          const isSelected = value === modelId;
          
          return (
            <button
              key={modelId}
              onClick={() => onChange(modelId)}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                'border-2 hover:scale-105 hover:shadow-md',
                isSelected
                  ? 'shadow-lg transform scale-105'
                  : 'hover:shadow-sm bg-white',
                loading && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: isSelected ? model.bgColor : '#ffffff',
                borderColor: isSelected ? model.color : '#e5e7eb',
                color: isSelected ? model.textColor : '#374151',
              }}
            >
              {/* Model Name */}
              <span className="text-sm font-semibold">
                {model.name}
              </span>
              
              {/* Brain Icon with Smart Opacity */}
              {getBrainIcon(model)}

              {/* Active Indicator Dot */}
              {isSelected && (
                <div 
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: model.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Model Description & Info */}
      {currentModel && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between">
            {/* Left: Description */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentModel.color }}
                />
                <span className="font-semibold text-gray-900">
                  {currentModel.name}
                </span>
                {/* Reasoning Capability Badge */}
                {currentModel.hasReasoning && (
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: currentModel.reasoningMode === 'forced' 
                        ? '#F3E8FF' // Purple background for forced
                        : '#EFF6FF', // Blue background for optional
                      color: currentModel.reasoningMode === 'forced'
                        ? '#7C3AED' // Purple text for forced
                        : '#2563EB' // Blue text for optional
                    }}
                  >
                    🧠 
                    {currentModel.reasoningMode === 'forced' ? 'Always Reasoning' : 'Supports Reasoning'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {currentModel.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 