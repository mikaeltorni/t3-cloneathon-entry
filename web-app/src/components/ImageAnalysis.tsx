import { useState } from 'react';
import { OpenRouterService } from '../services/openrouter';

interface ImageAnalysisProps {
  openRouterService: OpenRouterService | null;
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ openRouterService }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('What is in this image?');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!openRouterService) {
      setError('Please provide your OpenRouter API key first');
      return;
    }

    if (!imageUrl.trim()) {
      setError('Please provide an image URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const analysis = await openRouterService.analyzeImage(imageUrl.trim(), prompt.trim());
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const defaultImageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";

  const loadDefaultImage = () => {
    setImageUrl(defaultImageUrl);
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-3">🖼️</span>
        Image Analysis
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <div className="flex gap-2">
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <button
              onClick={loadDefaultImage}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Use Demo
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Prompt
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to know about this image?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {imageUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full h-48 object-cover rounded-lg shadow-md"
              onError={() => setError('Failed to load image. Please check the URL.')}
            />
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !openRouterService}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            loading || !openRouterService
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            'Analyze Image'
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <h3 className="font-medium text-green-800 mb-2 flex items-center">
              <span className="mr-2">✅</span>
              Analysis Result:
            </h3>
            <p className="text-green-700 whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 