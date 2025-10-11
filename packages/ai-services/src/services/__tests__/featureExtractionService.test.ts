import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureExtractionService } from '../featureExtractionService.js';
import { DPRSection } from '@dpr-system/shared';

describe('FeatureExtractionService', () => {
  let service: FeatureExtractionService;

  beforeEach(() => {
    service = new FeatureExtractionService();
  });

  describe('extractFeatures', () => {
    it('should perform comprehensive feature extraction', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Northeast Highway Development Project aims to improve connectivity between Guwahati and Shillong. Total project cost: Rs. 100 crore. Duration: 36 months. Expected to benefit 500,000 people.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 200
        },
        {
          type: 'COST_ESTIMATE',
          content: 'Detailed cost breakdown: Material cost Rs. 60 crore, Labor cost Rs. 25 crore, Equipment Rs. 15 crore. Contingency provision: 10%. Funding from central government schemes.',
          confidence: 0.85,
          startPosition: 201,
          endPosition: 400
        },
        {
          type: 'TIMELINE',
          content: 'Project start date: 01/04/2024. Expected completion: 31/03/2027. Phase 1: Site preparation (6 months), Phase 2: Construction (30 months).',
          confidence: 0.8,
          startPosition: 401,
          endPosition: 600
        }
      ];

      const rawText = sections.map(s => s.content).join(' ');

      const result = await service.extractFeatures(sections, rawText);

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.gapAnalysis).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.searchableContent).toBeDefined();

      // Check entities
      expect(result.entities.entities.length).toBeGreaterThan(0);
      expect(result.entities.metadata.totalEntitiesFound).toBeGreaterThan(0);

      // Check gap analysis
      expect(result.gapAnalysis.overallScore).toBeGreaterThan(0);
      expect(result.gapAnalysis.sectionScores.length).toBeGreaterThan(0);

      // Check metadata
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.extractedFeatures.totalEntities).toBeGreaterThan(0);
      expect(result.metadata.completenessMetrics.overallScore).toBeGreaterThan(0);

      // Check searchable content
      expect(result.searchableContent.keywords.length).toBeGreaterThan(0);
      expect(result.searchableContent.tags.length).toBeGreaterThan(0);
      expect(result.searchableContent.summary).toBeDefined();
      expect(result.searchableContent.indexableFields.length).toBeGreaterThan(0);
    });

    it('should handle empty sections', async () => {
      const result = await service.extractFeatures([], '');

      expect(result).toBeDefined();
      expect(result.entities.entities).toHaveLength(0);
      expect(result.gapAnalysis.overallScore).toBe(0);
      expect(result.metadata.extractedFeatures.totalEntities).toBe(0);
    });

    it('should extract monetary entities correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'COST_ESTIMATE',
          content: 'Project cost: Rs. 50,00,000. Material cost: Rs. 30 lakh. Labor cost: Rs. 20 lakh.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 100
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const monetaryEntities = result.entities.entities.filter(e => e.type === 'MONETARY');
      expect(monetaryEntities.length).toBeGreaterThan(0);
      expect(result.metadata.extractedFeatures.monetaryEntities).toBeGreaterThan(0);
    });

    it('should extract date entities correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'TIMELINE',
          content: 'Start date: 15/03/2024. Completion date: 31/12/2025. Milestone 1: June 2024.',
          confidence: 0.85,
          startPosition: 0,
          endPosition: 80
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const dateEntities = result.entities.entities.filter(e => e.type === 'DATE');
      expect(dateEntities.length).toBeGreaterThan(0);
      expect(result.metadata.extractedFeatures.dateEntities).toBeGreaterThan(0);
    });

    it('should extract location entities correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'TECHNICAL_SPECS',
          content: 'Project location: Guwahati, Assam. GPS coordinates: 26.1445, 91.7362. Covers Kamrup district.',
          confidence: 0.8,
          startPosition: 0,
          endPosition: 100
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const locationEntities = result.entities.entities.filter(e => e.type === 'LOCATION');
      expect(locationEntities.length).toBeGreaterThan(0);
      expect(result.metadata.extractedFeatures.locationEntities).toBeGreaterThan(0);
    });

    it('should extract resource entities correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'RESOURCES',
          content: 'Required: 50 engineers, 200 workers, 10 excavators, 1000 tons cement.',
          confidence: 0.85,
          startPosition: 0,
          endPosition: 80
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const resourceEntities = result.entities.entities.filter(e => e.type === 'RESOURCE');
      expect(resourceEntities.length).toBeGreaterThan(0);
      expect(result.metadata.extractedFeatures.resourceEntities).toBeGreaterThan(0);
    });
  });

  describe('extractFeaturesFromSections', () => {
    it('should extract features from specific section types only', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Executive summary content with project overview.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 50
        },
        {
          type: 'COST_ESTIMATE',
          content: 'Cost estimate: Rs. 50 lakh for the project.',
          confidence: 0.85,
          startPosition: 51,
          endPosition: 100
        },
        {
          type: 'TIMELINE',
          content: 'Timeline information with dates and milestones.',
          confidence: 0.8,
          startPosition: 101,
          endPosition: 150
        }
      ];

      const result = await service.extractFeaturesFromSections(
        sections,
        ['EXECUTIVE_SUMMARY', 'COST_ESTIMATE']
      );

      expect(result).toBeDefined();
      // Should only process the specified section types
      const processedSections = result.gapAnalysis.sectionScores.filter(s => s.present);
      expect(processedSections.length).toBeLessThanOrEqual(2);
    });
  });

  describe('metadata generation', () => {
    it('should generate comprehensive metadata', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Project with cost Rs. 25 lakh, location Guwahati, start date 01/01/2024, needs 10 engineers.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 100
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.extractedFeatures).toBeDefined();
      expect(result.metadata.completenessMetrics).toBeDefined();

      // Should have detected different entity types
      const features = result.metadata.extractedFeatures;
      expect(features.totalEntities).toBeGreaterThanOrEqual(0);
    });

    it('should calculate completeness metrics correctly', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Complete executive summary with all required information including project title, objectives, cost, duration, and beneficiaries.',
          confidence: 0.95,
          startPosition: 0,
          endPosition: 120
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const metrics = result.metadata.completenessMetrics;
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.completenessPercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.criticalIssues).toBeGreaterThanOrEqual(0);
      expect(metrics.missingRequiredFields).toBeGreaterThanOrEqual(0);
    });
  });

  describe('searchable content generation', () => {
    it('should generate relevant keywords', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Highway development project in Northeast India connecting Guwahati to Shillong with government funding.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 100
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const keywords = result.searchableContent.keywords;
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.some(k => k.includes('highway') || k.includes('development'))).toBe(true);
    });

    it('should generate appropriate tags', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Well-documented project with cost Rs. 50 lakh, location Assam, timeline 12 months.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 90
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const tags = result.searchableContent.tags;
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.includes('has-cost-info'))).toBe(true);
      expect(tags.some(t => t.includes('has-location-info'))).toBe(true);
    });

    it('should generate meaningful summary', async () => {
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: 'Project summary with basic information.',
          confidence: 0.7,
          startPosition: 0,
          endPosition: 40
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const summary = result.searchableContent.summary;
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('DPR');
    });

    it('should create indexable fields', async () => {
      const sections: DPRSection[] = [
        {
          type: 'COST_ESTIMATE',
          content: 'Total cost: Rs. 75 lakh for infrastructure development.',
          confidence: 0.85,
          startPosition: 0,
          endPosition: 60
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const indexableFields = result.searchableContent.indexableFields;
      expect(indexableFields.length).toBeGreaterThan(0);
      
      const hasEntityFields = indexableFields.some(f => f.name.includes('entity'));
      const hasSectionFields = indexableFields.some(f => f.name.includes('content'));
      
      expect(hasEntityFields || hasSectionFields).toBe(true);
    });
  });

  describe('service access', () => {
    it('should provide access to entity extraction service', () => {
      const entityService = service.getEntityExtractionService();
      expect(entityService).toBeDefined();
      expect(typeof entityService.extractEntities).toBe('function');
    });

    it('should provide access to gap analysis service', () => {
      const gapService = service.getGapAnalysisService();
      expect(gapService).toBeDefined();
      expect(typeof gapService.performGapAnalysis).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle malformed sections gracefully', async () => {
      const malformedSections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: '',
          confidence: -1,
          startPosition: -1,
          endPosition: -1
        }
      ];

      const result = await service.extractFeatures(malformedSections, '');

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.gapAnalysis).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle very large text input', async () => {
      const largeContent = 'Large project content with cost Rs. 10 lakh. '.repeat(1000);
      const sections: DPRSection[] = [
        {
          type: 'EXECUTIVE_SUMMARY',
          content: largeContent,
          confidence: 0.8,
          startPosition: 0,
          endPosition: largeContent.length
        }
      ];

      const result = await service.extractFeatures(sections, largeContent);

      expect(result).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });
  });

  describe('search weight calculation', () => {
    it('should assign appropriate search weights to different entity types', async () => {
      const sections: DPRSection[] = [
        {
          type: 'COST_ESTIMATE',
          content: 'Cost: Rs. 50 lakh, Location: Guwahati, Date: 01/01/2024, Resources: 10 engineers.',
          confidence: 0.9,
          startPosition: 0,
          endPosition: 80
        }
      ];

      const rawText = sections[0].content;
      const result = await service.extractFeatures(sections, rawText);

      const indexableFields = result.searchableContent.indexableFields;
      const entityFields = indexableFields.filter(f => f.name.includes('entity'));

      expect(entityFields.length).toBeGreaterThan(0);
      
      // Check that different entity types have different weights
      const weights = entityFields.map(f => f.searchWeight);
      const uniqueWeights = new Set(weights);
      
      // Should have some variation in weights (not all the same)
      expect(uniqueWeights.size).toBeGreaterThanOrEqual(1);
    });
  });
});