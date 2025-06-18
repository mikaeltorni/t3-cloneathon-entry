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

import React, { useState } from 'react';
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
      className={cn(
        'group relative p-4 rounded-lg border cursor-pointer transition-all duration-200 min-w-72 max-w-80',
        'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
      )}
      onClick={handleSelect}
    >
      {/* App name */}
      <h3 className={cn(
        'font-semibold text-base mb-2 truncate',
        isSelected 
          ? 'text-blue-900 dark:text-blue-100' 
          : 'text-gray-900 dark:text-slate-100'
      )}>
        {app.name}
      </h3>

      {/* System prompt preview */}
      <p 
        className={cn(
          'text-sm mb-3 overflow-hidden',
          isSelected 
            ? 'text-blue-700 dark:text-blue-200' 
            : 'text-gray-600 dark:text-slate-400'
        )}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden'
        }}
      >
        {app.systemPrompt}
      </p>

      {/* Created date */}
      <p className={cn(
        'text-xs mb-2',
        isSelected 
          ? 'text-blue-600 dark:text-blue-300' 
          : 'text-gray-500 dark:text-slate-500'
      )}>
        Created {new Date(app.createdAt).toLocaleDateString()}
      </p>

      {/* Actions */}
      <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="p-1 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            title="Edit app"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <>
            {showDeleteConfirm ? (
              <div className="flex space-x-1">
                <button
                  onClick={handleCancelDelete}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="p-1 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                title="Delete app"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
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

  return (
    <div className={cn('bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-600', className)}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Choose Your AI Assistant
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Select an app to start chatting with a custom AI assistant
            </p>
          </div>
          {onNewApp && (
            <button
              onClick={onNewApp}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New App
            </button>
          )}
        </div>

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
        )}
      </div>
    </div>
  );
}; 