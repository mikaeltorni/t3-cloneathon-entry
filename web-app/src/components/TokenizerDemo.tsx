/**
 * TokenizerDemo.tsx
 * 
 * Demonstration component showcasing the tokenizer service and token tracking
 * 
 * Components:
 *   TokenizerDemo - Interactive demo with real-time tokenization
 * 
 * Features:
 *   - Text input with live token counting
 *   - Model selection dropdown
 *   - Real-time TPS simulation
 *   - Cost estimation display
 *   - Provider-specific tokenization examples
 * 
 * Usage: <TokenizerDemo />
 */

import React, { useState, useCallback } from 'react';
import { Play, Square, RotateCcw, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTokenTracker } from '../hooks/useTokenTracker';
import { TokenMetricsDisplay } from './TokenMetricsDisplay';
import { tokenizerService } from '../services/tokenizerService';

/**
 * Sample texts for different use cases
 */
const SAMPLE_TEXTS = {
  short: "Hello, how are you doing today?",
  medium: "Explain the concept of quantum computing in simple terms. How does it differ from classical computing, and what are its potential applications?",
  long: `Artificial Intelligence has revolutionized many industries over the past decade. From machine learning algorithms that power recommendation systems to natural language processing models that enable sophisticated chatbots, AI continues to reshape how we interact with technology. 

The development of large language models like GPT, Claude, and others has particularly accelerated progress in natural language understanding and generation. These models are trained on vast amounts of text data and can perform a wide variety of tasks including writing, analysis, coding, and creative work.

However, with great power comes great responsibility. As AI systems become more capable, we must carefully consider their ethical implications, potential biases, and societal impact. The future of AI development will likely focus on creating more responsible, transparent, and beneficial systems.`,
  code: `function tokenizeText(text: string, model: string): Promise<TokenizationResult> {
  const modelInfo = getModelInfo(model);
  
  switch (modelInfo.provider) {
    case 'openai':
      return tokenizeOpenAI(text, model);
    case 'anthropic':
      return tokenizeAnthropic(text, model);
    case 'deepseek':
      return tokenizeDeepSeek(text, model);
    case 'google':
      return tokenizeGoogle(text, model);
    default:
      throw new Error(\`Unsupported provider: \${modelInfo.provider}\`);
  }
}`
};

/**
 * Tokenizer demonstration component
 */
export const TokenizerDemo: React.FC = () => {
  const [inputText, setInputText] = useState(SAMPLE_TEXTS.medium);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [isSimulating, setIsSimulating] = useState(false);
  const [tokenizationResult, setTokenizationResult] = useState<any>(null);

  const { 
    tokenMetrics, 
    isTracking, 
    startTracking, 
    updateTokens, 
    stopTracking, 
    reset
    // getFormattedMetrics // Available for future formatting needs
  } = useTokenTracker(selectedModel, {
    onComplete: (metrics) => {
      console.log('Token tracking completed:', metrics);
    }
  });

  /**
   * Handle tokenization of input text
   */
  const handleTokenize = useCallback(async () => {
    try {
      const result = await tokenizerService.tokenize(inputText, selectedModel);
      setTokenizationResult(result);
    } catch (error) {
      console.error('Tokenization failed:', error);
    }
  }, [inputText, selectedModel]);

  /**
   * Simulate streaming with real-time token tracking
   */
  const handleSimulateStreaming = useCallback(async () => {
    if (isSimulating) {
      // Stop simulation
      stopTracking();
      setIsSimulating(false);
      return;
    }

    // Start simulation
    setIsSimulating(true);
    await startTracking(inputText);

    // Simulate streaming chunks
    const words = inputText.split(' ');
    const chunkSize = Math.max(1, Math.floor(words.length / 20)); // 20 chunks
    
    for (let i = 0; i < words.length; i += chunkSize) {
      if (!isSimulating) break;
      
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      updateTokens(chunk);
      
      // Simulate realistic streaming delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    }

    stopTracking();
    setIsSimulating(false);
  }, [inputText, selectedModel, isSimulating, startTracking, updateTokens, stopTracking]);

  /**
   * Load sample text
   */
  const loadSampleText = useCallback((key: keyof typeof SAMPLE_TEXTS) => {
    setInputText(SAMPLE_TEXTS[key]);
    reset();
    setTokenizationResult(null);
  }, [reset]);

  /**
   * Handle model change
   */
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    reset();
    setTokenizationResult(null);
  }, [reset]);

  // const formattedMetrics = getFormattedMetrics(); // Available for future use
  const supportedModels = tokenizerService.getSupportedModels();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Multi-Provider Tokenizer Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test real-time tokenization and tokens-per-second tracking across OpenAI, Anthropic, 
          DeepSeek, and Google models with accurate cost estimation.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Model Selection */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTracking}
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
                  onClick={() => loadSampleText(key as keyof typeof SAMPLE_TEXTS)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md border transition-colors',
                    'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  disabled={isTracking}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTokenize}
            disabled={!inputText.trim() || isTracking}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Zap className="w-4 h-4" />
            Tokenize
          </button>

          <button
            onClick={handleSimulateStreaming}
            disabled={!inputText.trim()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
              isSimulating 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSimulating ? 'focus:ring-red-500' : 'focus:ring-green-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSimulating ? (
              <>
                <Square className="w-4 h-4" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Simulate Streaming
              </>
            )}
          </button>

          <button
            onClick={() => {
              reset();
              setTokenizationResult(null);
              setIsSimulating(false);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
              'border border-gray-300 text-gray-700 hover:bg-gray-50',
              'focus:outline-none focus:ring-2 focus:ring-gray-500'
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Text Input */}
      <div className="bg-white rounded-lg border p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Text
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to tokenize..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isTracking}
        />
        <div className="mt-2 text-sm text-gray-500">
          {inputText.length} characters
        </div>
      </div>

      {/* Real-time Token Metrics */}
      {(isTracking || tokenMetrics.totalTokens > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Real-time Metrics</h2>
          
          {/* Full Variant */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Full Display</h3>
            <TokenMetricsDisplay 
              metrics={{
                inputTokens: tokenMetrics.inputTokens,
                outputTokens: tokenMetrics.outputTokens,
                totalTokens: tokenMetrics.totalTokens,
                tokensPerSecond: tokenMetrics.tokensPerSecond,
                startTime: tokenMetrics.startTime,
                endTime: tokenMetrics.endTime,
                duration: tokenMetrics.duration,
                estimatedCost: tokenMetrics.estimatedCost
              }}
              variant="detailed"
            />
          </div>
        </div>
      )}

      {/* Tokenization Results */}
      {tokenizationResult && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tokenization Result</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-mono">{tokenizationResult.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-mono capitalize">{tokenizationResult.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Count:</span>
                  <span className="font-mono">{tokenizationResult.tokenCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="font-mono">${tokenizationResult.estimatedCost?.toFixed(6) || '0.000000'}</span>
                </div>
              </div>
            </div>

            {/* Token Array Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Token Array (First 20)</h3>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs overflow-x-auto">
                [{tokenizationResult.tokens.slice(0, 20).join(', ')}{tokenizationResult.tokens.length > 20 ? ', ...' : ''}]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Basic Tokenization</h3>
            <pre className="bg-white rounded p-3 overflow-x-auto">
{`import { tokenizerService } from './services/tokenizerService';

const result = await tokenizerService.tokenize(text, 'gpt-4o');
console.log(\`Tokens: \${result.tokenCount}, Cost: $\${result.estimatedCost}\`);`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Real-time Token Tracking</h3>
            <pre className="bg-white rounded p-3 overflow-x-auto">
{`import { useTokenTracker } from './hooks/useTokenTracker';

const { tokenMetrics, startTracking, updateTokens, stopTracking } = useTokenTracker('gpt-4o');

// Start tracking
await startTracking(inputText);

// Update during streaming
onStreamChunk((chunk) => updateTokens(chunk));

// Stop and get final metrics
const finalMetrics = stopTracking();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}; 