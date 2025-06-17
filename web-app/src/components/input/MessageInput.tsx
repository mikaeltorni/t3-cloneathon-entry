/**
 * MessageInput.tsx
 * 
 * Component for the message input textarea, attachment buttons, and send button
 * Now includes mobile-friendly attachment buttons for images and documents
 * Input remains writable during content generation
 * 
 * Components:
 *   MessageInput
 * 
 * Usage: <MessageInput message={message} onChange={onChange} onSubmit={onSubmit} ... />
 */
import React, { useRef } from 'react';
import { Button } from '../ui/Button';
import { Image, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLogger } from '../../hooks/useLogger';
import { useFileProcessing } from '../../hooks/fileDropZone/useFileProcessing';
import type { ImageAttachment, DocumentAttachment } from '../../../../src/shared/types';

interface MessageInputProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  loading: boolean; // True when sending a message
  isGenerating?: boolean; // True when AI is generating content
  canSubmit: boolean;
  // New props for file attachments
  images?: ImageAttachment[];
  documents?: DocumentAttachment[];
  onImagesChange?: (images: ImageAttachment[]) => void;
  onDocumentsChange?: (documents: DocumentAttachment[]) => void;
  maxImages?: number;
  maxDocuments?: number;
  // Mobile focus tracking
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

/**
 * Message input component with textarea, attachment buttons, and send button
 * Now includes mobile-friendly file upload capabilities
 * Input remains writable during content generation
 * 
 * @param message - Current message content
 * @param onChange - Message change handler
 * @param onKeyDown - Key down handler for shortcuts
 * @param onSubmit - Form submit handler
 * @param textareaRef - Reference to textarea element
 * @param loading - Loading state (sending message)
 * @param isGenerating - Generating state (AI is responding)
 * @param canSubmit - Whether submit is allowed
 * @param images - Current image attachments
 * @param documents - Current document attachments
 * @param onImagesChange - Images change handler
 * @param onDocumentsChange - Documents change handler
 * @param maxImages - Maximum number of images allowed
 * @param maxDocuments - Maximum number of documents allowed
 * @returns React component
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  onChange,
  onKeyDown,
  onSubmit,
  textareaRef,
  loading,
  isGenerating = false,
  canSubmit,
  images = [],
  documents = [],
  onImagesChange,
  onDocumentsChange,
  maxImages = 5,
  maxDocuments = 5,
  onFocus,
  onBlur
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { debug, warn } = useLogger('MessageInput');
  const { processImageFile, processDocumentFile } = useFileProcessing();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };

  /**
   * Handle image file selection
   */
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onImagesChange) return;

    // Check limits
    if (images.length >= maxImages) {
      warn(`Maximum ${maxImages} images allowed`);
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    debug(`Processing ${filesToProcess.length} image files`);

    const newImages: ImageAttachment[] = [];
    for (const file of filesToProcess) {
      const result = await processImageFile(file);
      if (result.success && result.attachment) {
        newImages.push(result.attachment as ImageAttachment);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      debug(`Added ${newImages.length} new images`);
    }

    // Reset input
    e.target.value = '';
  };

  /**
   * Handle document file selection
   */
  const handleDocumentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onDocumentsChange) return;

    // Check limits
    if (documents.length >= maxDocuments) {
      warn(`Maximum ${maxDocuments} documents allowed`);
      return;
    }

    const remainingSlots = maxDocuments - documents.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    debug(`Processing ${filesToProcess.length} document files`);

    const newDocuments: DocumentAttachment[] = [];
    for (const file of filesToProcess) {
      const result = await processDocumentFile(file);
      if (result.success && result.attachment) {
        newDocuments.push(result.attachment as DocumentAttachment);
      }
    }

    if (newDocuments.length > 0) {
      onDocumentsChange([...documents, ...newDocuments]);
      debug(`Added ${newDocuments.length} new documents`);
    }

    // Reset input
    e.target.value = '';
  };

  /**
   * Trigger image file picker
   */
  const triggerImagePicker = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  /**
   * Trigger document file picker
   */
  const triggerDocumentPicker = () => {
    if (documentInputRef.current) {
      documentInputRef.current.click();
    }
  };

  // Check if attachment buttons should be disabled
  // Only disable during actual sending, not during generation
  const isImageButtonDisabled = loading || images.length >= maxImages || !onImagesChange;
  const isDocumentButtonDisabled = loading || documents.length >= maxDocuments || !onDocumentsChange;

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-end gap-2 sm:gap-3">
        {/* Attachment Buttons - Mobile Optimized */}
        <div className="flex items-end gap-1 sm:gap-2 flex-shrink-0">
          {/* Image Attachment Button */}
          <button
            type="button"
            onClick={triggerImagePicker}
            disabled={isImageButtonDisabled}
            className={cn(
              'p-2 sm:p-2.5 rounded-lg border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'touch-manipulation', // Better touch handling on mobile
              isImageButtonDisabled
                ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-slate-600 dark:text-slate-500'
                : 'border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 dark:border-slate-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:active:bg-blue-900'
            )}
            title={`Add images (${images.length}/${maxImages})`}
          >
            <Image className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>

          {/* Document Attachment Button */}
          <button
            type="button"
            onClick={triggerDocumentPicker}
            disabled={isDocumentButtonDisabled}
            className={cn(
              'p-2 sm:p-2.5 rounded-lg border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'touch-manipulation', // Better touch handling on mobile
              isDocumentButtonDisabled
                ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-slate-600 dark:text-slate-500'
                : 'border-gray-300 text-gray-600 hover:text-green-600 hover:border-green-300 hover:bg-green-50 active:bg-green-100 dark:border-slate-600 dark:text-slate-400 dark:hover:text-green-400 dark:hover:border-green-500 dark:hover:bg-green-950 dark:active:bg-green-900'
            )}
            title={`Add documents (${documents.length}/${maxDocuments})`}
          >
            <FileText className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={
              isGenerating 
                ? "Assistant is responding... Write your next message..."
                : "Write your message... (Shift+Enter for new line)"
            }
            className={cn(
              'w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl resize-none transition-all duration-200',
              'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px] sm:min-h-[48px] max-h-[120px] overflow-y-auto',
              'text-base', // Use 16px font size to prevent mobile zoom
              'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
              'dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400',
              'dark:focus:ring-blue-400 dark:focus:border-blue-400'
              //isGenerating && !loading && 'border-blue-300 bg-blue-50/30', // Visual feedback during generation
              //isGenerating && !loading && 'border-gray-300'
            )}
            style={{ height: '44px' }} // Slightly smaller on mobile
          />
        </div>
        
        {/* Send Button - Mobile Optimized */}
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={loading}
          className={cn(
            'px-4 sm:px-6 py-2.5 sm:py-3 h-11 sm:h-12 flex-shrink-0',
            'text-sm sm:text-base', // Responsive text size
            'touch-manipulation' // Better touch handling on mobile
          )}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
      
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.txt,.md,.json,.csv,.xml,.html,.js,.ts,.css,.yaml,.yml"
        multiple
        onChange={handleDocumentSelect}
        className="hidden"
      />
    </form>
  );
}; 