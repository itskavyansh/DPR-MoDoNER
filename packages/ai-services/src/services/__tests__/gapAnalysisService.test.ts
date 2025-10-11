import { describe, it, expect, beforeEach } from 'vitest';
import { GapAnalysisService } from '../gapAnalysisService.js';
import { DPRSection, ExtractedEntity } from '@dpr-system/shared';

describe('GapAnalysisService', () => {
  let service: GapAnalysisService;

  beforeEach(() => {
    service = new GapAnalysisService();
  });

  describe('performGapAnalysis', () => {
    it('should perform comprehensive gap analysis with complete DPR', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Highway Development Project for connecting Guwahati to Shillong. Total cost: Rs. 50 crore. Duration: 24 months. Beneficiaries: 100,000 people.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 100
        },
        {
          type: 'COST_ESTIMATE',
          content: 'Material cost: Rs. 30 crore, Labor cost: Rs. 15 crore, Equipment: Rs. 5 crore. Contingency: 10%. Funding from central government.',
          confidence: 0.85,
          startPosition: 101,
          endPosition: 200
        },
        {
          type: 'TIMELINE',
          content: 'Start date: 01/04/2024, Completion: 31/03/2026. Phase 1: Site preparation (6 months), Phase 2: Construction (18 months).',
          confidence: 0.8,
          startPosition: 201,
          endPosition: 300
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'MONETARY', value: 'Rs. 50 crore', confidence: 0.9, position: 50 },
        { type: 'DATE', value: '01/04/2024', confidence: 0.8, position: 220 },
        { type: 'DATE', value: '31/03/2026', confidence: 0.8, position: 240 },
        { type: 'LOCATION', value: 'Guwahati to Shillong', confidence: 0.85, position: 30 }
      ];

      const rawText = sections.map(s => s.content).join(' ');

      const result = await service.performGapAnalysis(sections, entities, rawText);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.completenessPercentage).toBeGreaterThan(0);
      expect(result.sectionScores).toHaveLength(7); // Total sections in default checklist
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should identify missing sections', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Basic project summary with minimal information.',
          confidence: 0.7,
          startPosition: 0,
          endPosition: 50
        }
      ];

      const entities: ExtractedEntity[] = [];
      const rawText = 'Basic project summary with minimal information.';

      const result = await service.performGapAnalysis(sections, entities, rawText);

      expect(result.summary.missingSections).toBeGreaterThan(0);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(50);
    });

    it('should identify incomplete fields', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Project title: ABC. Cost: Rs. 10. Duration: 1 day.',
          confidence: 0.6,
          startPosition: 0,
          endPosition: 50
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'MONETARY', value: 'Rs. 10', confidence: 0.3, position: 25 }
      ];

      const rawText = 'Project title: ABC. Cost: Rs. 10. Duration: 1 day.';

      const result = await service.performGapAnalysis(sections, entities, rawText);

      expect(result.incompleteFields.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty input gracefully', async () => {
      const result = await service.performGapAnalysis([], [], '');

      expect(result.overallScore).toBe(0);
      expect(result.completenessPercentage).toBe(0);
      expect(result.summary.presentSections).toBe(0);
      expect(result.summary.missingSections).toBeGreaterThan(0);
    });

    it('should calculate correct completeness percentage', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Complete executive summary with project title: Highway Development, objective: Connect cities, cost: Rs. 50 crore, duration: 24 months, beneficiaries: 100000 people.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 150
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'MONETARY', value: 'Rs. 50 crore', confidence: 0.9, position: 80 },
        { type: 'TEXT', value: 'Highway Development', confidence: 0.9, position: 40 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      expect(result.completenessPercentage).toBeGreaterThan(0);
      expect(result.completenessPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('checklist management', () => {
    it('should return default checklist', () => {
      const checklist = service.getChecklist();

      expect(checklist).toBeDefined();
      expect(checklist.id).toBe('dpr-northeast-india-v1');
      expect(checklist.sections.length).toBeGreaterThan(0);
      expect(checklist.totalWeight).toBe(100);
    });

    it('should allow checklist updates', () => {
      const customChecklist = {
        id: 'custom-checklist',
        name: 'Custom Checklist',
        version: '2.0',
        totalWeight: 100,
        sections: [
          {
            id: 'test-section',
            name: 'Test Section',
            type: 'EXECUTIVE_SUMMARY' as const,
            weight: 100,
            required: true,
            fields: [
              {
                id: 'test-field',
                name: 'Test Field',
                description: 'Test field description',
                type: 'TEXT' as const,
                required: true,
                weight: 100
              }
            ]
          }
        ]
      };

      service.updateChecklist(customChecklist);
      const updatedChecklist = service.getChecklist();

      expect(updatedChecklist.id).toBe('custom-checklist');
      expect(updatedChecklist.sections).toHaveLength(1);
    });
  });

  describe('field extraction and validation', () => {
    it('should extract monetary fields correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'COST_ESTIMATE',
          content: 'Total project cost: Rs. 25,00,000. Material cost: Rs. 15,00,000. Labor cost: Rs. 10,00,000.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 100
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'MONETARY', value: 'Rs. 25,00,000', confidence: 0.9, position: 20 },
        { type: 'MONETARY', value: 'Rs. 15,00,000', confidence: 0.85, position: 50 },
        { type: 'MONETARY', value: 'Rs. 10,00,000', confidence: 0.85, position: 80 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      const costSection = result.sectionScores.find(s => s.sectionId === 'cost-estimate');
      expect(costSection).toBeDefined();
      expect(costSection!.present).toBe(true);
      
      const monetaryFields = costSection!.fieldScores.filter(f => f.present);
      expect(monetaryFields.length).toBeGreaterThan(0);
    });

    it('should extract date fields correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'TIMELINE',
          content: 'Project start date: 15/03/2024. Expected completion: 31/12/2025. Key milestones include phase 1 completion by June 2024.',
          confidence: 0.85,
          startPosition: 0,
          endPosition: 120
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'DATE', value: '15/03/2024', confidence: 0.9, position: 20 },
        { type: 'DATE', value: '31/12/2025', confidence: 0.9, position: 60 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      const timelineSection = result.sectionScores.find(s => s.sectionId === 'timeline');
      expect(timelineSection).toBeDefined();
      expect(timelineSection!.present).toBe(true);
      
      const dateFields = timelineSection!.fieldScores.filter(f => f.present);
      expect(dateFields.length).toBeGreaterThan(0);
    });

    it('should extract location fields correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'TECHNICAL_SPECS',
          content: 'Project location: Guwahati, Assam. GPS coordinates: 26.1445, 91.7362. Site area: 50 hectares.',
          confidence: 0.8,
          startPosition: 0,
          endPosition: 100
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'LOCATION', value: 'Guwahati, Assam', confidence: 0.9, position: 18 },
        { type: 'LOCATION', value: '26.1445, 91.7362', confidence: 0.85, position: 50 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      const techSection = result.sectionScores.find(s => s.sectionId === 'technical-specs');
      expect(techSection).toBeDefined();
      expect(techSection!.present).toBe(true);
      
      const locationFields = techSection!.fieldScores.filter(f => f.present);
      expect(locationFields.length).toBeGreaterThan(0);
    });

    it('should extract resource fields correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'RESOURCES',
          content: 'Human resources: 50 engineers, 200 workers. Materials: 1000 tons cement, 500 cubic meters sand. Equipment: 10 excavators, 5 bulldozers.',
          confidence: 0.85,
          startPosition: 0,
          endPosition: 150
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'RESOURCE', value: '50 engineers', confidence: 0.9, position: 18 },
        { type: 'RESOURCE', value: '200 workers', confidence: 0.9, position: 32 },
        { type: 'RESOURCE', value: '1000 tons cement', confidence: 0.85, position: 55 },
        { type: 'RESOURCE', value: '10 excavators', confidence: 0.85, position: 110 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      const resourceSection = result.sectionScores.find(s => s.sectionId === 'resources');
      expect(resourceSection).toBeDefined();
      expect(resourceSection!.present).toBe(true);
      
      const resourceFields = resourceSection!.fieldScores.filter(f => f.present);
      expect(resourceFields.length).toBeGreaterThan(0);
    });
  });

  describe('scoring and recommendations', () => {
    it('should provide higher scores for complete sections', async () => {
      const completeSections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Project title: Northeast Highway Development Project. Objective: To improve connectivity between major cities in Northeast India, enhancing economic development and accessibility. Total cost: Rs. 100 crore. Duration: 36 months. Beneficiaries: 500,000 people across multiple districts.',
          confidence: 0.95,
          startPosition: 0,
          endPosition: 200
        }
      ];

      const completeEntities: ExtractedEntity[] = [
        { type: 'MONETARY', value: 'Rs. 100 crore', confidence: 0.95, position: 150 },
        { type: 'TEXT', value: 'Northeast Highway Development Project', confidence: 0.9, position: 15 }
      ];

      const rawText = completeSections[0].content;

      const result = await service.performGapAnalysis(completeSections, completeEntities, rawText);

      const execSection = result.sectionScores.find(s => s.sectionId === 'executive-summary');
      expect(execSection).toBeDefined();
      expect(execSection!.completenessPercentage).toBeGreaterThan(50);
    });

    it('should generate relevant recommendations', async () => {
      const incompleteSections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Project title: ABC',
          confidence: 0.5,
          startPosition: 0,
          endPosition: 20
        }
      ];

      const result = await service.performGapAnalysis(incompleteSections, [], 'Project title: ABC');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('missing'))).toBe(true);
    });

    it('should identify critical issues correctly', async () => {
      const result = await service.performGapAnalysis([], [], '');

      expect(result.summary.criticalIssues).toBeGreaterThan(0);
      expect(result.summary.missingFields).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed section data', async () => {
      const malformedSections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: '',
          confidence: 0,
          startPosition: -1,
          endPosition: -1
        }
      ];

      const result = await service.performGapAnalysis(malformedSections, [], '');

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid entities gracefully', async () => {
      const sections: DPRSection[] = [
        {
          type: 'COST_ESTIMATE',
          content: 'Some cost information',
          confidence: 0.7,
          startPosition: 0,
          endPosition: 25
        }
      ];

      const invalidEntities: ExtractedEntity[] = [
        { type: 'MONETARY', value: '', confidence: -1, position: -1 }
      ];

      const result = await service.performGapAnalysis(sections, invalidEntities, 'Some cost information');

      expect(result).toBeDefined();
      expect(result.sectionScores).toHaveLength(7);
    });
  });

  describe('validation rules', () => {
    it('should apply minimum length validation', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Title: A. Objective: B. Cost: Rs. 1. Duration: 1. Beneficiaries: 1.',
          confidence: 0.8,
          startPosition: 0,
          endPosition: 70
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'TEXT', value: 'A', confidence: 0.8, position: 7 },
        { type: 'TEXT', value: 'B', confidence: 0.8, position: 20 },
        { type: 'MONETARY', value: 'Rs. 1', confidence: 0.8, position: 30 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      const execSection = result.sectionScores.find(s => s.sectionId === 'executive-summary');
      const fieldsWithErrors = execSection!.fieldScores.filter(f => f.validationErrors.length > 0);
      
      expect(fieldsWithErrors.length).toBeGreaterThan(0);
    });

    it('should apply keyword validation', async () => {
      const sections: DPRSection[] = [
        {
          type: 'COST_ESTIMATE',
          content: 'Total cost: Rs. 50 lakh without any breakdown details.',
          confidence: 0.7,
          startPosition: 0,
          endPosition: 60
        }
      ];

      const entities: ExtractedEntity[] = [
        { type: 'MONETARY', value: 'Rs. 50 lakh', confidence: 0.8, position: 12 }
      ];

      const rawText = sections[0].content;

      const result = await service.performGapAnalysis(sections, entities, rawText);

      const costSection = result.sectionScores.find(s => s.sectionId === 'cost-estimate');
      const breakdownField = costSection!.fieldScores.find(f => f.fieldId === 'detailed-cost-breakdown');
      
      expect(breakdownField).toBeDefined();
      // Should have validation errors for missing required keywords
      expect(breakdownField!.validationErrors.length).toBeGreaterThan(0);
    });
  });
});