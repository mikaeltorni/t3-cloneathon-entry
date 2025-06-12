/**
 * useReasoningState.ts
 * 
 * Custom hook for managing reasoning expansion state
 * Extracted from ChatInterface to improve code organization
 * 
 * Hook:
 *   useReasoningState
 * 
 * Features:
 *   - Reasoning visibility state management
 *   - Automatic temp ID to server ID mapping
 *   - Persistent state across message updates
 *   - Performance optimized with memoization
 * 
 * Usage: const { expandedReasoningIds, handleToggleReasoning } = useReasoningState(messages);
 */
import { useState, useCallback, useEffect } from 'react';
import { useLogger } from './useLogger';
import type { ChatMessage } from '../../../src/shared/types';

/**
 * Reasoning state hook return interface
 */
interface UseReasoningStateReturn {
  expandedReasoningIds: Set<string>;
  handleToggleReasoning: (messageId: string) => void;
  isReasoningExpanded: (messageId: string) => boolean;
}

/**
 * Custom hook for managing reasoning expansion state
 * 
 * Provides:
 * - Reasoning visibility state management
 * - Automatic ID mapping for temp-to-server transitions
 * - Performance optimized callbacks
 * 
 * @param messages - Current conversation messages
 * @returns Reasoning state and operations
 */
export const useReasoningState = (messages: ChatMessage[]): UseReasoningStateReturn => {
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Set<string>>(new Set());
  const { debug } = useLogger('useReasoningState');

  /**
   * Toggle reasoning expansion for a message
   * 
   * @param messageId - ID of the message to toggle
   */
  const handleToggleReasoning = useCallback((messageId: string) => {
    setExpandedReasoningIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        debug(`Collapsed reasoning for message: ${messageId}`);
      } else {
        newSet.add(messageId);
        debug(`Expanded reasoning for message: ${messageId}`);
      }
      return newSet;
    });
  }, [debug]);

  /**
   * Check if reasoning is expanded for a message
   * 
   * @param messageId - ID of the message to check
   * @returns Whether reasoning is expanded
   */
  const isReasoningExpanded = useCallback((messageId: string): boolean => {
    return expandedReasoningIds.has(messageId);
  }, [expandedReasoningIds]);

  /**
   * Effect to preserve reasoning visibility when message IDs change
   * (e.g., when temp messages get replaced with server messages)
   */
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // Check if we have any temp message IDs in expandedReasoningIds
    const tempIds = Array.from(expandedReasoningIds).filter(id => id.startsWith('temp-'));
    
    if (tempIds.length > 0) {
      debug('Checking for temp message ID updates...', { tempIds });
      
      // For each temp ID, try to find the corresponding server message
      const updates = new Map<string, string>();
      
      tempIds.forEach(tempId => {
        // Find the message that was recently created and has reasoning
        const latestAssistantWithReasoning = messages
          .filter(msg => msg.role === 'assistant' && msg.reasoning && !msg.id.startsWith('temp-'))
          .slice(-1)[0]; // Get the most recent one
        
        if (latestAssistantWithReasoning) {
          updates.set(tempId, latestAssistantWithReasoning.id);
          debug(`Mapping temp ID ${tempId} to server ID ${latestAssistantWithReasoning.id}`);
        }
      });
      
      // Update expandedReasoningIds if we found any mappings
      if (updates.size > 0) {
        setExpandedReasoningIds(prev => {
          const newSet = new Set(prev);
          
          updates.forEach((newId, oldId) => {
            if (newSet.has(oldId)) {
              newSet.delete(oldId);
              newSet.add(newId);
              debug(`Updated reasoning visibility: ${oldId} -> ${newId}`);
            }
          });
          
          return newSet;
        });
      }
    }
  }, [messages, expandedReasoningIds, debug]);

  return {
    expandedReasoningIds,
    handleToggleReasoning,
    isReasoningExpanded
  };
}; 