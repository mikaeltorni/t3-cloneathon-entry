/**
 * ModelSelectorExample.tsx
 * 
 * Example component demonstrating how to use ModelSelector and ModelSelectorButton
 * Shows the proper integration pattern for the new modal-style model selection
 * 
 * Components:
 *   ModelSelectorExample - Complete example with state management
 * 
 * Usage Example:
 * ```tsx
 * import { ModelSelectorExample } from './components/examples/ModelSelectorExample';
 * 
 * function App() {
 *   return <ModelSelectorExample />;
 * }
 * ```
 */
import React, { useState, useEffect } from 'react';
import { ModelSelector } from '../ModelSidebar';
import { ModelSelectorButton } from '../ModelSelectorButton';
import type { ModelConfig } from '../../../../src/shared/types';

/**
 * Example component demonstrating ModelSelector usage
 * 
 * @returns React component showing complete integration
 */
export const ModelSelectorExample: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-5-sonnet-20241022');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<Record<string, ModelConfig>>({});
  const [loading, setLoading] = useState(true);

  /**
   * Load available models (replace with your API call)
   */
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Replace with your actual API call
        const response = await fetch('/api/models');
        const data = await response.json();
        setAvailableModels(data.models || {});
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback to mock data for demo
        setAvailableModels({
          'claude-3-5-sonnet-20241022': {
            name: 'Claude 3.5 Sonnet',
            description: 'Most intelligent model with advanced reasoning',
            hasReasoning: true,
            reasoningType: 'thinking',
            reasoningMode: 'optional',
            webSearchMode: 'none',
            webSearchPricing: 'standard',
            color: '#FF6B6B',
            bgColor: '#FFF5F5',
            textColor: '#C53030',
            released: '2024-10-22'
          },
          'gpt-4o': {
            name: 'GPT-4o',
            description: 'OpenAI\'s flagship multimodal model',
            hasReasoning: false,
            reasoningType: 'internal',
            reasoningMode: 'none',
            webSearchMode: 'optional',
            webSearchPricing: 'openai',
            color: '#4ECDC4',
            bgColor: '#F0FDFA',
            textColor: '#0F766E',
            released: '2024-05-13'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  /**
   * Handle model selection
   */
  const handleModelChange = (modelId: string) => {
    console.log('Model selected:', modelId);
    setSelectedModel(modelId);
    // Here you would typically update your chat state, send to API, etc.
  };

  /**
   * Open model selector
   */
  const handleOpenModelSelector = () => {
    setIsModelSelectorOpen(true);
  };

  /**
   * Close model selector
   */
  const handleCloseModelSelector = () => {
    setIsModelSelectorOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Model Selector Example
          </h1>
          
          <div className="space-y-6">
            {/* Example 1: Basic Usage */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Basic Usage
              </h2>
              <div className="flex items-center gap-4">
                <ModelSelectorButton
                  currentModel={selectedModel}
                  models={availableModels}
                  onClick={handleOpenModelSelector}
                  loading={loading}
                />
                <span className="text-sm text-gray-600">
                  Click to open model selector
                </span>
              </div>
            </div>

            {/* Example 2: Different Variants */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Button Variants
              </h2>
              <div className="flex flex-wrap gap-4">
                <ModelSelectorButton
                  currentModel={selectedModel}
                  models={availableModels}
                  onClick={handleOpenModelSelector}
                  variant="primary"
                  size="sm"
                />
                <ModelSelectorButton
                  currentModel={selectedModel}
                  models={availableModels}
                  onClick={handleOpenModelSelector}
                  variant="secondary"
                  size="md"
                />
                <ModelSelectorButton
                  currentModel={selectedModel}
                  models={availableModels}
                  onClick={handleOpenModelSelector}
                  variant="ghost"
                  size="lg"
                />
              </div>
            </div>

            {/* Current Selection Display */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Current Selection
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm">
                  <strong>Selected Model:</strong> {selectedModel}
                </div>
                {availableModels[selectedModel] && (
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Name:</strong> {availableModels[selectedModel].name}
                  </div>
                )}
              </div>
            </div>

            {/* Usage Instructions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Integration Code
              </h2>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// 1. Import components
import { ModelSelector } from './components/ModelSidebar';
import { ModelSelectorButton } from './components/ModelSelectorButton';

// 2. Set up state
const [selectedModel, setSelectedModel] = useState('your-default-model');
const [isOpen, setIsOpen] = useState(false);

// 3. Add to your component
<ModelSelectorButton
  currentModel={selectedModel}
  models={availableModels}
  onClick={() => setIsOpen(true)}
/>

<ModelSelector
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  value={selectedModel}
  onChange={setSelectedModel}
  models={availableModels}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* The Modal */}
      <ModelSelector
        isOpen={isModelSelectorOpen}
        onClose={handleCloseModelSelector}
        value={selectedModel}
        onChange={handleModelChange}
        models={availableModels}
        loading={loading}
      />
    </div>
  );
}; 