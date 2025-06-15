/**
 * TokenizerResults.tsx
 * 
 * Component for displaying tokenization results and usage examples
 * 
 * Components:
 *   TokenizerResults - Displays tokenization results with basic info, token preview, and usage examples
 * 
 * Usage: <TokenizerResults result={tokenizationResult} />
 */

import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Interface for tokenization result data
 */
interface TokenizationResult {
  model: string;
  provider: string;
  tokenCount: number;
  estimatedCost?: number;
  tokens: (string | number)[];
  metadata?: Record<string, unknown>;
}

/**
 * Props for the TokenizerResults component
 */
interface TokenizerResultsProps {
  /** The tokenization result to display */
  result: TokenizationResult | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component for displaying tokenization results and usage examples
 * 
 * @param result - The tokenization result to display
 * @param className - Additional CSS classes
 * @returns JSX element containing the results display
 */
export const TokenizerResults: React.FC<TokenizerResultsProps> = ({
  result,
  className
}) => {
  if (!result) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tokenization Results */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tokenization Result</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-mono">{result.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-mono capitalize">{result.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Count:</span>
                <span className="font-mono">{result.tokenCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-mono">${result.estimatedCost?.toFixed(6) || '0.000000'}</span>
              </div>
            </div>
          </div>

          {/* Token Array Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Token Array (First 20)</h3>
            <div className="bg-gray-50 rounded p-3 font-mono text-xs overflow-x-auto">
              [{result.tokens.slice(0, 20).join(', ')}{result.tokens.length > 20 ? ', ...' : ''}]
            </div>
          </div>
        </div>
      </div>

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