// Core types for the DPR Quality Assessment System
export interface DPRDocument {
  id: string;
  originalFileName: string;
  fileType: 'PDF' | 'DOCX' | 'TXT';
  uploadTimestamp: Date;
  fileSize: number;
  language: 'EN' | 'HI' | 'AS';
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedContent?: ExtractedContent;
  metadata?: DocumentMetadata;
}

export interface ExtractedContent {
  sections: DPRSection[];
  entities: ExtractedEntity[];
  rawText: string;
  structuredData: StructuredData;
}

export interface DPRSection {
  type: 'EXECUTIVE_SUMMARY' | 'COST_ESTIMATE' | 'TIMELINE' | 'RESOURCES' | 'TECHNICAL_SPECS';
  content: string;
  confidence: number;
  startPosition: number;
  endPosition: number;
}

export interface ExtractedEntity {
  type: 'MONETARY' | 'DATE' | 'LOCATION' | 'RESOURCE';
  value: string;
  confidence: number;
  position: number;
}

export interface StructuredData {
  totalCost?: number;
  timeline?: string;
  location?: string;
  resources?: string[];
}

export interface DocumentMetadata {
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
}

// Historical project data types for price comparison
export interface HistoricalProject {
  id: string;
  projectName: string;
  projectType: string;
  locationState: string;
  locationDistrict?: string;
  locationCoordinates?: { lat: number; lng: number };
  estimatedCost: number;
  actualCost?: number;
  estimatedDurationMonths: number;
  actualDurationMonths?: number;
  completionStatus: 'COMPLETED' | 'ONGOING' | 'DELAYED' | 'CANCELLED';
  startDate: Date;
  completionDate?: Date;
  ministry?: string;
  implementingAgency?: string;
  schemesUsed: string[];
  riskFactors: string[];
  projectCategory: string;
  inflationYear: number;
  dataSource: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoricalCostItem {
  id: string;
  projectId: string;
  itemCategory: string;
  itemDescription: string;
  unit?: string;
  quantity?: number;
  unitRate: number;
  totalCost: number;
  normalizedUnitRate?: number;
  normalizedTotalCost?: number;
  regionalFactor: number;
  inflationFactor: number;
  createdAt: Date;
}

export interface RegionalCostFactor {
  id: string;
  state: string;
  district?: string;
  category: string;
  factor: number;
  baseYear: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  dataSource?: string;
  createdAt: Date;
}

export interface InflationFactor {
  id: string;
  year: number;
  category: string;
  inflationRate: number;
  cumulativeFactor: number;
  baseYear: number;
  dataSource?: string;
  createdAt: Date;
}

export interface PriceBenchmark {
  id: string;
  itemCategory: string;
  itemDescription: string;
  unit?: string;
  region: string;
  averageUnitRate: number;
  medianUnitRate: number;
  minUnitRate: number;
  maxUnitRate: number;
  standardDeviation?: number;
  sampleSize: number;
  lastUpdated: Date;
  baseYear: number;
  createdAt: Date;
}

// Price comparison result types
export interface PriceComparisonResult {
  dprId: string;
  totalEstimate: number;
  regionalAverage: number;
  deviationPercentage: number;
  flaggedItems: PriceFlaggedItem[];
  recommendations: string[];
  analysisTimestamp: Date;
}

export interface PriceFlaggedItem {
  itemCategory: string;
  itemDescription: string;
  dprUnitRate: number;
  benchmarkUnitRate: number;
  deviationPercentage: number;
  flagType: 'OVERPRICED' | 'UNDERPRICED';
  confidence: number;
  recommendation: string;
}

// Completion feasibility prediction types
export interface CompletionFeasibilityResult {
  dprId: string;
  completionProbability: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
  simulationData: SimulationScenario[];
  analysisTimestamp: Date;
  confidence: number;
}

export interface RiskFactor {
  type: 'TIMELINE' | 'RESOURCE' | 'COMPLEXITY' | 'ENVIRONMENTAL' | 'FINANCIAL';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  mitigation: string;
}

export interface SimulationScenario {
  scenarioName: string;
  adjustedTimeline: number;
  adjustedResources: number;
  adjustedComplexity: number;
  predictedProbability: number;
}

export interface ProjectFeatures {
  // Timeline features
  estimatedDurationMonths: number;
  seasonalityFactor: number;
  weatherRiskMonths: number;
  
  // Resource features
  totalCost: number;
  costPerMonth: number;
  resourceComplexityScore: number;
  laborIntensityScore: number;
  
  // Complexity features
  technicalComplexityScore: number;
  environmentalComplexityScore: number;
  regulatoryComplexityScore: number;
  
  // Location features
  accessibilityScore: number;
  infrastructureScore: number;
  remotenessScore: number;
  
  // Historical context
  similarProjectsCount: number;
  regionSuccessRate: number;
  categorySuccessRate: number;
  
  // Completion probability (calculated field)
  completionProbability?: number;
}

// Probability calculation and risk analysis types
export interface ProbabilityCalculationResult {
  dprId: string;
  completionProbability: number; // Percentage (0-100)
  probabilityBreakdown: ProbabilityBreakdown;
  confidenceLevel: number; // 0-1
  calculationTimestamp: Date;
}

export interface ProbabilityBreakdown {
  baseScore: number;
  timelineAdjustment: number;
  resourceAdjustment: number;
  complexityAdjustment: number;
  locationAdjustment: number;
  historicalAdjustment: number;
  riskAdjustment: number;
  finalScore: number;
}

export interface RiskAnalysisResult {
  dprId: string;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  riskBreakdown: RiskBreakdown;
  analysisTimestamp: Date;
}

export interface RiskBreakdown {
  timelineRisk: number;
  resourceRisk: number;
  complexityRisk: number;
  environmentalRisk: number;
  financialRisk: number;
  overallRisk: number;
}

export interface CompletionRecommendation {
  category: 'TIMELINE' | 'RESOURCE' | 'COMPLEXITY' | 'RISK_MITIGATION' | 'GENERAL';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  expectedImpact: number; // Percentage improvement in completion probability
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
}

export interface RecommendationEngineResult {
  dprId: string;
  currentProbability: number;
  potentialImprovement: number;
  recommendations: CompletionRecommendation[];
  prioritizedActions: string[];
  generatedTimestamp: Date;
}

// What-if simulation types
export interface SimulationParameters {
  timelineMultiplier?: number; // 0.5 = 50% faster, 1.5 = 50% slower
  resourceMultiplier?: number; // 1.2 = 20% more resources
  complexityMultiplier?: number; // 0.8 = 20% less complex
  accessibilityImprovement?: number; // 0-2 points improvement
  additionalRiskMitigation?: string[]; // Risk types to mitigate
}

export interface SimulationResult {
  scenarioName: string;
  parameters: SimulationParameters;
  adjustedFeatures: ProjectFeatures;
  adjustedRiskFactors: RiskFactor[];
  completionProbability: number;
  probabilityChange: number; // Change from baseline
  riskScore: number;
  riskChange: number; // Change from baseline
  costImpact: number; // Additional cost due to changes
  timeImpact: number; // Change in timeline (months)
  recommendations: string[];
  feasibilityRating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

export interface WhatIfAnalysis {
  dprId: string;
  baselineScenario: SimulationResult;
  simulatedScenarios: SimulationResult[];
  bestScenario: SimulationResult;
  worstScenario: SimulationResult;
  analysisTimestamp: Date;
  totalScenariosAnalyzed: number;
}

export interface InteractiveSimulationSession {
  sessionId: string;
  dprId: string;
  baselineFeatures: ProjectFeatures;
  baselineRiskFactors: RiskFactor[];
  currentScenario: SimulationResult;
  scenarioHistory: SimulationResult[];
  createdAt: Date;
  lastUpdated: Date;
}

// Government scheme identification types
export interface GovernmentScheme {
  id: string;
  schemeName: string;
  schemeCode?: string;
  ministry: string;
  department?: string;
  description: string;
  objectives: string[];
  eligibilityCriteria: string[];
  fundingRangeMin?: number;
  fundingRangeMax?: number;
  applicableRegions: string[];
  applicableSectors: string[];
  targetBeneficiaries: string[];
  keywords: string[];
  schemeType: 'CENTRALLY_SPONSORED' | 'CENTRAL_SECTOR' | 'STATE_SCHEME' | 'JOINT_SCHEME';
  launchDate?: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  websiteUrl?: string;
  contactDetails?: Record<string, any>;
  guidelinesUrl?: string;
  applicationProcess?: string;
  requiredDocuments: string[];
  processingTimeDays?: number;
  approvalAuthority?: string;
  monitoringMechanism?: string;
  successMetrics: string[];
  budgetAllocation?: number;
  budgetYear?: number;
  utilizationPercentage?: number;
  beneficiariesCount?: number;
  projectsFunded?: number;
  averageFundingAmount?: number;
  lastUpdated: Date;
  dataSource: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'NEEDS_UPDATE';
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemeCategory {
  id: string;
  categoryName: string;
  parentCategoryId?: string;
  description?: string;
  keywords: string[];
  createdAt: Date;
}

export interface SchemeCategoryMapping {
  schemeId: string;
  categoryId: string;
  relevanceScore: number;
  createdAt: Date;
}

export interface SchemeMatch {
  id: string;
  documentId: string;
  schemeId: string;
  matchType: 'SEMANTIC' | 'KEYWORD' | 'CATEGORY' | 'MANUAL';
  relevanceScore: number; // 0.0000 to 1.0000
  confidenceScore: number; // 0.0000 to 1.0000
  matchingKeywords: string[];
  matchingCriteria: string[];
  gapAnalysis?: Record<string, any>;
  recommendationReason?: string;
  matchStatus: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW';
  reviewedBy?: string;
  reviewTimestamp?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemeGapAnalysis {
  id: string;
  documentId: string;
  existingSchemesMentioned: string[];
  verifiedSchemes: string[];
  missingOpportunities: string[];
  incorrectReferences: string[];
  optimizationSuggestions: string[];
  completenessScore?: number;
  gapSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analysisTimestamp: Date;
  analysisVersion: string;
  createdAt: Date;
}

// Scheme matching and recommendation types
export interface SchemeMatchingRequest {
  documentId: string;
  projectDescription: string;
  projectType?: string;
  estimatedCost?: number;
  location?: {
    state: string;
    district?: string;
  };
  sectors: string[];
  targetBeneficiaries?: string[];
  existingSchemes?: string[];
  matchingOptions?: {
    includeInactive?: boolean;
    minRelevanceScore?: number;
    maxResults?: number;
    preferredSchemeTypes?: string[];
  };
}

export interface SchemeMatchingResult {
  documentId: string;
  totalSchemesAnalyzed: number;
  matchedSchemes: SchemeMatchWithDetails[];
  gapAnalysis: SchemeGapAnalysisResult;
  recommendations: SchemeRecommendation[];
  analysisTimestamp: Date;
  processingTimeMs: number;
}

export interface SchemeMatchWithDetails {
  scheme: GovernmentScheme;
  match: Omit<SchemeMatch, 'id' | 'createdAt' | 'updatedAt'>;
  applicabilityAnalysis: {
    eligibilityMet: boolean;
    missingCriteria: string[];
    fundingAlignment: 'UNDER' | 'WITHIN' | 'OVER' | 'UNKNOWN';
    regionalApplicability: boolean;
    sectorAlignment: boolean;
  };
}

export interface SchemeGapAnalysisResult {
  completenessScore: number;
  gapSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  existingSchemesMentioned: string[];
  verifiedSchemes: GovernmentScheme[];
  missingOpportunities: GovernmentScheme[];
  incorrectReferences: string[];
  optimizationSuggestions: string[];
}

export interface SchemeRecommendation {
  type: 'NEW_SCHEME' | 'SCHEME_OPTIMIZATION' | 'SCHEME_VERIFICATION' | 'FUNDING_ALIGNMENT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  scheme?: GovernmentScheme;
  recommendation: string;
  expectedBenefit: string;
  implementationSteps: string[];
  potentialFunding?: number;
  timeframe?: string;
}

// Scheme search and filtering types
export interface SchemeSearchRequest {
  query?: string;
  filters?: {
    ministry?: string[];
    schemeType?: string[];
    status?: string[];
    applicableRegions?: string[];
    applicableSectors?: string[];
    fundingRange?: {
      min?: number;
      max?: number;
    };
    launchDateRange?: {
      from?: Date;
      to?: Date;
    };
    keywords?: string[];
  };
  sorting?: {
    field: 'schemeName' | 'ministry' | 'launchDate' | 'budgetAllocation' | 'relevanceScore';
    order: 'ASC' | 'DESC';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SchemeSearchResult {
  schemes: GovernmentScheme[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  searchQuery?: string;
  appliedFilters: Record<string, any>;
  searchTimestamp: Date;
}

// Scheme data ingestion and management types
export interface SchemeDataIngestionRequest {
  dataSource: string;
  schemes: Partial<GovernmentScheme>[];
  ingestionMode: 'CREATE' | 'UPDATE' | 'UPSERT';
  validationLevel: 'STRICT' | 'MODERATE' | 'LENIENT';
  batchSize?: number;
}

export interface SchemeDataIngestionResult {
  totalProcessed: number;
  successfullyIngested: number;
  failed: number;
  skipped: number;
  errors: SchemeIngestionError[];
  warnings: string[];
  processingTimeMs: number;
  ingestionTimestamp: Date;
}

export interface SchemeIngestionError {
  schemeData: Partial<GovernmentScheme>;
  errorType: 'VALIDATION_ERROR' | 'DUPLICATE_ERROR' | 'DATABASE_ERROR' | 'PROCESSING_ERROR';
  errorMessage: string;
  fieldErrors?: Record<string, string>;
}

export interface SchemeUpdateRequest {
  schemeId: string;
  updates: Partial<GovernmentScheme>;
  updateReason?: string;
  updatedBy: string;
}

export interface SchemeVerificationRequest {
  schemeIds: string[];
  verificationSource: string;
  verifiedBy: string;
  verificationNotes?: string;
}

export interface SchemeVerificationResult {
  verifiedSchemes: string[];
  failedVerifications: {
    schemeId: string;
    reason: string;
  }[];
  verificationTimestamp: Date;
}

// Geospatial verification types
export interface GeographicLocation {
  latitude: number;
  longitude: number;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  accuracy?: number; // GPS accuracy in meters
}

export interface LocationVerificationRequest {
  dprId: string;
  coordinates?: GeographicLocation;
  address?: string;
  projectName?: string;
  verificationLevel: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
}

export interface LocationVerificationResult {
  dprId: string;
  originalLocation: GeographicLocation | string;
  verifiedLocation: GeographicLocation;
  verificationStatus: 'VERIFIED' | 'APPROXIMATE' | 'FAILED' | 'NEEDS_REVIEW';
  accuracy: number; // Confidence score 0-1
  verificationMethod: 'GPS' | 'GEOCODING' | 'MANUAL' | 'HYBRID';
  addressComponents: AddressComponents;
  verificationTimestamp: Date;
  errors?: string[];
  warnings?: string[];
}

export interface AddressComponents {
  streetNumber?: string;
  route?: string;
  locality?: string;
  subLocality?: string;
  administrativeAreaLevel1?: string; // State
  administrativeAreaLevel2?: string; // District
  administrativeAreaLevel3?: string; // Sub-district
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

export interface SiteAccessibilityAnalysis {
  dprId: string;
  location: GeographicLocation;
  accessibilityScore: number; // 0-100
  infrastructureAvailability: InfrastructureAvailability;
  transportConnectivity: TransportConnectivity;
  utilityAvailability: UtilityAvailability;
  terrainAnalysis: TerrainAnalysis;
  weatherRisks: WeatherRisk[];
  analysisTimestamp: Date;
}

export interface InfrastructureAvailability {
  roadAccess: {
    available: boolean;
    roadType: 'HIGHWAY' | 'STATE_ROAD' | 'DISTRICT_ROAD' | 'VILLAGE_ROAD' | 'NO_ROAD';
    distanceKm: number;
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  };
  railwayAccess: {
    available: boolean;
    nearestStationKm?: number;
    stationName?: string;
  };
  airportAccess: {
    available: boolean;
    nearestAirportKm?: number;
    airportName?: string;
    airportType?: 'INTERNATIONAL' | 'DOMESTIC' | 'REGIONAL';
  };
  portAccess: {
    available: boolean;
    nearestPortKm?: number;
    portName?: string;
    portType?: 'MAJOR' | 'MINOR' | 'FISHING';
  };
}

export interface TransportConnectivity {
  overallScore: number; // 0-100
  publicTransport: boolean;
  lastMileConnectivity: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  seasonalAccessibility: 'YEAR_ROUND' | 'SEASONAL' | 'LIMITED';
  logisticsComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface UtilityAvailability {
  electricity: {
    available: boolean;
    reliability: 'HIGH' | 'MEDIUM' | 'LOW';
    gridConnection: boolean;
    powerOutageHours?: number;
  };
  water: {
    available: boolean;
    source: 'MUNICIPAL' | 'GROUNDWATER' | 'SURFACE_WATER' | 'TANKER' | 'NONE';
    quality: 'POTABLE' | 'TREATABLE' | 'POOR';
    reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  telecommunications: {
    mobileNetwork: boolean;
    internetConnectivity: boolean;
    broadbandAvailable: boolean;
    networkStrength: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  };
  wasteManagement: {
    solidWasteCollection: boolean;
    sewageSystem: boolean;
    treatmentFacility: boolean;
  };
}

export interface TerrainAnalysis {
  elevation: number; // meters above sea level
  slope: number; // degrees
  terrainType: 'PLAIN' | 'HILLY' | 'MOUNTAINOUS' | 'COASTAL' | 'RIVERINE';
  soilType?: string;
  drainagePattern: 'GOOD' | 'MODERATE' | 'POOR';
  floodRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  landslideRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  seismicZone?: number; // 1-5
}

export interface WeatherRisk {
  riskType: 'MONSOON' | 'CYCLONE' | 'DROUGHT' | 'EXTREME_TEMPERATURE' | 'FOG' | 'HAIL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  seasonalPattern: string;
  impactOnConstruction: string;
  mitigationMeasures: string[];
}

export interface EnvironmentalConstraint {
  constraintType: 'FOREST_CLEARANCE' | 'WILDLIFE_SANCTUARY' | 'WETLAND' | 'ARCHAEOLOGICAL' | 'POLLUTION_CONTROL' | 'COASTAL_REGULATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  regulatoryRequirements: string[];
  approvalAuthority: string;
  estimatedTimelineMonths?: number;
  complianceCost?: number;
  mitigationPossible: boolean;
}

export interface SiteFeasibilityResult {
  dprId: string;
  location: GeographicLocation;
  overallFeasibilityScore: number; // 0-100
  feasibilityRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNSUITABLE';
  accessibilityAnalysis: SiteAccessibilityAnalysis;
  environmentalConstraints: EnvironmentalConstraint[];
  recommendations: SiteFeasibilityRecommendation[];
  riskFactors: string[];
  analysisTimestamp: Date;
  dataSourcesUsed: string[];
}

export interface SiteFeasibilityRecommendation {
  category: 'ACCESSIBILITY' | 'INFRASTRUCTURE' | 'ENVIRONMENTAL' | 'REGULATORY' | 'RISK_MITIGATION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  expectedImpact: string;
  implementationCost?: number;
  timeframe?: string;
}

export interface GeospatialVerificationResult {
  dprId: string;
  locationVerification: LocationVerificationResult;
  siteFeasibility: SiteFeasibilityResult;
  mapVisualization: MapVisualizationData;
  overallVerificationStatus: 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED' | 'NEEDS_REVIEW';
  verificationSummary: string;
  analysisTimestamp: Date;
}

export interface MapVisualizationData {
  centerCoordinates: GeographicLocation;
  zoomLevel: number;
  markers: MapMarker[];
  overlays: MapOverlay[];
  boundingBox: {
    northeast: GeographicLocation;
    southwest: GeographicLocation;
  };
}

export interface MapMarker {
  id: string;
  coordinates: GeographicLocation;
  type: 'PROJECT_SITE' | 'INFRASTRUCTURE' | 'CONSTRAINT' | 'REFERENCE_POINT';
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  clickable: boolean;
  infoWindow?: string;
}

export interface MapOverlay {
  id: string;
  type: 'POLYGON' | 'POLYLINE' | 'CIRCLE' | 'HEATMAP';
  coordinates: GeographicLocation[];
  style: {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
  title?: string;
  description?: string;
}