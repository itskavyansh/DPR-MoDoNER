import { describe, it, expect } from 'vitest';
import { FileValidator } from '../utils/fileValidation.js';

describe('FileValidator', () => {
  describe('validateFile', () => {
    it('should validate a valid PDF file', () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 10 * 1024 * 1024, // 10MB
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('PDF');
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid DOCX file', () => {
      const mockFile = {
        originalname: 'test.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 15 * 1024 * 1024, // 15MB
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('DOCX');
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid TXT file', () => {
      const mockFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 2 * 1024 * 1024, // 2MB
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('TXT');
      expect(result.error).toBeUndefined();
    });

    it('should reject file with invalid extension', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1 * 1024 * 1024, // 1MB
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
      expect(result.error?.message).toContain('Invalid file type');
    });

    it('should reject PDF file exceeding size limit', () => {
      const mockFile = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 60 * 1024 * 1024, // 60MB (exceeds 50MB limit)
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('FILE_SIZE_EXCEEDED');
      expect(result.error?.message).toContain('File size exceeds limit');
    });

    it('should reject DOCX file exceeding size limit', () => {
      const mockFile = {
        originalname: 'large.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 25 * 1024 * 1024, // 25MB (exceeds 20MB limit)
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('FILE_SIZE_EXCEEDED');
      expect(result.error?.message).toContain('File size exceeds limit');
    });

    it('should reject TXT file exceeding size limit', () => {
      const mockFile = {
        originalname: 'large.txt',
        mimetype: 'text/plain',
        size: 6 * 1024 * 1024, // 6MB (exceeds 5MB limit)
      } as Express.Multer.File;

      const result = FileValidator.validateFile(mockFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('FILE_SIZE_EXCEEDED');
      expect(result.error?.message).toContain('File size exceeds limit');
    });

    it('should reject when no file is provided', () => {
      const result = FileValidator.validateFile(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('FILE_REQUIRED');
      expect(result.error?.message).toBe('No file provided');
    });
  });

  describe('validateBatch', () => {
    it('should validate a valid batch of files', () => {
      const mockFiles = [
        { originalname: 'test1.pdf', mimetype: 'application/pdf', size: 1024 },
        { originalname: 'test2.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024 },
      ] as Express.Multer.File[];

      const result = FileValidator.validateBatch(mockFiles);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty batch', () => {
      const result = FileValidator.validateBatch([]);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('NO_FILES_PROVIDED');
    });

    it('should reject batch exceeding size limit', () => {
      const mockFiles = Array(11).fill({
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024
      }) as Express.Multer.File[];

      const result = FileValidator.validateBatch(mockFiles);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BATCH_SIZE_EXCEEDED');
      expect(result.error?.message).toContain('Maximum 10 files allowed');
    });

    it('should reject null files array', () => {
      const result = FileValidator.validateBatch(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('NO_FILES_PROVIDED');
    });
  });
});