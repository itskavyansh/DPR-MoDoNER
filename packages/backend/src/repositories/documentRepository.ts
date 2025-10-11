import { PoolClient } from 'pg';
import crypto from 'crypto';
import { DatabaseConnection } from '../database/connection.js';
import { 
  DocumentMetadata, 
  DocumentContent, 
  ExtractedSection, 
  ExtractedEntity, 
  DocumentProcessingLog,
  DocumentSearchCriteria 
} from '../models/document.js';

export class DocumentRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // Create a new document record
  async createDocument(documentData: Omit<DocumentMetadata, 'id' | 'uploadTimestamp' | 'lastModified' | 'version'>): Promise<DocumentMetadata> {
    const query = `
      INSERT INTO documents (
        original_file_name, file_name, file_type, file_size, file_path,
        uploaded_by, language, processing_status, checksum, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      documentData.originalFileName,
      documentData.fileName,
      documentData.fileType,
      documentData.fileSize,
      documentData.filePath,
      documentData.uploadedBy,
      documentData.language || null,
      documentData.processingStatus,
      documentData.checksum,
      documentData.tags || []
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToDocument(result.rows[0]);
  }

  // Get document by ID
  async getDocumentById(id: string): Promise<DocumentMetadata | null> {
    const query = 'SELECT * FROM documents WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToDocument(result.rows[0]);
  }

  // Get document by filename
  async getDocumentByFileName(fileName: string): Promise<DocumentMetadata | null> {
    const query = 'SELECT * FROM documents WHERE file_name = $1';
    const result = await this.db.query(query, [fileName]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToDocument(result.rows[0]);
  }

  // Update document processing status
  async updateProcessingStatus(
    id: string, 
    status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    error?: string
  ): Promise<void> {
    const query = `
      UPDATE documents 
      SET processing_status = $1, 
          processing_error = $2,
          processing_start_time = CASE WHEN $1 = 'PROCESSING' THEN CURRENT_TIMESTAMP ELSE processing_start_time END,
          processing_end_time = CASE WHEN $1 IN ('COMPLETED', 'FAILED') THEN CURRENT_TIMESTAMP ELSE processing_end_time END
      WHERE id = $3
    `;
    
    await this.db.query(query, [status, error || null, id]);
  }

  // Search documents with criteria
  async searchDocuments(criteria: DocumentSearchCriteria): Promise<{ documents: DocumentMetadata[], total: number }> {
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (criteria.fileName) {
      whereConditions.push(`original_file_name ILIKE $${paramIndex}`);
      queryParams.push(`%${criteria.fileName}%`);
      paramIndex++;
    }

    if (criteria.fileType) {
      whereConditions.push(`file_type = $${paramIndex}`);
      queryParams.push(criteria.fileType);
      paramIndex++;
    }

    if (criteria.uploadedBy) {
      whereConditions.push(`uploaded_by = $${paramIndex}`);
      queryParams.push(criteria.uploadedBy);
      paramIndex++;
    }

    if (criteria.processingStatus) {
      whereConditions.push(`processing_status = $${paramIndex}`);
      queryParams.push(criteria.processingStatus);
      paramIndex++;
    }

    if (criteria.uploadDateFrom) {
      whereConditions.push(`upload_timestamp >= $${paramIndex}`);
      queryParams.push(criteria.uploadDateFrom);
      paramIndex++;
    }

    if (criteria.uploadDateTo) {
      whereConditions.push(`upload_timestamp <= $${paramIndex}`);
      queryParams.push(criteria.uploadDateTo);
      paramIndex++;
    }

    if (criteria.tags && criteria.tags.length > 0) {
      whereConditions.push(`tags && $${paramIndex}`);
      queryParams.push(criteria.tags);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Count total records
    const countQuery = `SELECT COUNT(*) FROM documents ${whereClause}`;
    const countResult = await this.db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Build main query with sorting and pagination
    const sortBy = criteria.sortBy || 'upload_timestamp';
    const sortOrder = criteria.sortOrder || 'DESC';
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;

    const mainQuery = `
      SELECT * FROM documents 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.db.query(mainQuery, queryParams);

    const documents = result.rows.map(row => this.mapRowToDocument(row));

    return { documents, total };
  }

  // Delete document and all related data
  async deleteDocument(id: string): Promise<boolean> {
    return await this.db.transaction(async (client: PoolClient) => {
      // Delete in order due to foreign key constraints
      await client.query('DELETE FROM document_processing_logs WHERE document_id = $1', [id]);
      await client.query('DELETE FROM extracted_entities WHERE document_id = $1', [id]);
      await client.query('DELETE FROM extracted_sections WHERE document_id = $1', [id]);
      await client.query('DELETE FROM document_content WHERE document_id = $1', [id]);
      
      const result = await client.query('DELETE FROM documents WHERE id = $1', [id]);
      return result.rowCount > 0;
    });
  }

  // Document content operations
  async saveDocumentContent(content: Omit<DocumentContent, 'id' | 'extractionTimestamp'>): Promise<string> {
    const query = `
      INSERT INTO document_content (document_id, raw_text, ocr_confidence)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const result = await this.db.query(query, [
      content.documentId,
      content.rawText,
      content.ocrConfidence
    ]);

    return result.rows[0].id;
  }

  async getDocumentContent(documentId: string): Promise<DocumentContent | null> {
    const query = 'SELECT * FROM document_content WHERE document_id = $1';
    const result = await this.db.query(query, [documentId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      documentId: row.document_id,
      rawText: row.raw_text,
      ocrConfidence: row.ocr_confidence,
      extractionTimestamp: row.extraction_timestamp
    };
  }

  // Extracted sections operations
  async saveExtractedSections(sections: Omit<ExtractedSection, 'id'>[]): Promise<void> {
    if (sections.length === 0) return;

    const query = `
      INSERT INTO extracted_sections (
        document_id, section_type, title, content, confidence, 
        start_position, end_position, page_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.db.transaction(async (client: PoolClient) => {
      for (const section of sections) {
        await client.query(query, [
          section.documentId,
          section.type,
          section.title,
          section.content,
          section.confidence,
          section.startPosition,
          section.endPosition,
          section.pageNumber
        ]);
      }
    });
  }

  async getExtractedSections(documentId: string): Promise<ExtractedSection[]> {
    const query = 'SELECT * FROM extracted_sections WHERE document_id = $1 ORDER BY start_position';
    const result = await this.db.query(query, [documentId]);
    
    return result.rows.map(row => ({
      id: row.id,
      documentId: row.document_id,
      type: row.section_type,
      title: row.title,
      content: row.content,
      confidence: row.confidence,
      startPosition: row.start_position,
      endPosition: row.end_position,
      pageNumber: row.page_number
    }));
  }

  // Processing logs operations
  async addProcessingLog(log: Omit<DocumentProcessingLog, 'id' | 'startTime'>): Promise<string> {
    const query = `
      INSERT INTO document_processing_logs (
        document_id, stage, status, end_time, message, error, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.db.query(query, [
      log.documentId,
      log.stage,
      log.status,
      log.endTime,
      log.message,
      log.error,
      log.metadata ? JSON.stringify(log.metadata) : null
    ]);

    return result.rows[0].id;
  }

  async getProcessingLogs(documentId: string): Promise<DocumentProcessingLog[]> {
    const query = 'SELECT * FROM document_processing_logs WHERE document_id = $1 ORDER BY start_time';
    const result = await this.db.query(query, [documentId]);
    
    return result.rows.map(row => ({
      id: row.id,
      documentId: row.document_id,
      stage: row.stage,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      message: row.message,
      error: row.error,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  // Utility methods
  generateChecksum(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private mapRowToDocument(row: any): DocumentMetadata {
    return {
      id: row.id,
      originalFileName: row.original_file_name,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      uploadTimestamp: row.upload_timestamp,
      lastModified: row.last_modified,
      uploadedBy: row.uploaded_by,
      language: row.language,
      processingStatus: row.processing_status,
      processingStartTime: row.processing_start_time,
      processingEndTime: row.processing_end_time,
      processingError: row.processing_error,
      checksum: row.checksum,
      tags: row.tags || [],
      version: row.version
    };
  }
}