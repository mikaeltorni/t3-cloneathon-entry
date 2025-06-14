/**
 * MessageInput.tsx
 * 
 * Component for the message input textarea and send button
 * 
 * Components:
 *   MessageInput
 * 
 * Usage: <MessageInput message={message} onChange={onChange} onSubmit={onSubmit} ... />
 */
import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface MessageInputProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  loading: boolean;
  canSubmit: boolean;
}

/**
 * Message input component with textarea and send button
 * 
 * @param message - Current message content
 * @param onChange - Message change handler
 * @param onKeyDown - Key down handler for shortcuts
 * @param onSubmit - Form submit handler
 * @param textareaRef - Reference to textarea element
 * @param loading - Loading state
 * @param canSubmit - Whether submit is allowed
 * @returns React component
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  onChange,
  onKeyDown,
  onSubmit,
  textareaRef,
  loading,
  canSubmit
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={loading}
            className={cn(
              'w-full px-4 py-3 border border-gray-300 rounded-xl resize-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[48px] max-h-[120px] overflow-y-auto',
              loading && 'opacity-50 cursor-not-allowed'
            )}
            style={{ height: '48px' }}
          />
        </div>
        
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={loading}
          className="px-6 py-3 h-12"
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </form>
  );
}; 