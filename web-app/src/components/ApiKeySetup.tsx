import { useState } from 'react';

interface ApiKeySetupProps {
  onApiKeySubmit: (apiKey: string) => void;
  currentApiKey: string;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySubmit, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApiKeySubmit(apiKey.trim());
  };

  return (
    <div className="glass-effect rounded-xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-3">🔐</span>
        OpenRouter API Setup
      </h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Getting Started:</h3>
        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
          <li>Visit <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">OpenRouter.ai</a></li>
          <li>Create an account and generate an API key</li>
          <li>Enter your API key below to start analyzing images and text</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            OpenRouter API Key
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your API key is stored locally and never sent to our servers
          </p>
        </div>

        <button
          type="submit"
          disabled={!apiKey.trim()}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            !apiKey.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {currentApiKey ? 'Update API Key' : 'Set API Key'}
        </button>
      </form>

      {currentApiKey && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm flex items-center">
            <span className="mr-2">✅</span>
            API key configured successfully! You can now use the analysis features.
          </p>
        </div>
      )}
    </div>
  );
}; 