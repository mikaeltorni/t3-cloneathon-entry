/**
 * useChatApiService.ts
 * 
 * Authenticated API service creation hook
 * 
 * Hooks:
 *   useChatApiService
 * 
 * Features:
 *   - Authenticated API service creation
 *   - Token management with refresh
 *   - User authentication validation
 * 
 * Usage: const chatApiService = useChatApiService();
 */
import { useMemo } from 'react';
import { createChatApiService } from '../services/chatApi';
import { useAuth } from './useAuth';
import { useLogger } from './useLogger';

/**
 * Create authenticated chat API service
 * 
 * Creates a chat API service with proper authentication token handling,
 * including automatic token refresh and validation.
 * 
 * @returns Authenticated chat API service instance
 */
export const useChatApiService = () => {
  const { user } = useAuth();
  const { debug } = useLogger('useChatApiService');

  // Create authenticated API service
  const chatApiService = useMemo(() => {
    const getAuthToken = async () => {
      if (user) {
        try {
          // Get fresh ID token from Firebase with force refresh periodically
          debug('Getting auth token for API request...', { 
            userId: user.uid, 
            userEmail: user.email 
          });
          
          // Check if user is still valid before trying to get token
          if (!user.uid) {
            debug('User object exists but has no UID');
            return null;
          }
          
          const token = await user.getIdToken(false); // Don't force refresh every time
          debug(`Auth token obtained: ${token ? 'Yes' : 'No'}`);
          
          // Validate token is not empty
          if (!token || token.trim().length === 0) {
            debug('Token is empty, trying force refresh...');
            const freshToken = await user.getIdToken(true);
            debug(`Fresh auth token obtained: ${freshToken ? 'Yes' : 'No'}`);
            return freshToken;
          }
          
          return token;
        } catch (error) {
          debug('Failed to get auth token, trying force refresh...', error);
          // If normal token fails, try force refresh
          try {
            const freshToken = await user.getIdToken(true);
            debug(`Fresh auth token obtained: ${freshToken ? 'Yes' : 'No'}`);
            return freshToken;
          } catch (refreshError) {
            debug('Failed to get fresh auth token', refreshError);
            return null;
          }
        }
      }
      debug('No user available for auth token');
      return null;
    };

    debug('Creating new ChatApiService', { hasUser: !!user });
    return createChatApiService(getAuthToken);
  }, [user, debug]);

  return chatApiService;
}; 