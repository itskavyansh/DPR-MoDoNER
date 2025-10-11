import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import uploadRoutes, { initializeUploadRoutes } from '../routes/upload.js';
import { UploadService } from '../services/uploadService.js';
import { WebSocketService } from '../services/websocketService.js';

// Mock the services
vi.mock('../services/uploadService.js');
vi.mock('../services/websocketService.js');

describe('Upload Routes', () => {
  let app: express.Application;
  let server: any;
  let mockUploadService: any;
  let mockWebSocketService: any;

  beforeEach(() => {
    app = express();
    server = createServer(app);
    
    // Create mock services
    mockUploadService = {
      processSingleUpload: vi.fn(),
      processBatchUpload: vi.fn(),
      getProgress: vi.fn(),
    };
    
    mockWebSocketService = {
      emitUserUploadProgress: vi.fn(),
      emitUploadComplete: vi.fn(),
      emitBatchProgress: vi.fn(),
    };

    // Initialize routes with mocked services
    initializeUploadRoutes(mockUploadService, mockWebSocketService);
    
    app.use(express.json());
    app.use('/api/upload', uploadRoutes);
  });

  describe('POST /api/upload/single', () => {
    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .send({ userId: 'test-user' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_REQUIRED');
    });

    it('should successfully upload a valid file', async () => {
      const mockUploadedFile = {
        id: 'test-id',
        originalName: 'test.pdf',
        fileName: 'test-id.pdf',
        fileType: 'PDF',
        fileSize: 1024,
        uploadTimestamp: new Date(),
        status: 'UPLOADED',
        progress: 100
      };

      mockUploadService.processSingleUpload.mockResolvedValue(mockUploadedFile);

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf')
        .field('userId', 'test-user');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.file.id).toBe(mockUploadedFile.id);
      expect(response.body.file.originalName).toBe(mockUploadedFile.originalName);
      expect(response.body.file.fileType).toBe(mockUploadedFile.fileType);
      expect(response.body.file.status).toBe(mockUploadedFile.status);
      expect(mockWebSocketService.emitUserUploadProgress).toHaveBeenCalled();
      expect(mockWebSocketService.emitUploadComplete).toHaveBeenCalled();
    });

    it('should handle upload service errors', async () => {
      mockUploadService.processSingleUpload.mockRejectedValue(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf')
        .field('userId', 'test-user');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UPLOAD_FAILED');
    });
  });

  describe('POST /api/upload/batch', () => {
    it('should return 400 when no files are provided', async () => {
      const response = await request(app)
        .post('/api/upload/batch')
        .send({ userId: 'test-user' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILES_PROVIDED');
    });

    it('should successfully upload a batch of files', async () => {
      const mockBatchResult = {
        batchId: 'batch-id',
        files: [
          {
            id: 'file1-id',
            originalName: 'test1.pdf',
            fileName: 'file1-id.pdf',
            fileType: 'PDF',
            fileSize: 1024,
            uploadTimestamp: new Date(),
            status: 'UPLOADED',
            progress: 100
          }
        ],
        totalFiles: 1,
        successCount: 1,
        failureCount: 0
      };

      mockUploadService.processBatchUpload.mockResolvedValue(mockBatchResult);

      const response = await request(app)
        .post('/api/upload/batch')
        .attach('files', Buffer.from('fake pdf content'), 'test1.pdf')
        .field('userId', 'test-user');

      expect(response.status).toBe(201);
      expect(response.body.batchId).toBe(mockBatchResult.batchId);
      expect(response.body.totalFiles).toBe(mockBatchResult.totalFiles);
      expect(response.body.successCount).toBe(mockBatchResult.successCount);
      expect(response.body.failureCount).toBe(mockBatchResult.failureCount);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].id).toBe('file1-id');
      expect(mockWebSocketService.emitBatchProgress).toHaveBeenCalledTimes(2); // Initial and final
    });
  });

  describe('GET /api/upload/progress/:fileId', () => {
    it('should return progress for existing file', async () => {
      const mockProgress = {
        fileId: 'test-file-id',
        fileName: 'test.pdf',
        progress: 50,
        status: 'UPLOADING'
      };

      mockUploadService.getProgress.mockReturnValue(mockProgress);

      const response = await request(app)
        .get('/api/upload/progress/test-file-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.progress).toEqual(mockProgress);
    });

    it('should return 404 for non-existent file', async () => {
      mockUploadService.getProgress.mockReturnValue(undefined);

      const response = await request(app)
        .get('/api/upload/progress/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROGRESS_NOT_FOUND');
    });
  });

  describe('GET /api/upload/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/upload/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('Upload Service');
      expect(response.body.config).toBeDefined();
    });
  });
});