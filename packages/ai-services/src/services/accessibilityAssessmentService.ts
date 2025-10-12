import {
  GeographicLocation,
  SiteAccessibilityAnalysis,
  InfrastructureAvailability,
  TransportConnectivity,
  UtilityAvailability,
  TerrainAnalysis,
  WeatherRisk
} from '@dpr-system/shared';

/**
 * Enhanced Accessibility Assessment Service
 * Implements comprehensive algorithms for infrastructure availability assessment
 */
export class AccessibilityAssessmentService {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  /**
   * Perform comprehensive accessibility assessment
   */
  async assessSiteAccessibility(
    dprId: string,
    location: GeographicLocation
  ): Promise<SiteAccessibilityAnalysis> {
    try {
      this.logger.info(`Starting enhanced accessibility assessment for DPR: ${dprId}`);

      // Enhanced infrastructure analysis
      const infrastructureAvailability = await this.analyzeInfrastructureAvailability(location);
      
      // Enhanced transport connectivity analysis
      const transportConnectivity = await this.analyzeTransportConnectivity(location);
      
      // Enhanced utility availability analysis
      const utilityAvailability = await this.analyzeUtilityAvailability(location);
      
      // Enhanced terrain analysis
      const terrainAnalysis = await this.analyzeTerrainAndEnvironment(location);
      
      // Weather risk analysis
      const weatherRisks = await this.analyzeWeatherRisks(location);

      // Calculate comprehensive accessibility score
      const accessibilityScore = await this.calculateEnhancedAccessibilityScore(
        infrastructureAvailability,
        transportConnectivity,
        utilityAvailability,
        terrainAnalysis,
        location
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

      this.logger.info(`Enhanced accessibility assessment completed for DPR: ${dprId}, Score: ${accessibilityScore}`);
      return result;

    } catch (error) {
      this.logger.error(`Enhanced accessibility assessment failed for DPR: ${dprId}`, error);
      throw new Error(`Enhanced accessibility assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced infrastructure availability analysis
   */
  private async analyzeInfrastructureAvailability(location: GeographicLocation): Promise<InfrastructureAvailability> {
    this.logger.info('Analyzing infrastructure availability with enhanced algorithms');

    // Road access analysis with detailed assessment
    const roadAccess = await this.assessRoadAccess(location);
    
    // Railway connectivity analysis
    const railwayAccess = await this.assessRailwayAccess(location);
    
    // Airport connectivity analysis
    const airportAccess = await this.assessAirportAccess(location);
    
    // Port connectivity analysis (relevant for coastal areas)
    const portAccess = await this.assessPortAccess(location);

    return {
      roadAccess,
      railwayAccess,
      airportAccess,
      portAccess
    };
  }

  /**
   * Assess road access with detailed analysis
   */
  private async assessRoadAccess(location: GeographicLocation): Promise<{
    available: boolean;
    roadType: 'HIGHWAY' | 'STATE_ROAD' | 'DISTRICT_ROAD' | 'VILLAGE_ROAD' | 'NO_ROAD';
    distanceKm: number;
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  }> {
    // Simulate road network analysis
    // In production, this would query actual road network databases
    
    const roadNetworkDensity = this.getRoadNetworkDensity(location);
    const terrainFactor = this.getTerrainAccessibilityFactor(location);
    
    // Determine road availability based on location characteristics
    const roadAvailable = roadNetworkDensity > 0.3;
    
    let roadType: 'HIGHWAY' | 'STATE_ROAD' | 'DISTRICT_ROAD' | 'VILLAGE_ROAD' | 'NO_ROAD';
    let distanceKm: number;
    let condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

    if (!roadAvailable) {
      roadType = 'NO_ROAD';
      distanceKm = Math.random() * 20 + 5; // 5-25 km to nearest road
      condition = 'POOR';
    } else {
      // Determine road type based on location and network density
      if (roadNetworkDensity > 0.8) {
        roadType = Math.random() > 0.7 ? 'HIGHWAY' : 'STATE_ROAD';
        distanceKm = Math.random() * 2; // 0-2 km
        condition = Math.random() > 0.3 ? 'GOOD' : 'EXCELLENT';
      } else if (roadNetworkDensity > 0.5) {
        roadType = Math.random() > 0.5 ? 'STATE_ROAD' : 'DISTRICT_ROAD';
        distanceKm = Math.random() * 5; // 0-5 km
        condition = Math.random() > 0.4 ? 'FAIR' : 'GOOD';
      } else {
        roadType = Math.random() > 0.6 ? 'DISTRICT_ROAD' : 'VILLAGE_ROAD';
        distanceKm = Math.random() * 8; // 0-8 km
        condition = Math.random() > 0.5 ? 'POOR' : 'FAIR';
      }
    }

    // Adjust condition based on terrain
    if (terrainFactor < 0.5) {
      condition = this.degradeRoadCondition(condition);
    }

    return {
      available: roadAvailable,
      roadType,
      distanceKm: Math.round(distanceKm * 10) / 10,
      condition
    };
  }

  /**
   * Assess railway access
   */
  private async assessRailwayAccess(location: GeographicLocation): Promise<{
    available: boolean;
    nearestStationKm?: number;
    stationName?: string;
  }> {
    // Railway network is less dense in Northeast India
    const railwayDensity = this.getRailwayDensity(location);
    const available = railwayDensity > 0.2;

    if (available) {
      return {
        available: true,
        nearestStationKm: Math.random() * 30 + 5, // 5-35 km
        stationName: this.generateStationName(location)
      };
    }

    return {
      available: false,
      nearestStationKm: Math.random() * 100 + 50, // 50-150 km
      stationName: 'Nearest Railway Station'
    };
  }

  /**
   * Assess airport access
   */
  private async assessAirportAccess(location: GeographicLocation): Promise<{
    available: boolean;
    nearestAirportKm?: number;
    airportName?: string;
    airportType?: 'INTERNATIONAL' | 'DOMESTIC' | 'REGIONAL';
  }> {
    // Airport availability is limited in Northeast India
    const airportProximity = this.getAirportProximity(location);
    const available = airportProximity.distance < 200;

    return {
      available,
      nearestAirportKm: airportProximity.distance,
      airportName: airportProximity.name,
      airportType: airportProximity.type
    };
  }

  /**
   * Assess port access
   */
  private async assessPortAccess(location: GeographicLocation): Promise<{
    available: boolean;
    nearestPortKm?: number;
    portName?: string;
    portType?: 'MAJOR' | 'MINOR' | 'FISHING';
  }> {
    // Port access mainly relevant for coastal states
    const isCoastalRegion = this.isCoastalRegion(location);
    
    if (isCoastalRegion) {
      return {
        available: true,
        nearestPortKm: Math.random() * 100 + 20, // 20-120 km
        portName: 'Regional Port',
        portType: Math.random() > 0.7 ? 'MAJOR' : 'MINOR'
      };
    }

    return {
      available: false,
      nearestPortKm: Math.random() * 300 + 200, // 200-500 km
      portName: 'Nearest Port',
      portType: 'MAJOR'
    };
  }

  /**
   * Enhanced transport connectivity analysis
   */
  private async analyzeTransportConnectivity(location: GeographicLocation): Promise<TransportConnectivity> {
    const roadDensity = this.getRoadNetworkDensity(location);
    const terrainFactor = this.getTerrainAccessibilityFactor(location);
    const populationDensity = this.getPopulationDensity(location);

    // Calculate overall transport score
    const baseScore = (roadDensity * 40) + (terrainFactor * 30) + (populationDensity * 30);
    const overallScore = Math.min(100, Math.max(0, baseScore));

    // Determine public transport availability
    const publicTransport = populationDensity > 0.4 && roadDensity > 0.3;

    // Assess last mile connectivity
    let lastMileConnectivity: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    if (overallScore > 80) lastMileConnectivity = 'EXCELLENT';
    else if (overallScore > 60) lastMileConnectivity = 'GOOD';
    else if (overallScore > 40) lastMileConnectivity = 'FAIR';
    else lastMileConnectivity = 'POOR';

    // Assess seasonal accessibility (important for Northeast India)
    const seasonalAccessibility = this.assessSeasonalAccessibility(location, terrainFactor);

    // Determine logistics complexity
    let logisticsComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    if (overallScore > 70 && seasonalAccessibility === 'YEAR_ROUND') {
      logisticsComplexity = 'LOW';
    } else if (overallScore > 50) {
      logisticsComplexity = 'MEDIUM';
    } else {
      logisticsComplexity = 'HIGH';
    }

    return {
      overallScore: Math.round(overallScore),
      publicTransport,
      lastMileConnectivity,
      seasonalAccessibility,
      logisticsComplexity
    };
  }

  /**
   * Enhanced utility availability analysis
   */
  private async analyzeUtilityAvailability(location: GeographicLocation): Promise<UtilityAvailability> {
    const populationDensity = this.getPopulationDensity(location);
    const developmentIndex = this.getDevelopmentIndex(location);

    // Electricity analysis
    const electricity = await this.assessElectricityAvailability(location, populationDensity, developmentIndex);
    
    // Water supply analysis
    const water = await this.assessWaterAvailability(location, populationDensity);
    
    // Telecommunications analysis
    const telecommunications = await this.assessTelecommunications(location, populationDensity);
    
    // Waste management analysis
    const wasteManagement = await this.assessWasteManagement(location, populationDensity);

    return {
      electricity,
      water,
      telecommunications,
      wasteManagement
    };
  }

  /**
   * Assess electricity availability
   */
  private async assessElectricityAvailability(
    _location: GeographicLocation,
    populationDensity: number,
    developmentIndex: number
  ): Promise<{
    available: boolean;
    reliability: 'HIGH' | 'MEDIUM' | 'LOW';
    gridConnection: boolean;
    powerOutageHours?: number;
  }> {
    const available = populationDensity > 0.1 || developmentIndex > 0.3;
    const gridConnection = available && (populationDensity > 0.2 || developmentIndex > 0.4);
    
    let reliability: 'HIGH' | 'MEDIUM' | 'LOW';
    let powerOutageHours: number;

    if (developmentIndex > 0.7) {
      reliability = 'HIGH';
      powerOutageHours = Math.random() * 2; // 0-2 hours
    } else if (developmentIndex > 0.4) {
      reliability = 'MEDIUM';
      powerOutageHours = Math.random() * 6 + 2; // 2-8 hours
    } else {
      reliability = 'LOW';
      powerOutageHours = Math.random() * 8 + 4; // 4-12 hours
    }

    return {
      available,
      reliability,
      gridConnection,
      powerOutageHours: available ? Math.round(powerOutageHours) : undefined
    };
  }

  /**
   * Assess water availability
   */
  private async assessWaterAvailability(
    _location: GeographicLocation,
    populationDensity: number
  ): Promise<{
    available: boolean;
    source: 'MUNICIPAL' | 'GROUNDWATER' | 'SURFACE_WATER' | 'TANKER' | 'NONE';
    quality: 'POTABLE' | 'TREATABLE' | 'POOR';
    reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  }> {
    const available = populationDensity > 0.05; // Water available in most areas
    
    let source: 'MUNICIPAL' | 'GROUNDWATER' | 'SURFACE_WATER' | 'TANKER' | 'NONE';
    let quality: 'POTABLE' | 'TREATABLE' | 'POOR';
    let reliability: 'HIGH' | 'MEDIUM' | 'LOW';

    if (!available) {
      source = 'NONE';
      quality = 'POOR';
      reliability = 'LOW';
    } else if (populationDensity > 0.5) {
      source = 'MUNICIPAL';
      quality = Math.random() > 0.3 ? 'POTABLE' : 'TREATABLE';
      reliability = 'HIGH';
    } else if (populationDensity > 0.2) {
      source = Math.random() > 0.5 ? 'GROUNDWATER' : 'SURFACE_WATER';
      quality = Math.random() > 0.4 ? 'TREATABLE' : 'POTABLE';
      reliability = 'MEDIUM';
    } else {
      source = Math.random() > 0.6 ? 'GROUNDWATER' : 'SURFACE_WATER';
      quality = Math.random() > 0.5 ? 'TREATABLE' : 'POOR';
      reliability = Math.random() > 0.4 ? 'MEDIUM' : 'LOW';
    }

    return { available, source, quality, reliability };
  }

  /**
   * Assess telecommunications
   */
  private async assessTelecommunications(
    _location: GeographicLocation,
    populationDensity: number
  ): Promise<{
    mobileNetwork: boolean;
    internetConnectivity: boolean;
    broadbandAvailable: boolean;
    networkStrength: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  }> {
    const mobileNetwork = populationDensity > 0.05; // Mobile coverage is widespread
    const internetConnectivity = populationDensity > 0.1;
    const broadbandAvailable = populationDensity > 0.3;

    let networkStrength: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    if (populationDensity > 0.6) networkStrength = 'EXCELLENT';
    else if (populationDensity > 0.3) networkStrength = 'GOOD';
    else if (populationDensity > 0.1) networkStrength = 'FAIR';
    else networkStrength = 'POOR';

    return {
      mobileNetwork,
      internetConnectivity,
      broadbandAvailable,
      networkStrength
    };
  }

  /**
   * Assess waste management
   */
  private async assessWasteManagement(
    _location: GeographicLocation,
    populationDensity: number
  ): Promise<{
    solidWasteCollection: boolean;
    sewageSystem: boolean;
    treatmentFacility: boolean;
  }> {
    const solidWasteCollection = populationDensity > 0.4;
    const sewageSystem = populationDensity > 0.5;
    const treatmentFacility = populationDensity > 0.6;

    return {
      solidWasteCollection,
      sewageSystem,
      treatmentFacility
    };
  }

  /**
   * Enhanced terrain analysis
   */
  private async analyzeTerrainAndEnvironment(location: GeographicLocation): Promise<TerrainAnalysis> {
    // Simulate terrain analysis - would use actual elevation and geological data
    const elevation = this.getElevation(location);
    const slope = this.getSlope(location);
    const terrainType = this.getTerrainType(location, elevation);
    const soilType = this.getSoilType(location);
    const drainagePattern = this.getDrainagePattern(location, slope);
    const floodRisk = this.getFloodRisk(location);
    const landslideRisk = this.getLandslideRisk(location, slope);
    const seismicZone = this.getSeismicZone(location);

    return {
      elevation,
      slope,
      terrainType,
      soilType,
      drainagePattern,
      floodRisk,
      landslideRisk,
      seismicZone
    };
  }

  /**
   * Analyze weather risks
   */
  private async analyzeWeatherRisks(location: GeographicLocation): Promise<WeatherRisk[]> {
    const risks: WeatherRisk[] = [];

    // Monsoon risk (universal in Northeast India)
    risks.push({
      riskType: 'MONSOON',
      severity: 'HIGH',
      seasonalPattern: 'June to September',
      impactOnConstruction: 'Significant delays during monsoon season, flooding risk',
      mitigationMeasures: [
        'Schedule critical work outside monsoon period',
        'Ensure proper drainage systems',
        'Use weather-resistant materials',
        'Maintain emergency response protocols'
      ]
    });

    // Cyclone risk (mainly for coastal areas)
    if (this.isCoastalRegion(location)) {
      risks.push({
        riskType: 'CYCLONE',
        severity: 'MEDIUM',
        seasonalPattern: 'May to November',
        impactOnConstruction: 'Potential structural damage and work stoppage',
        mitigationMeasures: [
          'Cyclone-resistant construction design',
          'Early warning systems',
          'Temporary structure reinforcement'
        ]
      });
    }

    // Extreme temperature risk
    risks.push({
      riskType: 'EXTREME_TEMPERATURE',
      severity: 'MEDIUM',
      seasonalPattern: 'April to May',
      impactOnConstruction: 'Reduced working hours, worker safety concerns',
      mitigationMeasures: [
        'Adjust working hours to avoid peak heat',
        'Provide adequate hydration and cooling',
        'Use heat-resistant equipment'
      ]
    });

    // Fog risk (common in hilly areas)
    if (this.getElevation(location) > 500) {
      risks.push({
        riskType: 'FOG',
        severity: 'LOW',
        seasonalPattern: 'December to February',
        impactOnConstruction: 'Reduced visibility affecting transport and operations',
        mitigationMeasures: [
          'Enhanced lighting systems',
          'Adjusted transport schedules',
          'Safety protocols for low visibility'
        ]
      });
    }

    return risks;
  }

  /**
   * Calculate enhanced accessibility score
   */
  private async calculateEnhancedAccessibilityScore(
    infrastructure: InfrastructureAvailability,
    transport: TransportConnectivity,
    utilities: UtilityAvailability,
    terrain: TerrainAnalysis,
    _location: GeographicLocation
  ): Promise<number> {
    let score = 0;

    // Infrastructure score (35% weight) - Enhanced weighting
    let infraScore = 0;
    
    // Road access (most important)
    if (infrastructure.roadAccess.available) {
      const roadScore = this.getRoadScore(infrastructure.roadAccess.roadType, infrastructure.roadAccess.condition);
      infraScore += roadScore * 0.6; // 60% of infrastructure score
    }
    
    // Railway access
    if (infrastructure.railwayAccess.available) {
      const railwayScore = Math.max(0, 100 - (infrastructure.railwayAccess.nearestStationKm || 0) * 2);
      infraScore += railwayScore * 0.2; // 20% of infrastructure score
    }
    
    // Airport access
    if (infrastructure.airportAccess.available) {
      const airportScore = Math.max(0, 100 - (infrastructure.airportAccess.nearestAirportKm || 0) * 0.5);
      infraScore += airportScore * 0.15; // 15% of infrastructure score
    }
    
    // Port access (if relevant)
    if (infrastructure.portAccess.available) {
      const portScore = Math.max(0, 100 - (infrastructure.portAccess.nearestPortKm || 0) * 0.8);
      infraScore += portScore * 0.05; // 5% of infrastructure score
    }
    
    score += (infraScore * 0.35);

    // Transport connectivity (25% weight)
    score += (transport.overallScore * 0.25);

    // Utilities (25% weight) - Enhanced calculation
    let utilityScore = 0;
    
    // Electricity (most critical)
    if (utilities.electricity.available) {
      const electricityScore = this.getElectricityScore(utilities.electricity.reliability);
      utilityScore += electricityScore * 0.4; // 40% of utility score
    }
    
    // Water availability
    if (utilities.water.available) {
      const waterScore = this.getWaterScore(utilities.water.source, utilities.water.quality, utilities.water.reliability);
      utilityScore += waterScore * 0.3; // 30% of utility score
    }
    
    // Telecommunications
    const telecomScore = this.getTelecomScore(utilities.telecommunications);
    utilityScore += telecomScore * 0.2; // 20% of utility score
    
    // Waste management
    const wasteScore = this.getWasteManagementScore(utilities.wasteManagement);
    utilityScore += wasteScore * 0.1; // 10% of utility score
    
    score += (utilityScore * 0.25);

    // Terrain factors (15% weight) - Enhanced calculation
    let terrainScore = 100;
    
    // Slope penalty
    if (terrain.slope > 30) terrainScore -= 40;
    else if (terrain.slope > 15) terrainScore -= 20;
    else if (terrain.slope > 8) terrainScore -= 10;
    
    // Risk penalties
    if (terrain.floodRisk === 'HIGH') terrainScore -= 25;
    else if (terrain.floodRisk === 'MEDIUM') terrainScore -= 15;
    
    if (terrain.landslideRisk === 'HIGH') terrainScore -= 25;
    else if (terrain.landslideRisk === 'MEDIUM') terrainScore -= 15;
    
    // Drainage bonus/penalty
    if (terrain.drainagePattern === 'GOOD') terrainScore += 5;
    else if (terrain.drainagePattern === 'POOR') terrainScore -= 10;
    
    score += (Math.max(0, terrainScore) * 0.15);

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  // Helper methods for scoring calculations
  private getRoadScore(roadType: string, condition: string): number {
    let typeScore = 0;
    switch (roadType) {
      case 'HIGHWAY': typeScore = 100; break;
      case 'STATE_ROAD': typeScore = 80; break;
      case 'DISTRICT_ROAD': typeScore = 60; break;
      case 'VILLAGE_ROAD': typeScore = 40; break;
      case 'NO_ROAD': typeScore = 0; break;
    }

    let conditionMultiplier = 1;
    switch (condition) {
      case 'EXCELLENT': conditionMultiplier = 1.0; break;
      case 'GOOD': conditionMultiplier = 0.8; break;
      case 'FAIR': conditionMultiplier = 0.6; break;
      case 'POOR': conditionMultiplier = 0.4; break;
    }

    return typeScore * conditionMultiplier;
  }

  private getElectricityScore(reliability: string): number {
    switch (reliability) {
      case 'HIGH': return 100;
      case 'MEDIUM': return 70;
      case 'LOW': return 40;
      default: return 0;
    }
  }

  private getWaterScore(source: string, quality: string, reliability: string): number {
    let sourceScore = 0;
    switch (source) {
      case 'MUNICIPAL': sourceScore = 100; break;
      case 'GROUNDWATER': sourceScore = 80; break;
      case 'SURFACE_WATER': sourceScore = 70; break;
      case 'TANKER': sourceScore = 50; break;
      case 'NONE': sourceScore = 0; break;
    }

    let qualityMultiplier = 1;
    switch (quality) {
      case 'POTABLE': qualityMultiplier = 1.0; break;
      case 'TREATABLE': qualityMultiplier = 0.8; break;
      case 'POOR': qualityMultiplier = 0.5; break;
    }

    let reliabilityMultiplier = 1;
    switch (reliability) {
      case 'HIGH': reliabilityMultiplier = 1.0; break;
      case 'MEDIUM': reliabilityMultiplier = 0.8; break;
      case 'LOW': reliabilityMultiplier = 0.6; break;
    }

    return sourceScore * qualityMultiplier * reliabilityMultiplier;
  }

  private getTelecomScore(telecom: any): number {
    let score = 0;
    if (telecom.mobileNetwork) score += 40;
    if (telecom.internetConnectivity) score += 30;
    if (telecom.broadbandAvailable) score += 20;
    
    switch (telecom.networkStrength) {
      case 'EXCELLENT': score += 10; break;
      case 'GOOD': score += 7; break;
      case 'FAIR': score += 4; break;
      case 'POOR': score += 0; break;
    }

    return score;
  }

  private getWasteManagementScore(waste: any): number {
    let score = 0;
    if (waste.solidWasteCollection) score += 40;
    if (waste.sewageSystem) score += 35;
    if (waste.treatmentFacility) score += 25;
    return score;
  }

  // Location-based helper methods
  private getRoadNetworkDensity(location: GeographicLocation): number {
    // Simulate road network density based on state and coordinates
    const stateDensity = this.getStateDevelopmentIndex(location.state);
    const randomFactor = Math.random() * 0.3; // Add some randomness
    return Math.min(1, stateDensity + randomFactor);
  }

  private getRailwayDensity(location: GeographicLocation): number {
    const stateName = location.state?.toLowerCase();
    if (stateName?.includes('assam')) return 0.6;
    if (stateName?.includes('tripura')) return 0.4;
    if (stateName?.includes('west bengal')) return 0.8;
    return 0.2; // Lower railway density in most Northeast states
  }

  private getTerrainAccessibilityFactor(location: GeographicLocation): number {
    const elevation = this.getElevation(location);
    const slope = this.getSlope(location);
    
    let factor = 1.0;
    if (elevation > 2000) factor -= 0.4;
    else if (elevation > 1000) factor -= 0.2;
    
    if (slope > 20) factor -= 0.3;
    else if (slope > 10) factor -= 0.1;
    
    return Math.max(0.1, factor);
  }

  private getPopulationDensity(location: GeographicLocation): number {
    // Simulate population density - would use actual census data
    const stateDensity = this.getStateDevelopmentIndex(location.state);
    return Math.random() * stateDensity;
  }

  private getDevelopmentIndex(location: GeographicLocation): number {
    return this.getStateDevelopmentIndex(location.state);
  }

  private getStateDevelopmentIndex(state?: string): number {
    if (!state) return 0.4;
    
    const stateName = state.toLowerCase();
    if (stateName.includes('assam')) return 0.6;
    if (stateName.includes('tripura')) return 0.5;
    if (stateName.includes('manipur')) return 0.5;
    if (stateName.includes('sikkim')) return 0.7;
    if (stateName.includes('meghalaya')) return 0.4;
    if (stateName.includes('nagaland')) return 0.4;
    if (stateName.includes('mizoram')) return 0.5;
    if (stateName.includes('arunachal')) return 0.3;
    
    return 0.4; // Default
  }

  private getAirportProximity(location: GeographicLocation): {
    distance: number;
    name: string;
    type: 'INTERNATIONAL' | 'DOMESTIC' | 'REGIONAL';
  } {
    const stateName = location.state?.toLowerCase();
    
    if (stateName?.includes('assam')) {
      return {
        distance: Math.random() * 100 + 20,
        name: 'Lokpriya Gopinath Bordoloi International Airport',
        type: 'INTERNATIONAL'
      };
    }
    
    return {
      distance: Math.random() * 200 + 100,
      name: 'Regional Airport',
      type: 'DOMESTIC'
    };
  }

  private isCoastalRegion(location: GeographicLocation): boolean {
    const coastalStates = ['west bengal', 'odisha'];
    return coastalStates.some(state => 
      location.state?.toLowerCase().includes(state)
    );
  }

  private assessSeasonalAccessibility(
    _location: GeographicLocation,
    terrainFactor: number
  ): 'YEAR_ROUND' | 'SEASONAL' | 'LIMITED' {
    if (terrainFactor > 0.8) return 'YEAR_ROUND';
    if (terrainFactor > 0.5) return 'SEASONAL';
    return 'LIMITED';
  }

  private degradeRoadCondition(condition: string): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    switch (condition) {
      case 'EXCELLENT': return 'GOOD';
      case 'GOOD': return 'FAIR';
      case 'FAIR': return 'POOR';
      case 'POOR': return 'POOR';
      default: return 'POOR';
    }
  }

  private generateStationName(_location: GeographicLocation): string {
    const stationNames = [
      'Junction Railway Station',
      'Central Railway Station',
      'Town Railway Station',
      'Regional Railway Station'
    ];
    return stationNames[Math.floor(Math.random() * stationNames.length)];
  }

  // Terrain analysis helper methods
  private getElevation(_location: GeographicLocation): number {
    // Simulate elevation based on Northeast India geography
    return Math.random() * 2000 + 50; // 50-2050 meters
  }

  private getSlope(location: GeographicLocation): number {
    const elevation = this.getElevation(location);
    // Higher elevation areas tend to have steeper slopes
    return Math.random() * (elevation > 1000 ? 30 : 15);
  }

  private getTerrainType(location: GeographicLocation, elevation: number): 'PLAIN' | 'HILLY' | 'MOUNTAINOUS' | 'COASTAL' | 'RIVERINE' {
    if (this.isCoastalRegion(location)) return 'COASTAL';
    if (elevation > 1500) return 'MOUNTAINOUS';
    if (elevation > 500) return 'HILLY';
    return Math.random() > 0.5 ? 'PLAIN' : 'RIVERINE';
  }

  private getSoilType(_location: GeographicLocation): string {
    const soilTypes = ['Alluvial', 'Red Laterite', 'Hill Soil', 'Forest Soil', 'Riverine'];
    return soilTypes[Math.floor(Math.random() * soilTypes.length)];
  }

  private getDrainagePattern(_location: GeographicLocation, slope: number): 'GOOD' | 'MODERATE' | 'POOR' {
    if (slope > 15) return 'GOOD';
    if (slope > 5) return 'MODERATE';
    return 'POOR';
  }

  private getFloodRisk(location: GeographicLocation): 'LOW' | 'MEDIUM' | 'HIGH' {
    const stateName = location.state?.toLowerCase();
    if (stateName?.includes('assam')) return Math.random() > 0.4 ? 'HIGH' : 'MEDIUM';
    if (stateName?.includes('west bengal')) return Math.random() > 0.5 ? 'HIGH' : 'MEDIUM';
    return Math.random() > 0.7 ? 'MEDIUM' : 'LOW';
  }

  private getLandslideRisk(_location: GeographicLocation, slope: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (slope > 25) return 'HIGH';
    if (slope > 15) return 'MEDIUM';
    return 'LOW';
  }

  private getSeismicZone(_location: GeographicLocation): number {
    // Northeast India is in high seismic zones (4-5)
    return Math.random() > 0.5 ? 5 : 4;
  }
}