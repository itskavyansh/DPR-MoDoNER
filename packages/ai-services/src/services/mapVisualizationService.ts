import {
  GeographicLocation,
  MapVisualizationData,
  MapMarker,
  MapOverlay,
  SiteAccessibilityAnalysis,
  EnvironmentalConstraint,
  LocationVerificationResult
} from '@dpr-system/shared';

export class MapVisualizationService {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  /**
   * Generate map visualization data for the project site
   */
  async generateMapVisualization(
    dprId: string,
    locationVerification: LocationVerificationResult,
    accessibilityAnalysis: SiteAccessibilityAnalysis,
    environmentalConstraints: EnvironmentalConstraint[]
  ): Promise<MapVisualizationData> {
    try {
      this.logger.info(`Generating map visualization for DPR: ${dprId}`);

      const centerCoordinates = locationVerification.verifiedLocation;
      
      // Generate markers for various points of interest
      const markers = await this.generateMapMarkers(
        centerCoordinates,
        accessibilityAnalysis,
        environmentalConstraints
      );

      // Generate overlays for areas and zones
      const overlays = await this.generateMapOverlays(
        centerCoordinates,
        accessibilityAnalysis,
        environmentalConstraints
      );

      // Calculate appropriate zoom level based on site characteristics
      const zoomLevel = this.calculateOptimalZoomLevel(accessibilityAnalysis);

      // Calculate bounding box to include all relevant features
      const boundingBox = this.calculateBoundingBox(centerCoordinates, markers);

      const mapVisualization: MapVisualizationData = {
        centerCoordinates,
        zoomLevel,
        markers,
        overlays,
        boundingBox
      };

      this.logger.info(`Map visualization generated for DPR: ${dprId} with ${markers.length} markers and ${overlays.length} overlays`);
      return mapVisualization;

    } catch (error) {
      this.logger.error(`Map visualization generation failed for DPR: ${dprId}`, error);
      throw new Error(`Map visualization generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate map markers for points of interest
   */
  private async generateMapMarkers(
    centerLocation: GeographicLocation,
    accessibilityAnalysis: SiteAccessibilityAnalysis,
    environmentalConstraints: EnvironmentalConstraint[]
  ): Promise<MapMarker[]> {
    const markers: MapMarker[] = [];

    // Main project site marker
    markers.push({
      id: 'project-site',
      coordinates: centerLocation,
      type: 'PROJECT_SITE',
      title: 'Project Site',
      description: `Proposed project location at ${centerLocation.address || 'specified coordinates'}`,
      icon: 'project-site',
      color: '#FF6B35',
      clickable: true,
      infoWindow: this.generateProjectSiteInfoWindow(centerLocation, accessibilityAnalysis)
    });

    // Infrastructure markers
    if (accessibilityAnalysis.infrastructureAvailability.railwayAccess.available) {
      const railwayLocation = this.calculateNearbyLocation(
        centerLocation,
        accessibilityAnalysis.infrastructureAvailability.railwayAccess.nearestStationKm || 0,
        45 // degrees
      );
      
      markers.push({
        id: 'railway-station',
        coordinates: railwayLocation,
        type: 'INFRASTRUCTURE',
        title: accessibilityAnalysis.infrastructureAvailability.railwayAccess.stationName || 'Railway Station',
        description: `Distance: ${accessibilityAnalysis.infrastructureAvailability.railwayAccess.nearestStationKm}km`,
        icon: 'railway',
        color: '#4CAF50',
        clickable: true,
        infoWindow: 'Railway connectivity available for material transportation'
      });
    }

    if (accessibilityAnalysis.infrastructureAvailability.airportAccess.available) {
      const airportLocation = this.calculateNearbyLocation(
        centerLocation,
        accessibilityAnalysis.infrastructureAvailability.airportAccess.nearestAirportKm || 0,
        135 // degrees
      );
      
      markers.push({
        id: 'airport',
        coordinates: airportLocation,
        type: 'INFRASTRUCTURE',
        title: accessibilityAnalysis.infrastructureAvailability.airportAccess.airportName || 'Airport',
        description: `Distance: ${accessibilityAnalysis.infrastructureAvailability.airportAccess.nearestAirportKm}km`,
        icon: 'airport',
        color: '#2196F3',
        clickable: true,
        infoWindow: `${accessibilityAnalysis.infrastructureAvailability.airportAccess.airportType} airport for personnel and equipment transport`
      });
    }

    // Environmental constraint markers
    environmentalConstraints.forEach((constraint, index) => {
      const constraintLocation = this.calculateNearbyLocation(
        centerLocation,
        2 + index, // Vary distance
        90 + (index * 60) // Vary direction
      );

      markers.push({
        id: `constraint-${index}`,
        coordinates: constraintLocation,
        type: 'CONSTRAINT',
        title: this.getConstraintTitle(constraint.constraintType),
        description: constraint.description,
        icon: this.getConstraintIcon(constraint.constraintType),
        color: this.getConstraintColor(constraint.severity),
        clickable: true,
        infoWindow: this.generateConstraintInfoWindow(constraint)
      });
    });

    // Reference points for accessibility
    if (accessibilityAnalysis.infrastructureAvailability.roadAccess.available) {
      const roadAccessPoint = this.calculateNearbyLocation(
        centerLocation,
        accessibilityAnalysis.infrastructureAvailability.roadAccess.distanceKm,
        0 // North
      );

      markers.push({
        id: 'road-access',
        coordinates: roadAccessPoint,
        type: 'REFERENCE_POINT',
        title: 'Road Access Point',
        description: `${accessibilityAnalysis.infrastructureAvailability.roadAccess.roadType} - ${accessibilityAnalysis.infrastructureAvailability.roadAccess.condition}`,
        icon: 'road',
        color: '#FF9800',
        clickable: true,
        infoWindow: `Road access via ${accessibilityAnalysis.infrastructureAvailability.roadAccess.roadType}`
      });
    }

    return markers;
  }

  /**
   * Generate map overlays for areas and zones
   */
  private async generateMapOverlays(
    centerLocation: GeographicLocation,
    accessibilityAnalysis: SiteAccessibilityAnalysis,
    environmentalConstraints: EnvironmentalConstraint[]
  ): Promise<MapOverlay[]> {
    const overlays: MapOverlay[] = [];

    // Project site boundary (approximate circle)
    overlays.push({
      id: 'project-boundary',
      type: 'CIRCLE',
      coordinates: [centerLocation],
      style: {
        strokeColor: '#FF6B35',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#FF6B35',
        fillOpacity: 0.2
      },
      title: 'Project Site Boundary',
      description: 'Approximate project site area'
    });

    // Accessibility zones
    if (accessibilityAnalysis.accessibilityScore < 50) {
      // Low accessibility zone
      const accessibilityZone = this.generateCircularCoordinates(centerLocation, 5); // 5km radius
      overlays.push({
        id: 'low-accessibility-zone',
        type: 'POLYGON',
        coordinates: accessibilityZone,
        style: {
          strokeColor: '#F44336',
          strokeWeight: 1,
          strokeOpacity: 0.6,
          fillColor: '#F44336',
          fillOpacity: 0.1
        },
        title: 'Low Accessibility Zone',
        description: 'Area with limited infrastructure and connectivity'
      });
    }

    // Environmental constraint zones
    environmentalConstraints.forEach((constraint, index) => {
      if (constraint.constraintType === 'FOREST_CLEARANCE' || constraint.constraintType === 'WILDLIFE_SANCTUARY') {
        const constraintCenter = this.calculateNearbyLocation(
          centerLocation,
          3 + index,
          90 + (index * 60)
        );
        const constraintZone = this.generateCircularCoordinates(constraintCenter, 2);
        
        overlays.push({
          id: `constraint-zone-${index}`,
          type: 'POLYGON',
          coordinates: constraintZone,
          style: {
            strokeColor: this.getConstraintColor(constraint.severity),
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: this.getConstraintColor(constraint.severity),
            fillOpacity: 0.15
          },
          title: `${this.getConstraintTitle(constraint.constraintType)} Zone`,
          description: constraint.description
        });
      }
    });

    // Flood risk overlay if applicable
    if (accessibilityAnalysis.terrainAnalysis.floodRisk === 'HIGH') {
      const floodZone = this.generateCircularCoordinates(centerLocation, 3);
      overlays.push({
        id: 'flood-risk-zone',
        type: 'POLYGON',
        coordinates: floodZone,
        style: {
          strokeColor: '#03A9F4',
          strokeWeight: 2,
          strokeOpacity: 0.7,
          fillColor: '#03A9F4',
          fillOpacity: 0.2
        },
        title: 'High Flood Risk Zone',
        description: 'Area prone to flooding during monsoon season'
      });
    }

    return overlays;
  }

  /**
   * Calculate optimal zoom level based on site characteristics
   */
  private calculateOptimalZoomLevel(accessibilityAnalysis: SiteAccessibilityAnalysis): number {
    // Base zoom level
    let zoomLevel = 12;

    // Adjust based on infrastructure spread
    const maxDistance = Math.max(
      accessibilityAnalysis.infrastructureAvailability.railwayAccess.nearestStationKm || 0,
      accessibilityAnalysis.infrastructureAvailability.airportAccess.nearestAirportKm || 0,
      accessibilityAnalysis.infrastructureAvailability.roadAccess.distanceKm || 0
    );

    if (maxDistance > 50) {
      zoomLevel = 9;
    } else if (maxDistance > 20) {
      zoomLevel = 10;
    } else if (maxDistance > 10) {
      zoomLevel = 11;
    }

    return zoomLevel;
  }

  /**
   * Calculate bounding box to include all markers
   */
  private calculateBoundingBox(
    centerLocation: GeographicLocation,
    markers: MapMarker[]
  ): { northeast: GeographicLocation; southwest: GeographicLocation } {
    let minLat = centerLocation.latitude;
    let maxLat = centerLocation.latitude;
    let minLng = centerLocation.longitude;
    let maxLng = centerLocation.longitude;

    markers.forEach(marker => {
      minLat = Math.min(minLat, marker.coordinates.latitude);
      maxLat = Math.max(maxLat, marker.coordinates.latitude);
      minLng = Math.min(minLng, marker.coordinates.longitude);
      maxLng = Math.max(maxLng, marker.coordinates.longitude);
    });

    // Add padding
    const latPadding = (maxLat - minLat) * 0.1 || 0.01;
    const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

    return {
      northeast: {
        latitude: maxLat + latPadding,
        longitude: maxLng + lngPadding
      },
      southwest: {
        latitude: minLat - latPadding,
        longitude: minLng - lngPadding
      }
    };
  }

  /**
   * Calculate nearby location based on distance and bearing
   */
  private calculateNearbyLocation(
    center: GeographicLocation,
    distanceKm: number,
    bearingDegrees: number
  ): GeographicLocation {
    const R = 6371; // Earth's radius in km
    const lat1 = center.latitude * Math.PI / 180;
    const lng1 = center.longitude * Math.PI / 180;
    const bearing = bearingDegrees * Math.PI / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceKm / R) +
      Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing)
    );

    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
      Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      latitude: lat2 * 180 / Math.PI,
      longitude: lng2 * 180 / Math.PI
    };
  }

  /**
   * Generate circular coordinates for polygon overlay
   */
  private generateCircularCoordinates(center: GeographicLocation, radiusKm: number): GeographicLocation[] {
    const coordinates: GeographicLocation[] = [];
    const points = 16; // Number of points to create circle

    for (let i = 0; i < points; i++) {
      const angle = (i * 360 / points);
      const point = this.calculateNearbyLocation(center, radiusKm, angle);
      coordinates.push(point);
    }

    return coordinates;
  }

  /**
   * Generate info window content for project site
   */
  private generateProjectSiteInfoWindow(
    location: GeographicLocation,
    accessibilityAnalysis: SiteAccessibilityAnalysis
  ): string {
    return `
      <div>
        <h4>Project Site</h4>
        <p><strong>Location:</strong> ${location.address || `${location.latitude}, ${location.longitude}`}</p>
        <p><strong>Accessibility Score:</strong> ${accessibilityAnalysis.accessibilityScore}/100</p>
        <p><strong>Terrain:</strong> ${accessibilityAnalysis.terrainAnalysis.terrainType}</p>
        <p><strong>Elevation:</strong> ${accessibilityAnalysis.terrainAnalysis.elevation}m</p>
      </div>
    `;
  }

  /**
   * Generate info window content for environmental constraints
   */
  private generateConstraintInfoWindow(constraint: EnvironmentalConstraint): string {
    return `
      <div>
        <h4>${this.getConstraintTitle(constraint.constraintType)}</h4>
        <p><strong>Severity:</strong> ${constraint.severity}</p>
        <p><strong>Description:</strong> ${constraint.description}</p>
        <p><strong>Approval Authority:</strong> ${constraint.approvalAuthority}</p>
        <p><strong>Timeline:</strong> ${constraint.estimatedTimelineMonths} months</p>
      </div>
    `;
  }

  /**
   * Get constraint title from type
   */
  private getConstraintTitle(type: string): string {
    const titles: Record<string, string> = {
      'FOREST_CLEARANCE': 'Forest Area',
      'WILDLIFE_SANCTUARY': 'Wildlife Sanctuary',
      'WETLAND': 'Wetland Area',
      'ARCHAEOLOGICAL': 'Archaeological Site',
      'POLLUTION_CONTROL': 'Pollution Control Zone',
      'COASTAL_REGULATION': 'Coastal Regulation Zone'
    };
    return titles[type] || type;
  }

  /**
   * Get constraint icon from type
   */
  private getConstraintIcon(type: string): string {
    const icons: Record<string, string> = {
      'FOREST_CLEARANCE': 'forest',
      'WILDLIFE_SANCTUARY': 'wildlife',
      'WETLAND': 'water',
      'ARCHAEOLOGICAL': 'monument',
      'POLLUTION_CONTROL': 'warning',
      'COASTAL_REGULATION': 'beach'
    };
    return icons[type] || 'warning';
  }

  /**
   * Get constraint color from severity
   */
  private getConstraintColor(severity: string): string {
    const colors: Record<string, string> = {
      'CRITICAL': '#D32F2F',
      'HIGH': '#F57C00',
      'MEDIUM': '#FBC02D',
      'LOW': '#388E3C'
    };
    return colors[severity] || '#757575';
  }
}