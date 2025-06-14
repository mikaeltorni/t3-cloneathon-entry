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
import { useTokenTracker } from '../hooks/useTokenTracker';
import { tokenizerService } from '../services/tokenizerService';
import { TokenizerControls } from './tokenizer/TokenizerControls';
import { TokenizerActions } from './tokenizer/TokenizerActions';
import { TokenizerInput } from './tokenizer/TokenizerInput';
import { TokenizerMetrics } from './tokenizer/TokenizerMetrics';
import { TokenizerResults } from './tokenizer/TokenizerResults';

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
      stopTracking();
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    await startTracking(inputText);

    const words = inputText.split(' ');
    const chunkSize = Math.max(1, Math.floor(words.length / 20));
    
    for (let i = 0; i < words.length; i += chunkSize) {
      if (!isSimulating) break;
      
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      updateTokens(chunk);
      
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

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    reset();
    setTokenizationResult(null);
    setIsSimulating(false);
  }, [reset]);

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
        <TokenizerControls
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onLoadSample={loadSampleText}
          disabled={isTracking}
        />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border p-6">
        <TokenizerActions
          onTokenize={handleTokenize}
          onSimulateStreaming={handleSimulateStreaming}
          onReset={handleReset}
          canTokenize={!!inputText.trim() && !isTracking}
          canSimulate={!!inputText.trim()}
          isSimulating={isSimulating}
        />
      </div>

      {/* Text Input */}
      <TokenizerInput
        value={inputText}
        onChange={setInputText}
        disabled={isTracking}
      />

      {/* Real-time Token Metrics */}
      <TokenizerMetrics
        metrics={tokenMetrics}
        isVisible={isTracking || tokenMetrics.totalTokens > 0}
      />

      {/* Tokenization Results */}
      <TokenizerResults result={tokenizationResult} />
    </div>
  );
}; 