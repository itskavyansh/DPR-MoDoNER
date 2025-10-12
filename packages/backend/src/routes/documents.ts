import { Router, Request, Response } from 'express';
import { DocumentStorageService } from '../services/documentStorageService.js';
import { DocumentSearchCriteria } from '../models/document.js';

const router = Router();

// Dependency injection - will be set when router is initialized
let documentStorageService: DocumentStorageService;

export function initializeDocumentRoutes(docStorageService: DocumentStorageService) {
  documentStorageService = docStorageService;
}

// Get document by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const document = await documentStorageService.getDocument(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'server',
        message: 'Failed to retrieve document',
        code: 'RETRIEVAL_FAILED'
      }
    });
  }
});

// Search documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const criteria: DocumentSearchCriteria = {
      fileName: req.query.fileName as string,
      fileType: req.query.fileType as 'PDF' | 'DOCX' | 'TXT',
      uploadedBy: req.query.uploadedBy as string,
      processingStatus: req.query.processingStatus as 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
      uploadDateFrom: req.query.uploadDateFrom ? new Date(req.query.uploadDateFrom as string) : undefined,
      uploadDateTo: req.query.uploadDateTo ? new Date(req.query.uploadDateTo as string) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      textSearch: req.query.textSearch as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      sortBy: req.query.sortBy as 'uploadTimestamp' | 'fileName' | 'fileSize' | 'processingStatus',
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
    };

    // Remove undefined values
    Object.keys(criteria).forEach(key => {
      if (criteria[key as keyof DocumentSearchCriteria] === undefined) {
        delete criteria[key as keyof DocumentSearchCriteria];
      }
    });

    const result = await documentStorageService.searchDocuments(criteria);

    res.json({
      success: true,
      ...result,
      pagination: {
        limit: criteria.limit || 50,
        offset: criteria.offset || 0,
        total: result.total
      }
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'search',
        message: 'Failed to search documents',
        code: 'SEARCH_FAILED'
      }
    });
  }
});

// Download document file
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const document = await documentStorageService.getDocument(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        }
      });
    }

    const fileContent = await documentStorageService.getDocumentFile(document);
    
    // Set appropriate headers
    res.setHeader('Content-Type', getContentType(document.fileType));
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    res.setHeader('Content-Length', fileContent.length);
    
    res.send(fileContent);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'download',
        message: 'Failed to download document',
        code: 'DOWNLOAD_FAILED'
      }
    });
  }
});

// Update document processing status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, error } = req.body;

    if (!status || !['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'status',
          message: 'Invalid processing status',
          code: 'INVALID_STATUS'
        }
      });
    }

    await documentStorageService.updateProcessingStatus(id, status, error);

    res.json({
      success: true,
      message: 'Processing status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'update',
        message: 'Failed to update processing status',
        code: 'UPDATE_FAILED'
      }
    });
  }
});

// Add tags to document
router.post('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'tags',
          message: 'Tags must be a non-empty array',
          code: 'INVALID_TAGS'
        }
      });
    }

    await documentStorageService.addTags(id, tags);

    res.json({
      success: true,
      message: 'Tags added successfully'
    });
  } catch (error) {
    console.error('Add tags error:', error);
    
    if (error instanceof Error && error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        field: 'tags',
        message: 'Failed to add tags',
        code: 'ADD_TAGS_FAILED'
      }
    });
  }
});

// Remove tags from document
router.delete('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'tags',
          message: 'Tags must be a non-empty array',
          code: 'INVALID_TAGS'
        }
      });
    }

    await documentStorageService.removeTags(id, tags);

    res.json({
      success: true,
      message: 'Tags removed successfully'
    });
  } catch (error) {
    console.error('Remove tags error:', error);
    
    if (error instanceof Error && error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        field: 'tags',
        message: 'Failed to remove tags',
        code: 'REMOVE_TAGS_FAILED'
      }
    });
  }
});

// Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = await documentStorageService.deleteDocument(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'delete',
        message: 'Failed to delete document',
        code: 'DELETE_FAILED'
      }
    });
  }
});

// Get storage statistics
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await documentStorageService.getStorageStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'stats',
        message: 'Failed to retrieve storage statistics',
        code: 'STATS_FAILED'
      }
    });
  }
});

// Cleanup orphaned files
router.post('/admin/cleanup', async (req: Request, res: Response) => {
  try {
    const result = await documentStorageService.cleanupOrphanedFiles();
    
    res.json({
      success: true,
      message: 'Cleanup completed',
      result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'cleanup',
        message: 'Failed to cleanup orphaned files',
        code: 'CLEANUP_FAILED'
      }
    });
  }
});

// Helper function to get content type
function getContentType(fileType: string): string {
  switch (fileType) {
    case 'PDF':
      return 'application/pdf';
    case 'DOCX':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'TXT':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

export default router;