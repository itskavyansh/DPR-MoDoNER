export const UPLOAD_CONFIG = {
  // File size limits in bytes
  FILE_SIZE_LIMITS: {
    PDF: 50 * 1024 * 1024, // 50MB
    DOCX: 20 * 1024 * 1024, // 20MB
    TXT: 5 * 1024 * 1024, // 5MB
  },
  
  // Allowed file types
  ALLOWED_MIME_TYPES: {
    PDF: ['application/pdf'],
    DOCX: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    TXT: ['text/plain'],
  },
  
  // File extensions
  ALLOWED_EXTENSIONS: {
    PDF: ['.pdf'],
    DOCX: ['.docx', '.doc'],
    TXT: ['.txt'],
  },
  
  // Batch upload limits
  MAX_BATCH_SIZE: 10,
  
  // Upload directory
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  
  // Temporary upload directory
  TEMP_DIR: process.env.TEMP_DIR || 'temp',
} as const;

export type FileType = keyof typeof UPLOAD_CONFIG.FILE_SIZE_LIMITS;