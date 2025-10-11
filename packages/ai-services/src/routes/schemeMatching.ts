import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SchemeMatchingService } from '../services/schemeMatchingService.js';
import { SchemeVerificationService } from '../services/schemeVerificationService.js';
import { 
  SchemeMatchingRequest,
  GovernmentScheme,
  SchemeGapAnalysis
} from '../../../shared/src/types/index.js';

// Request/Response type definitions
interface SchemeMatchingRouteRequest extends FastifyRequest {
  body: SchemeMatchingRequest & {
    availableSchemes: GovernmentScheme[];
  };
}

interface SchemeVerificationRouteRequest extends FastifyRequest {
  body: {
    documentId: string;
    mentionedSchemes: string[];
    availableSchemes: GovernmentScheme[];
  };
}

interface GapAnalysisRouteRequest extends FastifyRequest {
  body: {
    documentId: string;
    projectData: {
      description: string;
      sectors: string[];
      location: { state: string; district?: string };
      estimatedCost: number;
      targetBeneficiaries?: string[];
    };
    mentionedSchemes: string[];
    availableSchemes: GovernmentScheme[];
  };
}

interface OptimizationRecommendationsRequest extends FastifyRequest {
  body: {
    gapAnalysis: SchemeGapAnalysis;
    projectData: {
      estimatedCost: number;
      sectors: string[];
      location: { state: string; district?: string };
    };
    availableSchemes: GovernmentScheme[];
  };
}

/**
 * Register scheme matching routes
 */
export async function registerSchemeMatchingRoutes(fastify: FastifyInstance) {
  const schemeMatchingService = new SchemeMatchingService();
  const schemeVerificationService = new SchemeVerificationService();

  // POST /api/schemes/match - Match schemes with DPR projects
  fastify.post('/api/schemes/match', {
    schema: {
      description: 'Match government schemes with DPR project using NLP-based semantic similarity',
      tags: ['Scheme Matching'],
      body: {
        type: 'object',
        required: ['documentId', 'projectDescription', 'sectors', 'availableSchemes'],
        properties: {
          documentId: { type: 'string' },
          projectDescription: { type: 'string' },
          projectType: { type: 'string' },
          estimatedCost: { type: 'number' },
          location: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              district: { type: 'string' }
            },
            required: ['state']
          },
          sectors: {
            type: 'array',
            items: { type: 'string' }
          },
          targetBeneficiaries: {
            type: 'array',
            items: { type: 'string' }
          },
          existingSchemes: {
            type: 'array',
            items: { type: 'string' }
          },
          matchingOptions: {
            type: 'object',
            properties: {
              includeInactive: { type: 'boolean' },
              minRelevanceScore: { type: 'number' },
              maxResults: { type: 'number' },
              preferredSchemeTypes: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          availableSchemes: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object' }
          }
        }
      }
    }
  }, async (request: SchemeMatchingRouteRequest, reply: FastifyReply) => {
    try {
      const { availableSchemes, ...matchingRequest } = request.body;

      if (!availableSchemes || availableSchemes.length === 0) {
        return reply.status(400).send({
          success: false,
          error: {
            field: 'availableSchemes',
            message: 'Available schemes data is required for matching',
            code: 'MISSING_SCHEMES_DATA'
          }
        });
      }

      const startTime = Date.now();
      const result = await schemeMatchingService.matchSchemes(matchingRequest, availableSchemes);
      const processingTime = Date.now() - startTime;

      fastify.log.info(`Scheme matching completed for document ${matchingRequest.documentId} in ${processingTime}ms`);

      return reply.send({
        success: true,
        data: result,
        message: `Found ${result.matchedSchemes.length} matching schemes from ${result.totalSchemesAnalyzed} analyzed schemes`
      });

    } catch (error) {
      fastify.log.error('Error in scheme matching:', error);
      return reply.status(500).send({
        success: false,
        error: {
          field: 'matching',
          message: error instanceof Error ? error.message : 'Failed to match schemes',
          code: 'MATCHING_ERROR'
        }
      });
    }
  });

  // POST /api/schemes/verify - Verify existing scheme references
  fastify.post('/api/schemes/verify', {
    schema: {
      description: 'Verify existing scheme references in DPR documents',
      tags: ['Scheme Verification'],
      body: {
        type: 'object',
        required: ['documentId', 'mentionedSchemes', 'availableSchemes'],
        properties: {
          documentId: { type: 'string' },
          mentionedSchemes: {
            type: 'array',
            items: { type: 'string' }
          },
          availableSchemes: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    }
  }, async (request: SchemeVerificationRouteRequest, reply: FastifyReply) => {
    try {
      const { documentId, mentionedSchemes, availableSchemes } = request.body;

      if (!mentionedSchemes || mentionedSchemes.length === 0) {
        return reply.status(400).send({
          success: false,
          error: {
            field: 'mentionedSchemes',
            message: 'Mentioned schemes are required for verification',
            code: 'MISSING_MENTIONED_SCHEMES'
          }
        });
      }

      const result = await schemeVerificationService.verifySchemeReferences(
        documentId,
        mentionedSchemes,
        availableSchemes
      );

      return reply.send({
        success: true,
        data: result,
        message: `Verified ${result.verifiedSchemes.length} schemes, ${result.unverifiedReferences.length} unverified, ${result.suggestions.length} suggestions`
      });

    } catch (error) {
      fastify.log.error('Error in scheme verification:', error);
      return reply.status(500).send({
        success: false,
        error: {
          field: 'verification',
          message: error instanceof Error ? error.message : 'Failed to verify schemes',
          code: 'VERIFICATION_ERROR'
        }
      });
    }
  });

  // POST /api/schemes/gap-analysis - Perform comprehensive gap analysis
  fastify.post('/api/schemes/gap-analysis', {
    schema: {
      description: 'Perform comprehensive scheme gap analysis for DPR projects',
      tags: ['Scheme Gap Analysis'],
      body: {
        type: 'object',
        required: ['documentId', 'projectData', 'mentionedSchemes', 'availableSchemes'],
        properties: {
          documentId: { type: 'string' },
          projectData: {
            type: 'object',
            required: ['description', 'sectors', 'location', 'estimatedCost'],
            properties: {
              description: { type: 'string' },
              sectors: {
                type: 'array',
                items: { type: 'string' }
              },
              location: {
                type: 'object',
                properties: {
                  state: { type: 'string' },
                  district: { type: 'string' }
                },
                required: ['state']
              },
              estimatedCost: { type: 'number' },
              targetBeneficiaries: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          mentionedSchemes: {
            type: 'array',
            items: { type: 'string' }
          },
          availableSchemes: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    }
  }, async (request: GapAnalysisRouteRequest, reply: FastifyReply) => {
    try {
      const { documentId, projectData, mentionedSchemes, availableSchemes } = request.body;

      const result = await schemeVerificationService.performComprehensiveGapAnalysis(
        documentId,
        projectData,
        mentionedSchemes,
        availableSchemes
      );

      return reply.send({
        success: true,
        data: result,
        message: `Gap analysis completed with ${result.gapSeverity} severity and ${(result.completenessScore * 100).toFixed(1)}% completeness score`
      });

    } catch (error) {
      fastify.log.error('Error in gap analysis:', error);
      return reply.status(500).send({
        success: false,
        error: {
          field: 'gap_analysis',
          message: error instanceof Error ? error.message : 'Failed to perform gap analysis',
          code: 'GAP_ANALYSIS_ERROR'
        }
      });
    }
  });

  // POST /api/schemes/missing-opportunities - Identify missing scheme opportunities
  fastify.post('/api/schemes/missing-opportunities', {
    schema: {
      description: 'Identify missing scheme opportunities for DPR projects',
      tags: ['Scheme Opportunities'],
      body: {
        type: 'object',
        required: ['documentId', 'projectDescription', 'projectSectors', 'projectLocation', 'estimatedCost', 'existingSchemes', 'availableSchemes'],
        properties: {
          documentId: { type: 'string' },
          projectDescription: { type: 'string' },
          projectSectors: {
            type: 'array',
            items: { type: 'string' }
          },
          projectLocation: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              district: { type: 'string' }
            },
            required: ['state']
          },
          estimatedCost: { type: 'number' },
          existingSchemes: {
            type: 'array',
            items: { type: 'object' }
          },
          availableSchemes: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        documentId,
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost,
        existingSchemes,
        availableSchemes
      } = request.body as any;

      const result = await schemeVerificationService.identifyMissingOpportunities(
        documentId,
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost,
        existingSchemes,
        availableSchemes
      );

      return reply.send({
        success: true,
        data: result,
        message: `Identified ${result.missingOpportunities.length} missing opportunities from ${result.opportunityAnalysis.length} analyzed schemes`
      });

    } catch (error) {
      fastify.log.error('Error identifying missing opportunities:', error);
      return reply.status(500).send({
        success: false,
        error: {
          field: 'missing_opportunities',
          message: error instanceof Error ? error.message : 'Failed to identify missing opportunities',
          code: 'MISSING_OPPORTUNITIES_ERROR'
        }
      });
    }
  });

  // POST /api/schemes/optimization-recommendations - Generate scheme optimization recommendations
  fastify.post('/api/schemes/optimization-recommendations', {
    schema: {
      description: 'Generate scheme optimization recommendations based on gap analysis',
      tags: ['Scheme Optimization'],
      body: {
        type: 'object',
        required: ['gapAnalysis', 'projectData', 'availableSchemes'],
        properties: {
          gapAnalysis: { type: 'object' },
          projectData: {
            type: 'object',
            required: ['estimatedCost', 'sectors', 'location'],
            properties: {
              estimatedCost: { type: 'number' },
              sectors: {
                type: 'array',
                items: { type: 'string' }
              },
              location: {
                type: 'object',
                properties: {
                  state: { type: 'string' },
                  district: { type: 'string' }
                },
                required: ['state']
              }
            }
          },
          availableSchemes: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    }
  }, async (request: OptimizationRecommendationsRequest, reply: FastifyReply) => {
    try {
      const { gapAnalysis, projectData, availableSchemes } = request.body;

      const recommendations = schemeVerificationService.generateSchemeOptimizationRecommendations(
        gapAnalysis,
        projectData,
        availableSchemes
      );

      return reply.send({
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
      fastify.log.error('Error generating optimization recommendations:', error);
      return reply.status(500).send({
        success: false,
        error: {
          field: 'optimization_recommendations',
          message: error instanceof Error ? error.message : 'Failed to generate optimization recommendations',
          code: 'OPTIMIZATION_RECOMMENDATIONS_ERROR'
        }
      });
    }
  });

  // GET /api/schemes/health - Health check for scheme matching services
  fastify.get('/api/schemes/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        service: 'Scheme Matching Engine',
        status: 'operational',
        features: [
          'Semantic similarity matching',
          'Relevance scoring algorithms',
          'Scheme verification',
          'Gap analysis',
          'Missing opportunity identification',
          'Optimization recommendations'
        ],
        timestamp: new Date().toISOString()
      },
      message: 'Scheme matching services are operational'
    });
  });
}