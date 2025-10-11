import { Client } from '@googlemaps/google-maps-services-js';
import NodeGeocoder from 'node-geocoder';
import { getDistance, isPointWithinRadius } from 'geolib';
import {
  GeographicLocation,
  LocationVerificationRequest,
  LocationVerificationResult,
  AddressComponents,
  SiteAccessibilityAnalysis,
  InfrastructureAvailability,
  TransportConnectivity,
  UtilityAvailability,
  TerrainAnalysis,
  WeatherRisk,
  EnvironmentalConstraint,
  SiteFeasibilityResult,
  SiteFeasibilityRecommendation,
  GeospatialVerificationResult,
  MapVisualizationData,
  MapMarker,
  MapOverlay
} from '@dpr-system/shared';

export class GeospatialVerificationService {
  private googleMapsClient: Client;
  private geocoder: NodeGeocoder.Geocoder;
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
    
    // Initialize Google Maps client
    this.googleMapsClient = new Client({});
    
    // Initialize geocoder with multiple providers
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap',
      httpAdapter: 'https',
      formatter: null
    });
  }

  /**
   * Verify and geocode location from DPR data
   */
  async verifyLocation(request: LocationVerificationRequest): Promise<LocationVerificationResult> {
    try {
      this.logger.info(`Starting location verification for DPR: ${request.dprId}`);

      let verifiedLocation: GeographicLocation;
      let verificationMethod: 'GPS' | 'GEOCODING' | 'MANUAL' | 'HYBRID';
      let accuracy = 0;
      let verificationStatus: 'VERIFIED' | 'APPROXIMATE' | 'FAILED' | 'NEEDS_REVIEW';
      const errors: string[] = [];
      const warnings: string[] = [];

      // If coordinates are provided, verify them
      if (request.coordinates) {
        const coordinateVerification = await this.verifyCoordinates(request.coordinates);
        verifiedLocation = coordinateVerification.location;
        accuracy = coordinateVerification.accuracy;
        verificationMethod = 'GPS';
        verificationStatus = coordinateVerification.status;
        
        if (coordinateVerification.errors) {
          errors.push(...coordinateVerification.errors);
        }
        if (coordinateVerification.warnings) {
          warnings.push(...coordinateVerification.warnings);
        }
      } 
      // If only address is provided, geocode it
      else if (request.address) {
        const geocodingResult = await this.geocodeAddress(request.address);
        verifiedLocation = geocodingResult.location;
        accuracy = geocodingResult.accuracy;
        verificationMethod = 'GEOCODING';
        verificationStatus = geocodingResult.status;
        
        if (geocodingResult.errors) {
          errors.push(...geocodingResult.errors);
        }
        if (geocodingResult.warnings) {
          warnings.push(...geocodingResult.warnings);
        }
      } else {
        throw new Error('Either coordinates or address must be provided');
      }

      // Get detailed address components
      const addressComponents = await this.getAddressComponents(verifiedLocation);

      const result: LocationVerificationResult = {
        dprId: request.dprId,
        originalLocation: request.coordinates || request.address!,
        verifiedLocation,
        verificationStatus,
        accuracy,
        verificationMethod,
        addressComponents,
        verificationTimestamp: new Date(),
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      this.logger.info(`Location verification completed for DPR: ${request.dprId}, Status: ${verificationStatus}`);
      return result;

    } catch (error) {
      this.logger.error(`Location verification failed for DPR: ${request.dprId}`, error);
      throw new Error(`Location verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify GPS coordinates accuracy and validity
   */
  private async verifyCoordinates(coordinates: GeographicLocation): Promise<{
    location: GeographicLocation;
    accuracy: number;
    status: 'VERIFIED' | 'APPROXIMATE' | 'FAILED' | 'NEEDS_REVIEW';
    errors?: string[];
    warnings?: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic coordinate validation
    if (coordinates.latitude < -90 || coordinates.latitude > 90) {
      errors.push('Invalid latitude: must be between -90 and 90');
    }
    if (coordinates.longitude < -180 || coordinates.longitude > 180) {
      errors.push('Invalid longitude: must be between -180 and 180');
    }

    // Check if coordinates are within Northeast India bounds
    const northeastBounds = {
      north: 29.5,
      south: 21.5,
      east: 97.5,
      west: 87.5
    };

    if (coordinates.latitude < northeastBounds.south || 
        coordinates.latitude > northeastBounds.north ||
        coordinates.longitude < northeastBounds.west || 
        coordinates.longitude > northeastBounds.east) {
      warnings.push('Coordinates appear to be outside Northeast India region');
    }

    if (errors.length > 0) {
      return {
        location: coordinates,
        accuracy: 0,
        status: 'FAILED',
        errors
      };
    }

    // Try to reverse geocode to verify the coordinates
    try {
      const reverseGeocode = await this.reverseGeocode(coordinates);
      if (reverseGeocode) {
        return {
          location: coordinates,
          accuracy: coordinates.accuracy || 0.8,
          status: 'VERIFIED',
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
    } catch (error) {
      warnings.push('Could not reverse geocode coordinates for verification');
    }

    return {
      location: coordinates,
      accuracy: coordinates.accuracy || 0.6,
      status: 'APPROXIMATE',
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Geocode address to coordinates
   */
  private async geocodeAddress(address: string): Promise<{
    location: GeographicLocation;
    accuracy: number;
    status: 'VERIFIED' | 'APPROXIMATE' | 'FAILED' | 'NEEDS_REVIEW';
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Try OpenStreetMap geocoding first
      const osmResults = await this.geocoder.geocode(address);
      
      if (osmResults && osmResults.length > 0) {
        const result = osmResults[0];
        const location: GeographicLocation = {
          latitude: result.latitude!,
          longitude: result.longitude!,
          address: result.formattedAddress || address,
          state: result.administrativeLevels?.level1long,
          district: result.administrativeLevels?.level2long,
          pincode: result.zipcode
        };

        return {
          location,
          accuracy: 0.7,
          status: 'VERIFIED'
        };
      }

      // If OSM fails, try Google Maps (if API key is available)
      if (process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const googleResult = await this.googleMapsClient.geocode({
            params: {
              address: address,
              key: process.env.GOOGLE_MAPS_API_KEY,
              region: 'in' // Bias towards India
            }
          });

          if (googleResult.data.results && googleResult.data.results.length > 0) {
            const result = googleResult.data.results[0];
            const location: GeographicLocation = {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              address: result.formatted_address,
              accuracy: this.getGoogleMapsAccuracy(result.geometry.location_type)
            };

            return {
              location,
              accuracy: location.accuracy || 0.8,
              status: 'VERIFIED'
            };
          }
        } catch (googleError) {
          this.logger.warn('Google Maps geocoding failed, falling back to approximate location');
        }
      }

      // If all geocoding fails, return error
      return {
        location: { latitude: 0, longitude: 0, address },
        accuracy: 0,
        status: 'FAILED',
        errors: ['Could not geocode the provided address']
      };

    } catch (error) {
      return {
        location: { latitude: 0, longitude: 0, address },
        accuracy: 0,
        status: 'FAILED',
        errors: [`Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  private async reverseGeocode(coordinates: GeographicLocation): Promise<string | null> {
    try {
      const results = await this.geocoder.reverse({
        lat: coordinates.latitude,
        lon: coordinates.longitude
      });

      if (results && results.length > 0) {
        return results[0].formattedAddress || null;
      }
      return null;
    } catch (error) {
      this.logger.warn('Reverse geocoding failed', error);
      return null;
    }
  }

  /**
   * Get detailed address components from coordinates
   */
  private async getAddressComponents(location: GeographicLocation): Promise<AddressComponents> {
    try {
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const result = await this.googleMapsClient.reverseGeocode({
          params: {
            latlng: `${location.latitude},${location.longitude}`,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });

        if (result.data.results && result.data.results.length > 0) {
          const components = result.data.results[0].address_components;
          const addressComponents: AddressComponents = {
            formattedAddress: result.data.results[0].formatted_address
          };

          components.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) {
              addressComponents.streetNumber = component.long_name;
            } else if (types.includes('route')) {
              addressComponents.route = component.long_name;
            } else if (types.includes('locality')) {
              addressComponents.locality = component.long_name;
            } else if (types.includes('sublocality')) {
              addressComponents.subLocality = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              addressComponents.administrativeAreaLevel1 = component.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              addressComponents.administrativeAreaLevel2 = component.long_name;
            } else if (types.includes('administrative_area_level_3')) {
              addressComponents.administrativeAreaLevel3 = component.long_name;
            } else if (types.includes('postal_code')) {
              addressComponents.postalCode = component.long_name;
            } else if (types.includes('country')) {
              addressComponents.country = component.long_name;
            }
          });

          return addressComponents;
        }
      }

      // Fallback to basic address components
      return {
        formattedAddress: location.address,
        administrativeAreaLevel1: location.state,
        administrativeAreaLevel2: location.district,
        postalCode: location.pincode,
        country: 'India'
      };

    } catch (error) {
      this.logger.warn('Failed to get detailed address components', error);
      return {
        formattedAddress: location.address || `${location.latitude}, ${location.longitude}`,
        country: 'India'
      };
    }
  }

  /**
   * Convert Google Maps location type to accuracy score
   */
  private getGoogleMapsAccuracy(locationType: string): number {
    switch (locationType) {
      case 'ROOFTOP': return 0.95;
      case 'RANGE_INTERPOLATED': return 0.8;
      case 'GEOMETRIC_CENTER': return 0.6;
      case 'APPROXIMATE': return 0.4;
      default: return 0.5;
    }
  }

  /**
   * Analyze site accessibility and infrastructure
   */
  async analyzeSiteAccessibility(dprId: string, location: GeographicLocation): Promise<SiteAccessibilityAnalysis> {
    try {
      this.logger.info(`Starting site accessibility analysis for DPR: ${dprId}`);

      const infrastructureAvailability = await this.analyzeInfrastructureAvailability(location);
      const transportConnectivity = await this.analyzeTransportConnectivity(location);
      const utilityAvailability = await this.analyzeUtilityAvailability(location);
      const terrainAnalysis = await this.analyzeTerrainAndEnvironment(location);
      const weatherRisks = await this.analyzeWeatherRisks(location);

      // Calculate overall accessibility score
      const accessibilityScore = this.calculateAccessibilityScore(
        infrastructureAvailability,
        transportConnectivity,
        utilityAvailability,
        terrainAnalysis
      );

      const result: SiteAccessibilityAnalysis = {
        dprId,
        location,
        accessibilityScore,
        infrastructureAvailability,
        transportConnectivity,
        utilityAvailability,
        terrainAnalysis,
        weatherRisks,
        analysisTimestamp: new Date()
      };

      this.logger.info(`Site accessibility analysis completed for DPR: ${dprId}, Score: ${accessibilityScore}`);
      return result;

    } catch (error) {
      this.logger.error(`Site accessibility analysis failed for DPR: ${dprId}`, error);
      throw new Error(`Site accessibility analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze infrastructure availability around the site
   */
  private async analyzeInfrastructureAvailability(location: GeographicLocation): Promise<InfrastructureAvailability> {
    // This is a simplified implementation. In a real system, this would query
    // actual infrastructure databases and mapping services
    
    const infrastructure: InfrastructureAvailability = {
      roadAccess: {
        available: true,
        roadType: 'STATE_ROAD',
        distanceKm: 2.5,
        condition: 'GOOD'
      },
      railwayAccess: {
        available: false,
        nearestStationKm: 45,
        stationName: 'Nearest Railway Station'
      },
      airportAccess: {
        available: false,
        nearestAirportKm: 120,
        airportName: 'Nearest Airport',
        airportType: 'DOMESTIC'
      },
      portAccess: {
        available: false,
        nearestPortKm: 200,
        portName: 'Nearest Port',
        portType: 'MAJOR'
      }
    };

    // In a real implementation, this would use actual infrastructure APIs
    // For now, we'll simulate based on location characteristics
    if (location.state?.toLowerCase().includes('assam')) {
      infrastructure.railwayAccess.available = true;
      infrastructure.railwayAccess.nearestStationKm = 25;
    }

    return infrastructure;
  }

  /**
   * Analyze transport connectivity
   */
  private async analyzeTransportConnectivity(location: GeographicLocation): Promise<TransportConnectivity> {
    // Simplified implementation - would use real transport data in production
    return {
      overallScore: 65,
      publicTransport: true,
      lastMileConnectivity: 'FAIR',
      seasonalAccessibility: 'SEASONAL',
      logisticsComplexity: 'MEDIUM'
    };
  }

  /**
   * Analyze utility availability
   */
  private async analyzeUtilityAvailability(location: GeographicLocation): Promise<UtilityAvailability> {
    // Simplified implementation - would query actual utility databases
    return {
      electricity: {
        available: true,
        reliability: 'MEDIUM',
        gridConnection: true,
        powerOutageHours: 4
      },
      water: {
        available: true,
        source: 'GROUNDWATER',
        quality: 'TREATABLE',
        reliability: 'MEDIUM'
      },
      telecommunications: {
        mobileNetwork: true,
        internetConnectivity: true,
        broadbandAvailable: false,
        networkStrength: 'FAIR'
      },
      wasteManagement: {
        solidWasteCollection: false,
        sewageSystem: false,
        treatmentFacility: false
      }
    };
  }

  /**
   * Analyze terrain and environmental factors
   */
  private async analyzeTerrainAndEnvironment(location: GeographicLocation): Promise<TerrainAnalysis> {
    // Simplified implementation - would use elevation APIs and geological data
    return {
      elevation: 150,
      slope: 5,
      terrainType: 'HILLY',
      soilType: 'Alluvial',
      drainagePattern: 'MODERATE',
      floodRisk: 'MEDIUM',
      landslideRisk: 'LOW',
      seismicZone: 5
    };
  }

  /**
   * Analyze weather-related risks
   */
  private async analyzeWeatherRisks(location: GeographicLocation): Promise<WeatherRisk[]> {
    // Simplified implementation - would use meteorological data
    return [
      {
        riskType: 'MONSOON',
        severity: 'HIGH',
        seasonalPattern: 'June to September',
        impactOnConstruction: 'Significant delays during monsoon season',
        mitigationMeasures: ['Schedule critical work outside monsoon', 'Ensure proper drainage', 'Use weather-resistant materials']
      },
      {
        riskType: 'EXTREME_TEMPERATURE',
        severity: 'MEDIUM',
        seasonalPattern: 'April to May',
        impactOnConstruction: 'Reduced working hours during peak summer',
        mitigationMeasures: ['Adjust working hours', 'Provide adequate hydration', 'Use heat-resistant equipment']
      }
    ];
  }

  /**
   * Calculate overall accessibility score
   */
  private calculateAccessibilityScore(
    infrastructure: InfrastructureAvailability,
    transport: TransportConnectivity,
    utilities: UtilityAvailability,
    terrain: TerrainAnalysis
  ): number {
    let score = 0;

    // Infrastructure score (30% weight)
    let infraScore = 0;
    if (infrastructure.roadAccess.available) infraScore += 40;
    if (infrastructure.railwayAccess.available) infraScore += 20;
    if (infrastructure.airportAccess.available) infraScore += 20;
    if (infrastructure.portAccess.available) infraScore += 20;
    score += (infraScore * 0.3);

    // Transport connectivity (25% weight)
    score += (transport.overallScore * 0.25);

    // Utilities (25% weight)
    let utilityScore = 0;
    if (utilities.electricity.available) utilityScore += 30;
    if (utilities.water.available) utilityScore += 25;
    if (utilities.telecommunications.mobileNetwork) utilityScore += 25;
    if (utilities.wasteManagement.solidWasteCollection) utilityScore += 20;
    score += (utilityScore * 0.25);

    // Terrain factors (20% weight)
    let terrainScore = 100;
    if (terrain.slope > 15) terrainScore -= 20;
    if (terrain.floodRisk === 'HIGH') terrainScore -= 30;
    if (terrain.landslideRisk === 'HIGH') terrainScore -= 25;
    score += (terrainScore * 0.2);

    return Math.round(Math.max(0, Math.min(100, score)));
  }
}