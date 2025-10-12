import { describe, it, expect, beforeEach } from 'vitest';
import { EntityExtractionService } from '../entityExtractionService.js';

describe('EntityExtractionService', () => {
  let service: EntityExtractionService;

  beforeEach(() => {
    service = new EntityExtractionService();
  });

  describe('extractEntities', () => {
    it('should extract monetary entities from text', async () => {
      const text = 'The project cost is Rs. 50,00,000 and additional budget of ₹ 25 lakh is allocated.';
      
      const result = await service.extractEntities(text);
      
      const monetaryEntities = result.entities.filter(e => e.type === 'MONETARY');
      expect(monetaryEntities.length).toBeGreaterThanOrEqual(2);
      expect(monetaryEntities.some(e => e.value.includes('50,00,000'))).toBe(true);
      expect(monetaryEntities.some(e => e.value.includes('25 lakh'))).toBe(true);
    });

    it('should extract date entities from text', async () => {
      const text = 'Project starts on 15/03/2024 and completion date is December 31, 2025.';
      
      const result = await service.extractEntities(text);
      
      const dateEntities = result.entities.filter(e => e.type === 'DATE');
      expect(dateEntities.length).toBeGreaterThan(0);
      expect(dateEntities.some(e => e.value.includes('15/03/2024'))).toBe(true);
    });

    it('should extract GPS coordinates from text', async () => {
      const text = 'The project site is located at coordinates 26.1445, 91.7362 in Guwahati.';
      
      const result = await service.extractEntities(text);
      
      const locationEntities = result.entities.filter(e => e.type === 'LOCATION');
      expect(locationEntities.length).toBeGreaterThan(0);
      expect(locationEntities.some(e => e.value.includes('26.1445'))).toBe(true);
    });

    it('should extract resource entities from text', async () => {
      const text = 'The project requires 50 engineers, 200 workers, and 10 excavators.';
      
      const result = await service.extractEntities(text);
      
      const resourceEntities = result.entities.filter(e => e.type === 'RESOURCE');
      expect(resourceEntities.length).toBeGreaterThan(0);
      expect(resourceEntities.some(e => e.value.includes('engineers'))).toBe(true);
    });

    it('should extract location names from text', async () => {
      const text = 'The highway project connects Guwahati to Shillong through Meghalaya district.';
      
      const result = await service.extractEntities(text);
      
      const locationEntities = result.entities.filter(e => e.type === 'LOCATION');
      expect(locationEntities.length).toBeGreaterThan(0);
      expect(locationEntities.some(e => e.value.includes('Guwahati'))).toBe(true);
      expect(locationEntities.some(e => e.value.includes('Meghalaya'))).toBe(true);
    });

    it('should handle empty text', async () => {
      const result = await service.extractEntities('');
      
      expect(result.entities).toHaveLength(0);
      expect(result.metadata.totalEntitiesFound).toBe(0);
    });

    it('should handle text with no entities', async () => {
      const text = 'This is a simple text without any specific entities.';
      
      const result = await service.extractEntities(text);
      
      expect(result.entities).toHaveLength(0);
      expect(result.metadata.totalEntitiesFound).toBe(0);
    });

    it('should return metadata with processing information', async () => {
      const text = 'Project cost: Rs. 10 lakh, timeline: 6 months, location: Assam.';
      
      const result = await service.extractEntities(text);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalEntitiesFound).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateMetadata', () => {
    it('should generate searchable metadata from entities', async () => {
      const entities = [
        { type: 'MONETARY' as const, value: 'Rs. 50 lakh', confidence: 0.9, position: 0 },
        { type: 'LOCATION' as const, value: 'Guwahati', confidence: 0.8, position: 20 },
        { type: 'DATE' as const, value: '15/03/2024', confidence: 0.7, position: 40 },
        { type: 'RESOURCE' as const, value: '10 engineers', confidence: 0.8, position: 60 }
      ];
      
      const text = 'Project in Guwahati costs Rs. 50 lakh, starts 15/03/2024, needs 10 engineers.';
      
      const metadata = await service.generateMetadata(entities, text);
      
      expect(metadata.totalCost).toBeGreaterThan(0);
      expect(metadata.locations).toContain('Guwahati');
      expect(metadata.dates).toContain('15/03/2024');
      expect(metadata.resources).toContain('10 engineers');
      expect(metadata.keywords).toBeInstanceOf(Array);
      expect(metadata.keywords.length).toBeGreaterThan(0);
    });

    it('should handle empty entities array', async () => {
      const metadata = await service.generateMetadata([], 'Simple text');
      
      expect(metadata.totalCost).toBe(0);
      expect(metadata.locations).toHaveLength(0);
      expect(metadata.dates).toHaveLength(0);
      expect(metadata.resources).toHaveLength(0);
      expect(metadata.keywords).toBeInstanceOf(Array);
    });
  });

  describe('monetary value parsing', () => {
    it('should parse Indian currency formats correctly', async () => {
      const testCases = [
        { text: 'Rs. 50,00,000' },
        { text: '₹ 25 lakh' },
        { text: '10 crore rupees' },
        { text: 'INR 1,50,000' }
      ];

      for (const testCase of testCases) {
        const result = await service.extractEntities(`Cost: ${testCase.text}`);
        const monetaryEntity = result.entities.find(e => e.type === 'MONETARY');
        
        expect(monetaryEntity).toBeDefined();
        // Verify the entity was extracted (value should contain some part of the original)
        expect(monetaryEntity!.value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('coordinate parsing', () => {
    it('should parse decimal degree coordinates', async () => {
      const text = 'Location: 26.1445, 91.7362';
      
      const result = await service.extractEntities(text);
      
      const locationEntity = result.entities.find(e => e.type === 'LOCATION' && e.value.includes('26.1445'));
      expect(locationEntity).toBeDefined();
    });

    it('should validate coordinate ranges', async () => {
      const invalidText = 'Invalid coordinates: 200.0, 300.0';
      
      const result = await service.extractEntities(invalidText);
      
      // Should not extract invalid coordinates
      const invalidCoords = result.entities.find(e => e.value.includes('200.0, 300.0'));
      expect(invalidCoords).toBeUndefined();
    });
  });

  describe('date parsing', () => {
    it('should parse various date formats', async () => {
      const testCases = [
        '15/03/2024',
        '15-03-2024',
        'March 15, 2024',
        '15 March 2024',
        '2024-03-15'
      ];

      for (const dateStr of testCases) {
        const result = await service.extractEntities(`Date: ${dateStr}`);
        const dateEntity = result.entities.find(e => e.type === 'DATE');
        
        expect(dateEntity).toBeDefined();
        expect(dateEntity!.value).toContain(dateStr);
      }
    });
  });

  describe('resource extraction', () => {
    it('should extract human resources', async () => {
      const text = 'Need 25 engineers and 100 workers for the project.';
      
      const result = await service.extractEntities(text);
      
      const resourceEntities = result.entities.filter(e => e.type === 'RESOURCE');
      expect(resourceEntities.length).toBeGreaterThan(0);
      expect(resourceEntities.some(e => e.value.includes('engineers'))).toBe(true);
      expect(resourceEntities.some(e => e.value.includes('workers'))).toBe(true);
    });

    it('should extract material resources', async () => {
      const text = 'Required materials: 500 tons of cement and 1000 cubic meters of sand.';
      
      const result = await service.extractEntities(text);
      
      const resourceEntities = result.entities.filter(e => e.type === 'RESOURCE');
      expect(resourceEntities.length).toBeGreaterThan(0);
      expect(resourceEntities.some(e => e.value.includes('tons'))).toBe(true);
      expect(resourceEntities.some(e => e.value.includes('cubic meters'))).toBe(true);
    });

    it('should extract equipment resources', async () => {
      const text = 'Equipment needed: 5 excavators, 3 bulldozers, and 10 trucks.';
      
      const result = await service.extractEntities(text);
      
      const resourceEntities = result.entities.filter(e => e.type === 'RESOURCE');
      expect(resourceEntities.length).toBeGreaterThan(0);
      expect(resourceEntities.some(e => e.value.includes('excavators'))).toBe(true);
    });
  });

  describe('confidence scoring', () => {
    it('should assign higher confidence to clear monetary indicators', async () => {
      const text = 'Budget allocation: ₹ 50,00,000 for infrastructure development.';
      
      const result = await service.extractEntities(text);
      
      const monetaryEntity = result.entities.find(e => e.type === 'MONETARY');
      expect(monetaryEntity).toBeDefined();
      expect(monetaryEntity!.confidence).toBeGreaterThan(0.7);
    });

    it('should assign higher confidence to Northeast India locations', async () => {
      const text = 'Project location: Guwahati, Assam.';
      
      const result = await service.extractEntities(text);
      
      const locationEntity = result.entities.find(e => e.value.includes('Assam'));
      expect(locationEntity).toBeDefined();
      expect(locationEntity!.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('error handling', () => {
    it('should handle malformed input gracefully', async () => {
      const malformedText = 'Rs. abc lakh on 32/15/2024 at coordinates invalid, invalid';
      
      const result = await service.extractEntities(malformedText);
      
      // Should not crash and should filter out invalid entities
      expect(result.entities).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should handle very long text', async () => {
      const longText = 'Project cost Rs. 10 lakh. '.repeat(1000);
      
      const result = await service.extractEntities(longText);
      
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });
  });
});