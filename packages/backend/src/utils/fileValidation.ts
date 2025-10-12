import path from 'path';
import { UPLOAD_CONFIG, FileType } from '../config/upload.js';
import { FileValidationError } from '../types/upload.js';

export class FileValidator {
  static validateFile(file: Express.Multer.File): { isValid: boolean; error?: FileValidationError; fileType?: FileType } {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: {
          field: 'file',
          message: 'No file provided',
          code: 'FILE_REQUIRED'
        }
      };
    }

    // Determine file type from extension and mime type
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    
    let detectedFileType: FileType | null = null;
    
    // Check PDF
    if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.PDF.includes(fileExtension) && 
        UPLOAD_CONFIG.ALLOWED_MIME_TYPES.PDF.includes(mimeType)) {
      detectedFileType = 'PDF';
    }
    // Check DOCX
    else if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.DOCX.includes(fileExtension) && 
             UPLOAD_CONFIG.ALLOWED_MIME_TYPES.DOCX.includes(mimeType)) {
      detectedFileType = 'DOCX';
    }
    // Check TXT
    else if (UPLOAD_CONFIG.ALLOWED_EXTENSIONS.TXT.includes(fileExtension) && 
             UPLOAD_CONFIG.ALLOWED_MIME_TYPES.TXT.includes(mimeType)) {
      detectedFileType = 'TXT';
    }

    // Invalid file type
    if (!detectedFileType) {
      return {
        isValid: false,
        error: {
          field: 'fileType',
          message: `Invalid file type. Allowed formats: PDF (up to 50MB), DOCX (up to 20MB), TXT (up to 5MB)`,
          code: 'INVALID_FILE_TYPE'
        }
      };
    }

    // Check file size
    const maxSize = UPLOAD_CONFIG.FILE_SIZE_LIMITS[detectedFileType];
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        isValid: false,
        error: {
          field: 'fileSize',
          message: `File size exceeds limit. Maximum allowed size for ${detectedFileType} files is ${maxSizeMB}MB`,
          code: 'FILE_SIZE_EXCEEDED'
        }
      };
    }

    return {
      isValid: true,
      fileType: detectedFileType
    };
  }

  static validateBatch(files: Express.Multer.File[]): { isValid: boolean; error?: FileValidationError } {
    if (!files || files.length === 0) {
      return {
        isValid: false,
        error: {
          field: 'files',
          message: 'No files provided for batch upload',
          code: 'NO_FILES_PROVIDED'
        }
      };
    }

    if (files.length > UPLOAD_CONFIG.MAX_BATCH_SIZE) {
      return {
        isValid: false,
        error: {
          field: 'files',
          message: `Batch upload limit exceeded. Maximum ${UPLOAD_CONFIG.MAX_BATCH_SIZE} files allowed`,
          code: 'BATCH_SIZE_EXCEEDED'
        }
      };
    }

    return { isValid: true };
  }
}