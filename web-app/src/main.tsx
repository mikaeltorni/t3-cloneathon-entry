/**
 * main.tsx
 * 
 * Application entry point and root component rendering
 * 
 * Features:
 *   - React 18 concurrent mode with createRoot
 *   - Global error boundary for crash protection
 *   - CSS imports for styling
 *   - Development mode logging
 * 
 * Usage: Entry point for the React application
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logger } from './utils/logger'
import App from './App'
import './index.css'

// Log application startup
logger.info('Starting OpenRouter Chat application...')

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Please ensure the HTML template includes a div with id="root".')
}

// Create React root and render application
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

logger.info('React application rendered successfully')
