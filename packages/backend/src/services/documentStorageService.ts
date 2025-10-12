import fs from 'fs/promises';
import path from 'path';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { DocumentMetadata, DocumentSearchCriteria } from '../models/document.js';
import { UPLOAD_CONFIG } from '../config/upload.js';

export class DocumentStorageService {
  private documentRepo: DocumentRepository;

  constructor() {
    this.documentRepo = new DocumentRepository();
  }

  // Store uploaded file and create document record
  async storeDocument(
    file: Express.Multer.File,
    fileName: string,
    uploadedBy: string,
    tags: string[] = []
  ): Promise<DocumentMetadata> {
    try {
      // Ensure upload directory exists
      await fs.mkdir(UPLOAD_CONFIG.UPLOAD_DIR, { recursive: true });

      // Calculate file path
      const filePath = path.join(UPLOAD_CONFIG.UPLOAD_DIR, fileName);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate checksum
      const checksum = this.documentRepo.generateChecksum(file.buffer);

      // Determine file type
      const fileExtension = path.extname(file.originalname).toLowerCase();
      let fileType: 'PDF' | 'DOCX' | 'TXT';
      
      if (fileExtension === '.pdf') {
        fileType = 'PDF';
      } else if (fileExtension === '.docx' || fileExtension === '.doc') {
        fileType = 'DOCX';
      } else {
        fileType = 'TXT';
      }

      // Create document record
      const documentData = {
        originalFileName: file.originalname,
        fileName: fileName,
        fileType: fileType,
        fileSize: file.size,
        filePath: filePath,
        uploadedBy: uploadedBy,
        processingStatus: 'UPLOADED' as const,
        checksum: checksum,
        tags: tags
      };

      const document = await this.documentRepo.createDocument(documentData);

      // Log the upload
      await this.documentRepo.addProcessingLog({
        documentId: document.id,
        stage: 'UPLOAD',
        status: 'COMPLETED',
        endTime: new Date(),
        message: 'File uploaded successfully'
      });

      return document;
    } catch (error) {
      console.error('Error storing document:', error);
      throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Retrieve document metadata
  async getDocument(id: string): Promise<DocumentMetadata | null> {
    return await this.documentRepo.getDocumentById(id);
  }

  // Get document by filename
  async getDocumentByFileName(fileName: string): Promise<DocumentMetadata | null> {
    return await this.documentRepo.getDocumentByFileName(fileName);
  }

  // Search documents
  async searchDocuments(criteria: DocumentSearchCriteria): Promise<{ documents: DocumentMetadata[], total: number }> {
    return await this.documentRepo.searchDocuments(criteria);
  }

  // Get document file content
  async getDocumentFile(document: DocumentMetadata): Promise<Buffer> {
    try {
      const fileContent = await fs.readFile(document.filePath);
      return fileContent;
    } catch (error) {
      console.error('Error reading document file:', error);
      throw new Error(`Failed to read document file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update document processing status
  async updateProcessingStatus(
    id: string, 
    status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    error?: string
  ): Promise<void> {
    await this.documentRepo.updateProcessingStatus(id, status, error);
  }

  // Delete document and file
  async deleteDocument(id: string): Promise<boolean> {
    try {
      const document = await this.documentRepo.getDocumentById(id);
      if (!document) {
        return false;
      }

      // Delete file from disk
      try {
        await fs.unlink(document.filePath);
      } catch (fileError) {
        console.warn('Could not delete file from disk:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      const deleted = await this.documentRepo.deleteDocument(id);
      return deleted;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add tags to document
  async addTags(id: string, newTags: string[]): Promise<void> {
    const document = await this.documentRepo.getDocumentById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const updatedTags = [...new Set([...document.tags, ...newTags])];
    
    // Update tags in database (this would require adding an update method to the repository)
    // For now, we'll implement a simple query
    const db = this.documentRepo['db']; // Access private property for this operation
    await db.query('UPDATE documents SET tags = $1 WHERE id = $2', [updatedTags, id]);
  }

  // Remove tags from document
  async removeTags(id: string, tagsToRemove: string[]): Promise<void> {
    const document = await this.documentRepo.getDocumentById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const updatedTags = document.tags.filter(tag => !tagsToRemove.includes(tag));
    
    // Update tags in database
    const db = this.documentRepo['db']; // Access private property for this operation
    await db.query('UPDATE documents SET tags = $1 WHERE id = $2', [updatedTags, id]);
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    byFileType: { [key: string]: { count: number; size: number } };
    byStatus: { [key: string]: number };
  }> {
    const db = this.documentRepo['db']; // Access private property

    // Get total documents and size
    const totalQuery = 'SELECT COUNT(*) as count, SUM(file_size) as total_size FROM documents';
    const totalResult = await db.query(totalQuery);
    
    // Get stats by file type
    const typeQuery = `
      SELECT file_type, COUNT(*) as count, SUM(file_size) as total_size 
      FROM documents 
      GROUP BY file_type
    `;
    const typeResult = await db.query(typeQuery);
    
    // Get stats by processing status
    const statusQuery = `
      SELECT processing_status, COUNT(*) as count 
      FROM documents 
      GROUP BY processing_status
    `;
    const statusResult = await db.query(statusQuery);

    const byFileType: { [key: string]: { count: number; size: number } } = {};
    typeResult.rows.forEach(row => {
      byFileType[row.file_type] = {
        count: parseInt(row.count),
        size: parseInt(row.total_size || '0')
      };
    });

    const byStatus: { [key: string]: number } = {};
    statusResult.rows.forEach(row => {
      byStatus[row.processing_status] = parseInt(row.count);
    });

    return {
      totalDocuments: parseInt(totalResult.rows[0].count),
      totalSize: parseInt(totalResult.rows[0].total_size || '0'),
      byFileType,
      byStatus
    };
  }

  // Clean up orphaned files (files without database records)
  async cleanupOrphanedFiles(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      const uploadDir = UPLOAD_CONFIG.UPLOAD_DIR;
      const files = await fs.readdir(uploadDir);
      
      let cleaned = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          const document = await this.documentRepo.getDocumentByFileName(file);
          if (!document) {
            // File exists but no database record - delete it
            await fs.unlink(path.join(uploadDir, file));
            cleaned++;
          }
        } catch (error) {
          errors.push(`Error processing file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { cleaned, errors };
    } catch (error) {
      throw new Error(`Failed to cleanup orphaned files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}