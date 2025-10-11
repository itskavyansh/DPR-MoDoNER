import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RiskMitigationService } from '../services/riskMitigationService.js';
import { RiskFactor, ProjectFeatures } from '../../../shared/src/types/index.js';

// Request type definitions
interface GeneratePlanRequest extends FastifyRequest {
  body: {
    dprId: string;
    riskFactors: RiskFactor[];
    projectFeatures: ProjectFeatures;
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

interface RecommendationsRequest extends FastifyRequest {
  body: {
    riskFactors: RiskFactor[];
    projectFeatures: ProjectFeatures;
  };
}

interface AddStrategyRequest extends FastifyRequest {
  body: any; // MitigationStrategy
}

interface UpdateStrategyRequest extends FastifyRequest {
  params: {
    id: string;
  };
  body: any; // Partial<MitigationStrategy>
}

interface GetStrategyRequest extends FastifyRequest {
  params: {
    id: string;
  };
}

interface GetStrategiesRequest extends FastifyRequest {
  query: {
    riskType?: 'COST_OVERRUN' | 'DELAY' | 'ENVIRONMENTAL' | 'RESOURCE';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

/**
 * Register risk mitigation routes
 */
export async function registerRiskMitigationRoutes(fastify: FastifyInstance) {
  const riskMitigationService = new RiskMitigationService();

  // POST /api/risk-mitigation/generate-plan - Generate comprehensive risk mitigation plan
  fastify.post('/api/risk-mitigation/generate-plan', {
    schema: {
      description: 'Generate comprehensive risk mitigation plan for identified risks',
      tags: ['Risk Mitigation'],
      body: {
        type: 'object',
        required: ['dprId', 'riskFactors', 'projectFeatures', 'overallRiskLevel'],
        properties: {
          dprId: { type: 'string' },
          riskFactors: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'description', 'impact', 'probability'],
              properties: {
                type: { type: 'string', enum: ['TIMELINE', 'RESOURCE', 'COMPLEXITY', 'ENVIRONMENTAL', 'FINANCIAL'] },
                description: { type: 'string' },
                impact: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                probability: { type: 'number', minimum: 0, maximum: 1 },
                mitigation: { type: 'string' }
              }
            }
          },
          projectFeatures: { type: 'object' },
          overallRiskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            metadata: { type: 'object' }
          }
        }
      }
    }
  }, async (request: GeneratePlanRequest, reply: FastifyReply) => {
    try {
      const { dprId, riskFactors, projectFeatures, overallRiskLevel } = request.body;

      // Validate required fields
      if (!dprId || !riskFactors || !projectFeatures || !overallRiskLevel) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields',
          required: ['dprId', 'riskFactors', 'projectFeatures', 'overallRiskLevel']
        });
      }

      // Validate risk factors array
      if (!Array.isArray(riskFactors) || riskFactors.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'riskFactors must be a non-empty array'
        });
      }

      // Validate overall risk level
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(overallRiskLevel)) {
        return reply.status(400).send({
          success: false,
          error: 'overallRiskLevel must be one of: LOW, MEDIUM, HIGH'
        });
      }

      fastify.log.info(`Generating mitigation plan for DPR ${dprId} with ${riskFactors.length} risk factors`);

      const mitigationPlan = await riskMitigationService.generateMitigationPlan(
        dprId,
        riskFactors,
        projectFeatures,
        overallRiskLevel
      );

      return reply.send({
        success: true,
        data: mitigationPlan,
        metadata: {
          totalRecommendations: mitigationPlan.recommendations.length,
          totalStrategies: mitigationPlan.prioritizedStrategies.length,
          quickWinsCount: mitigationPlan.quickWins.length,
          longTermActionsCount: mitigationPlan.longTermActions.length,
          processingTime: Date.now() - new Date(mitigationPlan.generatedAt).getTime()
        }
      });
    } catch (error) {
      fastify.log.error('Error generating mitigation plan:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate mitigation plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/risk-mitigation/strategies - Get mitigation strategies by risk type and severity
  fastify.get('/api/risk-mitigation/strategies', {
    schema: {
      description: 'Get mitigation strategies filtered by risk type and severity',
      tags: ['Risk Mitigation'],
      querystring: {
        type: 'object',
        properties: {
          riskType: { type: 'string', enum: ['COST_OVERRUN', 'DELAY', 'ENVIRONMENTAL', 'RESOURCE'] },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            metadata: { type: 'object' }
          }
        }
      }
    }
  }, async (request: GetStrategiesRequest, reply: FastifyReply) => {
    try {
      const { riskType, severity } = request.query;

      // Validate risk type
      if (riskType && !['COST_OVERRUN', 'DELAY', 'ENVIRONMENTAL', 'RESOURCE'].includes(riskType)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid riskType. Must be one of: COST_OVERRUN, DELAY, ENVIRONMENTAL, RESOURCE'
        });
      }

      // Validate severity
      if (severity && !['LOW', 'MEDIUM', 'HIGH'].includes(severity)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid severity. Must be one of: LOW, MEDIUM, HIGH'
        });
      }

      const strategies = riskMitigationService.getMitigationStrategies(riskType, severity);

      return reply.send({
        success: true,
        data: strategies,
        metadata: {
          totalStrategies: strategies.length,
          filters: {
            riskType: riskType || 'all',
            severity: severity || 'all'
          }
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching mitigation strategies:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch mitigation strategies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/risk-mitigation/strategies/:id - Get specific mitigation strategy by ID
  fastify.get('/api/risk-mitigation/strategies/:id', {
    schema: {
      description: 'Get specific mitigation strategy by ID',
      tags: ['Risk Mitigation'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            strategyId: { type: 'string' }
          }
        }
      }
    }
  }, async (request: GetStrategyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      if (!id) {
        return reply.status(400).send({
          success: false,
          error: 'Strategy ID is required'
        });
      }

      const strategy = riskMitigationService.getMitigationStrategy(id);

      if (!strategy) {
        return reply.status(404).send({
          success: false,
          error: 'Strategy not found',
          strategyId: id
        });
      }

      return reply.send({
        success: true,
        data: strategy
      });
    } catch (error) {
      fastify.log.error('Error fetching mitigation strategy:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch mitigation strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/risk-mitigation/strategies - Add new mitigation strategy
  fastify.post('/api/risk-mitigation/strategies', {
    schema: {
      description: 'Add new mitigation strategy to the database',
      tags: ['Risk Mitigation'],
      body: {
        type: 'object',
        required: ['id', 'riskType', 'riskSeverity', 'strategyName', 'description', 'actionItems'],
        properties: {
          id: { type: 'string' },
          riskType: { type: 'string', enum: ['COST_OVERRUN', 'DELAY', 'ENVIRONMENTAL', 'RESOURCE'] },
          riskSeverity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          strategyName: { type: 'string' },
          description: { type: 'string' },
          actionItems: { type: 'array' },
          expectedImpact: { type: 'number' },
          implementationCost: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          implementationTime: { type: 'string' },
          prerequisites: { type: 'array' },
          successMetrics: { type: 'array' },
          applicableProjectTypes: { type: 'array' },
          effectiveness: { type: 'number', minimum: 0, maximum: 1 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: AddStrategyRequest, reply: FastifyReply) => {
    try {
      const strategy = request.body;

      // Validate required fields
      const requiredFields = ['id', 'riskType', 'riskSeverity', 'strategyName', 'description', 'actionItems'];
      const missingFields = requiredFields.filter(field => !strategy[field]);

      if (missingFields.length > 0) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields',
          missingFields
        });
      }

      // Validate risk type
      if (!['COST_OVERRUN', 'DELAY', 'ENVIRONMENTAL', 'RESOURCE'].includes(strategy.riskType)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid riskType. Must be one of: COST_OVERRUN, DELAY, ENVIRONMENTAL, RESOURCE'
        });
      }

      // Validate severity
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(strategy.riskSeverity)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid riskSeverity. Must be one of: LOW, MEDIUM, HIGH'
        });
      }

      // Set default values
      strategy.expectedImpact = strategy.expectedImpact || 0;
      strategy.implementationCost = strategy.implementationCost || 'MEDIUM';
      strategy.implementationTime = strategy.implementationTime || '4 weeks';
      strategy.prerequisites = strategy.prerequisites || [];
      strategy.successMetrics = strategy.successMetrics || [];
      strategy.applicableProjectTypes = strategy.applicableProjectTypes || [];
      strategy.effectiveness = strategy.effectiveness || 0.5;
      strategy.lastUpdated = new Date();

      riskMitigationService.addMitigationStrategy(strategy);

      return reply.status(201).send({
        success: true,
        message: 'Mitigation strategy added successfully',
        data: strategy
      });
    } catch (error) {
      fastify.log.error('Error adding mitigation strategy:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.status(409).send({
          success: false,
          error: 'Strategy already exists',
          message: error.message
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to add mitigation strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT /api/risk-mitigation/strategies/:id - Update existing mitigation strategy
  fastify.put('/api/risk-mitigation/strategies/:id', async (request: UpdateStrategyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      if (!id) {
        return reply.status(400).send({
          success: false,
          error: 'Strategy ID is required'
        });
      }

      // Validate risk type if provided
      if (updates.riskType && !['COST_OVERRUN', 'DELAY', 'ENVIRONMENTAL', 'RESOURCE'].includes(updates.riskType)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid riskType. Must be one of: COST_OVERRUN, DELAY, ENVIRONMENTAL, RESOURCE'
        });
      }

      // Validate severity if provided
      if (updates.riskSeverity && !['LOW', 'MEDIUM', 'HIGH'].includes(updates.riskSeverity)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid riskSeverity. Must be one of: LOW, MEDIUM, HIGH'
        });
      }

      const success = riskMitigationService.updateMitigationStrategy(id, updates);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Strategy not found',
          strategyId: id
        });
      }

      const updatedStrategy = riskMitigationService.getMitigationStrategy(id);

      return reply.send({
        success: true,
        message: 'Mitigation strategy updated successfully',
        data: updatedStrategy
      });
    } catch (error) {
      fastify.log.error('Error updating mitigation strategy:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update mitigation strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /api/risk-mitigation/strategies/:id - Delete mitigation strategy
  fastify.delete('/api/risk-mitigation/strategies/:id', async (request: GetStrategyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      if (!id) {
        return reply.status(400).send({
          success: false,
          error: 'Strategy ID is required'
        });
      }

      const success = riskMitigationService.removeMitigationStrategy(id);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Strategy not found',
          strategyId: id
        });
      }

      return reply.send({
        success: true,
        message: 'Mitigation strategy deleted successfully',
        strategyId: id
      });
    } catch (error) {
      fastify.log.error('Error deleting mitigation strategy:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete mitigation strategy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/risk-mitigation/stats - Get mitigation database statistics
  fastify.get('/api/risk-mitigation/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = riskMitigationService.getDatabaseStats();

      return reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      fastify.log.error('Error fetching database stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch database statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/risk-mitigation/recommendations - Generate recommendations for specific risk factors
  fastify.post('/api/risk-mitigation/recommendations', {
    schema: {
      description: 'Generate mitigation recommendations for specific risk factors',
      tags: ['Risk Mitigation'],
      body: {
        type: 'object',
        required: ['riskFactors', 'projectFeatures'],
        properties: {
          riskFactors: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'description', 'impact', 'probability'],
              properties: {
                type: { type: 'string', enum: ['TIMELINE', 'RESOURCE', 'COMPLEXITY', 'ENVIRONMENTAL', 'FINANCIAL'] },
                description: { type: 'string' },
                impact: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                probability: { type: 'number', minimum: 0, maximum: 1 },
                mitigation: { type: 'string' }
              }
            }
          },
          projectFeatures: { type: 'object' }
        }
      }
    }
  }, async (request: RecommendationsRequest, reply: FastifyReply) => {
    try {
      const { riskFactors, projectFeatures } = request.body;

      // Validate required fields
      if (!riskFactors || !projectFeatures) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields',
          required: ['riskFactors', 'projectFeatures']
        });
      }

      // Validate risk factors array
      if (!Array.isArray(riskFactors) || riskFactors.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'riskFactors must be a non-empty array'
        });
      }

      fastify.log.info(`Generating recommendations for ${riskFactors.length} risk factors`);

      // Generate recommendations for each risk factor
      const recommendations = [];
      for (const riskFactor of riskFactors) {
        const recommendation = await (riskMitigationService as any).generateRiskRecommendation(riskFactor, projectFeatures);
        recommendations.push(recommendation);
      }

      return reply.send({
        success: true,
        data: recommendations,
        metadata: {
          totalRiskFactors: riskFactors.length,
          totalRecommendations: recommendations.length,
          averageStrategiesPerRisk: recommendations.reduce((sum, r) => sum + r.recommendedStrategies.length, 0) / recommendations.length
        }
      });
    } catch (error) {
      fastify.log.error('Error generating recommendations:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/risk-mitigation/health - Health check for risk mitigation services
  fastify.get('/api/risk-mitigation/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        service: 'Risk Mitigation Engine',
        status: 'operational',
        features: [
          'Risk-specific mitigation strategy database',
          'Recommendation algorithms based on risk types and severity',
          'Actionable risk reduction suggestions',
          'Strategy prioritization and optimization',
          'Implementation cost and timeline estimation'
        ],
        databaseStats: riskMitigationService.getDatabaseStats(),
        timestamp: new Date().toISOString()
      },
      message: 'Risk mitigation services are operational'
    });
  });
}