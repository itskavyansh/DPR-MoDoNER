import express from 'express';
import { Pool } from 'pg';
import { GovernmentSchemesRepository } from '../repositories/governmentSchemesRepository.js';
import { GovernmentSchemesService } from '../services/governmentSchemesService.js';
import { 
  SchemeSearchRequest,
  SchemeDataIngestionRequest,
  SchemeUpdateRequest,
  SchemeVerificationRequest
} from '../../../shared/src/types/index.js';

const router = express.Router();
let schemesService: GovernmentSchemesService;

// Initialize routes with database pool
export function initializeGovernmentSchemesRoutes(pool: Pool) {
  const repository = new GovernmentSchemesRepository(pool);
  schemesService = new GovernmentSchemesService(repository);
}

// GET /api/schemes - Search and filter government schemes
router.get('/', async (req, res) => {
  try {
    const searchRequest: SchemeSearchRequest = {
      query: req.query.q as string,
      filters: {
        ministry: req.query.ministry ? (Array.isArray(req.query.ministry) ? req.query.ministry as string[] : [req.query.ministry as string]) : undefined,
        schemeType: req.query.schemeType ? (Array.isArray(req.query.schemeType) ? req.query.schemeType as string[] : [req.query.schemeType as string]) : undefined,
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : undefined,
        applicableRegions: req.query.regions ? (Array.isArray(req.query.regions) ? req.query.regions as string[] : [req.query.regions as string]) : undefined,
        applicableSectors: req.query.sectors ? (Array.isArray(req.query.sectors) ? req.query.sectors as string[] : [req.query.sectors as string]) : undefined,
        keywords: req.query.keywords ? (Array.isArray(req.query.keywords) ? req.query.keywords as string[] : [req.query.keywords as string]) : undefined,
        fundingRange: req.query.minFunding || req.query.maxFunding ? {
          min: req.query.minFunding ? parseFloat(req.query.minFunding as string) : undefined,
          max: req.query.maxFunding ? parseFloat(req.query.maxFunding as string) : undefined
        } : undefined,
        launchDateRange: req.query.launchFrom || req.query.launchTo ? {
          from: req.query.launchFrom ? new Date(req.query.launchFrom as string) : undefined,
          to: req.query.launchTo ? new Date(req.query.launchTo as string) : undefined
        } : undefined
      },
      sorting: req.query.sortBy ? {
        field: req.query.sortBy as any,
        order: (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      } : undefined,
      pagination: {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 20
      }
    };

    const result = await schemesService.searchSchemes(searchRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching schemes:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'search',
        message: error instanceof Error ? error.message : 'Failed to search schemes',
        code: 'SEARCH_ERROR'
      }
    });
  }
});

// GET /api/schemes/statistics - Get scheme statistics
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await schemesService.getSchemeStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting scheme statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'statistics',
        message: error instanceof Error ? error.message : 'Failed to get statistics',
        code: 'STATISTICS_ERROR'
      }
    });
  }
});

// GET /api/schemes/:id - Get specific scheme by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'id',
          message: 'Scheme ID is required',
          code: 'MISSING_ID'
        }
      });
    }

    const scheme = await schemesService.getSchemeById(id);
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Scheme not found',
          code: 'SCHEME_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Error getting scheme:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'retrieval',
        message: error instanceof Error ? error.message : 'Failed to retrieve scheme',
        code: 'RETRIEVAL_ERROR'
      }
    });
  }
});

// POST /api/schemes - Create a new government scheme
router.post('/', async (req, res) => {
  try {
    const schemeData = req.body;
    
    if (!schemeData) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'body',
          message: 'Scheme data is required',
          code: 'MISSING_DATA'
        }
      });
    }

    const newScheme = await schemesService.createScheme(schemeData);
    
    res.status(201).json({
      success: true,
      data: newScheme,
      message: 'Scheme created successfully'
    });
  } catch (error) {
    console.error('Error creating scheme:', error);
    res.status(400).json({
      success: false,
      error: {
        field: 'creation',
        message: error instanceof Error ? error.message : 'Failed to create scheme',
        code: 'CREATION_ERROR'
      }
    });
  }
});

// POST /api/schemes/bulk-ingest - Bulk ingest government schemes data
router.post('/bulk-ingest', async (req, res) => {
  try {
    const ingestionRequest: SchemeDataIngestionRequest = req.body;
    
    if (!ingestionRequest || !ingestionRequest.schemes || ingestionRequest.schemes.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'schemes',
          message: 'Schemes data is required for bulk ingestion',
          code: 'MISSING_SCHEMES_DATA'
        }
      });
    }

    if (!ingestionRequest.dataSource) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'dataSource',
          message: 'Data source is required for bulk ingestion',
          code: 'MISSING_DATA_SOURCE'
        }
      });
    }

    // Set defaults
    const requestWithDefaults = {
      ...ingestionRequest,
      ingestionMode: ingestionRequest.ingestionMode || 'CREATE',
      validationLevel: ingestionRequest.validationLevel || 'MODERATE',
      batchSize: ingestionRequest.batchSize || 50
    };

    const result = await schemesService.ingestSchemeData(requestWithDefaults);
    
    const statusCode = result.failed > 0 ? 207 : 200; // 207 Multi-Status if some failed
    
    res.status(statusCode).json({
      success: result.failed === 0,
      data: result,
      message: `Bulk ingestion completed. ${result.successfullyIngested} successful, ${result.failed} failed, ${result.skipped} skipped.`
    });
  } catch (error) {
    console.error('Error in bulk ingestion:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'ingestion',
        message: error instanceof Error ? error.message : 'Failed to ingest schemes data',
        code: 'INGESTION_ERROR'
      }
    });
  }
});

// PUT /api/schemes/:id - Update existing scheme
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'id',
          message: 'Scheme ID is required',
          code: 'MISSING_ID'
        }
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'updates',
          message: 'Update data is required',
          code: 'MISSING_UPDATE_DATA'
        }
      });
    }

    const updateRequest: SchemeUpdateRequest = {
      schemeId: id,
      updates,
      updatedBy: req.headers['x-user-id'] as string || 'system'
    };

    const updatedScheme = await schemesService.updateScheme(updateRequest);
    
    if (!updatedScheme) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Scheme not found',
          code: 'SCHEME_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: updatedScheme,
      message: 'Scheme updated successfully'
    });
  } catch (error) {
    console.error('Error updating scheme:', error);
    res.status(400).json({
      success: false,
      error: {
        field: 'update',
        message: error instanceof Error ? error.message : 'Failed to update scheme',
        code: 'UPDATE_ERROR'
      }
    });
  }
});

// DELETE /api/schemes/:id - Delete scheme
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'id',
          message: 'Scheme ID is required',
          code: 'MISSING_ID'
        }
      });
    }

    const deleted = await schemesService.deleteScheme(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          field: 'id',
          message: 'Scheme not found',
          code: 'SCHEME_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      message: 'Scheme deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'deletion',
        message: error instanceof Error ? error.message : 'Failed to delete scheme',
        code: 'DELETION_ERROR'
      }
    });
  }
});

// GET /api/schemes/ministry/:ministry - Get schemes by ministry
router.get('/ministry/:ministry', async (req, res) => {
  try {
    const { ministry } = req.params;
    
    if (!ministry) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'ministry',
          message: 'Ministry is required',
          code: 'MISSING_MINISTRY'
        }
      });
    }

    const schemes = await schemesService.getSchemesByMinistry(decodeURIComponent(ministry));
    
    res.json({
      success: true,
      data: schemes,
      count: schemes.length
    });
  } catch (error) {
    console.error('Error getting schemes by ministry:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'ministry_search',
        message: error instanceof Error ? error.message : 'Failed to get schemes by ministry',
        code: 'MINISTRY_SEARCH_ERROR'
      }
    });
  }
});

// GET /api/schemes/region/:region - Get schemes by region
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    if (!region) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'region',
          message: 'Region is required',
          code: 'MISSING_REGION'
        }
      });
    }

    const schemes = await schemesService.getSchemesByRegion(decodeURIComponent(region));
    
    res.json({
      success: true,
      data: schemes,
      count: schemes.length
    });
  } catch (error) {
    console.error('Error getting schemes by region:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'region_search',
        message: error instanceof Error ? error.message : 'Failed to get schemes by region',
        code: 'REGION_SEARCH_ERROR'
      }
    });
  }
});

// GET /api/schemes/sector/:sector - Get schemes by sector
router.get('/sector/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    
    if (!sector) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'sector',
          message: 'Sector is required',
          code: 'MISSING_SECTOR'
        }
      });
    }

    const schemes = await schemesService.getSchemesBySector(decodeURIComponent(sector));
    
    res.json({
      success: true,
      data: schemes,
      count: schemes.length
    });
  } catch (error) {
    console.error('Error getting schemes by sector:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'sector_search',
        message: error instanceof Error ? error.message : 'Failed to get schemes by sector',
        code: 'SECTOR_SEARCH_ERROR'
      }
    });
  }
});

// POST /api/schemes/verify - Verify schemes
router.post('/verify', async (req, res) => {
  try {
    const verificationRequest: SchemeVerificationRequest = req.body;
    
    if (!verificationRequest.schemeIds || verificationRequest.schemeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'schemeIds',
          message: 'At least one scheme ID is required for verification',
          code: 'MISSING_SCHEME_IDS'
        }
      });
    }

    if (!verificationRequest.verificationSource) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'verificationSource',
          message: 'Verification source is required',
          code: 'MISSING_VERIFICATION_SOURCE'
        }
      });
    }

    if (!verificationRequest.verifiedBy) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'verifiedBy',
          message: 'Verified by field is required',
          code: 'MISSING_VERIFIED_BY'
        }
      });
    }

    const result = await schemesService.verifySchemes(verificationRequest);
    
    res.json({
      success: true,
      data: result,
      message: `Verification completed. ${result.verifiedSchemes.length} schemes verified, ${result.failedVerifications.length} failed.`
    });
  } catch (error) {
    console.error('Error verifying schemes:', error);
    res.status(400).json({
      success: false,
      error: {
        field: 'verification',
        message: error instanceof Error ? error.message : 'Failed to verify schemes',
        code: 'VERIFICATION_ERROR'
      }
    });
  }
});

export default router;