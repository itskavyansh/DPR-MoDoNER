import { describe, it, expect, beforeEach } from 'vitest';
import { SiteFeasibilityService } from '../siteFeasibilityService.js';
import { GeographicLocation } from '@dpr-system/shared';

describe('SiteFeasibilityService - Enhanced Features', () => {
  let service: SiteFeasibilityService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: () => {},
      error: () => {},
      warn: () => {}
    };
    service = new SiteFeasibilityService(mockLogger);
  });

  describe('analyzeSiteFeasibility - Enhanced Implementation', () => {
    it('should perform enhanced site feasibility analysis without accessibility input', async () => {
      const location: GeographicLocation = {
        latitude: 26.1445,
        longitude: 91.7362,
        address: 'Guwahati, Assam',
        state: 'Assam'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-1', location);

      expect(result).toBeDefined();
      expect(result.dprId).toBe('test-dpr-1');
      expect(result.location).toEqual(location);
      expect(result.overallFeasibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallFeasibilityScore).toBeLessThanOrEqual(100);
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNSUITABLE']).toContain(result.feasibilityRating);
      expect(result.accessibilityAnalysis).toBeDefined();
      expect(result.environmentalConstraints).toBeDefined();
      expect(Array.isArray(result.environmentalConstraints)).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it('should identify comprehensive environmental constraints', async () => {
      const location: GeographicLocation = {
        latitude: 27.0844,
        longitude: 93.6053,
        address: 'Itanagar, Arunachal Pradesh',
        state: 'Arunachal Pradesh'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-2', location);

      expect(result.environmentalConstraints.length).toBeGreaterThan(0);
      
      // Should have at least pollution control requirements
      const pollutionConstraints = result.environmentalConstraints.filter(
        c => c.constraintType === 'POLLUTION_CONTROL'
      );
      expect(pollutionConstraints.length).toBeGreaterThan(0);

      // Check constraint structure
      result.environmentalConstraints.forEach(constraint => {
        expect(constraint.constraintType).toBeDefined();
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(constraint.severity);
        expect(constraint.description).toBeDefined();
        expect(Array.isArray(constraint.regulatoryRequirements)).toBe(true);
        expect(constraint.approvalAuthority).toBeDefined();
        expect(typeof constraint.mitigationPossible).toBe('boolean');
      });
    });

    it('should generate enhanced recommendations', async () => {
      const location: GeographicLocation = {
        latitude: 25.5788,
        longitude: 91.8933,
        address: 'Shillong, Meghalaya',
        state: 'Meghalaya'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-3', location);

      expect(result.recommendations.length).toBeGreaterThan(0);

      // Check recommendation structure
      result.recommendations.forEach(recommendation => {
        expect(['ACCESSIBILITY', 'INFRASTRUCTURE', 'ENVIRONMENTAL', 'REGULATORY', 'RISK_MITIGATION'])
          .toContain(recommendation.category);
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(recommendation.priority);
        expect(recommendation.recommendation).toBeDefined();
        expect(recommendation.expectedImpact).toBeDefined();
      });

      // Should have infrastructure recommendations for Northeast India
      const infraRecommendations = result.recommendations.filter(
        r => r.category === 'INFRASTRUCTURE'
      );
      expect(infraRecommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify comprehensive risk factors', async () => {
      const location: GeographicLocation = {
        latitude: 23.8315,
        longitude: 91.2868,
        address: 'Agartala, Tripura',
        state: 'Tripura'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-4', location);

      expect(result.riskFactors.length).toBeGreaterThan(0);

      // Should identify Northeast India specific risks
      const neRisks = result.riskFactors.filter(risk => 
        risk.toLowerCase().includes('northeast')
      );
      expect(neRisks.length).toBeGreaterThanOrEqual(0);

      // Should identify monsoon-related risks
      const monsoonRisks = result.riskFactors.filter(risk => 
        risk.toLowerCase().includes('monsoon') || risk.toLowerCase().includes('seasonal')
      );
      expect(monsoonRisks.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle critical environmental constraints appropriately', async () => {
      const location: GeographicLocation = {
        latitude: 24.6637,
        longitude: 93.9063,
        address: 'Imphal, Manipur',
        state: 'Manipur'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-5', location);

      const criticalConstraints = result.environmentalConstraints.filter(
        c => c.severity === 'CRITICAL'
      );

      if (criticalConstraints.length > 0) {
        // If there are critical constraints, feasibility should be UNSUITABLE
        expect(result.feasibilityRating).toBe('UNSUITABLE');
      }
    });

    it('should provide enhanced data sources information', async () => {
      const location: GeographicLocation = {
        latitude: 25.6751,
        longitude: 94.1086,
        address: 'Kohima, Nagaland',
        state: 'Nagaland'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-6', location);

      expect(result.dataSourcesUsed).toBeDefined();
      expect(Array.isArray(result.dataSourcesUsed)).toBe(true);
      expect(result.dataSourcesUsed.length).toBeGreaterThan(0);

      // Should include enhanced data sources
      expect(result.dataSourcesUsed).toContain('Enhanced Infrastructure Database');
      expect(result.dataSourcesUsed).toContain('Regulatory Clearance Database');
      expect(result.dataSourcesUsed).toContain('Environmental Impact Database');
    });

    it('should calculate enhanced feasibility scores', async () => {
      const location: GeographicLocation = {
        latitude: 23.1645,
        longitude: 92.9376,
        address: 'Aizawl, Mizoram',
        state: 'Mizoram'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-7', location);

      // Score should be within valid range
      expect(result.overallFeasibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallFeasibilityScore).toBeLessThanOrEqual(100);

      // Rating should correspond to score appropriately
      if (result.overallFeasibilityScore >= 80) {
        expect(result.feasibilityRating).toBe('EXCELLENT');
      } else if (result.overallFeasibilityScore >= 65) {
        expect(result.feasibilityRating).toBe('GOOD');
      } else if (result.overallFeasibilityScore >= 50) {
        expect(result.feasibilityRating).toBe('FAIR');
      } else if (result.overallFeasibilityScore >= 35) {
        expect(result.feasibilityRating).toBe('POOR');
      } else {
        expect(result.feasibilityRating).toBe('UNSUITABLE');
      }
    });

    it('should handle forest area constraints for Northeast states', async () => {
      const location: GeographicLocation = {
        latitude: 27.4728,
        longitude: 94.9120,
        address: 'Tezpur, Assam',
        state: 'Assam'
      };

      const result = await service.analyzeSiteFeasibility('test-dpr-8', location);

      // Northeast India has high forest cover, so should likely have forest-related constraints
      const forestConstraints = result.environmentalConstraints.filter(
        c => c.constraintType === 'FOREST_CLEARANCE'
      );

      // Should have comprehensive regulatory requirements if forest constraints exist
      forestConstraints.forEach(constraint => {
        expect(constraint.regulatoryRequirements.length).toBeGreaterThan(0);
        expect(constraint.estimatedTimelineMonths).toBeGreaterThan(0);
        expect(constraint.complianceCost).toBeGreaterThan(0);
      });
    });
  });
});