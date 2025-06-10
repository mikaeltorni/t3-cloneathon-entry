import { useState, useEffect } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ImageAnalysis } from './components/ImageAnalysis';
import { TextAnalysis } from './components/TextAnalysis';
import { createOpenRouterService, OpenRouterService } from './services/openrouter';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [openRouterService, setOpenRouterService] = useState<OpenRouterService | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openrouter-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setOpenRouterService(createOpenRouterService(savedApiKey));
    }
  }, []);

  const handleApiKeySubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('openrouter-api-key', newApiKey);
    setOpenRouterService(createOpenRouterService(newApiKey));
  };

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

        {/* API Key Setup */}
        <ApiKeySetup 
          onApiKeySubmit={handleApiKeySubmit} 
          currentApiKey={apiKey} 
        />

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
