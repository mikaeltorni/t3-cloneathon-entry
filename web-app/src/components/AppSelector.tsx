/**
 * AppSelector.tsx
 * 
 * Component for selecting apps within the main chat interface
 * Appears in place of the context window when no thread is selected
 * 
 * Components:
 *   AppSelector - Horizontal app selection interface
 *   AppSelectorItem - Individual app selection card
 * 
 * Usage: <AppSelector apps={apps} onAppSelect={onSelect} />
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { useLogger } from '../hooks/useLogger';
import type { App } from '../../../src/shared/types';

interface AppSelectorProps {
  apps: App[];
  currentAppId: string | null;
  onAppSelect: (appId: string) => void;
  onAppEdit?: (app: App) => void;
  onAppDelete?: (appId: string) => void;
  onNewApp?: () => void;
  className?: string;
}

interface AppSelectorItemProps {
  app: App;
  isSelected: boolean;
  onSelect: (appId: string) => void;
  onEdit?: (app: App) => void;
  onDelete?: (appId: string) => void;
}

/**
 * Individual app selector item
 */
const AppSelectorItem: React.FC<AppSelectorItemProps> = ({
  app,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { debug } = useLogger('AppSelectorItem');

  const handleSelect = () => {
    debug(`App selected: ${app.name}`);
    onSelect(app.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    debug(`App edit requested: ${app.name}`);
    onEdit?.(app);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    debug(`App delete confirmed: ${app.name}`);
    onDelete?.(app.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'relative min-w-[280px] max-w-[320px] p-4 rounded-lg border cursor-pointer transition-all duration-200 group',
        'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
        {
          'border-purple-200 dark:border-purple-700 ring-2 ring-purple-500/20 dark:ring-purple-400/30': isSelected,
          'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600': !isSelected
        }
      )}
    >
      {/* Header with action buttons */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 line-clamp-1">
            {app.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded transition-colors"
              title="Edit app"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className={cn(
                'p-1.5 rounded transition-colors',
                showDeleteConfirm
                  ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                  : 'text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400'
              )}
              title={showDeleteConfirm ? "Click again to confirm" : "Delete app"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          
          {showDeleteConfirm && (
            <button
              onClick={handleCancelDelete}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded transition-colors"
              title="Cancel delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* System prompt preview */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {app.systemPrompt}
        </p>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full ring-2 ring-white dark:ring-slate-800"></div>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex flex-col items-center justify-center z-10 gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center px-4">
            Delete "{app.name}"?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main AppSelector component - horizontal scrolling app selection
 */
export const AppSelector: React.FC<AppSelectorProps> = ({
  apps,
  currentAppId,
  onAppSelect,
  onAppEdit,
  onAppDelete,
  onNewApp,
  className
}) => {
  const { debug } = useLogger('AppSelector');

  // Debug logging to see what props are being passed
  useEffect(() => {
    debug(`AppSelector rendered with ${apps.length} apps:`, apps);
    debug(`Current app ID: ${currentAppId}`);
  }, [apps, currentAppId, debug]);

  return (
    <div className={cn('bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-600', className)}>
      <div className="p-4">
        {/* Apps horizontal scroll */}
        {apps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
              No apps yet
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
              Create your first app to get started with custom AI assistants
            </p>
            {onNewApp && (
              <button
                onClick={onNewApp}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-sm transition-all duration-200 inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First App
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header - Only shown when there are apps */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Choose Your AI Assistant
                </h2>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Select an app to start chatting with a custom AI assistant
                </p>
              </div>
              {onNewApp && (
                <button
                  onClick={onNewApp}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New App
                </button>
              )}
            </div>

            {/* Apps list */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {apps.map((app) => (
                <AppSelectorItem
                  key={app.id}
                  app={app}
                  isSelected={currentAppId === app.id}
                  onSelect={onAppSelect}
                  onEdit={onAppEdit}
                  onDelete={onAppDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 