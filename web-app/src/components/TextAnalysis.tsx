import { useState } from 'react';
import { OpenRouterService } from '../services/openrouter';

interface TextAnalysisProps {
  openRouterService: OpenRouterService | null;
}

export const TextAnalysis: React.FC<TextAnalysisProps> = ({ openRouterService }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setError('Please enter a question or prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const analysis = await openRouterService!.analyzeText(prompt.trim());
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    "Explain quantum physics in simple terms",
    "Write a short story about a robot learning to paint",
    "What are the main differences between TypeScript and JavaScript?",
    "How do I implement a binary search algorithm in Python?",
    "Explain the concept of climate change"
  ];

  const loadExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-3">💬</span>
        Text Analysis
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="textPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            Your Question or Prompt
          </label>
          <textarea
            id="textPrompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything... (Ctrl/Cmd + Enter to submit)"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Press Ctrl/Cmd + Enter to quickly submit your prompt
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Example Prompts:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExamplePrompt(example)}
                className="text-left text-xs p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Thinking...
            </div>
          ) : (
            'Ask Question'
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              <span className="font-medium">Error:</span> {error}
            </p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
              <span className="mr-2">🤖</span>
              AI Response:
            </h3>
            <div className="text-blue-700 whitespace-pre-wrap leading-relaxed">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}; 