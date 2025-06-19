/**
 * ModelSidebar.tsx
 * 
 * Right-side model selection sidebar with toggle functionality
 * Similar to ChatSidebar but for model selection
 * 
 * Components:
 *   ModelSidebar - Right-side sidebar for model selection
 * 
 * Features:
 *   - Right-side positioned sidebar that slides in/out
 *   - Close button in top right corner
 *   - Vertical model selection with brand colors and icons
 *   - Brain emoji icons with smart opacity (full, half, very low)
 *   - One-click model switching with visual feedback
 *   - Model pinning functionality
 *   - Automatic sorting by release date (newest first)
 *   - Smooth animations and transitions
 *   - Mobile-friendly design with overlay
 *   - Toggle button when closed
 * 
 * Usage: <ModelSidebar isOpen={open} onClose={setClose} value={selectedModel} onChange={setSelectedModel} models={availableModels} />
 */
import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useLogger } from '../hooks/useLogger';
import { ModelList } from './model/ModelList';
import { Button } from './ui/Button';
import type { ModelConfig } from '../../../src/shared/types';

interface ModelSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (modelId: string) => void;
  models: Record<string, ModelConfig>;
  loading?: boolean;
  className?: string;
}

/**
 * Right-side model selection sidebar with toggle functionality
 * 
 * @param isOpen - Whether the sidebar is visible
 * @param onClose - Callback to close the sidebar

 * @param value - Currently selected model ID
 * @param onChange - Callback when model is selected
 * @param models - Available models configuration
 * @param loading - Loading state
 * @param className - Additional CSS classes
 * @returns React component
 */
export const ModelSidebar: React.FC<ModelSidebarProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  models,
  loading = false,
  className
}) => {
  const [pinningModel, setPinningModel] = useState<string | null>(null);
  
  const { pinnedModels, toggleModelPin } = useUserPreferences();
  const { debug, warn } = useLogger('ModelSidebar');

  /**
   * Handle model selection with debugging
   */
  const handleModelSelect = (modelId: string) => {
    debug(`Model selected: ${modelId}`);
    
    if (!onChange) {
      warn('onChange callback is not provided!');
      return;
    }
    
    if (loading) {
      debug('Model selection blocked - component is in loading state');
      return;
    }
    
    if (!models[modelId]) {
      warn(`Model ${modelId} not found in available models!`);
      return;
    }
    
    try {
      onChange(modelId);
      debug(`Model selection completed: ${modelId}`);
    } catch (error) {
              warn(`Error during model selection:`, error as Error);
    }
  };

  /**
   * Handle model pin toggle
   */
  const handleTogglePin = async (modelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent model selection
    
    try {
      setPinningModel(modelId);
              debug(`Toggling pin for model: ${modelId}`);
      await toggleModelPin(modelId);
      debug(`Pin toggle completed for model: ${modelId}`);
    } catch (error) {
      warn(`Failed to toggle pin for model ${modelId}`, error as Error);
    } finally {
      setPinningModel(null);
    }
  };

  const modelCount = Object.keys(models).length;
  const pinnedCount = pinnedModels.length;

  return (
    <>
      {/* Mobile overlay - only show on small screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          'fixed right-0 top-0 w-80 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-l border-gray-200 dark:border-slate-600 flex flex-col h-full z-40 transition-transform duration-300',
          // Transform based on isOpen state for all screen sizes
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        data-no-drop="true"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
          {/* Top row: Title + Close button */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">AI Models</h1>
            
            {/* Close button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-2 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close model sidebar"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-slate-400 text-center leading-relaxed">
            Choose your AI model • {modelCount} models available
            {pinnedCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                • {pinnedCount} pinned
              </span>
            )}
          </p>
        </div>

        {/* Model list with enhanced scrolling */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-0">
          {loading ? (
            <LoadingState />
          ) : (
            <ModelList
              models={models}
              value={value}
              pinnedModels={pinnedModels}
              pinningModel={pinningModel}
              loading={loading}
              onChange={handleModelSelect}
              onTogglePin={handleTogglePin}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <div className="text-xs text-gray-500 dark:text-slate-400 text-center leading-relaxed">
            Click a model to select it, or pin your favorites for easy access
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Loading skeleton component
 */
const LoadingState: React.FC = () => (
  <div className="space-y-3 w-full">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="h-16 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse w-full"
      />
    ))}
  </div>
);

// Export ModelSidebar as both names for compatibility
export { ModelSidebar as ModelSelector }; 