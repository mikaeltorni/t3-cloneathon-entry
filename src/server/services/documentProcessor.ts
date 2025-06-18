/**
 * documentProcessor.ts
 * 
 * Document processing service for handling various file types
 * 
 * Services:
 *   DocumentProcessor - Main service for processing documents
 * 
 * Features:
 *   - PDF text extraction using pdf-parse
 *   - Text file processing (.txt, .md, .json, etc.)
 *   - File validation and error handling
 *   - Comprehensive logging and debugging
 * 
 * Usage: import { DocumentProcessor } from './services/documentProcessor'
 */
import { logger } from '../utils/logger';
import pdfdoc from 'pdf-parse';
import type { DocumentAttachment } from '../../shared/types';

const SUPPORTED_DOCUMENT_TYPES = [
  // PDF files
  'application/pdf',
  // Text files
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/json',
  'text/csv',
  'text/xml',
  'application/xml',
  'text/html',
  'application/javascript',
  'application/typescript',
  'text/css',
  'application/yaml',
  'text/yaml',
  'application/x-yaml',
];

const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TEXT_LENGTH = 100000; // Maximum characters to extract

interface ProcessDocumentResult {
  success: boolean;
  document?: DocumentAttachment;
  error?: string;
}

/**
 * Document processing result interface
 */
export interface DocumentProcessingResult {
  content: string;
  category: 'pdf' | 'text' | 'markdown' | 'other';
  pageCount?: number;
  metadata?: any;
}

/**
 * Document processing service class
 */
export class DocumentProcessor {
  private readonly maxContentLength = 100 * 1024; // 100KB max content
  private readonly processingTimeout = 30000; // 30 second timeout

  /**
   * Check if a file type is supported
   * 
   * @param mimeType - MIME type to check
   * @returns Whether the file type is supported
   */
  static isSupportedType(mimeType: string): boolean {
    return SUPPORTED_DOCUMENT_TYPES.includes(mimeType);
  }

  /**
   * Get document category from MIME type
   * 
   * @param mimeType - MIME type of the document
   * @returns Document category
   */
  static getDocumentCategory(mimeType: string): 'pdf' | 'text' | 'markdown' | 'other' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('markdown')) return 'markdown';
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('yaml')) return 'text';
    return 'other';
  }

  /**
   * Process a document file and extract text content
   * 
   * @param buffer - File buffer
   * @param filename - Original filename
   * @returns Promise<DocumentProcessingResult>
   */
  async processDocument(buffer: Buffer, filename: string): Promise<DocumentProcessingResult> {
    logger.info(`Processing document: ${filename} (${buffer.length} bytes)`);

    // Validate file size (50MB limit for documents)
    if (buffer.length > 50 * 1024 * 1024) {
      throw new Error('Document too large. Maximum size is 50MB.');
    }

    const fileExtension = this.getFileExtension(filename);
    const category = this.determineCategory(fileExtension);

    try {
      let content: string;
      let pageCount: number | undefined;
      let metadata: any = undefined;

      switch (fileExtension) {
        case 'pdf':
          const pdfResult = await this.processPDF(buffer);
          content = pdfResult.content;
          pageCount = pdfResult.pageCount;
          metadata = pdfResult.metadata;
          break;
        
        case 'txt':
        case 'md':
        case 'json':
        case 'csv':
        case 'xml':
        case 'html':
        case 'js':
        case 'ts':
        case 'css':
        case 'yaml':
        case 'yml':
          content = await this.processTextFile(buffer);
          break;
        
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Truncate content if too long
      if (content.length > this.maxContentLength) {
        logger.warn(`Content truncated from ${content.length} to ${this.maxContentLength} characters`);
        content = content.substring(0, this.maxContentLength) + '\n\n[Content truncated for length...]';
      }

      logger.info(`Successfully processed ${filename}: ${content.length} characters extracted`);

      return {
        content,
        category,
        pageCount,
        metadata
      };

    } catch (error) {
      logger.error(`Failed to process document ${filename}:`, error instanceof Error ? error : undefined);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process PDF file using pdf-parse
   * 
   * @param buffer - PDF buffer
   * @returns Promise with content, pageCount, and metadata
   */
  private async processPDF(buffer: Buffer): Promise<{ content: string; pageCount: number; metadata: any }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF processing timeout'));
      }, this.processingTimeout);

      pdfdoc(buffer)
        .then((data) => {
          clearTimeout(timeout);
          
          // Sanitize content to remove null bytes and invalid characters
          let content = data.text || '';
          content = content.replace(/\0/g, '').trim();
          
          // Ensure we have valid content
          if (!content || content.length === 0) {
            logger.warn('PDF processed but no text content extracted');
            content = '[No text content could be extracted from this PDF]';
          }
          
          // Sanitize metadata to remove undefined values and circular references
          const sanitizedMetadata: Record<string, any> = {
            title: data.info?.Title || undefined,
            author: data.info?.Author || undefined,
            subject: data.info?.Subject || undefined,
            creator: data.info?.Creator || undefined,
            producer: data.info?.Producer || undefined,
            creationDate: data.info?.CreationDate || undefined,
            modificationDate: data.info?.ModDate || undefined,
            version: data.version || undefined
          };
          
          // Remove undefined values
          Object.keys(sanitizedMetadata).forEach(key => {
            if (sanitizedMetadata[key] === undefined) {
              delete sanitizedMetadata[key];
            }
          });
          
          logger.info(`PDF processed successfully: ${data.numpages} pages, ${content.length} characters`);
          
          resolve({
            content,
            pageCount: data.numpages || 0,
            metadata: sanitizedMetadata
          });
        })
        .catch((error) => {
          clearTimeout(timeout);
          logger.error('PDF processing failed:', error);
          reject(new Error(`PDF processing failed: ${error.message}`));
        });
    });
  }

  /**
   * Process text-based files
   * 
   * @param buffer - File buffer
   * @returns Promise<string>
   */
  private async processTextFile(buffer: Buffer): Promise<string> {
    try {
      // Try UTF-8 first
      let content = buffer.toString('utf8');
      
      // If content has null bytes or invalid characters, try other encodings
      if (content.includes('\0') || content.includes('')) {
        logger.warn('UTF-8 decoding issues detected, trying latin1');
        content = buffer.toString('latin1');
      }

      return content.trim();
    } catch (error) {
      logger.error('Text file processing failed:', error instanceof Error ? error : undefined);
      throw new Error(`Text file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file extension from filename
   * 
   * @param filename - Original filename
   * @returns Lowercase file extension
   */
  private getFileExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  /**
   * Determine document category from file extension
   * 
   * @param extension - File extension
   * @returns Document category
   */
  private determineCategory(extension: string): 'pdf' | 'text' | 'markdown' | 'other' {
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'md':
        return 'markdown';
      case 'txt':
      case 'json':
      case 'csv':
      case 'xml':
      case 'html':
      case 'js':
      case 'ts':
      case 'css':
      case 'yaml':
      case 'yml':
        return 'text';
      default:
        return 'other';
    }
  }

  /**
   * Validate file type
   * 
   * @param filename - Original filename
   * @returns True if supported
   */
  isSupportedFileType(filename: string): boolean {
    const extension = this.getFileExtension(filename);
    const supportedExtensions = ['pdf', 'txt', 'md', 'json', 'csv', 'xml', 'html', 'js', 'ts', 'css', 'yaml', 'yml'];
    return supportedExtensions.includes(extension);
  }


} 