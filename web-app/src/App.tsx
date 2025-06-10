import { useState, useEffect } from 'react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ImageAnalysis } from './components/ImageAnalysis';
import { TextAnalysis } from './components/TextAnalysis';
import { createOpenRouterService, OpenRouterService } from './services/openrouter';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [openRouterService, setOpenRouterService] = useState<OpenRouterService | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [apiKeySource, setApiKeySource] = useState<'env' | 'storage' | 'manual' | null>(null);

  // Load API key from environment variable or localStorage on component mount
  useEffect(() => {
    // First, try environment variable (Vite requires VITE_ prefix)
    const envApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (envApiKey && envApiKey.trim()) {
      console.log('✅ Using API key from VITE_OPENROUTER_API_KEY environment variable');
      setApiKey(envApiKey.trim());
      setOpenRouterService(createOpenRouterService(envApiKey.trim()));
      setApiKeySource('env');
      return;
    }

    // Fall back to localStorage
    const savedApiKey = localStorage.getItem('openrouter-api-key');
    if (savedApiKey && savedApiKey.trim()) {
      console.log('📁 Using API key from localStorage');
      setApiKey(savedApiKey);
      setOpenRouterService(createOpenRouterService(savedApiKey));
      setApiKeySource('storage');
      return;
    }

    // No API key found - user needs to enter manually
    setApiKeySource('manual');
  }, []);

  const handleApiKeySubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('openrouter-api-key', newApiKey);
    setOpenRouterService(createOpenRouterService(newApiKey));
    setApiKeySource('manual');
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
          
          {/* API Key Status */}
          {apiKeySource && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {apiKeySource === 'env' && (
                <>
                  <span className="mr-1">🌍</span>
                  API key loaded from environment variable
                </>
              )}
              {apiKeySource === 'storage' && (
                <>
                  <span className="mr-1">💾</span>
                  API key loaded from browser storage
                </>
              )}
              {apiKeySource === 'manual' && (
                <>
                  <span className="mr-1">✋</span>
                  API key entered manually
                </>
              )}
            </div>
          )}
        </header>

        {/* API Key Setup - Only show if no environment variable is set */}
        {apiKeySource !== 'env' && (
          <ApiKeySetup 
            onApiKeySubmit={handleApiKeySubmit} 
            currentApiKey={apiKey}
            isEnvKeyAvailable={false}
          />
        )}

        {/* Show environment key info if available */}
        {apiKeySource === 'env' && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌍</span>
              <div>
                <h3 className="font-semibold text-green-800">Environment Configuration Active</h3>
                <p className="text-green-700 text-sm">
                  API key is automatically loaded from <code className="bg-green-100 px-1 rounded">VITE_OPENROUTER_API_KEY</code> environment variable.
                  No manual setup required!
                </p>
              </div>
            </div>
          </div>
        )}

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
