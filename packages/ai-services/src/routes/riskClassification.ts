import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RiskClassificationService } from '../services/riskClassificationService.js';
import { ProjectFeatures, HistoricalProject } from '@dpr-system/shared';

// Request type definitions
interface RiskClassificationRequest extends FastifyRequest {
  body: {
    dprId: string;
    projectFeatures: ProjectFeatures;
    historicalData?: HistoricalProject[];
  };
}

/**
 * Register risk classification routes
 */
export async function registerRiskClassificationRoutes(fastify: FastifyInstance) {
  const riskClassificationService = new RiskClassificationService();

  // POST /api/risk-classification/classify - Classify risks for a DPR document
  fastify.post('/api/risk-classification/classify', {
    schema: {
      description: 'Classify risks for a DPR document based on project features',
      tags: ['Risk Classification'],
      body: {
        type: 'object',
        required: ['dprId', 'projectFeatures'],
        properties: {
          dprId: { type: 'string' },
          projectFeatures: {
            type: 'object',
            required: [
              'totalCost', 'estimatedDurationMonths', 'technicalComplexityScore',
              'environmentalComplexityScore', 'regulatoryComplexityScore',
              'accessibilityScore', 'infrastructureScore', 'remotenessScore'
            ],
            properties: {
              totalCost: { type: 'number' },
              estimatedDurationMonths: { type: 'number' },
              technicalComplexityScore: { type: 'number', minimum: 0, maximum: 1 },
              environmentalComplexityScore: { type: 'number', minimum: 0, maximum: 1 },
              regulatoryComplexityScore: { type: 'number', minimum: 0, maximum: 1 },
              accessibilityScore: { type: 'number', minimum: 0, maximum: 1 },
              infrastructureScore: { type: 'number', minimum: 0, maximum: 1 },
              remotenessScore: { type: 'number', minimum: 0, maximum: 1 }
            }
          },
          historicalData: {
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
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: RiskClassificationRequest, reply: FastifyReply) => {
    try {
      const { dprId, projectFeatures, historicalData } = request.body;

      // Validate required fields
      if (!dprId || !projectFeatures) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields',
          required: ['dprId', 'projectFeatures']
        });
      }

      // Validate project features structure
      const requiredFeatures = [
        'totalCost', 'estimatedDurationMonths', 'technicalComplexityScore',
        'environmentalComplexityScore', 'regulatoryComplexityScore',
        'accessibilityScore', 'infrastructureScore', 'remotenessScore'
      ];

      const missingFeatures = requiredFeatures.filter(feature => 
        projectFeatures[feature] === undefined || projectFeatures[feature] === null
      );

      if (missingFeatures.length > 0) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required project features',
          missingFeatures
        });
      }

      fastify.log.info(`Classifying risks for DPR ${dprId}`);

      // Perform risk classification
      const result = await riskClassificationService.classifyRisks(
        dprId,
        projectFeatures as ProjectFeatures,
        historicalData || []
      );

      return reply.send({
        success: true,
        data: result
      });

    } catch (error) {
      fastify.log.error('Risk classification error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Risk classification failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/risk-classification/models - Get information about ML models
  fastify.get('/api/risk-classification/models', {
    schema: {
      description: 'Get information about the ML models used for risk classification',
      tags: ['Risk Classification'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const modelInfo = riskClassificationService.getModelInfo();
      
      return reply.send({
        success: true,
        data: {
          models: modelInfo,
          totalModels: Object.keys(modelInfo).length,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      fastify.log.error('Error retrieving model information:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve model information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/risk-classification/health - Health check for risk classification services
  fastify.get('/api/risk-classification/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        service: 'Risk Classification Engine',
        status: 'operational',
        features: [
          'Multi-class risk classification',
          'Cost overrun prediction',
          'Timeline delay prediction',
          'Environmental risk assessment',
          'Resource shortage prediction'
        ],
        modelInfo: riskClassificationService.getModelInfo(),
        timestamp: new Date().toISOString()
      },
      message: 'Risk classification services are operational'
    });
  });
}