/**
 * WelcomeMessage.tsx
 * 
 * Welcome screen component for empty conversation state
 * 
 * Components:
 *   WelcomeMessage
 * 
 * Features:
 *   - Welcoming empty state design
 *   - Feature showcase cards
 *   - Responsive grid layout
 *   - Gradient branding elements
 * 
 * Usage: <WelcomeMessage />
 */
import React from 'react';

/**
 * Welcome message for empty conversation state
 * 
 * @returns React component displaying welcome content and feature highlights
 */
export const WelcomeMessage: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to OpenRouter Chat!
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Start a conversation with any AI model. Upload images, ask questions, 
          and explore the capabilities of different language models.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💬 Ask Anything</h3>
            <p className="text-blue-700">Get help with coding, writing, analysis, and more</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">🖼️ Upload Images</h3>
            <p className="text-purple-700">Share images for analysis and description</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">🧠 Reasoning Models</h3>
            <p className="text-green-700">Enable reasoning for complex problem solving</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">⚡ Multiple Models</h3>
            <p className="text-orange-700">Switch between different AI models</p>
          </div>
        </div>
      </div>
    </div>
  );
});

WelcomeMessage.displayName = 'WelcomeMessage'; 