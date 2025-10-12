import {
  LocationVerificationRequest,
  GeospatialVerificationResult,
  LocationVerificationResult,
  SiteFeasibilityResult,
  MapVisualizationData
} from '@dpr-system/shared';
import { GeospatialVerificationService } from './geospatialVerificationService.js';
import { SiteFeasibilityService } from './siteFeasibilityService.js';
import { MapVisualizationService } from './mapVisualizationService.js';

export class GeospatialService {
  private geospatialVerificationService: GeospatialVerificationService;
  private siteFeasibilityService: SiteFeasibilityService;
  private mapVisualizationService: MapVisualizationService;
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
    this.geospatialVerificationService = new GeospatialVerificationService(logger);
    this.siteFeasibilityService = new SiteFeasibilityService(logger);
    this.mapVisualizationService = new MapVisualizationService(logger);
  }

  /**
   * Perform comprehensive geospatial verification and analysis
   */
  async performGeospatialVerification(request: LocationVerificationRequest): Promise<GeospatialVerificationResult> {
    try {
      this.logger.info(`Starting comprehensive geospatial verification for DPR: ${request.dprId}`);

      // Step 1: Verify and geocode location
      const locationVerification = await this.geospatialVerificationService.verifyLocation(request);

      // Step 2: Analyze site accessibility
      const accessibilityAnalysis = await this.geospatialVerificationService.analyzeSiteAccessibility(
        request.dprId,
        locationVerification.verifiedLocation
      );

      // Step 3: Analyze site feasibility
      const siteFeasibility = await this.siteFeasibilityService.analyzeSiteFeasibility(
        request.dprId,
        locationVerification.verifiedLocation,
        accessibilityAnalysis
      );

      // Step 4: Generate map visualization
      const mapVisualization = await this.mapVisualizationService.generateMapVisualization(
        request.dprId,
        locationVerification,
        accessibilityAnalysis,
        siteFeasibility.environmentalConstraints
      );

      // Step 5: Determine overall verification status
      const overallVerificationStatus = this.determineOverallVerificationStatus(
        locationVerification,
        siteFeasibility
      );

      // Step 6: Generate verification summary
      const verificationSummary = this.generateVerificationSummary(
        locationVerification,
        siteFeasibility
      );

      const result: GeospatialVerificationResult = {
        dprId: request.dprId,
        locationVerification,
        siteFeasibility,
        mapVisualization,
        overallVerificationStatus,
        verificationSummary,
        analysisTimestamp: new Date()
      };

      this.logger.info(`Geospatial verification completed for DPR: ${request.dprId}, Status: ${overallVerificationStatus}`);
      return result;

    } catch (error) {
      this.logger.error(`Geospatial verification failed for DPR: ${request.dprId}`, error);
      throw new Error(`Geospatial verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify location only (lightweight operation)
   */
  async verifyLocationOnly(request: LocationVerificationRequest): Promise<LocationVerificationResult> {
    return await this.geospatialVerificationService.verifyLocation(request);
  }

  /**
   * Analyze site accessibility only
   */
  async analyzeSiteAccessibilityOnly(dprId: string, location: any) {
    return await this.geospatialVerificationService.analyzeSiteAccessibility(dprId, location);
  }

  /**
   * Generate map visualization only
   */
  async generateMapVisualizationOnly(
    dprId: string,
    locationVerification: LocationVerificationResult,
    accessibilityAnalysis: any,
    environmentalConstraints: any[]
  ): Promise<MapVisualizationData> {
    return await this.mapVisualizationService.generateMapVisualization(
      dprId,
      locationVerification,
      accessibilityAnalysis,
      environmentalConstraints
    );
  }

  /**
   * Determine overall verification status
   */
  private determineOverallVerificationStatus(
    locationVerification: LocationVerificationResult,
    siteFeasibility: SiteFeasibilityResult
  ): 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED' | 'NEEDS_REVIEW' {
    // If location verification failed, overall status is failed
    if (locationVerification.verificationStatus === 'FAILED') {
      return 'FAILED';
    }

    // If site is unsuitable, overall status is failed
    if (siteFeasibility.feasibilityRating === 'UNSUITABLE') {
      return 'FAILED';
    }

    // Check for critical environmental constraints
    const criticalConstraints = siteFeasibility.environmentalConstraints.filter(
      c => c.severity === 'CRITICAL'
    );
    if (criticalConstraints.length > 0) {
      return 'NEEDS_REVIEW';
    }

    // Check for poor feasibility
    if (siteFeasibility.feasibilityRating === 'POOR') {
      return 'NEEDS_REVIEW';
    }

    // Check for location verification issues
    if (locationVerification.verificationStatus === 'NEEDS_REVIEW') {
      return 'NEEDS_REVIEW';
    }

    // Check for warnings
    const hasWarnings = (
      (locationVerification.warnings && locationVerification.warnings.length > 0) ||
      siteFeasibility.riskFactors.length > 0 ||
      siteFeasibility.environmentalConstraints.some(c => c.severity === 'HIGH')
    );

    if (hasWarnings) {
      return 'PASSED_WITH_WARNINGS';
    }

    return 'PASSED';
  }

  /**
   * Generate verification summary
   */
  private generateVerificationSummary(
    locationVerification: LocationVerificationResult,
    siteFeasibility: SiteFeasibilityResult
  ): string {
    const summaryParts: string[] = [];

    // Location verification summary
    summaryParts.push(`Location verification: ${locationVerification.verificationStatus.toLowerCase()}`);
    if (locationVerification.accuracy) {
      summaryParts.push(`with ${Math.round(locationVerification.accuracy * 100)}% accuracy`);
    }

    // Site feasibility summary
    summaryParts.push(`Site feasibility: ${siteFeasibility.feasibilityRating.toLowerCase()}`);
    summaryParts.push(`(score: ${siteFeasibility.overallFeasibilityScore}/100)`);

    // Accessibility summary
    summaryParts.push(`Accessibility score: ${siteFeasibility.accessibilityAnalysis.accessibilityScore}/100`);

    // Environmental constraints summary
    if (siteFeasibility.environmentalConstraints.length > 0) {
      const criticalCount = siteFeasibility.environmentalConstraints.filter(c => c.severity === 'CRITICAL').length;
      const highCount = siteFeasibility.environmentalConstraints.filter(c => c.severity === 'HIGH').length;
      
      if (criticalCount > 0) {
        summaryParts.push(`${criticalCount} critical environmental constraint(s)`);
      }
      if (highCount > 0) {
        summaryParts.push(`${highCount} high-severity environmental constraint(s)`);
      }
    }

    // Risk factors summary
    if (siteFeasibility.riskFactors.length > 0) {
      summaryParts.push(`${siteFeasibility.riskFactors.length} risk factor(s) identified`);
    }

    // Recommendations summary
    const highPriorityRecommendations = siteFeasibility.recommendations.filter(r => r.priority === 'HIGH');
    if (highPriorityRecommendations.length > 0) {
      summaryParts.push(`${highPriorityRecommendations.length} high-priority recommendation(s)`);
    }

    return summaryParts.join('. ') + '.';
  }

  /**
   * Get verification status for multiple locations (batch processing)
   */
  async batchVerifyLocations(requests: LocationVerificationRequest[]): Promise<GeospatialVerificationResult[]> {
    const results: GeospatialVerificationResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.performGeospatialVerification(request);
        results.push(result);
      } catch (error) {
        this.logger.error(`Batch verification failed for DPR: ${request.dprId}`, error);
        // Continue with other requests even if one fails
      }
    }

    return results;
  }

  /**
   * Update location verification with manual corrections
   */
  async updateLocationVerification(
    dprId: string,
    correctedLocation: any,
    verificationNotes?: string
  ): Promise<LocationVerificationResult> {
    this.logger.info(`Updating location verification for DPR: ${dprId} with manual corrections`);

    const request: LocationVerificationRequest = {
      dprId,
      coordinates: correctedLocation,
      verificationLevel: 'COMPREHENSIVE'
    };

    const result = await this.geospatialVerificationService.verifyLocation(request);
    
    // Add manual verification notes
    if (verificationNotes) {
      result.warnings = result.warnings || [];
      result.warnings.push(`Manual verification: ${verificationNotes}`);
    }

    return result;
  }
}