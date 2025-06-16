/**
 * TokenizerControls.tsx
 * 
 * Component for tokenizer model selection and sample text loading
 * 
 * Components:
 *   TokenizerControls
 * 
 * Usage: <TokenizerControls selectedModel={model} onModelChange={onChange} onLoadSample={onLoad} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
import { tokenizerService } from '../../services/tokenizerService';
import { SAMPLE_TEXTS } from '../../constants/tokenizerSamples';

interface TokenizerControlsProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onLoadSample: (key: keyof typeof SAMPLE_TEXTS) => void;
  disabled?: boolean;
}

/**
 * Controls for model selection and sample text loading
 * 
 * @param selectedModel - Currently selected model
 * @param onModelChange - Model change handler
 * @param onLoadSample - Sample text loading handler
 * @param disabled - Whether controls are disabled
 * @returns React component
 */
export const TokenizerControls: React.FC<TokenizerControlsProps> = ({
  selectedModel,
  onModelChange,
  onLoadSample,
  disabled = false
}) => {
  const supportedModels = tokenizerService.getSupportedModels();

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {/* Model Selection */}
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        >
          {supportedModels.map(model => {
            const modelInfo = tokenizerService.getModelInfo(model);
            return (
              <option key={model} value={model}>
                {model} ({modelInfo.provider})
              </option>
            );
          })}
        </select>
      </div>

      {/* Sample Text Buttons */}
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sample Texts
        </label>
        <div className="flex gap-2">
          {Object.keys(SAMPLE_TEXTS).map(key => (
            <button
              key={key}
              onClick={() => onLoadSample(key as keyof typeof SAMPLE_TEXTS)}
              className={cn(
                'px-3 py-1 text-xs rounded-md border transition-colors',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              disabled={disabled}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 