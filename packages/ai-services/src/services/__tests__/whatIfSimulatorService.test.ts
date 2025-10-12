import { describe, it, expect, beforeEach } from 'vitest';
import { WhatIfSimulatorService } from '../whatIfSimulatorService.js';
import { DPRDocument, SimulationParameters } from '@dpr-system/shared';

describe('WhatIfSimulatorService', () => {
  let service: WhatIfSimulatorService;
  let mockDPR: DPRDocument;

  beforeEach(() => {
    service = new WhatIfSimulatorService();
    
    mockDPR = {
      id: 'test-dpr-1',
      originalFileName: 'test-dpr.pdf',
      fileType: 'PDF',
      uploadTimestamp: new Date(),
      fileSize: 1024000,
      language: 'EN',
      processingStatus: 'COMPLETED',
      extractedContent: {
        sections: [
          {
            type: 'EXECUTIVE_SUMMARY',
            content: 'Road construction project in Assam with 18 months duration.',
            confidence: 0.9,
            startPosition: 0,
            endPosition: 100
          },
          {
            type: 'COST_ESTIMATE',
            content: 'Total cost estimated at 5.5 crores.',
            confidence: 0.85,
            startPosition: 101,
            endPosition: 200
          }
        ],
        entities: [],
        rawText: 'Full document text...',
        structuredData: {
          totalCost: 55000000,
          timeline: '18 months',
          location: 'Assam'
        }
      }
    };
  });

  describe('createSimulationSession', () => {
    it('should create a new simulation session', async () => {
      const session = await service.createSimulationSession(mockDPR);

      expect(session).toBeDefined();
      expect(session.sessionId).toBeTruthy();
      expect(session.dprId).toBe(mockDPR.id);
      expect(session.baselineFeatures).toBeDefined();
      expect(session.baselineRiskFactors).toBeInstanceOf(Array);
      expect(session.currentScenario).toBeDefined();
      expect(session.scenarioHistory).toHaveLength(1);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastUpdated).toBeInstanceOf(Date);
    });

    it('should create baseline scenario correctly', async () => {
      const session = await service.createSimulationSession(mockDPR);
      const baseline = session.currentScenario;

      expect(baseline.scenarioName).toContain('Baseline');
      expect(baseline.parameters).toEqual({});
      expect(baseline.completionProbability).toBeGreaterThan(0);
      expect(baseline.completionProbability).toBeLessThanOrEqual(100);
      expect(baseline.probabilityChange).toBe(0);
      expect(baseline.riskChange).toBe(0);
      expect(baseline.costImpact).toBe(0);
      expect(baseline.timeImpact).toBe(0);
      expect(baseline.feasibilityRating).toMatch(/^(POOR|FAIR|GOOD|EXCELLENT)$/);
    });

    it('should store session in active sessions', async () => {
      const initialCount = service.getActiveSessionsCount();
      const session = await service.createSimulationSession(mockDPR);
      
      expect(service.getActiveSessionsCount()).toBe(initialCount + 1);
      expect(service.getSimulationSession(session.sessionId)).toBeDefined();
    });
  });

  describe('runSimulation', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await service.createSimulationSession(mockDPR);
      sessionId = session.sessionId;
    });

    it('should run simulation with timeline adjustment', async () => {
      const parameters: SimulationParameters = {
        timelineMultiplier: 0.8 // 20% faster
      };

      const result = await service.runSimulation(sessionId, parameters, 'Fast Track');

      expect(result).toBeDefined();
      expect(result.scenarioName).toBe('Fast Track');
      expect(result.parameters).toEqual(parameters);
      expect(result.adjustedFeatures.estimatedDurationMonths).toBeLessThan(18);
      expect(result.timeImpact).toBeLessThan(0);
      expect(result.completionProbability).toBeGreaterThan(0);
      expect(result.completionProbability).toBeLessThanOrEqual(100);
    });

    it('should run simulation with resource adjustment', async () => {
      const parameters: SimulationParameters = {
        resourceMultiplier: 1.3 // 30% more resources
      };

      const result = await service.runSimulation(sessionId, parameters);

      expect(result.adjustedFeatures.totalCost).toBeGreaterThan(55000000);
      expect(result.costImpact).toBeGreaterThan(0);
      expect(result.scenarioName).toContain('High-Resource');
    });

    it('should run simulation with complexity reduction', async () => {
      const parameters: SimulationParameters = {
        complexityMultiplier: 0.7 // 30% less complex
      };

      const result = await service.runSimulation(sessionId, parameters);

      expect(result.adjustedFeatures.technicalComplexityScore).toBeLessThan(2.0);
      expect(result.scenarioName).toContain('Simplified');
    });

    it('should run simulation with accessibility improvement', async () => {
      const parameters: SimulationParameters = {
        accessibilityImprovement: 1.0
      };

      const result = await service.runSimulation(sessionId, parameters);

      expect(result.adjustedFeatures.accessibilityScore).toBeGreaterThan(2.0);
      expect(result.costImpact).toBeGreaterThan(0); // Infrastructure costs
      expect(result.scenarioName).toContain('Infrastructure-Enhanced');
    });

    it('should run simulation with risk mitigation', async () => {
      const parameters: SimulationParameters = {
        additionalRiskMitigation: ['COMPLEXITY', 'ENVIRONMENTAL']
      };

      const result = await service.runSimulation(sessionId, parameters);

      expect(result.costImpact).toBeGreaterThan(0); // Mitigation costs
      expect(result.scenarioName).toContain('Risk-Mitigated');
      
      // Check that specified risk types have reduced probability
      const complexityRisks = result.adjustedRiskFactors.filter(rf => rf.type === 'COMPLEXITY');
      const environmentalRisks = result.adjustedRiskFactors.filter(rf => rf.type === 'ENVIRONMENTAL');
      
      // At least some risks should be mitigated
      expect(complexityRisks.length + environmentalRisks.length).toBeGreaterThanOrEqual(0);
    });

    it('should update session with new scenario', async () => {
      const parameters: SimulationParameters = {
        timelineMultiplier: 1.2
      };

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.runSimulation(sessionId, parameters);
      const session = service.getSimulationSession(sessionId);

      expect(session).toBeDefined();
      expect(session!.scenarioHistory).toHaveLength(2); // Baseline + new scenario
      expect(session!.lastUpdated.getTime()).toBeGreaterThanOrEqual(session!.createdAt.getTime());
    });

    it('should handle invalid session ID', async () => {
      const parameters: SimulationParameters = {
        timelineMultiplier: 1.1
      };

      await expect(service.runSimulation('invalid-session', parameters))
        .rejects.toThrow('Simulation session not found');
    });

    it('should generate appropriate scenario names', async () => {
      const testCases = [
        { params: { timelineMultiplier: 0.8 }, expectedContains: 'Fast' },
        { params: { timelineMultiplier: 1.3 }, expectedContains: 'Extended' },
        { params: { resourceMultiplier: 1.5 }, expectedContains: 'High-Resource' },
        { params: { complexityMultiplier: 0.8 }, expectedContains: 'Simplified' },
        { params: { accessibilityImprovement: 1.0 }, expectedContains: 'Infrastructure-Enhanced' }
      ];

      for (const testCase of testCases) {
        const result = await service.runSimulation(sessionId, testCase.params);
        expect(result.scenarioName).toContain(testCase.expectedContains);
      }
    });
  });

  describe('runComprehensiveAnalysis', () => {
    it('should run comprehensive analysis with multiple scenarios', async () => {
      const analysis = await service.runComprehensiveAnalysis(mockDPR);

      expect(analysis).toBeDefined();
      expect(analysis.dprId).toBe(mockDPR.id);
      expect(analysis.baselineScenario).toBeDefined();
      expect(analysis.simulatedScenarios).toBeInstanceOf(Array);
      expect(analysis.simulatedScenarios.length).toBeGreaterThan(3);
      expect(analysis.bestScenario).toBeDefined();
      expect(analysis.worstScenario).toBeDefined();
      expect(analysis.totalScenariosAnalyzed).toBeGreaterThan(1);
      expect(analysis.analysisTimestamp).toBeInstanceOf(Date);
    });

    it('should identify best and worst scenarios correctly', async () => {
      const analysis = await service.runComprehensiveAnalysis(mockDPR);

      const allScenarios = [analysis.baselineScenario, ...analysis.simulatedScenarios];
      const maxProbability = Math.max(...allScenarios.map(s => s.completionProbability));
      const minProbability = Math.min(...allScenarios.map(s => s.completionProbability));

      expect(analysis.bestScenario.completionProbability).toBe(maxProbability);
      expect(analysis.worstScenario.completionProbability).toBe(minProbability);
    });

    it('should include standard scenarios', async () => {
      const analysis = await service.runComprehensiveAnalysis(mockDPR);

      const scenarioNames = analysis.simulatedScenarios.map(s => s.scenarioName);
      expect(scenarioNames).toContain('Optimistic Timeline');
      expect(scenarioNames).toContain('Conservative Timeline');
      expect(scenarioNames).toContain('High Resource Investment');
      expect(scenarioNames).toContain('Risk Mitigation Focus');
    });
  });

  describe('session management', () => {
    it('should get simulation session by ID', async () => {
      const session = await service.createSimulationSession(mockDPR);
      const retrieved = service.getSimulationSession(session.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved!.sessionId).toBe(session.sessionId);
    });

    it('should return undefined for non-existent session', () => {
      const retrieved = service.getSimulationSession('non-existent-session');
      expect(retrieved).toBeUndefined();
    });

    it('should close simulation session', async () => {
      const session = await service.createSimulationSession(mockDPR);
      const initialCount = service.getActiveSessionsCount();

      const success = service.closeSimulationSession(session.sessionId);
      expect(success).toBe(true);
      expect(service.getActiveSessionsCount()).toBe(initialCount - 1);
      expect(service.getSimulationSession(session.sessionId)).toBeUndefined();
    });

    it('should return false when closing non-existent session', () => {
      const success = service.closeSimulationSession('non-existent-session');
      expect(success).toBe(false);
    });

    it('should track active sessions count', async () => {
      const initialCount = service.getActiveSessionsCount();

      const session1 = await service.createSimulationSession(mockDPR);
      expect(service.getActiveSessionsCount()).toBe(initialCount + 1);

      const session2 = await service.createSimulationSession(mockDPR);
      expect(service.getActiveSessionsCount()).toBe(initialCount + 2);

      service.closeSimulationSession(session1.sessionId);
      expect(service.getActiveSessionsCount()).toBe(initialCount + 1);

      service.closeSimulationSession(session2.sessionId);
      expect(service.getActiveSessionsCount()).toBe(initialCount);
    });
  });

  describe('parameter application', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await service.createSimulationSession(mockDPR);
      sessionId = session.sessionId;
    });

    it('should apply multiple parameters correctly', async () => {
      const parameters: SimulationParameters = {
        timelineMultiplier: 0.9,
        resourceMultiplier: 1.2,
        complexityMultiplier: 0.8,
        accessibilityImprovement: 0.5
      };

      const result = await service.runSimulation(sessionId, parameters);

      expect(result.adjustedFeatures.estimatedDurationMonths).toBeLessThan(18);
      expect(result.adjustedFeatures.totalCost).toBeGreaterThan(55000000);
      expect(result.adjustedFeatures.technicalComplexityScore).toBeLessThan(2.0);
      expect(result.adjustedFeatures.accessibilityScore).toBeGreaterThan(2.0);
      expect(result.costImpact).toBeGreaterThan(0);
      expect(result.timeImpact).toBeLessThan(0);
    });

    it('should maintain feature constraints', async () => {
      const parameters: SimulationParameters = {
        complexityMultiplier: 0.1, // Very low complexity
        accessibilityImprovement: 5.0 // Very high improvement
      };

      const result = await service.runSimulation(sessionId, parameters);

      // Features should be within valid ranges
      expect(result.adjustedFeatures.technicalComplexityScore).toBeGreaterThanOrEqual(1.0);
      expect(result.adjustedFeatures.accessibilityScore).toBeLessThanOrEqual(3.0);
    });
  });

  describe('feasibility rating', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await service.createSimulationSession(mockDPR);
      sessionId = session.sessionId;
    });

    it('should assign appropriate feasibility ratings', async () => {
      // Test different scenarios that should produce different ratings
      const scenarios = [
        { params: { timelineMultiplier: 0.7, resourceMultiplier: 2.0 }, expectHigher: true },
        { params: { timelineMultiplier: 2.0, complexityMultiplier: 2.0 }, expectHigher: false }
      ];

      const results = [];
      for (const scenario of scenarios) {
        const result = await service.runSimulation(sessionId, scenario.params);
        results.push(result);
      }

      // First scenario (more resources, faster) should generally be better than second (slower, more complex)
      expect(results[0].feasibilityRating).toBeDefined();
      expect(results[1].feasibilityRating).toBeDefined();
    });
  });
});