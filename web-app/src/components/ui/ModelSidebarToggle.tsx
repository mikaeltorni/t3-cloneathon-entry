/**
 * ModelSidebarToggle.tsx
 * 
 * Floating toggle button for the model sidebar
 * Appears in top right when model sidebar is closed
 * 
 * Components:
 *   ModelSidebarToggle - Toggle button for model sidebar
 * 
 * Usage: <ModelSidebarToggle isOpen={open} onToggle={toggle} currentModel={model} />
 */
import React from 'react';
import { cn } from '../../utils/cn';
import type { ModelConfig } from '../../../../src/shared/types';

interface ModelSidebarToggleProps {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback to toggle the sidebar */
  onToggle: () => void;
  /** Currently selected model ID */
  currentModel?: string;
  /** Available models configuration */
  models?: Record<string, ModelConfig>;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Floating toggle button for the model sidebar
 * 
 * @param isOpen - Whether the sidebar is currently open
 * @param onToggle - Callback to toggle the sidebar
 * @param currentModel - Currently selected model ID
 * @param models - Available models configuration
 * @param loading - Loading state
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ModelSidebarToggle: React.FC<ModelSidebarToggleProps> = ({
  isOpen,
  onToggle,
  currentModel,
  models = {},
  loading = false,
  className
}) => {
  // Only show when sidebar is closed
  if (isOpen) return null;

  const model = currentModel ? models[currentModel] : null;
  const modelName = model?.name || 'Select Model';

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={cn(
        'fixed top-4 right-4 z-30',
        'bg-white border border-gray-300 rounded-lg shadow-lg',
        'p-3',
        'hover:bg-gray-50 hover:shadow-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={`Open model sidebar. Current model: ${modelName}`}
      title={`Open model sidebar. Current model: ${modelName}`}
    >
      {/* Robot icon */}
      <span className="text-lg" role="img" aria-label="AI Model">
        🤖
      </span>
    </button>
  );
}; 