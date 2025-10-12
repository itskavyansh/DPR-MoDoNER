import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { UploadedFile, BatchUploadResponse, UploadProgress } from '../types/upload.js';
import { FileValidator } from '../utils/fileValidation.js';
import { UPLOAD_CONFIG, FileType } from '../config/upload.js';
import { DocumentStorageService } from './documentStorageService.js';

export class UploadService {
  private uploadProgress = new Map<string, UploadProgress>();
  private documentStorageService: DocumentStorageService;

  constructor() {
    this.documentStorageService = new DocumentStorageService();
  }

  async processSingleUpload(file: Express.Multer.File, uploadedBy: string = 'anonymous', tags: string[] = []): Promise<UploadedFile> {
    const validation = FileValidator.validateFile(file);
    
    if (!validation.isValid || !validation.fileType) {
      throw new Error(validation.error?.message || 'File validation failed');
    }

    const fileId = uuidv4();
    const fileName = `${fileId}${path.extname(file.originalname)}`;

    // Store document using DocumentStorageService
    const document = await this.documentStorageService.storeDocument(file, fileName, uploadedBy, tags);

    const uploadedFile: UploadedFile = {
      id: document.id,
      originalName: document.originalFileName,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadTimestamp: document.uploadTimestamp,
      status: 'UPLOADED',
      progress: 100
    };

    return uploadedFile;
  }

  async processBatchUpload(files: Express.Multer.File[], uploadedBy: string = 'anonymous', tags: string[] = []): Promise<BatchUploadResponse> {
    const batchValidation = FileValidator.validateBatch(files);
    
    if (!batchValidation.isValid) {
      throw new Error(batchValidation.error?.message || 'Batch validation failed');
    }

    const batchId = uuidv4();
    const uploadedFiles: UploadedFile[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      try {
        const uploadedFile = await this.processSingleUpload(file, uploadedBy, tags);
        uploadedFiles.push(uploadedFile);
        successCount++;
      } catch (error) {
        const fileId = uuidv4();
        const failedFile: UploadedFile = {
          id: fileId,
          originalName: file.originalname,
          fileName: '',
          fileType: 'PDF', // Default, will be corrected by validation
          fileSize: file.size,
          uploadTimestamp: new Date(),
          status: 'FAILED',
          progress: 0
        };
        uploadedFiles.push(failedFile);
        failureCount++;
      }
    }

    return {
      batchId,
      files: uploadedFiles,
      totalFiles: files.length,
      successCount,
      failureCount
    };
  }

  updateProgress(fileId: string, progress: UploadProgress): void {
    this.uploadProgress.set(fileId, progress);
  }

  getProgress(fileId: string): UploadProgress | undefined {
    return this.uploadProgress.get(fileId);
  }

  clearProgress(fileId: string): void {
    this.uploadProgress.delete(fileId);
  }

  getAllProgress(): Map<string, UploadProgress> {
    return new Map(this.uploadProgress);
  }
}