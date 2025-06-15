/**
 * useTags.ts
 * 
 * Custom hook for tag management operations
 * 
 * Hook:
 *   useTags - Manages tag CRUD operations and state
 * 
 * Usage: const { tags, loading, createTag, updateTag, deleteTag } = useTags();
 */
import { useState, useEffect, useCallback } from 'react';
import { userPreferencesApi } from '../services/userPreferencesApi';
import { useLogger } from './useLogger';
import { useAuth } from './useAuth';
import type { ChatTag } from '../../../src/shared/types';

interface UseTagsReturn {
  tags: ChatTag[];
  loading: boolean;
  error: string | null;
  createTag: (name: string, color: { r: number; g: number; b: number }) => Promise<ChatTag>;
  updateTag: (tagId: string, updates: Partial<Pick<ChatTag, 'name' | 'color'>>) => Promise<ChatTag>;
  deleteTag: (tagId: string) => Promise<void>;
  refreshTags: () => Promise<void>;
}

/**
 * Custom hook for managing tags
 * 
 * Provides tag CRUD operations and maintains local state
 * synchronized with the server
 * 
 * @returns Object with tags state and management functions
 */
export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<ChatTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, initialized } = useAuth();
  const { debug, log, error: logError } = useLogger('useTags');

  /**
   * Load tags from the server
   */
  const loadTags = useCallback(async () => {
    // Don't try to load tags if user is not authenticated
    if (!user) {
      debug('User not authenticated, skipping tag loading');
      setTags([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      debug('Loading tags from server');
      
      const fetchedTags = await userPreferencesApi.getTags();
      setTags(fetchedTags);
      log(`Loaded ${fetchedTags.length} tags`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tags';
      logError('Failed to load tags', err as Error);
      setError(errorMessage);
      // Don't clear existing tags on error, but set empty array if no user
      if (!user) {
        setTags([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, debug, log, logError]);

  /**
   * Create a new tag
   */
  const createTag = useCallback(async (
    name: string, 
    color: { r: number; g: number; b: number }
  ): Promise<ChatTag> => {
    if (!user) {
      throw new Error('User must be authenticated to create tags');
    }

    try {
      debug(`Creating tag: ${name}`);
      const newTag = await userPreferencesApi.createTag(name, color);
      
      setTags(prevTags => [...prevTags, newTag]);
      log(`Created tag: ${name}`);
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      logError(`Failed to create tag: ${name}`, err as Error);
      throw new Error(errorMessage);
    }
  }, [user, debug, log, logError]);

  /**
   * Update an existing tag
   */
  const updateTag = useCallback(async (
    tagId: string,
    updates: Partial<Pick<ChatTag, 'name' | 'color'>>
  ): Promise<ChatTag> => {
    if (!user) {
      throw new Error('User must be authenticated to update tags');
    }

    try {
      debug(`Updating tag: ${tagId}`);
      const updatedTag = await userPreferencesApi.updateTag(tagId, updates);
      
      setTags(prevTags => 
        prevTags.map(tag => 
          tag.id === tagId ? updatedTag : tag
        )
      );
      
      log(`Updated tag: ${tagId}`);
      return updatedTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tag';
      logError(`Failed to update tag: ${tagId}`, err as Error);
      throw new Error(errorMessage);
    }
  }, [user, debug, log, logError]);

  /**
   * Delete a tag
   */
  const deleteTag = useCallback(async (tagId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete tags');
    }

    try {
      debug(`Deleting tag: ${tagId}`);
      await userPreferencesApi.deleteTag(tagId);
      
      setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
      log(`Deleted tag: ${tagId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      logError(`Failed to delete tag: ${tagId}`, err as Error);
      throw new Error(errorMessage);
    }
  }, [user, debug, log, logError]);

  /**
   * Refresh tags from server
   */
  const refreshTags = useCallback(async (): Promise<void> => {
    await loadTags();
  }, [loadTags]);

  // Load tags when auth is initialized and user changes
  useEffect(() => {
    if (initialized) {
      loadTags();
    }
  }, [initialized, user, loadTags]);

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refreshTags
  };
}; 