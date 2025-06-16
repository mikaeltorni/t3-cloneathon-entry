/**
 * useModels.ts
 * 
 * Hook for accessing models context
 * 
 * Hook:
 *   useModels
 * 
 * Usage: import { useModels } from '../hooks/useModels'
 */
import { useContext } from 'react';
import { ModelsContext } from '../contexts/ModelsContext';
import type { ModelsContextType } from '../contexts/ModelsContext';

export const useModels = (): ModelsContextType => {
  const context = useContext(ModelsContext);
  if (context === undefined) {
    throw new Error('useModels must be used within a ModelsProvider');
  }
  return context;
}; 