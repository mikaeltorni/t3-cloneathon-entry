/**
 * AppList.tsx
 * 
 * Component for displaying and managing user-created apps
 * Shows to the right of the sidebar when no chat is active
 * 
 * Components:
 *   AppList - List of apps with selection and management
 *   AppItem - Individual app item with actions
 * 
 * Usage: <AppList apps={apps} onAppSelect={onAppSelect} onAppEdit={onAppEdit} />
 */

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';
import { useLogger } from '../hooks/useLogger';
import type { App } from '../../../src/shared/types';

interface AppListProps {
  apps: App[];
  currentAppId: string | null;
  onAppSelect: (appId: string) => void;
  onAppEdit?: (app: App) => void;
  onAppDelete?: (appId: string) => void;
  className?: string;
}

interface AppItemProps {
  app: App;
  isSelected: boolean;
  onSelect: (appId: string) => void;
  onEdit?: (app: App) => void;
  onDelete?: (appId: string) => void;
}

/**
 * Individual app item component
 */
const AppItem: React.FC<AppItemProps> = ({
  app,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { debug } = useLogger('AppItem');

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
        'group relative p-4 rounded-lg border cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
      )}
      onClick={handleSelect}
    >
      {/* App name */}
      <h3 className={cn(
        'font-semibold text-lg mb-2 truncate',
        isSelected 
          ? 'text-blue-900 dark:text-blue-100' 
          : 'text-gray-900 dark:text-slate-100'
      )}>
        {app.name}
      </h3>

      {/* System prompt preview */}
      <p className={cn(
        'text-sm mb-3 overflow-hidden',
        isSelected 
          ? 'text-blue-700 dark:text-blue-200' 
          : 'text-gray-600 dark:text-slate-400'
      )}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical' as any,
        overflow: 'hidden'
      }}>
        {app.systemPrompt}
      </p>

      {/* Created date */}
      <p className={cn(
        'text-xs mb-3',
        isSelected 
          ? 'text-blue-600 dark:text-blue-300' 
          : 'text-gray-500 dark:text-slate-500'
      )}>
        Created {new Date(app.createdAt).toLocaleDateString()}
      </p>

      {/* Actions */}
      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
 * Main AppList component
 */
export const AppList: React.FC<AppListProps> = ({
  apps,
  currentAppId,
  onAppSelect,
  onAppEdit,
  onAppDelete,
  className
}) => {
  const { debug } = useLogger('AppList');

  return (
    <div 
      className={cn(
        'fixed top-0 left-80 w-96 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-600 z-30',
        'overflow-y-auto custom-scrollbar',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Your Apps
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Select an app to start chatting with your custom AI assistant
        </p>
      </div>

      {/* Apps list */}
      <div className="p-4">
        {apps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
              No apps yet
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              Create your first app to get started with custom AI assistants
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <AppItem
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