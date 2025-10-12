export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'TXT';
  fileSize: number;
  uploadTimestamp: Date;
  status: 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: string;
  error?: string;
}

export interface BatchUploadResponse {
  batchId: string;
  files: UploadedFile[];
  totalFiles: number;
  successCount: number;
  failureCount: number;
}

export interface FileValidationError {
  field: string;
  message: string;
  code: string;
}

export interface UploadResponse {
  success: boolean;
  file?: UploadedFile;
  error?: FileValidationError;
}