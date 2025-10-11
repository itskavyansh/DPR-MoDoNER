import { DPRDocument, ProjectFeatures, RiskFactor, SimulationScenario } from '@dpr-system/shared';
import { CompletionFeasibilityService } from './completionFeasibilityService.js';
import { ProbabilityCalculatorService } from './probabilityCalculatorService.js';

// Types for what-if simulation
export interface SimulationParameters {
  timelineMultiplier?: number; // 0.5 = 50% faster, 1.5 = 50% slower
  resourceMultiplier?: number; // 1.2 = 20% more resources
  complexityMultiplier?: number; // 0.8 = 20% less complex
  accessibilityImprovement?: number; // 0-2 points improvement
  additionalRiskMitigation?: string[]; // Risk types to mitigate
}

export interface SimulationResult {
  scenarioName: string;
  parameters: SimulationParameters;
  adjustedFeatures: ProjectFeatures;
  adjustedRiskFactors: RiskFactor[];
  completionProbability: number;
  probabilityChange: number; // Change from baseline
  riskScore: number;
  riskChange: number; // Change from baseline
  costImpact: number; // Additional cost due to changes
  timeImpact: number; // Change in timeline (months)
  recommendations: string[];
  feasibilityRating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

export interface WhatIfAnalysis {
  dprId: string;
  baselineScenario: SimulationResult;
  simulatedScenarios: SimulationResult[];
  bestScenario: SimulationResult;
  worstScenario: SimulationResult;
  analysisTimestamp: Date;
  totalScenariosAnalyzed: number;
}

export interface InteractiveSimulationSession {
  sessionId: string;
  dprId: string;
  baselineFeatures: ProjectFeatures;
  baselineRiskFactors: RiskFactor[];
  currentScenario: SimulationResult;
  scenarioHistory: SimulationResult[];
  createdAt: Date;
  lastUpdated: Date;
}

export class WhatIfSimulatorService {
  private completionFeasibilityService: CompletionFeasibilityService;
  private probabilityCalculatorService: ProbabilityCalculatorService;
  private activeSessions: Map<string, InteractiveSimulationSession> = new Map();

  constructor() {
    this.completionFeasibilityService = new CompletionFeasibilityService();
    this.probabilityCalculatorService = new ProbabilityCalculatorService();
  }

  /**
   * Create a new interactive simulation session
   */
  async createSimulationSession(dpr: DPRDocument): Promise<InteractiveSimulationSession> {
    try {
      // Get baseline feasibility analysis
      const baselineFeasibility = await this.completionFeasibilityService.predictCompletionFeasibility(dpr);
      
      // Extract baseline features (mock for now - would come from feasibility service)
      const baselineFeatures = this.extractFeaturesFromDPR(dpr);
      
      // Create baseline scenario
      const baselineScenario = await this.createBaselineScenario(
        dpr, 
        baselineFeatures, 
        baselineFeasibility.riskFactors
      );

      // Create session
      const sessionId = this.generateSessionId();
      const session: InteractiveSimulationSession = {
        sessionId,
        dprId: dpr.id,
        baselineFeatures,
        baselineRiskFactors: baselineFeasibility.riskFactors,
        currentScenario: baselineScenario,
        scenarioHistory: [baselineScenario],
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      this.activeSessions.set(sessionId, session);
      return session;
    } catch (error) {
      console.error('Error creating simulation session:', error);
      throw new Error('Failed to create simulation session');
    }
  }

  /**
   * Run what-if simulation with given parameters
   */
  async runSimulation(
    sessionId: string, 
    parameters: SimulationParameters, 
    scenarioName?: string
  ): Promise<SimulationResult> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Simulation session not found');
      }

      // Apply parameters to baseline features
      const adjustedFeatures = this.applyParametersToFeatures(session.baselineFeatures, parameters);
      
      // Apply parameters to risk factors
      const adjustedRiskFactors = this.applyParametersToRiskFactors(session.baselineRiskFactors, parameters);

      // Get DPR document (mock for now)
      const mockDPR: DPRDocument = {
        id: session.dprId,
        originalFileName: 'simulation.pdf',
        fileType: 'PDF',
        uploadTimestamp: new Date(),
        fileSize: 1000000,
        language: 'EN',
        processingStatus: 'COMPLETED'
      };

      // Calculate new probability and risk
      const probabilityResult = await this.probabilityCalculatorService.calculateCompletionProbability(
        mockDPR, 
        adjustedFeatures, 
        adjustedRiskFactors
      );

      const riskResult = await this.probabilityCalculatorService.analyzeRisks(
        mockDPR, 
        adjustedFeatures, 
        adjustedRiskFactors
      );

      // Calculate impacts
      const costImpact = this.calculateCostImpact(session.baselineFeatures, adjustedFeatures, parameters);
      const timeImpact = adjustedFeatures.estimatedDurationMonths - session.baselineFeatures.estimatedDurationMonths;

      // Generate recommendations for this scenario
      const recommendations = await this.generateScenarioRecommendations(parameters, adjustedFeatures);

      // Create simulation result
      const simulationResult: SimulationResult = {
        scenarioName: scenarioName || this.generateScenarioName(parameters),
        parameters,
        adjustedFeatures,
        adjustedRiskFactors,
        completionProbability: probabilityResult.completionProbability,
        probabilityChange: probabilityResult.completionProbability - session.currentScenario.completionProbability,
        riskScore: riskResult.riskScore,
        riskChange: riskResult.riskScore - session.currentScenario.riskScore,
        costImpact,
        timeImpact,
        recommendations,
        feasibilityRating: this.calculateFeasibilityRating(probabilityResult.completionProbability, riskResult.riskScore)
      };

      // Update session
      session.currentScenario = simulationResult;
      session.scenarioHistory.push(simulationResult);
      session.lastUpdated = new Date();

      return simulationResult;
    } catch (error) {
      console.error('Error running simulation:', error);
      // Re-throw the original error if it's a known validation error
      if (error instanceof Error && error.message === 'Simulation session not found') {
        throw error;
      }
      throw new Error('Failed to run simulation');
    }
  }

  /**
   * Run comprehensive what-if analysis with multiple scenarios
   */
  async runComprehensiveAnalysis(dpr: DPRDocument): Promise<WhatIfAnalysis> {
    try {
      const session = await this.createSimulationSession(dpr);
      const scenarios: SimulationResult[] = [session.currentScenario]; // Include baseline

      // Define standard scenarios to test
      const standardScenarios: { name: string; params: SimulationParameters }[] = [
        {
          name: 'Optimistic Timeline',
          params: { timelineMultiplier: 0.85, resourceMultiplier: 1.1 }
        },
        {
          name: 'Conservative Timeline',
          params: { timelineMultiplier: 1.3, resourceMultiplier: 1.2 }
        },
        {
          name: 'High Resource Investment',
          params: { resourceMultiplier: 1.5, complexityMultiplier: 0.8 }
        },
        {
          name: 'Risk Mitigation Focus',
          params: { 
            resourceMultiplier: 1.2, 
            timelineMultiplier: 1.1,
            additionalRiskMitigation: ['COMPLEXITY', 'ENVIRONMENTAL']
          }
        },
        {
          name: 'Infrastructure Improvement',
          params: { 
            accessibilityImprovement: 1.5, 
            resourceMultiplier: 1.3,
            timelineMultiplier: 1.1
          }
        },
        {
          name: 'Fast Track',
          params: { 
            timelineMultiplier: 0.7, 
            resourceMultiplier: 1.8,
            complexityMultiplier: 1.2
          }
        }
      ];

      // Run all scenarios
      for (const scenario of standardScenarios) {
        const result = await this.runSimulation(session.sessionId, scenario.params, scenario.name);
        scenarios.push(result);
      }

      // Find best and worst scenarios
      const bestScenario = scenarios.reduce((best, current) => 
        current.completionProbability > best.completionProbability ? current : best
      );

      const worstScenario = scenarios.reduce((worst, current) => 
        current.completionProbability < worst.completionProbability ? current : worst
      );

      return {
        dprId: dpr.id,
        baselineScenario: session.currentScenario,
        simulatedScenarios: scenarios.slice(1), // Exclude baseline
        bestScenario,
        worstScenario,
        analysisTimestamp: new Date(),
        totalScenariosAnalyzed: scenarios.length
      };
    } catch (error) {
      console.error('Error running comprehensive analysis:', error);
      throw new Error('Failed to run comprehensive analysis');
    }
  }

  /**
   * Get simulation session by ID
   */
  getSimulationSession(sessionId: string): InteractiveSimulationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Close simulation session
   */
  closeSimulationSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  // Private helper methods

  private extractFeaturesFromDPR(dpr: DPRDocument): ProjectFeatures {
    // Mock feature extraction - in production this would analyze the DPR content
    return {
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
  }

  private async createBaselineScenario(
    dpr: DPRDocument, 
    features: ProjectFeatures, 
    riskFactors: RiskFactor[]
  ): Promise<SimulationResult> {
    const probabilityResult = await this.probabilityCalculatorService.calculateCompletionProbability(
      dpr, 
      features, 
      riskFactors
    );

    const riskResult = await this.probabilityCalculatorService.analyzeRisks(
      dpr, 
      features, 
      riskFactors
    );

    return {
      scenarioName: 'Baseline (Current Plan)',
      parameters: {},
      adjustedFeatures: features,
      adjustedRiskFactors: riskFactors,
      completionProbability: probabilityResult.completionProbability,
      probabilityChange: 0,
      riskScore: riskResult.riskScore,
      riskChange: 0,
      costImpact: 0,
      timeImpact: 0,
      recommendations: ['This is your current project plan'],
      feasibilityRating: this.calculateFeasibilityRating(probabilityResult.completionProbability, riskResult.riskScore)
    };
  }

  private applyParametersToFeatures(baseFeatures: ProjectFeatures, parameters: SimulationParameters): ProjectFeatures {
    const adjusted = { ...baseFeatures };

    // Apply timeline multiplier
    if (parameters.timelineMultiplier) {
      adjusted.estimatedDurationMonths = Math.round(baseFeatures.estimatedDurationMonths * parameters.timelineMultiplier);
      adjusted.costPerMonth = baseFeatures.totalCost / adjusted.estimatedDurationMonths;
    }

    // Apply resource multiplier
    if (parameters.resourceMultiplier) {
      adjusted.totalCost = Math.round(baseFeatures.totalCost * parameters.resourceMultiplier);
      adjusted.costPerMonth = adjusted.totalCost / adjusted.estimatedDurationMonths;
      
      // More resources can reduce complexity
      if (parameters.resourceMultiplier > 1.2) {
        adjusted.resourceComplexityScore = Math.max(1.0, baseFeatures.resourceComplexityScore * 0.9);
        adjusted.laborIntensityScore = Math.max(1.0, baseFeatures.laborIntensityScore * 0.95);
      }
    }

    // Apply complexity multiplier
    if (parameters.complexityMultiplier) {
      adjusted.technicalComplexityScore = Math.max(1.0, Math.min(3.0, 
        baseFeatures.technicalComplexityScore * parameters.complexityMultiplier));
      adjusted.environmentalComplexityScore = Math.max(1.0, Math.min(3.0, 
        baseFeatures.environmentalComplexityScore * parameters.complexityMultiplier));
      adjusted.regulatoryComplexityScore = Math.max(1.0, Math.min(3.0, 
        baseFeatures.regulatoryComplexityScore * parameters.complexityMultiplier));
    }

    // Apply accessibility improvement
    if (parameters.accessibilityImprovement) {
      adjusted.accessibilityScore = Math.min(3.0, 
        baseFeatures.accessibilityScore + parameters.accessibilityImprovement);
      adjusted.infrastructureScore = Math.min(3.0, 
        baseFeatures.infrastructureScore + (parameters.accessibilityImprovement * 0.5));
    }

    return adjusted;
  }

  private applyParametersToRiskFactors(baseRiskFactors: RiskFactor[], parameters: SimulationParameters): RiskFactor[] {
    const adjusted = [...baseRiskFactors];

    // Apply risk mitigation
    if (parameters.additionalRiskMitigation && parameters.additionalRiskMitigation.length > 0) {
      for (const riskType of parameters.additionalRiskMitigation) {
        // Reduce probability and impact of specified risk types
        adjusted.forEach(risk => {
          if (risk.type === riskType) {
            risk.probability = Math.max(0.1, risk.probability * 0.7);
            if (risk.impact === 'HIGH') risk.impact = 'MEDIUM';
            else if (risk.impact === 'MEDIUM') risk.impact = 'LOW';
          }
        });
      }
    }

    // Timeline changes affect timeline risks
    if (parameters.timelineMultiplier) {
      adjusted.forEach(risk => {
        if (risk.type === 'TIMELINE') {
          if (parameters.timelineMultiplier! < 1) {
            // Faster timeline increases timeline risk
            risk.probability = Math.min(0.95, risk.probability * 1.3);
          } else if (parameters.timelineMultiplier! > 1.2) {
            // Slower timeline reduces timeline risk
            risk.probability = Math.max(0.1, risk.probability * 0.8);
          }
        }
      });
    }

    // Resource changes affect resource risks
    if (parameters.resourceMultiplier && parameters.resourceMultiplier > 1.2) {
      adjusted.forEach(risk => {
        if (risk.type === 'RESOURCE') {
          risk.probability = Math.max(0.1, risk.probability * 0.8);
        }
      });
    }

    return adjusted;
  }

  private calculateCostImpact(
    baseFeatures: ProjectFeatures, 
    adjustedFeatures: ProjectFeatures, 
    parameters: SimulationParameters
  ): number {
    let costImpact = adjustedFeatures.totalCost - baseFeatures.totalCost;

    // Add infrastructure improvement costs
    if (parameters.accessibilityImprovement) {
      costImpact += parameters.accessibilityImprovement * 5000000; // 50 lakhs per point
    }

    // Add risk mitigation costs
    if (parameters.additionalRiskMitigation) {
      costImpact += parameters.additionalRiskMitigation.length * 2000000; // 20 lakhs per risk type
    }

    return Math.round(costImpact);
  }

  private async generateScenarioRecommendations(
    parameters: SimulationParameters, 
    adjustedFeatures: ProjectFeatures
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (parameters.timelineMultiplier && parameters.timelineMultiplier < 1) {
      recommendations.push('Fast-track timeline requires careful resource planning and risk monitoring');
    }

    if (parameters.timelineMultiplier && parameters.timelineMultiplier > 1.2) {
      recommendations.push('Extended timeline allows for better risk mitigation and quality control');
    }

    if (parameters.resourceMultiplier && parameters.resourceMultiplier > 1.3) {
      recommendations.push('Higher resource allocation should focus on critical path activities');
    }

    if (parameters.accessibilityImprovement) {
      recommendations.push('Infrastructure improvements will have long-term benefits beyond this project');
    }

    if (parameters.additionalRiskMitigation) {
      recommendations.push('Risk mitigation investments should be prioritized by impact and probability');
    }

    if (adjustedFeatures.completionProbability && adjustedFeatures.completionProbability > 80) {
      recommendations.push('This scenario shows high success probability - consider implementation');
    } else if (adjustedFeatures.completionProbability && adjustedFeatures.completionProbability < 60) {
      recommendations.push('This scenario has elevated risks - additional mitigation may be needed');
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  private calculateFeasibilityRating(completionProbability: number, riskScore: number): 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' {
    const combinedScore = completionProbability - (riskScore * 0.5);

    if (combinedScore >= 80) return 'EXCELLENT';
    if (combinedScore >= 70) return 'GOOD';
    if (combinedScore >= 60) return 'FAIR';
    return 'POOR';
  }

  private generateScenarioName(parameters: SimulationParameters): string {
    const parts: string[] = [];

    if (parameters.timelineMultiplier) {
      if (parameters.timelineMultiplier < 0.9) parts.push('Fast');
      else if (parameters.timelineMultiplier > 1.1) parts.push('Extended');
    }

    if (parameters.resourceMultiplier && parameters.resourceMultiplier > 1.2) {
      parts.push('High-Resource');
    }

    if (parameters.complexityMultiplier && parameters.complexityMultiplier < 0.9) {
      parts.push('Simplified');
    }

    if (parameters.accessibilityImprovement) {
      parts.push('Infrastructure-Enhanced');
    }

    if (parameters.additionalRiskMitigation) {
      parts.push('Risk-Mitigated');
    }

    return parts.length > 0 ? parts.join(' ') + ' Scenario' : 'Custom Scenario';
  }

  private generateSessionId(): string {
    return 'sim_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }
}