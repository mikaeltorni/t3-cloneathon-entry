import { useState, useEffect } from 'react';
import { ImageAnalysis } from './components/ImageAnalysis';
import { TextAnalysis } from './components/TextAnalysis';
import { createOpenRouterService, OpenRouterService } from './services/openrouter';

function App() {
  const [openRouterService, setOpenRouterService] = useState<OpenRouterService | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load API key from environment variable on component mount
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (envApiKey && envApiKey.trim()) {
      console.log('✅ Using API key from VITE_OPENROUTER_API_KEY environment variable');
      setOpenRouterService(createOpenRouterService(envApiKey.trim()));
      setError(null);
    } else {
      console.error('❌ VITE_OPENROUTER_API_KEY environment variable not found or empty');
      setError('VITE_OPENROUTER_API_KEY environment variable is required but not set.');
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-bold text-red-800 mb-2">Environment Variable Required</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="bg-red-100 rounded-lg p-3 text-left">
              <p className="text-sm text-red-800 font-medium mb-2">To fix this:</p>
              <code className="text-xs bg-red-200 px-2 py-1 rounded block">
                VITE_OPENROUTER_API_KEY=your_api_key_here
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="mr-3">🚀</span>
            OpenRouter AI Analysis
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powered by Google's Gemini 2.5 Flash model via OpenRouter. 
            Analyze images and get AI-powered text responses with cutting-edge technology.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/50 rounded-lg p-1 backdrop-blur-sm border border-white/20">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'image'
                  ? 'bg-white shadow-md text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <span className="mr-2">🖼️</span>
              Image Analysis
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'text'
                  ? 'bg-white shadow-md text-green-600 border border-green-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <span className="mr-2">💬</span>
              Text Analysis
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'image' ? (
            <ImageAnalysis openRouterService={openRouterService} />
          ) : (
            <TextAnalysis openRouterService={openRouterService} />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <div className="glass-effect rounded-lg p-4 inline-block">
            <p className="mb-2">
              Built with React, TypeScript, and Tailwind CSS
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Google Gemini 2.5 Flash
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                OpenRouter API
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Modern Web Tech
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
