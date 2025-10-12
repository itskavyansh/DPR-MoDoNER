import { describe, it, expect, beforeEach } from 'vitest';
import { GeospatialService } from '../geospatialService.js';
import { LocationVerificationRequest } from '@dpr-system/shared';

describe('GeospatialService', () => {
  let geospatialService: GeospatialService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: () => {},
      error: () => {},
      warn: () => {}
    };
    geospatialService = new GeospatialService(mockLogger);
  });

  describe('Location Verification', () => {
    it('should verify location with coordinates', async () => {
      const request: LocationVerificationRequest = {
        dprId: 'test-dpr-001',
        coordinates: {
          latitude: 26.1445,
          longitude: 91.7362,
          address: 'Guwahati, Assam, India'
        },
        verificationLevel: 'BASIC'
      };

      const result = await geospatialService.verifyLocationOnly(request);

      expect(result).toBeDefined();
      expect(result.dprId).toBe('test-dpr-001');
      expect(result.verifiedLocation).toBeDefined();
      expect(result.verifiedLocation.latitude).toBe(26.1445);
      expect(result.verifiedLocation.longitude).toBe(91.7362);
      expect(result.verificationStatus).toBeOneOf(['VERIFIED', 'APPROXIMATE', 'FAILED', 'NEEDS_REVIEW']);
    });

    it('should verify location with address only', async () => {
      const request: LocationVerificationRequest = {
        dprId: 'test-dpr-002',
        address: 'Shillong, Meghalaya, India',
        verificationLevel: 'BASIC'
      };

      const result = await geospatialService.verifyLocationOnly(request);

      expect(result).toBeDefined();
      expect(result.dprId).toBe('test-dpr-002');
      expect(result.verifiedLocation).toBeDefined();
      expect(result.verificationStatus).toBeOneOf(['VERIFIED', 'APPROXIMATE', 'FAILED', 'NEEDS_REVIEW']);
    });
  });

  describe('Comprehensive Geospatial Verification', () => {
    it('should perform comprehensive verification', async () => {
      const request: LocationVerificationRequest = {
        dprId: 'test-dpr-003',
        coordinates: {
          latitude: 25.5788,
          longitude: 91.8933,
          address: 'Cherrapunji, Meghalaya, India'
        },
        verificationLevel: 'COMPREHENSIVE'
      };

      const result = await geospatialService.performGeospatialVerification(request);

      expect(result).toBeDefined();
      expect(result.dprId).toBe('test-dpr-003');
      expect(result.locationVerification).toBeDefined();
      expect(result.siteFeasibility).toBeDefined();
      expect(result.mapVisualization).toBeDefined();
      expect(result.overallVerificationStatus).toBeOneOf(['PASSED', 'PASSED_WITH_WARNINGS', 'FAILED', 'NEEDS_REVIEW']);
      expect(result.verificationSummary).toBeDefined();
      expect(typeof result.verificationSummary).toBe('string');
    });
  });

  describe('Site Accessibility Analysis', () => {
    it('should analyze site accessibility', async () => {
      const location = {
        latitude: 26.1445,
        longitude: 91.7362,
        address: 'Guwahati, Assam, India'
      };

      const result = await geospatialService.analyzeSiteAccessibilityOnly('test-dpr-004', location);

      expect(result).toBeDefined();
      expect(result.dprId).toBe('test-dpr-004');
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
  });

  describe('Map Visualization', () => {
    it('should generate map visualization', async () => {
      const locationVerification = {
        dprId: 'test-dpr-005',
        originalLocation: 'Imphal, Manipur, India',
        verifiedLocation: {
          latitude: 24.8170,
          longitude: 93.9368,
          address: 'Imphal, Manipur, India'
        },
        verificationStatus: 'VERIFIED' as const,
        accuracy: 0.9,
        verificationMethod: 'GEOCODING' as const,
        addressComponents: {
          formattedAddress: 'Imphal, Manipur, India',
          administrativeAreaLevel1: 'Manipur',
          country: 'India'
        },
        verificationTimestamp: new Date()
      };

      const accessibilityAnalysis = {
        dprId: 'test-dpr-005',
        location: locationVerification.verifiedLocation,
        accessibilityScore: 65,
        infrastructureAvailability: {
          roadAccess: {
            available: true,
            roadType: 'STATE_ROAD' as const,
            distanceKm: 2.5,
            condition: 'GOOD' as const
          },
          railwayAccess: {
            available: false,
            nearestStationKm: 45
          },
          airportAccess: {
            available: true,
            nearestAirportKm: 8,
            airportName: 'Imphal Airport',
            airportType: 'DOMESTIC' as const
          },
          portAccess: {
            available: false,
            nearestPortKm: 200
          }
        },
        transportConnectivity: {
          overallScore: 65,
          publicTransport: true,
          lastMileConnectivity: 'FAIR' as const,
          seasonalAccessibility: 'SEASONAL' as const,
          logisticsComplexity: 'MEDIUM' as const
        },
        utilityAvailability: {
          electricity: {
            available: true,
            reliability: 'MEDIUM' as const,
            gridConnection: true,
            powerOutageHours: 4
          },
          water: {
            available: true,
            source: 'GROUNDWATER' as const,
            quality: 'TREATABLE' as const,
            reliability: 'MEDIUM' as const
          },
          telecommunications: {
            mobileNetwork: true,
            internetConnectivity: true,
            broadbandAvailable: false,
            networkStrength: 'FAIR' as const
          },
          wasteManagement: {
            solidWasteCollection: false,
            sewageSystem: false,
            treatmentFacility: false
          }
        },
        terrainAnalysis: {
          elevation: 150,
          slope: 5,
          terrainType: 'HILLY' as const,
          soilType: 'Alluvial',
          drainagePattern: 'MODERATE' as const,
          floodRisk: 'MEDIUM' as const,
          landslideRisk: 'LOW' as const,
          seismicZone: 5
        },
        weatherRisks: [
          {
            riskType: 'MONSOON' as const,
            severity: 'HIGH' as const,
            seasonalPattern: 'June to September',
            impactOnConstruction: 'Significant delays during monsoon season',
            mitigationMeasures: ['Schedule critical work outside monsoon', 'Ensure proper drainage']
          }
        ],
        analysisTimestamp: new Date()
      };

      const environmentalConstraints = [
        {
          constraintType: 'POLLUTION_CONTROL' as const,
          severity: 'MEDIUM' as const,
          description: 'Standard pollution control measures required',
          regulatoryRequirements: ['Consent to Establish from State Pollution Control Board'],
          approvalAuthority: 'State Pollution Control Board',
          estimatedTimelineMonths: 4,
          complianceCost: 150000,
          mitigationPossible: true
        }
      ];

      const result = await geospatialService.generateMapVisualizationOnly(
        'test-dpr-005',
        locationVerification,
        accessibilityAnalysis,
        environmentalConstraints
      );

      expect(result).toBeDefined();
      expect(result.centerCoordinates).toEqual(locationVerification.verifiedLocation);
      expect(result.zoomLevel).toBeGreaterThan(0);
      expect(result.markers).toBeDefined();
      expect(Array.isArray(result.markers)).toBe(true);
      expect(result.markers.length).toBeGreaterThan(0);
      expect(result.overlays).toBeDefined();
      expect(Array.isArray(result.overlays)).toBe(true);
      expect(result.boundingBox).toBeDefined();
      expect(result.boundingBox.northeast).toBeDefined();
      expect(result.boundingBox.southwest).toBeDefined();

      // Check that project site marker exists
      const projectSiteMarker = result.markers.find(m => m.type === 'PROJECT_SITE');
      expect(projectSiteMarker).toBeDefined();
      expect(projectSiteMarker?.title).toBe('Project Site');
    });
  });

  describe('Batch Processing', () => {
    it('should handle batch verification requests', async () => {
      const requests: LocationVerificationRequest[] = [
        {
          dprId: 'batch-001',
          coordinates: { latitude: 26.1445, longitude: 91.7362 },
          verificationLevel: 'BASIC'
        },
        {
          dprId: 'batch-002',
          address: 'Aizawl, Mizoram, India',
          verificationLevel: 'BASIC'
        }
      ];

      const results = await geospatialService.batchVerifyLocations(requests);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(requests.length);

      // Check that each result has the expected structure
      results.forEach(result => {
        expect(result.dprId).toBeDefined();
        expect(result.locationVerification).toBeDefined();
        expect(result.siteFeasibility).toBeDefined();
        expect(result.mapVisualization).toBeDefined();
        expect(result.overallVerificationStatus).toBeOneOf(['PASSED', 'PASSED_WITH_WARNINGS', 'FAILED', 'NEEDS_REVIEW']);
      });
    });
  });
});