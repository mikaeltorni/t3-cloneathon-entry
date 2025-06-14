/**
 * ModelSidebarStates.tsx
 * 
 * Header, footer, and loading state components for model sidebar
 * 
 * Components:
 *   ModelSidebarStates - Collection of sidebar state components
 * 
 * Usage: <ModelSidebarStates.Loading /> or <ModelSidebarStates.Header />
 */

import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Props for the Header component
 */
interface HeaderProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the Footer component
 */
interface FooterProps {
  /** Total number of models */
  modelCount: number;
  /** Number of pinned models */
  pinnedCount: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the Loading component
 */
interface LoadingProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Header component for model sidebar
 */
const Header: React.FC<HeaderProps> = ({ className }) => (
  <div className={cn('p-4 border-b border-gray-100', className)}>
    <h3 className="text-lg font-semibold text-gray-900">Select Model</h3>
    <p className="text-sm text-gray-600">Choose your AI assistant</p>
  </div>
);

/**
 * Footer component with model statistics
 */
const Footer: React.FC<FooterProps> = ({ modelCount, pinnedCount, className }) => (
  <div className={cn('p-4 border-t border-gray-100 bg-gray-50', className)}>
    <div className="text-xs text-gray-500 text-center">
      {modelCount} models available
      {pinnedCount > 0 && (
        <span className="text-amber-600 ml-1">
          • {pinnedCount} pinned
        </span>
      )}
    </div>
  </div>
);

/**
 * Loading skeleton component
 */
const Loading: React.FC<LoadingProps> = ({ className }) => (
  <div className={cn('bg-white border-l border-gray-200 shadow-lg h-full p-4', className)}>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-12 bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  </div>
);

/**
 * Model sidebar state components collection
 */
export const ModelSidebarStates = {
  Header,
  Footer,
  Loading
}; 