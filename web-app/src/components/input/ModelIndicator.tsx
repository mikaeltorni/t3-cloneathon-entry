/**
 * ModelIndicator.tsx
 * 
 * Component for displaying currently selected model information
 * 
 * Components:
 *   ModelIndicator
 * 
 * Usage: <ModelIndicator selectedModel={selectedModel} availableModels={availableModels} />
 */
import React from 'react';
import type { ModelConfig } from '../../../../src/shared/types';

interface ModelIndicatorProps {
  selectedModel: string;
  availableModels: Record<string, ModelConfig>;
}

/**
 * Displays the currently selected model with description
 * 
 * @param selectedModel - Currently selected model ID
 * @param availableModels - Available model configurations
 * @returns React component
 */
export const ModelIndicator: React.FC<ModelIndicatorProps> = ({
  selectedModel,
  availableModels
}) => {
  const model = availableModels[selectedModel];

  if (!model) {
    return null;
  }

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: model.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            Current Model: {model.name}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          (Use sidebar on the right to change model)
        </div>
      </div>
      
      {/* Model Description */}
      <p className="text-xs text-gray-600 leading-relaxed">
        {model.description}
      </p>
    </div>
  );
}; 