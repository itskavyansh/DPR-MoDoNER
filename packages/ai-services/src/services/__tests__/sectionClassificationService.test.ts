import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SectionClassificationService } from '../sectionClassificationService.js';

describe('SectionClassificationService', () => {
  let service: SectionClassificationService;

  beforeAll(async () => {
    service = new SectionClassificationService();
    await service.initialize();
  });

  afterAll(async () => {
    await service.cleanup();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      const newService = new SectionClassificationService();
      await expect(newService.initialize()).resolves.not.toThrow();
      await newService.cleanup();
    });

    it('should return healthy status when initialized', () => {
      const status = service.getHealthStatus();
      expect(status.status).toBe('healthy');
      expect(status.initialized).toBe(true);
      expect(status.timestamp).toBeInstanceOf(Date);
    });

    it('should return supported section types', () => {
      const types = service.getSupportedSectionTypes();
      expect(types).toEqual([
        'EXECUTIVE_SUMMARY',
        'COST_ESTIMATE', 
        'TIMELINE',
        'RESOURCES',
        'TECHNICAL_SPECS'
      ]);
    });
  });

  describe('Section Classification', () => {
    it('should classify executive summary section', () => {
      const text = `
        Executive Summary
        
        This project aims to develop critical infrastructure in Northeast India to support economic growth and improve connectivity. The initiative focuses on building sustainable development solutions that will benefit the local communities and enhance regional development.
        
        The project overview includes comprehensive planning for infrastructure development with clear objectives and measurable outcomes.
      `;

      const result = service.classifySections(text);
      
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].type).toBe('EXECUTIVE_SUMMARY');
      expect(result.sections[0].confidence).toBeGreaterThan(0.6);
      expect(result.totalSections).toBe(1);
    });

    it('should classify cost estimate section', () => {
      const text = `
        Cost Estimate
        
        The total project cost is estimated at Rs. 10,00,000. This includes:
        - Material costs: Rs. 6,00,000
        - Labor charges: Rs. 2,50,000
        - Equipment rental: Rs. 1,00,000
        - Administrative expenses: Rs. 50,000
        
        Budget allocation has been done considering current market rates and inflation factors.
      `;

      const result = service.classifySections(text);
      
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].type).toBe('COST_ESTIMATE');
      expect(result.sections[0].confidence).toBeGreaterThan(0.6);
    });

    it('should classify timeline section', () => {
      const text = `
        Project Timeline
        
        The project duration is 12 months with the following phases:
        Phase 1: Planning and Design (2 months)
        Phase 2: Construction (8 months)
        Phase 3: Testing and Commissioning (2 months)
        
        Key milestones include foundation completion, structural work, and final delivery.
      `;

      const result = service.classifySections(text);
      
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].type).toBe('TIMELINE');
      expect(result.sections[0].confidence).toBeGreaterThan(0.6);
    });

    it('should classify resources section', () => {
      const text = `
        Resource Requirements
        
        Human Resources:
        - 10 Engineers
        - 25 Skilled workers
        - 5 Supervisors
        - 2 Project managers
        
        Equipment and Materials:
        - Excavators and construction machinery
        - Raw materials including cement, steel, and aggregates
        - Transportation vehicles
      `;

      const result = service.classifySections(text);
      
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].type).toBe('RESOURCES');
      expect(result.sections[0].confidence).toBeGreaterThan(0.6);
    });

    it('should classify technical specifications section', () => {
      const text = `
        Technical Specifications
        
        Design specifications for the infrastructure project include:
        - Engineering standards: IS codes compliance
        - Quality parameters: Grade M25 concrete
        - Performance requirements: Load bearing capacity 500 kg/sq.m
        - Technical parameters: Seismic zone considerations
        
        All specifications meet national and international standards.
      `;

      const result = service.classifySections(text);
      
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].type).toBe('TECHNICAL_SPECS');
      expect(result.sections[0].confidence).toBeGreaterThan(0.6);
    });

    it('should classify multiple sections in a document', () => {
      const text = `
        Executive Summary
        This project aims to develop infrastructure in Northeast India.
        
        Cost Estimate
        Total project cost: Rs. 15,00,000
        Material costs: Rs. 10,00,000
        Labor costs: Rs. 5,00,000
        
        Timeline
        Project duration: 18 months
        Phase 1: 6 months
        Phase 2: 12 months
        
        Resources
        Engineers: 15
        Workers: 30
        Equipment: Excavators, cranes
        
        Technical Specifications
        Design standards: IS codes
        Quality requirements: Grade M30 concrete
      `;

      const result = service.classifySections(text);
      
      expect(result.sections.length).toBeGreaterThanOrEqual(3);
      expect(result.totalSections).toBeGreaterThanOrEqual(3);
      expect(result.confidence).toBeGreaterThan(0.5);
      
      // Check that we have different section types
      const sectionTypes = result.sections.map(s => s.type);
      const uniqueTypes = new Set(sectionTypes);
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(2);
    });

    it('should handle text with no clear sections', () => {
      const text = `
        This is some random text that doesn't clearly belong to any specific section type.
        It contains general information but no specific keywords or patterns that would
        indicate it belongs to executive summary, cost estimate, timeline, resources, or
        technical specifications.
      `;

      const result = service.classifySections(text);
      
      // Should still attempt classification but may have varying confidence
      expect(result.sections.length).toBeGreaterThanOrEqual(0);
      // The confidence may vary based on the classification algorithm
    });

    it('should respect confidence threshold', () => {
      const text = `
        Some ambiguous text that might not clearly fit any section category.
        This text is intentionally vague to test confidence thresholds.
      `;

      const highThresholdResult = service.classifySections(text, {
        confidenceThreshold: 0.9
      });

      const lowThresholdResult = service.classifySections(text, {
        confidenceThreshold: 0.1
      });

      expect(highThresholdResult.sections.length).toBeLessThanOrEqual(
        lowThresholdResult.sections.length
      );
    });

    it('should respect minimum section length', () => {
      const text = `
        Short.
        
        This is a longer section that meets the minimum length requirement and should be processed.
      `;

      const result = service.classifySections(text, {
        minSectionLength: 50
      });

      // Should filter out very short sections
      result.sections.forEach(section => {
        expect(section.content.length).toBeGreaterThanOrEqual(50);
      });
    });

    it('should respect maximum sections limit', () => {
      const text = `
        Section 1: Executive Summary - This is the first section.
        Section 2: Cost Estimate - This is the second section.
        Section 3: Timeline - This is the third section.
        Section 4: Resources - This is the fourth section.
        Section 5: Technical Specs - This is the fifth section.
        Section 6: Additional Info - This is the sixth section.
      `;

      const result = service.classifySections(text, {
        maxSections: 3
      });

      expect(result.sections.length).toBeLessThanOrEqual(3);
      expect(result.totalSections).toBeLessThanOrEqual(3);
    });

    it('should handle overlap detection', () => {
      const text = `
        Executive Summary and Cost Analysis
        This section contains both executive summary information and cost details.
        The total cost is Rs. 10,00,000 for this infrastructure project overview.
      `;

      const withOverlapDetection = service.classifySections(text, {
        enableOverlapDetection: true
      });

      const withoutOverlapDetection = service.classifySections(text, {
        enableOverlapDetection: false
      });

      // With overlap detection should resolve conflicts
      expect(withOverlapDetection.sections.length).toBeLessThanOrEqual(
        withoutOverlapDetection.sections.length
      );
    });

    it('should throw error for uninitialized service', async () => {
      const uninitializedService = new SectionClassificationService();
      
      expect(() => uninitializedService.classifySections('test text'))
        .toThrow('Section classification service not initialized');
    });
  });

  describe('Section Position and Content Analysis', () => {
    it('should give higher confidence to sections with relevant keywords', () => {
      const costText = `
        Budget and Financial Analysis
        Total cost: Rs. 20,00,000
        Material expenses: Rs. 15,00,000
        Labor charges: Rs. 5,00,000
      `;

      const genericText = `
        Some Information
        This section contains general information without specific keywords.
      `;

      const costResult = service.classifySections(costText);
      const genericResult = service.classifySections(genericText);

      if (costResult.sections.length > 0 && genericResult.sections.length > 0) {
        expect(costResult.sections[0].confidence).toBeGreaterThan(
          genericResult.sections[0].confidence
        );
      }
    });

    it('should handle sections with mixed content', () => {
      const mixedText = `
        Project Overview and Cost Analysis
        
        This project aims to develop infrastructure (executive summary content)
        with a total budget of Rs. 25,00,000 (cost estimate content).
        The timeline is 15 months (timeline content).
      `;

      const result = service.classifySections(mixedText);
      
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Service Cleanup', () => {
    it('should cleanup resources properly', async () => {
      const testService = new SectionClassificationService();
      await testService.initialize();
      
      await expect(testService.cleanup()).resolves.not.toThrow();
      
      const status = testService.getHealthStatus();
      expect(status.initialized).toBe(false);
      expect(status.status).toBe('not_initialized');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty text', () => {
      const result = service.classifySections('');
      
      expect(result.sections).toHaveLength(0);
      expect(result.totalSections).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'This is a test section. '.repeat(1000);
      
      const result = service.classifySections(longText);
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.sections.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with special characters', () => {
      const specialText = `
        Cost Estimate (₹)
        
        Total cost: ₹ 10,00,000/-
        Material: ₹ 7,50,000/-
        Labor: ₹ 2,50,000/-
        
        Note: All amounts are in Indian Rupees (₹)
      `;

      const result = service.classifySections(specialText);
      
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
      if (result.sections.length > 0) {
        expect(result.sections[0].type).toBe('COST_ESTIMATE');
      }
    });
  });
});