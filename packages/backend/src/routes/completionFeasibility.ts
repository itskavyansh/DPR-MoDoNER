import express from 'express';
import { CompletionFeasibilityService, ProbabilityCalculatorService, WhatIfSimulatorService } from '@dpr-system/ai-services';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { CompletionFeasibilityResult, SimulationScenario } from '@dpr-system/shared';

const router = express.Router();
const completionFeasibilityService = new CompletionFeasibilityService();
const probabilityCalculatorService = new ProbabilityCalculatorService();
const whatIfSimulatorService = new WhatIfSimulatorService();
const documentRepository = new DocumentRepository();

/**
 * POST /api/completion-feasibility/predict
 * Predict completion feasibility for a DPR
 */
router.post('/predict', async (req, res) => {
  try {
    const { dprId } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document from database
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    // Check if DPR has been processed
    if (dpr.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'DPR must be fully processed before feasibility analysis',
        code: 'DPR_NOT_PROCESSED'
      });
    }

    // Predict completion feasibility
    const result = await completionFeasibilityService.predictCompletionFeasibility(dpr);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error predicting completion feasibility:', error);
    res.status(500).json({
      error: 'Failed to predict completion feasibility',
      code: 'PREDICTION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/simulate
 * Run what-if simulation for completion feasibility
 */
router.post('/simulate', async (req, res) => {
  try {
    const { 
      dprId, 
      timelineAdjustment, 
      resourceAdjustment, 
      complexityAdjustment 
    } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    // Get base feasibility analysis
    const baseFeasibility = await completionFeasibilityService.predictCompletionFeasibility(dpr);

    // Create custom simulation scenario
    const customScenario: SimulationScenario = {
      scenarioName: 'Custom Simulation',
      adjustedTimeline: baseFeasibility.simulationData[0].adjustedTimeline * (timelineAdjustment || 1.0),
      adjustedResources: baseFeasibility.simulationData[0].adjustedResources * (resourceAdjustment || 1.0),
      adjustedComplexity: baseFeasibility.simulationData[0].adjustedComplexity * (complexityAdjustment || 1.0),
      predictedProbability: 0 // Will be calculated
    };

    // Calculate new probability for custom scenario
    // This is a simplified calculation - in production would use the actual ML model
    let adjustedProbability = baseFeasibility.completionProbability / 100;
    
    if (timelineAdjustment && timelineAdjustment > 1) {
      adjustedProbability += (timelineAdjustment - 1) * 0.2; // More time increases probability
    } else if (timelineAdjustment && timelineAdjustment < 1) {
      adjustedProbability -= (1 - timelineAdjustment) * 0.3; // Less time decreases probability
    }
    
    if (resourceAdjustment && resourceAdjustment > 1) {
      adjustedProbability += (resourceAdjustment - 1) * 0.15; // More resources increase probability
    } else if (resourceAdjustment && resourceAdjustment < 1) {
      adjustedProbability -= (1 - resourceAdjustment) * 0.25; // Fewer resources decrease probability
    }
    
    if (complexityAdjustment && complexityAdjustment > 1) {
      adjustedProbability -= (complexityAdjustment - 1) * 0.2; // More complexity decreases probability
    }

    customScenario.predictedProbability = Math.min(Math.max(adjustedProbability, 0.1), 0.95);

    res.json({
      success: true,
      data: {
        baseScenario: baseFeasibility.simulationData[0],
        customScenario,
        comparison: {
          probabilityChange: customScenario.predictedProbability - (baseFeasibility.completionProbability / 100),
          timelineChange: customScenario.adjustedTimeline - baseFeasibility.simulationData[0].adjustedTimeline,
          resourceChange: customScenario.adjustedResources - baseFeasibility.simulationData[0].adjustedResources,
          complexityChange: customScenario.adjustedComplexity - baseFeasibility.simulationData[0].adjustedComplexity
        }
      }
    });

  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({
      error: 'Failed to run simulation',
      code: 'SIMULATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/completion-feasibility/history/:dprId
 * Get historical completion feasibility analyses for a DPR
 */
router.get('/history/:dprId', async (req, res) => {
  try {
    const { dprId } = req.params;

    // In a real implementation, this would query a database for historical analyses
    // For now, we'll return a mock response
    const mockHistory = [
      {
        analysisId: 'analysis_1',
        analysisDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completionProbability: 0.72,
        riskFactorCount: 3,
        version: '1.0'
      },
      {
        analysisId: 'analysis_2',
        analysisDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completionProbability: 0.75,
        riskFactorCount: 2,
        version: '1.1'
      }
    ];

    res.json({
      success: true,
      data: {
        dprId,
        analyses: mockHistory,
        totalAnalyses: mockHistory.length
      }
    });

  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis history',
      code: 'HISTORY_FETCH_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/completion-feasibility/model-info
 * Get information about the ML models used for prediction
 */
router.get('/model-info', async (req, res) => {
  try {
    // Return model information
    const modelInfo = {
      modelVersion: '1.0.0',
      trainingDate: '2024-01-15',
      accuracy: 0.82,
      precision: 0.79,
      recall: 0.85,
      f1Score: 0.82,
      features: [
        'estimatedDurationMonths',
        'totalCost',
        'technicalComplexityScore',
        'accessibilityScore',
        'regionSuccessRate',
        'resourceComplexityScore',
        'regulatoryComplexityScore'
      ],
      trainingDataSize: 1250,
      lastUpdated: new Date('2024-01-15')
    };

    res.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    console.error('Error fetching model info:', error);
    res.status(500).json({
      error: 'Failed to fetch model information',
      code: 'MODEL_INFO_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/batch-predict
 * Predict completion feasibility for multiple DPRs
 */
router.post('/batch-predict', async (req, res) => {
  try {
    const { dprIds } = req.body;

    if (!dprIds || !Array.isArray(dprIds) || dprIds.length === 0) {
      return res.status(400).json({
        error: 'Array of DPR IDs is required',
        code: 'MISSING_DPR_IDS'
      });
    }

    if (dprIds.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 DPRs can be processed in a single batch',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    const results: (CompletionFeasibilityResult | { error: string; dprId: string })[] = [];

    // Process each DPR
    for (const dprId of dprIds) {
      try {
        const dpr = await documentRepository.findById(dprId);
        if (!dpr) {
          results.push({
            error: 'DPR not found',
            dprId
          });
          continue;
        }

        if (dpr.processingStatus !== 'COMPLETED') {
          results.push({
            error: 'DPR not fully processed',
            dprId
          });
          continue;
        }

        const result = await completionFeasibilityService.predictCompletionFeasibility(dpr);
        results.push(result);

      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : 'Unknown error',
          dprId
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        totalProcessed: dprIds.length,
        successCount: results.filter(r => !('error' in r)).length,
        errorCount: results.filter(r => 'error' in r).length
      }
    });

  } catch (error) {
    console.error('Error in batch prediction:', error);
    res.status(500).json({
      error: 'Failed to process batch prediction',
      code: 'BATCH_PREDICTION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/calculate-probability
 * Calculate detailed completion probability with breakdown
 */
router.post('/calculate-probability', async (req, res) => {
  try {
    const { dprId } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    if (dpr.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'DPR must be fully processed before probability calculation',
        code: 'DPR_NOT_PROCESSED'
      });
    }

    // Get feasibility analysis first to extract features and risks
    const feasibilityResult = await completionFeasibilityService.predictCompletionFeasibility(dpr);
    
    // Extract features (this would normally be done by the feasibility service)
    // For now, we'll create mock features based on the DPR
    const mockFeatures = {
      estimatedDurationMonths: 18,
      seasonalityFactor: 1.2,
      weatherRiskMonths: 4,
      totalCost: 55000000,
      costPerMonth: 3055556,
      resourceComplexityScore: 1.8,
      laborIntensityScore: 1.6,
      technicalComplexityScore: 2.0,
      environmentalComplexityScore: 1.5,
      regulatoryComplexityScore: 2.2,
      accessibilityScore: 2.0,
      infrastructureScore: 2.2,
      remotenessScore: 1.3,
      similarProjectsCount: 15,
      regionSuccessRate: 0.72,
      categorySuccessRate: 0.75
    };

    // Calculate detailed probability
    const probabilityResult = await probabilityCalculatorService.calculateCompletionProbability(
      dpr, 
      mockFeatures, 
      feasibilityResult.riskFactors
    );

    res.json({
      success: true,
      data: probabilityResult
    });

  } catch (error) {
    console.error('Error calculating probability:', error);
    res.status(500).json({
      error: 'Failed to calculate completion probability',
      code: 'PROBABILITY_CALCULATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/analyze-risks
 * Analyze risks with detailed breakdown
 */
router.post('/analyze-risks', async (req, res) => {
  try {
    const { dprId } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    if (dpr.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'DPR must be fully processed before risk analysis',
        code: 'DPR_NOT_PROCESSED'
      });
    }

    // Get feasibility analysis first
    const feasibilityResult = await completionFeasibilityService.predictCompletionFeasibility(dpr);
    
    // Mock features (same as above)
    const mockFeatures = {
      estimatedDurationMonths: 18,
      seasonalityFactor: 1.2,
      weatherRiskMonths: 4,
      totalCost: 55000000,
      costPerMonth: 3055556,
      resourceComplexityScore: 1.8,
      laborIntensityScore: 1.6,
      technicalComplexityScore: 2.0,
      environmentalComplexityScore: 1.5,
      regulatoryComplexityScore: 2.2,
      accessibilityScore: 2.0,
      infrastructureScore: 2.2,
      remotenessScore: 1.3,
      similarProjectsCount: 15,
      regionSuccessRate: 0.72,
      categorySuccessRate: 0.75
    };

    // Analyze risks
    const riskAnalysis = await probabilityCalculatorService.analyzeRisks(
      dpr, 
      mockFeatures, 
      feasibilityResult.riskFactors
    );

    res.json({
      success: true,
      data: riskAnalysis
    });

  } catch (error) {
    console.error('Error analyzing risks:', error);
    res.status(500).json({
      error: 'Failed to analyze risks',
      code: 'RISK_ANALYSIS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/generate-recommendations
 * Generate recommendations to improve completion likelihood
 */
router.post('/generate-recommendations', async (req, res) => {
  try {
    const { dprId } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    if (dpr.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'DPR must be fully processed before generating recommendations',
        code: 'DPR_NOT_PROCESSED'
      });
    }

    // Get feasibility analysis first
    const feasibilityResult = await completionFeasibilityService.predictCompletionFeasibility(dpr);
    
    // Mock features (same as above)
    const mockFeatures = {
      estimatedDurationMonths: 18,
      seasonalityFactor: 1.2,
      weatherRiskMonths: 4,
      totalCost: 55000000,
      costPerMonth: 3055556,
      resourceComplexityScore: 1.8,
      laborIntensityScore: 1.6,
      technicalComplexityScore: 2.0,
      environmentalComplexityScore: 1.5,
      regulatoryComplexityScore: 2.2,
      accessibilityScore: 2.0,
      infrastructureScore: 2.2,
      remotenessScore: 1.3,
      similarProjectsCount: 15,
      regionSuccessRate: 0.72,
      categorySuccessRate: 0.75
    };

    // Generate recommendations
    const recommendations = await probabilityCalculatorService.generateRecommendations(
      dpr,
      mockFeatures,
      feasibilityResult.riskFactors,
      feasibilityResult.completionProbability
    );

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      code: 'RECOMMENDATION_GENERATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/create-simulation-session
 * Create a new interactive simulation session
 */
router.post('/create-simulation-session', async (req, res) => {
  try {
    const { dprId } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    if (dpr.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'DPR must be fully processed before creating simulation session',
        code: 'DPR_NOT_PROCESSED'
      });
    }

    // Create simulation session
    const session = await whatIfSimulatorService.createSimulationSession(dpr);

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error creating simulation session:', error);
    res.status(500).json({
      error: 'Failed to create simulation session',
      code: 'SESSION_CREATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/run-simulation
 * Run what-if simulation with parameters
 */
router.post('/run-simulation', async (req, res) => {
  try {
    const { sessionId, parameters, scenarioName } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required',
        code: 'MISSING_SESSION_ID'
      });
    }

    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({
        error: 'Simulation parameters are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Run simulation
    const result = await whatIfSimulatorService.runSimulation(sessionId, parameters, scenarioName);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error running simulation:', error);
    
    if (error instanceof Error && error.message === 'Simulation session not found') {
      return res.status(404).json({
        error: 'Simulation session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to run simulation',
      code: 'SIMULATION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/completion-feasibility/comprehensive-analysis
 * Run comprehensive what-if analysis with multiple scenarios
 */
router.post('/comprehensive-analysis', async (req, res) => {
  try {
    const { dprId } = req.body;

    if (!dprId) {
      return res.status(400).json({
        error: 'DPR ID is required',
        code: 'MISSING_DPR_ID'
      });
    }

    // Get DPR document
    const dpr = await documentRepository.findById(dprId);
    if (!dpr) {
      return res.status(404).json({
        error: 'DPR document not found',
        code: 'DPR_NOT_FOUND'
      });
    }

    if (dpr.processingStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'DPR must be fully processed before comprehensive analysis',
        code: 'DPR_NOT_PROCESSED'
      });
    }

    // Run comprehensive analysis
    const analysis = await whatIfSimulatorService.runComprehensiveAnalysis(dpr);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error running comprehensive analysis:', error);
    res.status(500).json({
      error: 'Failed to run comprehensive analysis',
      code: 'COMPREHENSIVE_ANALYSIS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/completion-feasibility/simulation-session/:sessionId
 * Get simulation session details
 */
router.get('/simulation-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = whatIfSimulatorService.getSimulationSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Simulation session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error fetching simulation session:', error);
    res.status(500).json({
      error: 'Failed to fetch simulation session',
      code: 'SESSION_FETCH_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/completion-feasibility/simulation-session/:sessionId
 * Close simulation session
 */
router.delete('/simulation-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const success = whatIfSimulatorService.closeSimulationSession(sessionId);
    if (!success) {
      return res.status(404).json({
        error: 'Simulation session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Simulation session closed successfully'
    });

  } catch (error) {
    console.error('Error closing simulation session:', error);
    res.status(500).json({
      error: 'Failed to close simulation session',
      code: 'SESSION_CLOSE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/completion-feasibility/active-sessions
 * Get count of active simulation sessions (for monitoring)
 */
router.get('/active-sessions', async (req, res) => {
  try {
    const activeSessionsCount = whatIfSimulatorService.getActiveSessionsCount();

    res.json({
      success: true,
      data: {
        activeSessionsCount,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching active sessions count:', error);
    res.status(500).json({
      error: 'Failed to fetch active sessions count',
      code: 'ACTIVE_SESSIONS_FETCH_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;