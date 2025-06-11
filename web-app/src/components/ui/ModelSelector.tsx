/**
 * ModelSelector.tsx
 * 
 * AI model selection component with descriptions and reasoning indicators
 * 
 * Components:
 *   ModelSelector
 * 
 * Features:
 *   - Dropdown selection of available AI models
 *   - Model descriptions and capabilities
 *   - Brain icons for reasoning models
 * 
 * Usage: <ModelSelector value={selectedModel} onChange={handleModelChange} models={availableModels} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * AI model selector component
 * 
 * @param value - Currently selected model ID
 * @param onChange - Callback when model selection changes
 * @param models - Available models configuration
 * @param loading - Loading state
 * @param disabled - Disabled state
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  models,
  loading = false,
  disabled = false,
  className
}) => {
  /**
   * Render brain icon for reasoning models with appropriate opacity
   * 
   * @param reasoningMode - The reasoning mode of the model
   * @returns Brain emoji with appropriate styling or null
   */
  const renderBrainIcon = (reasoningMode: 'forced' | 'optional' | 'none') => {
    switch (reasoningMode) {
      case 'forced':
        return (
          <span className="ml-1 text-purple-600" title="Always uses reasoning (cannot be disabled)">
            🧠
          </span>
        );
      case 'optional':
        return (
          <span className="ml-1 text-purple-600 opacity-50" title="Optional reasoning (can be toggled)">
            🧠
          </span>
        );
      case 'none':
      default:
        return null;
    }
  };



  if (loading) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">Loading models...</span>
      </div>
    );
  }

  const selectedModel = models[value];

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        AI Model
      </label>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
      >
        {Object.entries(models).map(([modelId, config]) => (
          <option key={modelId} value={modelId}>
            {config.name}{config.reasoningMode === 'forced' ? ' 🧠' : config.reasoningMode === 'optional' ? ' 🧠' : ''}
          </option>
        ))}
      </select>

      {/* Selected model info */}
      {selectedModel && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {selectedModel.name}
            </span>
            {renderBrainIcon(selectedModel.reasoningMode)}
          </div>
          <p className="text-xs text-gray-600">
            {selectedModel.description}
          </p>
        </div>
      )}
    </div>
  );
}; 