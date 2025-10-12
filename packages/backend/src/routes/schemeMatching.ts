import express from 'express';
import { Pool } from 'pg';
import { GovernmentSchemesRepository } from '../repositories/governmentSchemesRepository.js';
import { GovernmentSchemesService } from '../services/governmentSchemesService.js';
import { SchemeMatchingIntegrationService } from '../services/schemeMatchingIntegrationService.js';
import { 
  SchemeMatchingRequest,
  SchemeGapAnalysis
} from '../../../shared/src/types/index.js';

const router = express.Router();
let schemeMatchingService: SchemeMatchingIntegrationService;

// Initialize routes with database pool
export function initializeSchemeMatchingRoutes(pool: Pool) {
  const repository = new GovernmentSchemesRepository(pool);
  const governmentSchemesService = new GovernmentSchemesService(repository);
  schemeMatchingService = new SchemeMatchingIntegrationService(governmentSchemesService);
}

// POST /api/scheme-matching/match - Perform scheme matching for DPR
router.post('/match', async (req, res) => {
  try {
    const matchingRequest: SchemeMatchingRequest = req.body;
    
    if (!matchingRequest.documentId) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'documentId',
          message: 'Document ID is required',
          code: 'MISSING_DOCUMENT_ID'
        }
      });
    }

    if (!matchingRequest.projectDescription) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'projectDescription',
          message: 'Project description is required',
          code: 'MISSING_PROJECT_DESCRIPTION'
        }
      });
    }

    if (!matchingRequest.sectors || matchingRequest.sectors.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'sectors',
          message: 'At least one project sector is required',
          code: 'MISSING_SECTORS'
        }
      });
    }

    const result = await schemeMatchingService.performSchemeMatching(matchingRequest);
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.matchedSchemes.length} matching schemes from ${result.totalSchemesAnalyzed} analyzed schemes`
    });
  } catch (error) {
    console.error('Error in scheme matching:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'matching',
        message: error instanceof Error ? error.message : 'Failed to match schemes',
        code: 'MATCHING_ERROR'
      }
    });
  }
});

// POST /api/scheme-matching/verify - Verify existing scheme references
router.post('/verify', async (req, res) => {
  try {
    const { documentId, mentionedSchemes } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'documentId',
          message: 'Document ID is required',
          code: 'MISSING_DOCUMENT_ID'
        }
      });
    }

    if (!mentionedSchemes || !Array.isArray(mentionedSchemes) || mentionedSchemes.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'mentionedSchemes',
          message: 'Mentioned schemes array is required',
          code: 'MISSING_MENTIONED_SCHEMES'
        }
      });
    }

    const result = await schemeMatchingService.verifySchemeReferences(documentId, mentionedSchemes);
    
    res.json({
      success: true,
      data: result,
      message: `Verified ${result.verifiedSchemes.length} schemes, ${result.unverifiedReferences.length} unverified, ${result.suggestions.length} suggestions`
    });
  } catch (error) {
    console.error('Error in scheme verification:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'verification',
        message: error instanceof Error ? error.message : 'Failed to verify schemes',
        code: 'VERIFICATION_ERROR'
      }
    });
  }
});

// POST /api/scheme-matching/gap-analysis - Perform gap analysis
router.post('/gap-analysis', async (req, res) => {
  try {
    const { documentId, projectData, mentionedSchemes } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'documentId',
          message: 'Document ID is required',
          code: 'MISSING_DOCUMENT_ID'
        }
      });
    }

    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'projectData',
          message: 'Project data is required',
          code: 'MISSING_PROJECT_DATA'
        }
      });
    }

    // Validate required project data fields
    const requiredFields = ['description', 'sectors', 'location', 'estimatedCost'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return res.status(400).json({
          success: false,
          error: {
            field: `projectData.${field}`,
            message: `Project ${field} is required`,
            code: `MISSING_PROJECT_${field.toUpperCase()}`
          }
        });
      }
    }

    if (!projectData.location.state) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'projectData.location.state',
          message: 'Project location state is required',
          code: 'MISSING_PROJECT_STATE'
        }
      });
    }

    const result = await schemeMatchingService.performGapAnalysis(
      documentId,
      projectData,
      mentionedSchemes || []
    );
    
    res.json({
      success: true,
      data: result,
      message: `Gap analysis completed with ${result.gapSeverity} severity and ${(result.completenessScore * 100).toFixed(1)}% completeness score`
    });
  } catch (error) {
    console.error('Error in gap analysis:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'gap_analysis',
        message: error instanceof Error ? error.message : 'Failed to perform gap analysis',
        code: 'GAP_ANALYSIS_ERROR'
      }
    });
  }
});

// POST /api/scheme-matching/missing-opportunities - Identify missing opportunities
router.post('/missing-opportunities', async (req, res) => {
  try {
    const { 
      documentId, 
      projectDescription, 
      projectSectors, 
      projectLocation, 
      estimatedCost, 
      existingSchemes 
    } = req.body;
    
    if (!documentId || !projectDescription || !projectSectors || !projectLocation || !estimatedCost) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'request_data',
          message: 'Document ID, project description, sectors, location, and estimated cost are required',
          code: 'MISSING_REQUIRED_DATA'
        }
      });
    }

    const result = await schemeMatchingService.identifyMissingOpportunities(
      documentId,
      projectDescription,
      projectSectors,
      projectLocation,
      estimatedCost,
      existingSchemes || []
    );
    
    res.json({
      success: true,
      data: result,
      message: `Identified ${result.missingOpportunities.length} missing opportunities from ${result.opportunityAnalysis.length} analyzed schemes`
    });
  } catch (error) {
    console.error('Error identifying missing opportunities:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'missing_opportunities',
        message: error instanceof Error ? error.message : 'Failed to identify missing opportunities',
        code: 'MISSING_OPPORTUNITIES_ERROR'
      }
    });
  }
});

// POST /api/scheme-matching/optimization-recommendations - Generate optimization recommendations
router.post('/optimization-recommendations', async (req, res) => {
  try {
    const { gapAnalysis, projectData } = req.body;
    
    if (!gapAnalysis) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'gapAnalysis',
          message: 'Gap analysis data is required',
          code: 'MISSING_GAP_ANALYSIS'
        }
      });
    }

    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'projectData',
          message: 'Project data is required',
          code: 'MISSING_PROJECT_DATA'
        }
      });
    }

    const recommendations = await schemeMatchingService.generateOptimizationRecommendations(
      gapAnalysis as SchemeGapAnalysis,
      projectData
    );
    
    res.json({
      success: true,
      data: {
        recommendations,
        totalRecommendations: recommendations.length,
        highPriorityCount: recommendations.filter(r => r.priority === 'HIGH').length,
        mediumPriorityCount: recommendations.filter(r => r.priority === 'MEDIUM').length,
        lowPriorityCount: recommendations.filter(r => r.priority === 'LOW').length
      },
      message: `Generated ${recommendations.length} optimization recommendations`
    });
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'optimization_recommendations',
        message: error instanceof Error ? error.message : 'Failed to generate optimization recommendations',
        code: 'OPTIMIZATION_RECOMMENDATIONS_ERROR'
      }
    });
  }
});

// POST /api/scheme-matching/comprehensive-analysis - Get comprehensive scheme analysis
router.post('/comprehensive-analysis', async (req, res) => {
  try {
    const { 
      documentId, 
      projectData, 
      mentionedSchemes, 
      matchingOptions 
    } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'documentId',
          message: 'Document ID is required',
          code: 'MISSING_DOCUMENT_ID'
        }
      });
    }

    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: {
          field: 'projectData',
          message: 'Project data is required',
          code: 'MISSING_PROJECT_DATA'
        }
      });
    }

    // Validate required project data fields
    const requiredFields = ['description', 'sectors', 'location', 'estimatedCost'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return res.status(400).json({
          success: false,
          error: {
            field: `projectData.${field}`,
            message: `Project ${field} is required`,
            code: `MISSING_PROJECT_${field.toUpperCase()}`
          }
        });
      }
    }

    const result = await schemeMatchingService.getComprehensiveSchemeAnalysis(
      documentId,
      projectData,
      mentionedSchemes || [],
      matchingOptions
    );
    
    res.json({
      success: true,
      data: result,
      message: `Comprehensive analysis completed: ${result.summary.matchedSchemes} matches, ${result.summary.missingOpportunities} opportunities, ${result.summary.highPriorityRecommendations} high-priority recommendations`
    });
  } catch (error) {
    console.error('Error in comprehensive scheme analysis:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'comprehensive_analysis',
        message: error instanceof Error ? error.message : 'Failed to perform comprehensive analysis',
        code: 'COMPREHENSIVE_ANALYSIS_ERROR'
      }
    });
  }
});

// GET /api/scheme-matching/health - Health check for scheme matching services
router.get('/health', async (req, res) => {
  try {
    const aiServicesHealth = await schemeMatchingService.checkAIServicesHealth();
    
    res.json({
      success: true,
      data: {
        service: 'Scheme Matching Integration',
        backendStatus: 'operational',
        aiServicesStatus: aiServicesHealth.status,
        aiServicesMessage: aiServicesHealth.message,
        features: [
          'Scheme matching',
          'Scheme verification',
          'Gap analysis',
          'Missing opportunity identification',
          'Optimization recommendations',
          'Comprehensive analysis'
        ],
        timestamp: new Date().toISOString()
      },
      message: 'Scheme matching integration services status'
    });
  } catch (error) {
    console.error('Error checking scheme matching health:', error);
    res.status(500).json({
      success: false,
      error: {
        field: 'health_check',
        message: error instanceof Error ? error.message : 'Failed to check service health',
        code: 'HEALTH_CHECK_ERROR'
      }
    });
  }
});

export default router;