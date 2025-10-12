import { describe, it, expect, beforeEach } from 'vitest';
import { AccessibilityAssessmentService } from '../accessibilityAssessmentService.js';
import { GeographicLocation } from '@dpr-system/shared';

describe('AccessibilityAssessmentService', () => {
  let service: AccessibilityAssessmentService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: () => {},
      error: () => {},
      warn: () => {}
    };
    service = new AccessibilityAssessmentService(mockLogger);
  });

  describe('assessSiteAccessibility', () => {
    it('should perform comprehensive accessibility assessment', async () => {
      const location: GeographicLocation = {
        latitude: 26.1445,
        longitude: 91.7362,
        address: 'Guwahati, Assam',
        state: 'Assam'
      };

      const result = await service.assessSiteAccessibility('test-dpr-1', location);

      expect(result).toBeDefined();
      expect(result.dprId).toBe('test-dpr-1');
      expect(result.location).toEqual(location);
      expect(result.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.accessibilityScore).toBeLessThanOrEqual(100);
      expect(result.infrastructureAvailability).toBeDefined();
      expect(result.transportConnectivity).toBeDefined();
      expect(result.utilityAvailability).toBeDefined();
      expect(result.terrainAnalysis).toBeDefined();
      expect(result.weatherRisks).toBeDefined();
      expect(Array.isArray(result.weatherRisks)).toBe(true);
    });

    it('should handle Northeast India specific characteristics', async () => {
      const location: GeographicLocation = {
        latitude: 27.0844,
        longitude: 93.6053,
        address: 'Itanagar, Arunachal Pradesh',
        state: 'Arunachal Pradesh'
      };

      const result = await service.assessSiteAccessibility('test-dpr-2', location);

      expect(result.weatherRisks.some(risk => risk.riskType === 'MONSOON')).toBe(true);
      expect(result.terrainAnalysis.seismicZone).toBeGreaterThanOrEqual(4);
    });

    it('should provide detailed infrastructure analysis', async () => {
      const location: GeographicLocation = {
        latitude: 25.5788,
        longitude: 91.8933,
        address: 'Shillong, Meghalaya',
        state: 'Meghalaya'
      };

      const result = await service.assessSiteAccessibility('test-dpr-3', location);

      expect(result.infrastructureAvailability.roadAccess).toBeDefined();
      expect(result.infrastructureAvailability.railwayAccess).toBeDefined();
      expect(result.infrastructureAvailability.airportAccess).toBeDefined();
      expect(result.infrastructureAvailability.portAccess).toBeDefined();
      
      expect(typeof result.infrastructureAvailability.roadAccess.available).toBe('boolean');
      expect(['HIGHWAY', 'STATE_ROAD', 'DISTRICT_ROAD', 'VILLAGE_ROAD', 'NO_ROAD'])
        .toContain(result.infrastructureAvailability.roadAccess.roadType);
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'])
        .toContain(result.infrastructureAvailability.roadAccess.condition);
    });

    it('should assess utility availability comprehensively', async () => {
      const location: GeographicLocation = {
        latitude: 23.8315,
        longitude: 91.2868,
        address: 'Agartala, Tripura',
        state: 'Tripura'
      };

      const result = await service.assessSiteAccessibility('test-dpr-4', location);

      expect(result.utilityAvailability.electricity).toBeDefined();
      expect(result.utilityAvailability.water).toBeDefined();
      expect(result.utilityAvailability.telecommunications).toBeDefined();
      expect(result.utilityAvailability.wasteManagement).toBeDefined();

      expect(typeof result.utilityAvailability.electricity.available).toBe('boolean');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.utilityAvailability.electricity.reliability);
      
      expect(['MUNICIPAL', 'GROUNDWATER', 'SURFACE_WATER', 'TANKER', 'NONE'])
        .toContain(result.utilityAvailability.water.source);
      expect(['POTABLE', 'TREATABLE', 'POOR']).toContain(result.utilityAvailability.water.quality);
    });

    it('should analyze terrain and environmental factors', async () => {
      const location: GeographicLocation = {
        latitude: 24.6637,
        longitude: 93.9063,
        address: 'Imphal, Manipur',
        state: 'Manipur'
      };

      const result = await service.assessSiteAccessibility('test-dpr-5', location);

      expect(result.terrainAnalysis.elevation).toBeGreaterThanOrEqual(0);
      expect(result.terrainAnalysis.slope).toBeGreaterThanOrEqual(0);
      expect(['PLAIN', 'HILLY', 'MOUNTAINOUS', 'COASTAL', 'RIVERINE'])
        .toContain(result.terrainAnalysis.terrainType);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.terrainAnalysis.floodRisk);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.terrainAnalysis.landslideRisk);
      expect(['GOOD', 'MODERATE', 'POOR']).toContain(result.terrainAnalysis.drainagePattern);
    });

    it('should provide transport connectivity analysis', async () => {
      const location: GeographicLocation = {
        latitude: 25.6751,
        longitude: 94.1086,
        address: 'Kohima, Nagaland',
        state: 'Nagaland'
      };

      const result = await service.assessSiteAccessibility('test-dpr-6', location);

      expect(result.transportConnectivity.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.transportConnectivity.overallScore).toBeLessThanOrEqual(100);
      expect(typeof result.transportConnectivity.publicTransport).toBe('boolean');
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'])
        .toContain(result.transportConnectivity.lastMileConnectivity);
      expect(['YEAR_ROUND', 'SEASONAL', 'LIMITED'])
        .toContain(result.transportConnectivity.seasonalAccessibility);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.transportConnectivity.logisticsComplexity);
    });
  });
});