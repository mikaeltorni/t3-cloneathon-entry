/**
 * TokenizerActions.tsx
 * 
 * Component for tokenizer action buttons
 * 
 * Components:
 *   TokenizerActions
 * 
 * Usage: <TokenizerActions onTokenize={onTokenize} onSimulate={onSimulate} onReset={onReset} />
 */
import React from 'react';
import { Play, Square, RotateCcw, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TokenizerActionsProps {
  onTokenize: () => void;
  onSimulateStreaming: () => void;
  onReset: () => void;
  canTokenize: boolean;
  canSimulate: boolean;
  isSimulating: boolean;
}

/**
 * Action buttons for tokenizer operations
 * 
 * @param onTokenize - Tokenize action handler
 * @param onSimulateStreaming - Streaming simulation handler
 * @param onReset - Reset action handler
 * @param canTokenize - Whether tokenization is allowed
 * @param canSimulate - Whether simulation is allowed
 * @param isSimulating - Whether currently simulating
 * @returns React component
 */
export const TokenizerActions: React.FC<TokenizerActionsProps> = ({
  onTokenize,
  onSimulateStreaming,
  onReset,
  canTokenize,
  canSimulate,
  isSimulating
}) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={onTokenize}
        disabled={!canTokenize}
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
        onClick={onSimulateStreaming}
        disabled={!canSimulate}
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
        onClick={onReset}
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
  );
}; 