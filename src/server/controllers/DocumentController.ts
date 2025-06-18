/**
 * DocumentController.ts
 * 
 * Express controller for document processing operations
 * 
 * Controllers:
 *   DocumentController - Handles document upload and text extraction
 * 
 * Routes:
 *   POST /process - Process uploaded document and extract text
 * 
 * Usage: import { createDocumentController } from './controllers/DocumentController'
 */
import { Router, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { DocumentProcessor } from '../services/documentProcessor';
import { logger } from '../utils/logger';
import type { DocumentAttachment } from '../../shared/types';

// Extend Express Request to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if file type is supported
    if (DocumentProcessor.isSupportedType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

/**
 * Document processing controller class
 */
export class DocumentController {
  private router: Router;
  private documentProcessor: DocumentProcessor;

  constructor() {
    this.router = Router();
    this.documentProcessor = new DocumentProcessor();
    this.setupRoutes();
  }

  /**
   * Set up the routes for document operations
   */
  private setupRoutes(): void {
    // POST /api/documents/process - Process uploaded document
    this.router.post('/process', upload.single('document'), this.processDocument.bind(this));
  }

  /**
   * Process uploaded document and extract text content
   * 
   * @route POST /api/documents/process
   * @param req - Express request object with uploaded file
   * @param res - Express response object
   */
  private async processDocument(req: MulterRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check if file was uploaded
      if (!req.file) {
        logger.warn('Document processing requested without file');
        res.status(400).json({
          error: 'No document file provided',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const file = req.file;
      logger.info(`Processing document: ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(1)}KB)`);

      // Validate file type
      if (!this.documentProcessor.isSupportedFileType(file.originalname)) {
        res.status(400).json({
          error: `Unsupported file type: ${file.originalname}. Supported types: PDF, TXT, MD, JSON, CSV, XML, HTML, JS, TS, CSS, YAML`
        });
        return;
      }

      // Process the document
      const processingResult = await this.documentProcessor.processDocument(file.buffer, file.originalname);

      // For large files (>5MB), don't include the full data URL to avoid Firestore size limits
      const isLargeFile = file.size > 5 * 1024 * 1024;
      const documentUrl = isLargeFile 
        ? `document://${file.originalname}` // Placeholder URL for large files
        : `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      if (isLargeFile) {
        logger.warn(`Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB): Using placeholder URL to avoid Firestore size limits`);
      }

      // Create document attachment (exclude metadata to avoid Firestore serialization issues)
      const document: DocumentAttachment = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: documentUrl,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        content: processingResult.content,
        category: processingResult.category
      };

      const processingTime = Date.now() - startTime;

      logger.info(`Successfully processed ${file.originalname}: ${processingResult.content.length} characters extracted, document size: ${(file.size / 1024).toFixed(1)}KB, using ${isLargeFile ? 'placeholder' : 'data'} URL`);
      
      res.json({
        success: true,
        document,
        processingTime,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Document processing endpoint error:', error instanceof Error ? error : undefined);
      
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error during document processing',
        processingTime,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get the router instance
   * 
   * @returns Express router
   */
  public getRoutes(): Router {
    return this.router;
  }
}

/**
 * Create a new document controller instance
 * 
 * @returns DocumentController instance
 */
export function createDocumentController(): DocumentController {
  logger.info('Creating DocumentController');
  return new DocumentController();
} 