import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/uploadService.js';
import { WebSocketService } from '../services/websocketService.js';
import { FileValidator } from '../utils/fileValidation.js';
import { UploadResponse, BatchUploadResponse } from '../types/upload.js';
import { UPLOAD_CONFIG } from '../config/upload.js';

const router = Router();

// Configure multer for memory storage (we'll handle file saving manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(...Object.values(UPLOAD_CONFIG.FILE_SIZE_LIMITS)), // Use the largest limit
    files: UPLOAD_CONFIG.MAX_BATCH_SIZE
  }
});

// Dependency injection - these will be set when the router is initialized
let uploadService: UploadService;
let websocketService: WebSocketService;

export function initializeUploadRoutes(uploadSvc: UploadService, wsSvc: WebSocketService) {
  uploadService = uploadSvc;
  websocketService = wsSvc;
}

// Single file upload endpoint
router.post('/single', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = req.body.userId || 'anonymous'; // In real app, get from auth

    if (!file) {
      const response: UploadResponse = {
        success: false,
        error: {
          field: 'file',
          message: 'No file provided',
          code: 'FILE_REQUIRED'
        }
      };
      return res.status(400).json(response);
    }

    // Validate file
    const validation = FileValidator.validateFile(file);
    if (!validation.isValid) {
      const response: UploadResponse = {
        success: false,
        error: validation.error
      };
      return res.status(400).json(response);
    }

    // Emit initial progress
    const fileId = `temp-${Date.now()}`;
    websocketService.emitUserUploadProgress(userId, {
      fileId,
      fileName: file.originalname,
      progress: 0,
      status: 'UPLOADING'
    });

    // Process upload
    const tags = req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : [];
    const uploadedFile = await uploadService.processSingleUpload(file, userId, tags);

    // Emit completion
    websocketService.emitUploadComplete(uploadedFile.id, {
      success: true,
      fileId: uploadedFile.id
    });

    const response: UploadResponse = {
      success: true,
      file: uploadedFile
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Single upload error:', error);
    
    const response: UploadResponse = {
      success: false,
      error: {
        field: 'upload',
        message: error instanceof Error ? error.message : 'Upload failed',
        code: 'UPLOAD_FAILED'
      }
    };

    res.status(500).json(response);
  }
});

// Batch file upload endpoint
router.post('/batch', upload.array('files', UPLOAD_CONFIG.MAX_BATCH_SIZE), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.body.userId || 'anonymous'; // In real app, get from auth

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'files',
          message: 'No files provided for batch upload',
          code: 'NO_FILES_PROVIDED'
        }
      });
    }

    // Validate batch
    const batchValidation = FileValidator.validateBatch(files);
    if (!batchValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: batchValidation.error
      });
    }

    // Emit initial batch progress
    websocketService.emitBatchProgress(userId, 'temp-batch', {
      batchId: 'temp-batch',
      totalFiles: files.length,
      completedFiles: 0,
      failedFiles: 0
    });

    // Process batch upload
    const tags = req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : [];
    const batchResult = await uploadService.processBatchUpload(files, userId, tags);

    // Emit final batch progress
    websocketService.emitBatchProgress(userId, batchResult.batchId, {
      batchId: batchResult.batchId,
      totalFiles: batchResult.totalFiles,
      completedFiles: batchResult.successCount,
      failedFiles: batchResult.failureCount
    });

    const response: BatchUploadResponse = batchResult;
    res.status(201).json(response);
  } catch (error) {
    console.error('Batch upload error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        field: 'upload',
        message: error instanceof Error ? error.message : 'Batch upload failed',
        code: 'BATCH_UPLOAD_FAILED'
      }
    });
  }
});

// Get upload progress endpoint
router.get('/progress/:fileId', (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const progress = uploadService.getProgress(fileId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'fileId',
          message: 'Upload progress not found',
          code: 'PROGRESS_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'progress',
        message: 'Failed to retrieve upload progress',
        code: 'PROGRESS_RETRIEVAL_FAILED'
      }
    });
  }
});

// Health check for upload service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Upload Service',
    timestamp: new Date().toISOString(),
    config: {
      maxBatchSize: UPLOAD_CONFIG.MAX_BATCH_SIZE,
      supportedFormats: Object.keys(UPLOAD_CONFIG.FILE_SIZE_LIMITS),
      sizeLimits: UPLOAD_CONFIG.FILE_SIZE_LIMITS
    }
  });
});

export default router;