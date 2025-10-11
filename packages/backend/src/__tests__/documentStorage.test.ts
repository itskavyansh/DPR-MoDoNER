import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DocumentStorageService } from '../services/documentStorageService.js';
import { DocumentRepository } from '../repositories/documentRepository.js';

// Mock the DocumentRepository
vi.mock('../repositories/documentRepository.js');

describe('DocumentStorageService', () => {
  let documentStorageService: DocumentStorageService;
  let mockDocumentRepo: any;

  beforeEach(() => {
    mockDocumentRepo = {
      createDocument: vi.fn(),
      getDocumentById: vi.fn(),
      getDocumentByFileName: vi.fn(),
      searchDocuments: vi.fn(),
      updateProcessingStatus: vi.fn(),
      deleteDocument: vi.fn(),
      addProcessingLog: vi.fn(),
      generateChecksum: vi.fn(),
    };

    // Mock the constructor to return our mock
    vi.mocked(DocumentRepository).mockImplementation(() => mockDocumentRepo);
    
    documentStorageService = new DocumentStorageService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('storeDocument', () => {
    it('should store a PDF document successfully', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from('fake pdf content'),
        size: 1024,
        mimetype: 'application/pdf'
      } as Express.Multer.File;

      const mockDocument = {
        id: 'test-id',
        originalFileName: 'test.pdf',
        fileName: 'test-id.pdf',
        fileType: 'PDF',
        fileSize: 1024,
        filePath: 'uploads/test-id.pdf',
        uploadTimestamp: new Date(),
        lastModified: new Date(),
        uploadedBy: 'test-user',
        processingStatus: 'UPLOADED',
        checksum: 'fake-checksum',
        tags: [],
        version: 1
      };

      mockDocumentRepo.generateChecksum.mockReturnValue('fake-checksum');
      mockDocumentRepo.createDocument.mockResolvedValue(mockDocument);
      mockDocumentRepo.addProcessingLog.mockResolvedValue('log-id');

      const result = await documentStorageService.storeDocument(
        mockFile,
        'test-id.pdf',
        'test-user',
        ['tag1', 'tag2']
      );

      expect(result).toEqual(mockDocument);
      expect(mockDocumentRepo.createDocument).toHaveBeenCalledWith({
        originalFileName: 'test.pdf',
        fileName: 'test-id.pdf',
        fileType: 'PDF',
        fileSize: 1024,
        filePath: expect.stringContaining('test-id.pdf'),
        uploadedBy: 'test-user',
        processingStatus: 'UPLOADED',
        checksum: 'fake-checksum',
        tags: ['tag1', 'tag2']
      });
      expect(mockDocumentRepo.addProcessingLog).toHaveBeenCalled();
    });

    it('should store a DOCX document successfully', async () => {
      const mockFile = {
        originalname: 'test.docx',
        buffer: Buffer.from('fake docx content'),
        size: 2048,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } as Express.Multer.File;

      const mockDocument = {
        id: 'test-id',
        originalFileName: 'test.docx',
        fileName: 'test-id.docx',
        fileType: 'DOCX',
        fileSize: 2048,
        filePath: 'uploads/test-id.docx',
        uploadTimestamp: new Date(),
        lastModified: new Date(),
        uploadedBy: 'test-user',
        processingStatus: 'UPLOADED',
        checksum: 'fake-checksum',
        tags: [],
        version: 1
      };

      mockDocumentRepo.generateChecksum.mockReturnValue('fake-checksum');
      mockDocumentRepo.createDocument.mockResolvedValue(mockDocument);
      mockDocumentRepo.addProcessingLog.mockResolvedValue('log-id');

      const result = await documentStorageService.storeDocument(
        mockFile,
        'test-id.docx',
        'test-user'
      );

      expect(result.fileType).toBe('DOCX');
      expect(mockDocumentRepo.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'DOCX',
          originalFileName: 'test.docx'
        })
      );
    });

    it('should store a TXT document successfully', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('fake text content'),
        size: 512,
        mimetype: 'text/plain'
      } as Express.Multer.File;

      const mockDocument = {
        id: 'test-id',
        originalFileName: 'test.txt',
        fileName: 'test-id.txt',
        fileType: 'TXT',
        fileSize: 512,
        filePath: 'uploads/test-id.txt',
        uploadTimestamp: new Date(),
        lastModified: new Date(),
        uploadedBy: 'test-user',
        processingStatus: 'UPLOADED',
        checksum: 'fake-checksum',
        tags: [],
        version: 1
      };

      mockDocumentRepo.generateChecksum.mockReturnValue('fake-checksum');
      mockDocumentRepo.createDocument.mockResolvedValue(mockDocument);
      mockDocumentRepo.addProcessingLog.mockResolvedValue('log-id');

      const result = await documentStorageService.storeDocument(
        mockFile,
        'test-id.txt',
        'test-user'
      );

      expect(result.fileType).toBe('TXT');
      expect(mockDocumentRepo.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'TXT',
          originalFileName: 'test.txt'
        })
      );
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const mockDocument = {
        id: 'test-id',
        originalFileName: 'test.pdf',
        fileName: 'test-id.pdf',
        fileType: 'PDF',
        fileSize: 1024,
        filePath: 'uploads/test-id.pdf',
        uploadTimestamp: new Date(),
        lastModified: new Date(),
        uploadedBy: 'test-user',
        processingStatus: 'UPLOADED',
        checksum: 'fake-checksum',
        tags: [],
        version: 1
      };

      mockDocumentRepo.getDocumentById.mockResolvedValue(mockDocument);

      const result = await documentStorageService.getDocument('test-id');

      expect(result).toEqual(mockDocument);
      expect(mockDocumentRepo.getDocumentById).toHaveBeenCalledWith('test-id');
    });

    it('should return null for non-existent document', async () => {
      mockDocumentRepo.getDocumentById.mockResolvedValue(null);

      const result = await documentStorageService.getDocument('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with criteria', async () => {
      const mockSearchResult = {
        documents: [
          {
            id: 'test-id-1',
            originalFileName: 'test1.pdf',
            fileName: 'test-id-1.pdf',
            fileType: 'PDF',
            fileSize: 1024,
            filePath: 'uploads/test-id-1.pdf',
            uploadTimestamp: new Date(),
            lastModified: new Date(),
            uploadedBy: 'test-user',
            processingStatus: 'UPLOADED',
            checksum: 'fake-checksum-1',
            tags: ['tag1'],
            version: 1
          }
        ],
        total: 1
      };

      mockDocumentRepo.searchDocuments.mockResolvedValue(mockSearchResult);

      const criteria = {
        fileType: 'PDF' as const,
        uploadedBy: 'test-user',
        limit: 10,
        offset: 0
      };

      const result = await documentStorageService.searchDocuments(criteria);

      expect(result).toEqual(mockSearchResult);
      expect(mockDocumentRepo.searchDocuments).toHaveBeenCalledWith(criteria);
    });
  });

  describe('updateProcessingStatus', () => {
    it('should update processing status', async () => {
      mockDocumentRepo.updateProcessingStatus.mockResolvedValue(undefined);

      await documentStorageService.updateProcessingStatus('test-id', 'PROCESSING');

      expect(mockDocumentRepo.updateProcessingStatus).toHaveBeenCalledWith('test-id', 'PROCESSING', undefined);
    });

    it('should update processing status with error', async () => {
      mockDocumentRepo.updateProcessingStatus.mockResolvedValue(undefined);

      await documentStorageService.updateProcessingStatus('test-id', 'FAILED', 'Processing error');

      expect(mockDocumentRepo.updateProcessingStatus).toHaveBeenCalledWith('test-id', 'FAILED', 'Processing error');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const mockDocument = {
        id: 'test-id',
        originalFileName: 'test.pdf',
        fileName: 'test-id.pdf',
        fileType: 'PDF',
        fileSize: 1024,
        filePath: 'uploads/test-id.pdf',
        uploadTimestamp: new Date(),
        lastModified: new Date(),
        uploadedBy: 'test-user',
        processingStatus: 'UPLOADED',
        checksum: 'fake-checksum',
        tags: [],
        version: 1
      };

      mockDocumentRepo.getDocumentById.mockResolvedValue(mockDocument);
      mockDocumentRepo.deleteDocument.mockResolvedValue(true);

      const result = await documentStorageService.deleteDocument('test-id');

      expect(result).toBe(true);
      expect(mockDocumentRepo.getDocumentById).toHaveBeenCalledWith('test-id');
      expect(mockDocumentRepo.deleteDocument).toHaveBeenCalledWith('test-id');
    });

    it('should return false for non-existent document', async () => {
      mockDocumentRepo.getDocumentById.mockResolvedValue(null);

      const result = await documentStorageService.deleteDocument('non-existent-id');

      expect(result).toBe(false);
      expect(mockDocumentRepo.deleteDocument).not.toHaveBeenCalled();
    });
  });
});