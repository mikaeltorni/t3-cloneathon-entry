/**
 * useLocalState.ts
 * 
 * Custom hook for managing local component state
 * 
 * Hook:
 *   useLocalState
 * 
 * Usage: const [state, setState, resetState] = useLocalState(initialValue);
 */
import { useState, useCallback } from 'react';

/**
 * Custom hook for local state management with reset functionality
 * 
 * @param initialValue - Initial state value
 * @returns Tuple with state, setter, and reset function
 */
export function useLocalState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  
  const resetState = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);
  
  const updateState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(newValue);
  }, []);
  
  return [state, updateState, resetState] as const;
} 