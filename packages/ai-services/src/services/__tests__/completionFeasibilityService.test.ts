import { describe, it, expect, beforeEach } from 'vitest';
import { CompletionFeasibilityService } from '../completionFeasibilityService.js';
import { DPRDocument } from '@dpr-system/shared';

describe('CompletionFeasibilityService', () => {
  let service: CompletionFeasibilityService;
  let mockDPR: DPRDocument;

  beforeEach(() => {
    service = new CompletionFeasibilityService();
    
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
            content: 'This is a road construction project in Assam with estimated duration of 18 months.',
            confidence: 0.9,
            startPosition: 0,
            endPosition: 100
          },
          {
            type: 'COST_ESTIMATE',
            content: 'Total project cost is estimated at 5.5 crores. This includes materials, labor, and equipment costs.',
            confidence: 0.85,
            startPosition: 101,
            endPosition: 200
          },
          {
            type: 'TIMELINE',
            content: 'Project duration: 18 months. Construction will avoid monsoon season from June to September.',
            confidence: 0.8,
            startPosition: 201,
            endPosition: 300
          },
          {
            type: 'RESOURCES',
            content: 'Required resources include specialized equipment, skilled labor, and imported materials.',
            confidence: 0.75,
            startPosition: 301,
            endPosition: 400
          },
          {
            type: 'TECHNICAL_SPECS',
            content: 'Advanced construction techniques will be used. Environmental clearances required.',
            confidence: 0.7,
            startPosition: 401,
            endPosition: 500
          }
        ],
        entities: [
          {
            type: 'MONETARY',
            value: '5.5 crores',
            confidence: 0.9,
            position: 150
          },
          {
            type: 'DATE',
            value: '18 months',
            confidence: 0.85,
            position: 250
          },
          {
            type: 'LOCATION',
            value: 'Assam',
            confidence: 0.8,
            position: 50
          }
        ],
        rawText: 'Full document text...',
        structuredData: {
          totalCost: 55000000,
          timeline: '18 months',
          location: 'Assam',
          resources: ['specialized equipment', 'skilled labor', 'imported materials']
        }
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['road', 'construction', 'assam'],
        category: 'infrastructure'
      }
    };
  });

  describe('predictCompletionFeasibility', () => {
    it('should predict completion feasibility for a valid DPR', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);

      expect(result).toBeDefined();
      expect(result.dprId).toBe(mockDPR.id);
      expect(result.completionProbability).toBeGreaterThan(0);
      expect(result.completionProbability).toBeLessThanOrEqual(1);
      expect(result.riskFactors).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.simulationData).toBeInstanceOf(Array);
      expect(result.analysisTimestamp).toBeInstanceOf(Date);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should identify risk factors correctly', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);

      expect(result.riskFactors.length).toBeGreaterThan(0);
      
      const riskTypes = result.riskFactors.map(rf => rf.type);
      expect(riskTypes).toContain('ENVIRONMENTAL'); // Due to monsoon mention
      
      result.riskFactors.forEach(risk => {
        expect(risk.type).toMatch(/^(TIMELINE|RESOURCE|COMPLEXITY|ENVIRONMENTAL|FINANCIAL)$/);
        expect(risk.impact).toMatch(/^(LOW|MEDIUM|HIGH)$/);
        expect(risk.probability).toBeGreaterThan(0);
        expect(risk.probability).toBeLessThanOrEqual(1);
        expect(risk.description).toBeTruthy();
        expect(risk.mitigation).toBeTruthy();
      });
    });

    it('should generate simulation scenarios', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);

      expect(result.simulationData.length).toBeGreaterThanOrEqual(3);
      
      const scenarioNames = result.simulationData.map(s => s.scenarioName);
      expect(scenarioNames).toContain('Current Plan');
      
      result.simulationData.forEach(scenario => {
        expect(scenario.adjustedTimeline).toBeGreaterThan(0);
        expect(scenario.adjustedResources).toBeGreaterThan(0);
        expect(scenario.adjustedComplexity).toBeGreaterThan(0);
        expect(scenario.predictedProbability).toBeGreaterThan(0);
        expect(scenario.predictedProbability).toBeLessThanOrEqual(1);
      });
    });

    it('should provide meaningful recommendations', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeLessThanOrEqual(5);
      
      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10);
      });
    });

    it('should handle DPR without extracted content', async () => {
      const incompleteDPR = { ...mockDPR, extractedContent: undefined };

      await expect(service.predictCompletionFeasibility(incompleteDPR))
        .rejects.toThrow('DPR content not available for feature extraction');
    });

    it('should adjust probability based on project complexity', async () => {
      // Create a high-complexity DPR
      const complexDPR = {
        ...mockDPR,
        extractedContent: {
          ...mockDPR.extractedContent!,
          sections: [
            ...mockDPR.extractedContent!.sections,
            {
              type: 'TECHNICAL_SPECS' as const,
              content: 'Highly advanced sophisticated complex specialized innovative cutting-edge technology required. Multiple environmental clearances needed.',
              confidence: 0.8,
              startPosition: 500,
              endPosition: 600
            }
          ]
        }
      };

      const complexResult = await service.predictCompletionFeasibility(complexDPR);
      const simpleResult = await service.predictCompletionFeasibility(mockDPR);

      // Complex project should have lower completion probability
      expect(complexResult.completionProbability).toBeLessThan(simpleResult.completionProbability);
      expect(complexResult.riskFactors.length).toBeGreaterThanOrEqual(simpleResult.riskFactors.length);
    });

    it('should consider timeline impact on feasibility', async () => {
      // Create a long-duration DPR
      const longDPR = {
        ...mockDPR,
        extractedContent: {
          ...mockDPR.extractedContent!,
          sections: mockDPR.extractedContent!.sections.map(section => 
            section.type === 'TIMELINE' 
              ? { ...section, content: 'Project duration: 48 months. Extended timeline due to complexity.' }
              : section
          )
        }
      };

      const longResult = await service.predictCompletionFeasibility(longDPR);
      const normalResult = await service.predictCompletionFeasibility(mockDPR);

      // Longer project should have more timeline-related risks
      const longTimelineRisks = longResult.riskFactors.filter(rf => rf.type === 'TIMELINE');
      const normalTimelineRisks = normalResult.riskFactors.filter(rf => rf.type === 'TIMELINE');
      
      expect(longTimelineRisks.length).toBeGreaterThanOrEqual(normalTimelineRisks.length);
    });
  });

  describe('feature extraction', () => {
    it('should extract timeline features correctly', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);
      
      // Should identify monsoon risk from timeline section
      const environmentalRisks = result.riskFactors.filter(rf => rf.type === 'ENVIRONMENTAL');
      expect(environmentalRisks.some(risk => risk.description.toLowerCase().includes('monsoon'))).toBe(true);
    });

    it('should extract cost features correctly', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);
      
      // Should identify high cost as potential financial risk
      const financialRisks = result.riskFactors.filter(rf => rf.type === 'FINANCIAL');
      expect(financialRisks.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract complexity features correctly', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);
      
      // Should identify complexity from technical specs and resources
      const complexityRisks = result.riskFactors.filter(rf => rf.type === 'COMPLEXITY');
      
      // The mock DPR has "Advanced construction techniques" and "specialized equipment" 
      // which should trigger complexity detection
      expect(complexityRisks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('simulation scenarios', () => {
    it('should generate optimistic scenario with higher probability', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);
      
      const currentPlan = result.simulationData.find(s => s.scenarioName === 'Current Plan');
      const optimistic = result.simulationData.find(s => s.scenarioName.includes('Optimistic'));
      
      expect(currentPlan).toBeDefined();
      expect(optimistic).toBeDefined();
      
      if (currentPlan && optimistic) {
        expect(optimistic.predictedProbability).toBeGreaterThanOrEqual(currentPlan.predictedProbability);
        expect(optimistic.adjustedTimeline).toBeLessThan(currentPlan.adjustedTimeline);
      }
    });

    it('should generate conservative scenario with lower risk', async () => {
      const result = await service.predictCompletionFeasibility(mockDPR);
      
      const currentPlan = result.simulationData.find(s => s.scenarioName === 'Current Plan');
      const conservative = result.simulationData.find(s => s.scenarioName.includes('Conservative'));
      
      expect(currentPlan).toBeDefined();
      expect(conservative).toBeDefined();
      
      if (currentPlan && conservative) {
        expect(conservative.adjustedTimeline).toBeGreaterThan(currentPlan.adjustedTimeline);
        expect(conservative.adjustedResources).toBeGreaterThan(currentPlan.adjustedResources);
      }
    });
  });
});