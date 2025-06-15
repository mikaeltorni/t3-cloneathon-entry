/**
 * ModelSelectorButton.tsx
 * 
 * Button component to trigger the ModelSelector modal
 * Shows current model and allows opening the selector
 * 
 * Components:
 *   ModelSelectorButton - Button to open model selector
 * 
 * Usage: <ModelSelectorButton currentModel={model} onClick={openSelector} />
 */
import React from 'react';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelSelectorButtonProps {
  /** Currently selected model ID */
  currentModel: string;
  /** Available models configuration */
  models: Record<string, ModelConfig>;
  /** Callback to open the model selector */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button component to trigger the ModelSelector modal
 * 
 * @param currentModel - Currently selected model ID
 * @param models - Available models configuration
 * @param onClick - Callback to open the model selector
 * @param loading - Loading state
 * @param className - Additional CSS classes
 * @param variant - Button variant
 * @param size - Button size
 * @returns React component
 */
export const ModelSelectorButton: React.FC<ModelSelectorButtonProps> = ({
  currentModel,
  models,
  onClick,
  loading = false,
  className,
  variant = 'outline',
  size = 'md'
}) => {
  const model = models[currentModel];
  const modelName = model?.name || currentModel || 'Select Model';

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      loading={loading}
      className={cn(
        'flex items-center gap-2 max-w-xs',
        className
      )}
      aria-label={`Current model: ${modelName}. Click to change model.`}
    >
      {/* Robot emoji icon */}
      <span className="text-lg" role="img" aria-label="AI Model">
        🤖
      </span>
      
      {/* Model info */}
      <div className="flex flex-col items-start text-left min-w-0">
        <span className="text-sm font-medium truncate">
          {modelName}
        </span>
        {model && (
          <span className="text-xs text-gray-500 truncate">
            AI Model
          </span>
        )}
      </div>
      
      {/* Dropdown arrow */}
      <svg
        className="w-4 h-4 text-gray-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </Button>
  );
}; 