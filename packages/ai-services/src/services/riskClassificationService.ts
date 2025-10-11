import { ProjectFeatures, RiskFactor, HistoricalProject } from '@dpr-system/shared';

// Risk classification types
export interface RiskClassificationResult {
  dprId: string;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number; // 0-100
  riskCategories: RiskCategoryResult[];
  historicalAnalysis: HistoricalAnalysisResult;
  analysisTimestamp: Date;
  confidence: number;
}

export interface RiskCategoryResult {
  category: 'COST_OVERRUN' | 'DELAY' | 'ENVIRONMENTAL' | 'RESOURCE';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number; // 0-100
  confidence: number;
  contributingFactors: string[];
  mitigationStrategies: string[];
  historicalPrecedents: HistoricalPrecedent[];
}

export interface HistoricalPrecedent {
  projectId: string;
  projectName: string;
  similarity: number; // 0-1
  actualOutcome: 'SUCCESS' | 'DELAYED' | 'COST_OVERRUN' | 'FAILED';
  lessonsLearned: string[];
}

export interface HistoricalAnalysisResult {
  similarProjectsCount: number;
  successRate: number;
  averageDelayMonths: number;
  averageCostOverrunPercentage: number;
  commonRiskPatterns: RiskPattern[];
  regionalTrends: RegionalTrend[];
}

export interface RiskPattern {
  pattern: string;
  frequency: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  associatedRisks: string[];
}

export interface RegionalTrend {
  region: string;
  riskCategory: string;
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
  impactLevel: number;
}

export interface MLModelConfig {
  modelType: 'RANDOM_FOREST' | 'GRADIENT_BOOSTING' | 'NEURAL_NETWORK';
  features: string[];
  hyperparameters: Record<string, any>;
  trainingDataSize: number;
  accuracy: number;
  lastTrainedAt: Date;
}

export interface RiskModelPrediction {
  category: string;
  probability: number;
  confidence: number;
  featureImportance: Record<string, number>;
}

/**
 * Multi-class risk classification service for DPR analysis
 * Implements ML models for cost overrun, delay, environmental, and resource risks
 */
export class RiskClassificationService {
  private costOverrunModel: MLModelConfig;
  private delayModel: MLModelConfig;
  private environmentalModel: MLModelConfig;
  private resourceModel: MLModelConfig;
  private historicalProjects: HistoricalProject[] = [];

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize ML models for different risk categories
   */
  private initializeModels(): void {
    // Cost overrun risk model configuration
    this.costOverrunModel = {
      modelType: 'GRADIENT_BOOSTING',
      features: [
        'totalCost',
        'costPerMonth',
        'projectComplexity',
        'historicalCostVariance',
        'inflationRate',
        'materialCostVolatility',
        'laborCostTrend',
        'contractorReliability'
      ],
      hyperparameters: {
        n_estimators: 100,
        learning_rate: 0.1,
        max_depth: 6,
        min_samples_split: 10
      },
      trainingDataSize: 1500,
      accuracy: 0.85,
      lastTrainedAt: new Date()
    };

    // Delay risk model configuration
    this.delayModel = {
      modelType: 'RANDOM_FOREST',
      features: [
        'estimatedDurationMonths',
        'seasonalityFactor',
        'weatherRiskMonths',
        'regulatoryComplexity',
        'approvalTimeline',
        'resourceAvailability',
        'accessibilityScore',
        'stakeholderComplexity'
      ],
      hyperparameters: {
        n_estimators: 150,
        max_depth: 8,
        min_samples_split: 5,
        min_samples_leaf: 2
      },
      trainingDataSize: 1200,
      accuracy: 0.82,
      lastTrainedAt: new Date()
    };

    // Environmental risk model configuration
    this.environmentalModel = {
      modelType: 'NEURAL_NETWORK',
      features: [
        'environmentalComplexityScore',
        'forestCoverPercentage',
        'waterBodyProximity',
        'wildlifeHabitatRisk',
        'pollutionLevel',
        'climateChangeVulnerability',
        'biodiversityIndex',
        'environmentalClearanceTime'
      ],
      hyperparameters: {
        hidden_layers: [64, 32, 16],
        activation: 'relu',
        dropout_rate: 0.3,
        learning_rate: 0.001
      },
      trainingDataSize: 800,
      accuracy: 0.78,
      lastTrainedAt: new Date()
    };

    // Resource risk model configuration
    this.resourceModel = {
      modelType: 'GRADIENT_BOOSTING',
      features: [
        'laborIntensityScore',
        'skillRequirementLevel',
        'materialRequirementComplexity',
        'equipmentAvailability',
        'localResourceAvailability',
        'supplyChainReliability',
        'transportationChallenges',
        'resourceCostVolatility'
      ],
      hyperparameters: {
        n_estimators: 120,
        learning_rate: 0.08,
        max_depth: 7,
        subsample: 0.8
      },
      trainingDataSize: 1000,
      accuracy: 0.80,
      lastTrainedAt: new Date()
    };
  }

  /**
   * Classify risks for a DPR document
   */
  async classifyRisks(
    dprId: string,
    projectFeatures: ProjectFeatures,
    historicalData: HistoricalProject[]
  ): Promise<RiskClassificationResult> {
    try {
      // Store historical data for analysis
      this.historicalProjects = historicalData;

      // Perform risk classification for each category
      const costOverrunRisk = await this.classifyCostOverrunRisk(projectFeatures);
      const delayRisk = await this.classifyDelayRisk(projectFeatures);
      const environmentalRisk = await this.classifyEnvironmentalRisk(projectFeatures);
      const resourceRisk = await this.classifyResourceRisk(projectFeatures);

      const riskCategories = [costOverrunRisk, delayRisk, environmentalRisk, resourceRisk];

      // Calculate overall risk level and score
      const overallRiskScore = this.calculateOverallRiskScore(riskCategories);
      const overallRiskLevel = this.determineRiskLevel(overallRiskScore);

      // Perform historical analysis
      const historicalAnalysis = await this.performHistoricalAnalysis(projectFeatures);

      // Calculate confidence based on model accuracies and data quality
      const confidence = this.calculateOverallConfidence(riskCategories);

      return {
        dprId,
        overallRiskLevel,
        riskScore: overallRiskScore,
        riskCategories,
        historicalAnalysis,
        analysisTimestamp: new Date(),
        confidence
      };
    } catch (error) {
      console.error('Error in risk classification:', error);
      throw new Error(`Risk classification failed: ${error.message}`);
    }
  }

  /**
   * Classify cost overrun risk
   */
  private async classifyCostOverrunRisk(features: ProjectFeatures): Promise<RiskCategoryResult> {
    // Extract relevant features for cost overrun prediction
    const costFeatures = {
      totalCost: features.totalCost,
      costPerMonth: features.costPerMonth,
      projectComplexity: (features.technicalComplexityScore + features.environmentalComplexityScore) / 2,
      historicalCostVariance: this.calculateHistoricalCostVariance(),
      inflationRate: 0.06, // Current inflation rate
      materialCostVolatility: this.calculateMaterialCostVolatility(),
      laborCostTrend: this.calculateLaborCostTrend(),
      contractorReliability: 0.75 // Default reliability score
    };

    // Simulate ML model prediction
    const prediction = this.simulateMLPrediction(this.costOverrunModel, costFeatures);
    const riskScore = prediction.probability * 100;
    const riskLevel = this.determineRiskLevel(riskScore);

    // Find historical precedents
    const historicalPrecedents = this.findHistoricalPrecedents(features, 'COST_OVERRUN');

    return {
      category: 'COST_OVERRUN',
      riskLevel,
      riskScore,
      confidence: prediction.confidence,
      contributingFactors: this.identifyCostOverrunFactors(costFeatures, prediction.featureImportance),
      mitigationStrategies: this.generateCostOverrunMitigationStrategies(riskLevel),
      historicalPrecedents
    };
  }

  /**
   * Classify delay risk
   */
  private async classifyDelayRisk(features: ProjectFeatures): Promise<RiskCategoryResult> {
    const delayFeatures = {
      estimatedDurationMonths: features.estimatedDurationMonths,
      seasonalityFactor: features.seasonalityFactor,
      weatherRiskMonths: features.weatherRiskMonths,
      regulatoryComplexity: features.regulatoryComplexityScore,
      approvalTimeline: this.estimateApprovalTimeline(features),
      resourceAvailability: this.calculateResourceAvailability(features),
      accessibilityScore: features.accessibilityScore,
      stakeholderComplexity: this.calculateStakeholderComplexity(features)
    };

    const prediction = this.simulateMLPrediction(this.delayModel, delayFeatures);
    const riskScore = prediction.probability * 100;
    const riskLevel = this.determineRiskLevel(riskScore);

    const historicalPrecedents = this.findHistoricalPrecedents(features, 'DELAY');

    return {
      category: 'DELAY',
      riskLevel,
      riskScore,
      confidence: prediction.confidence,
      contributingFactors: this.identifyDelayFactors(delayFeatures, prediction.featureImportance),
      mitigationStrategies: this.generateDelayMitigationStrategies(riskLevel),
      historicalPrecedents
    };
  }

  /**
   * Classify environmental risk
   */
  private async classifyEnvironmentalRisk(features: ProjectFeatures): Promise<RiskCategoryResult> {
    const environmentalFeatures = {
      environmentalComplexityScore: features.environmentalComplexityScore,
      forestCoverPercentage: this.calculateForestCoverPercentage(features),
      waterBodyProximity: this.calculateWaterBodyProximity(features),
      wildlifeHabitatRisk: this.calculateWildlifeHabitatRisk(features),
      pollutionLevel: this.calculatePollutionLevel(features),
      climateChangeVulnerability: this.calculateClimateChangeVulnerability(features),
      biodiversityIndex: this.calculateBiodiversityIndex(features),
      environmentalClearanceTime: this.estimateEnvironmentalClearanceTime(features)
    };

    const prediction = this.simulateMLPrediction(this.environmentalModel, environmentalFeatures);
    const riskScore = prediction.probability * 100;
    const riskLevel = this.determineRiskLevel(riskScore);

    const historicalPrecedents = this.findHistoricalPrecedents(features, 'ENVIRONMENTAL');

    return {
      category: 'ENVIRONMENTAL',
      riskLevel,
      riskScore,
      confidence: prediction.confidence,
      contributingFactors: this.identifyEnvironmentalFactors(environmentalFeatures, prediction.featureImportance),
      mitigationStrategies: this.generateEnvironmentalMitigationStrategies(riskLevel),
      historicalPrecedents
    };
  }

  /**
   * Classify resource risk
   */
  private async classifyResourceRisk(features: ProjectFeatures): Promise<RiskCategoryResult> {
    const resourceFeatures = {
      laborIntensityScore: features.laborIntensityScore,
      skillRequirementLevel: this.calculateSkillRequirementLevel(features),
      materialRequirementComplexity: this.calculateMaterialRequirementComplexity(features),
      equipmentAvailability: this.calculateEquipmentAvailability(features),
      localResourceAvailability: this.calculateLocalResourceAvailability(features),
      supplyChainReliability: this.calculateSupplyChainReliability(features),
      transportationChallenges: this.calculateTransportationChallenges(features),
      resourceCostVolatility: this.calculateResourceCostVolatility(features)
    };

    const prediction = this.simulateMLPrediction(this.resourceModel, resourceFeatures);
    const riskScore = prediction.probability * 100;
    const riskLevel = this.determineRiskLevel(riskScore);

    const historicalPrecedents = this.findHistoricalPrecedents(features, 'RESOURCE');

    return {
      category: 'RESOURCE',
      riskLevel,
      riskScore,
      confidence: prediction.confidence,
      contributingFactors: this.identifyResourceFactors(resourceFeatures, prediction.featureImportance),
      mitigationStrategies: this.generateResourceMitigationStrategies(riskLevel),
      historicalPrecedents
    };
  }

  /**
   * Simulate ML model prediction (placeholder for actual ML inference)
   */
  private simulateMLPrediction(model: MLModelConfig, features: Record<string, number>): RiskModelPrediction {
    // In a real implementation, this would call the actual ML model
    // For now, we simulate based on feature values and model configuration
    
    const featureValues = Object.values(features);
    const normalizedScore = featureValues.reduce((sum, val) => sum + val, 0) / featureValues.length;
    
    // Simulate probability based on normalized features and model type
    let probability: number;
    switch (model.modelType) {
      case 'GRADIENT_BOOSTING':
        probability = Math.min(0.95, Math.max(0.05, normalizedScore * 0.7 + Math.random() * 0.3));
        break;
      case 'RANDOM_FOREST':
        probability = Math.min(0.95, Math.max(0.05, normalizedScore * 0.6 + Math.random() * 0.4));
        break;
      case 'NEURAL_NETWORK':
        probability = Math.min(0.95, Math.max(0.05, normalizedScore * 0.8 + Math.random() * 0.2));
        break;
      default:
        probability = 0.5;
    }

    // Calculate feature importance (simplified)
    const featureImportance: Record<string, number> = {};
    const featureNames = Object.keys(features);
    featureNames.forEach((name, index) => {
      featureImportance[name] = Math.random() * 0.3 + 0.1; // Random importance between 0.1 and 0.4
    });

    return {
      category: 'RISK',
      probability,
      confidence: model.accuracy * (0.8 + Math.random() * 0.2), // Confidence based on model accuracy
      featureImportance
    };
  }

  /**
   * Calculate overall risk score from individual category scores
   */
  private calculateOverallRiskScore(riskCategories: RiskCategoryResult[]): number {
    // Weighted average of risk scores
    const weights = {
      COST_OVERRUN: 0.3,
      DELAY: 0.3,
      ENVIRONMENTAL: 0.2,
      RESOURCE: 0.2
    };

    let weightedSum = 0;
    let totalWeight = 0;

    riskCategories.forEach(category => {
      const weight = weights[category.category] || 0.25;
      weightedSum += category.riskScore * weight;
      totalWeight += weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Determine risk level based on risk score
   */
  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (riskScore <= 30) return 'LOW';
    if (riskScore <= 70) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Calculate overall confidence based on individual model confidences
   */
  private calculateOverallConfidence(riskCategories: RiskCategoryResult[]): number {
    const avgConfidence = riskCategories.reduce((sum, cat) => sum + cat.confidence, 0) / riskCategories.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  // Helper methods for feature calculation and analysis
  private calculateHistoricalCostVariance(): number {
    if (this.historicalProjects.length === 0) return 0.15; // Default variance
    
    const costVariances = this.historicalProjects
      .filter(p => p.actualCost && p.estimatedCost)
      .map(p => Math.abs(p.actualCost! - p.estimatedCost) / p.estimatedCost);
    
    return costVariances.length > 0 
      ? costVariances.reduce((sum, v) => sum + v, 0) / costVariances.length
      : 0.15;
  }

  private calculateMaterialCostVolatility(): number {
    // Simulate material cost volatility based on current market conditions
    return 0.12 + Math.random() * 0.08; // 12-20% volatility
  }

  private calculateLaborCostTrend(): number {
    // Simulate labor cost trend (positive = increasing costs)
    return 0.08 + Math.random() * 0.04; // 8-12% annual increase
  }

  private estimateApprovalTimeline(features: ProjectFeatures): number {
    // Estimate approval timeline based on project complexity
    const baseTimeline = 6; // 6 months base
    const complexityMultiplier = (features.regulatoryComplexityScore + features.environmentalComplexityScore) / 2;
    return baseTimeline * (1 + complexityMultiplier);
  }

  private calculateResourceAvailability(features: ProjectFeatures): number {
    // Calculate resource availability score (0-1)
    return Math.max(0.1, 1 - (features.remotenessScore * 0.3 + (1 - features.infrastructureScore) * 0.7));
  }

  private calculateStakeholderComplexity(features: ProjectFeatures): number {
    // Estimate stakeholder complexity based on project features
    return (features.environmentalComplexityScore + features.regulatoryComplexityScore) / 2;
  }

  // Environmental feature calculations
  private calculateForestCoverPercentage(features: ProjectFeatures): number {
    // Simulate forest cover percentage based on location
    return Math.random() * 0.6 + 0.1; // 10-70% forest cover
  }

  private calculateWaterBodyProximity(features: ProjectFeatures): number {
    // Distance to nearest water body (normalized 0-1)
    return Math.random();
  }

  private calculateWildlifeHabitatRisk(features: ProjectFeatures): number {
    return features.environmentalComplexityScore * 0.8 + Math.random() * 0.2;
  }

  private calculatePollutionLevel(features: ProjectFeatures): number {
    return Math.random() * 0.5; // Current pollution level
  }

  private calculateClimateChangeVulnerability(features: ProjectFeatures): number {
    return 0.3 + Math.random() * 0.4; // 30-70% vulnerability
  }

  private calculateBiodiversityIndex(features: ProjectFeatures): number {
    return Math.random() * 0.8 + 0.1; // Biodiversity index 0.1-0.9
  }

  private estimateEnvironmentalClearanceTime(features: ProjectFeatures): number {
    // Months required for environmental clearance
    return 12 + features.environmentalComplexityScore * 18;
  }

  // Resource feature calculations
  private calculateSkillRequirementLevel(features: ProjectFeatures): number {
    return features.technicalComplexityScore;
  }

  private calculateMaterialRequirementComplexity(features: ProjectFeatures): number {
    return (features.technicalComplexityScore + features.resourceComplexityScore) / 2;
  }

  private calculateEquipmentAvailability(features: ProjectFeatures): number {
    return Math.max(0.1, 1 - features.remotenessScore * 0.6);
  }

  private calculateLocalResourceAvailability(features: ProjectFeatures): number {
    return Math.max(0.2, 1 - features.remotenessScore * 0.5);
  }

  private calculateSupplyChainReliability(features: ProjectFeatures): number {
    return Math.max(0.3, 1 - features.remotenessScore * 0.4);
  }

  private calculateTransportationChallenges(features: ProjectFeatures): number {
    return features.remotenessScore * 0.7 + (1 - features.accessibilityScore) * 0.3;
  }

  private calculateResourceCostVolatility(features: ProjectFeatures): number {
    return 0.1 + features.remotenessScore * 0.2; // Higher volatility in remote areas
  }

  /**
   * Find historical precedents for similar projects
   */
  private findHistoricalPrecedents(features: ProjectFeatures, riskType: string): HistoricalPrecedent[] {
    if (this.historicalProjects.length === 0) return [];

    // Calculate similarity scores and find top matches
    const precedents = this.historicalProjects
      .map(project => ({
        project,
        similarity: this.calculateProjectSimilarity(features, project)
      }))
      .filter(p => p.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 similar projects
      .map(p => ({
        projectId: p.project.id,
        projectName: p.project.projectName,
        similarity: p.similarity,
        actualOutcome: this.determineActualOutcome(p.project),
        lessonsLearned: this.extractLessonsLearned(p.project, riskType)
      }));

    return precedents;
  }

  private calculateProjectSimilarity(features: ProjectFeatures, historical: HistoricalProject): number {
    // Simplified similarity calculation based on key features
    const costSimilarity = 1 - Math.abs(features.totalCost - historical.estimatedCost) / Math.max(features.totalCost, historical.estimatedCost);
    const durationSimilarity = 1 - Math.abs(features.estimatedDurationMonths - historical.estimatedDurationMonths) / Math.max(features.estimatedDurationMonths, historical.estimatedDurationMonths);
    
    return (costSimilarity + durationSimilarity) / 2;
  }

  private determineActualOutcome(project: HistoricalProject): 'SUCCESS' | 'DELAYED' | 'COST_OVERRUN' | 'FAILED' {
    if (project.completionStatus === 'CANCELLED') return 'FAILED';
    if (project.completionStatus === 'DELAYED') return 'DELAYED';
    if (project.actualCost && project.actualCost > project.estimatedCost * 1.1) return 'COST_OVERRUN';
    return 'SUCCESS';
  }

  private extractLessonsLearned(project: HistoricalProject, riskType: string): string[] {
    // Extract relevant lessons based on risk type and project outcome
    const lessons: string[] = [];
    
    if (project.riskFactors.length > 0) {
      lessons.push(`Risk factors identified: ${project.riskFactors.join(', ')}`);
    }
    
    if (project.actualCost && project.actualCost > project.estimatedCost * 1.1) {
      lessons.push('Cost overrun occurred - ensure better cost estimation and contingency planning');
    }
    
    if (project.completionStatus === 'DELAYED') {
      lessons.push('Project experienced delays - consider timeline buffers and risk mitigation');
    }
    
    return lessons.length > 0 ? lessons : ['No specific lessons available'];
  }

  // Risk factor identification methods
  private identifyCostOverrunFactors(features: Record<string, number>, importance: Record<string, number>): string[] {
    const factors: string[] = [];
    
    if (features.totalCost > 50000000) factors.push('High project cost increases overrun risk');
    if (features.projectComplexity > 0.7) factors.push('High project complexity');
    if (features.historicalCostVariance > 0.2) factors.push('Historical cost variance in similar projects');
    if (features.materialCostVolatility > 0.15) factors.push('High material cost volatility');
    
    return factors;
  }

  private identifyDelayFactors(features: Record<string, number>, importance: Record<string, number>): string[] {
    const factors: string[] = [];
    
    if (features.estimatedDurationMonths > 36) factors.push('Long project duration increases delay risk');
    if (features.weatherRiskMonths > 4) factors.push('Significant weather-related delays expected');
    if (features.regulatoryComplexity > 0.7) factors.push('Complex regulatory approval process');
    if (features.accessibilityScore < 0.5) factors.push('Poor site accessibility');
    
    return factors;
  }

  private identifyEnvironmentalFactors(features: Record<string, number>, importance: Record<string, number>): string[] {
    const factors: string[] = [];
    
    if (features.environmentalComplexityScore > 0.7) factors.push('High environmental complexity');
    if (features.forestCoverPercentage > 0.5) factors.push('High forest cover requires clearance');
    if (features.wildlifeHabitatRisk > 0.6) factors.push('Wildlife habitat concerns');
    if (features.environmentalClearanceTime > 18) factors.push('Extended environmental clearance timeline');
    
    return factors;
  }

  private identifyResourceFactors(features: Record<string, number>, importance: Record<string, number>): string[] {
    const factors: string[] = [];
    
    if (features.laborIntensityScore > 0.7) factors.push('High labor intensity requirements');
    if (features.skillRequirementLevel > 0.8) factors.push('Specialized skills required');
    if (features.equipmentAvailability < 0.5) factors.push('Limited equipment availability');
    if (features.transportationChallenges > 0.6) factors.push('Significant transportation challenges');
    
    return factors;
  }

  // Mitigation strategy generation methods
  private generateCostOverrunMitigationStrategies(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
    const strategies: string[] = [];
    
    strategies.push('Implement detailed cost monitoring and control systems');
    strategies.push('Establish contingency reserves (10-20% of project cost)');
    
    if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
      strategies.push('Conduct regular cost reviews and variance analysis');
      strategies.push('Implement value engineering practices');
    }
    
    if (riskLevel === 'HIGH') {
      strategies.push('Consider fixed-price contracts with penalties');
      strategies.push('Engage independent cost verification consultants');
    }
    
    return strategies;
  }

  private generateDelayMitigationStrategies(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
    const strategies: string[] = [];
    
    strategies.push('Develop detailed project schedule with critical path analysis');
    strategies.push('Build weather contingency into timeline');
    
    if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
      strategies.push('Implement parallel processing where possible');
      strategies.push('Establish early warning systems for delays');
    }
    
    if (riskLevel === 'HIGH') {
      strategies.push('Consider fast-track construction methods');
      strategies.push('Engage dedicated project management consultants');
    }
    
    return strategies;
  }

  private generateEnvironmentalMitigationStrategies(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
    const strategies: string[] = [];
    
    strategies.push('Conduct comprehensive environmental impact assessment');
    strategies.push('Engage with environmental regulatory authorities early');
    
    if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
      strategies.push('Develop environmental management plan');
      strategies.push('Implement biodiversity offset programs');
    }
    
    if (riskLevel === 'HIGH') {
      strategies.push('Consider alternative project locations or designs');
      strategies.push('Engage environmental specialists and NGOs');
    }
    
    return strategies;
  }

  private generateResourceMitigationStrategies(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
    const strategies: string[] = [];
    
    strategies.push('Develop comprehensive resource procurement plan');
    strategies.push('Establish relationships with multiple suppliers');
    
    if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
      strategies.push('Implement resource monitoring and tracking systems');
      strategies.push('Consider local capacity building programs');
    }
    
    if (riskLevel === 'HIGH') {
      strategies.push('Establish strategic resource reserves');
      strategies.push('Consider alternative resource sources and technologies');
    }
    
    return strategies;
  }

  /**
   * Perform historical analysis to identify patterns and trends
   */
  private async performHistoricalAnalysis(features: ProjectFeatures): Promise<HistoricalAnalysisResult> {
    if (this.historicalProjects.length === 0) {
      return {
        similarProjectsCount: 0,
        successRate: 0.7, // Default success rate
        averageDelayMonths: 6,
        averageCostOverrunPercentage: 15,
        commonRiskPatterns: [],
        regionalTrends: []
      };
    }

    // Find similar projects
    const similarProjects = this.historicalProjects.filter(project => 
      this.calculateProjectSimilarity(features, project) > 0.3
    );

    // Calculate success rate
    const successfulProjects = similarProjects.filter(p => 
      p.completionStatus === 'COMPLETED' && 
      (!p.actualCost || p.actualCost <= p.estimatedCost * 1.1) &&
      (!p.actualDurationMonths || p.actualDurationMonths <= p.estimatedDurationMonths * 1.2)
    );
    const successRate = similarProjects.length > 0 ? successfulProjects.length / similarProjects.length : 0.7;

    // Calculate average delays and cost overruns
    const delayedProjects = similarProjects.filter(p => p.actualDurationMonths && p.actualDurationMonths > p.estimatedDurationMonths);
    const averageDelayMonths = delayedProjects.length > 0 
      ? delayedProjects.reduce((sum, p) => sum + (p.actualDurationMonths! - p.estimatedDurationMonths), 0) / delayedProjects.length
      : 0;

    const overrunProjects = similarProjects.filter(p => p.actualCost && p.actualCost > p.estimatedCost);
    const averageCostOverrunPercentage = overrunProjects.length > 0
      ? overrunProjects.reduce((sum, p) => sum + ((p.actualCost! - p.estimatedCost) / p.estimatedCost * 100), 0) / overrunProjects.length
      : 0;

    // Identify common risk patterns
    const commonRiskPatterns = this.identifyRiskPatterns(similarProjects);

    // Analyze regional trends
    const regionalTrends = this.analyzeRegionalTrends(this.historicalProjects);

    return {
      similarProjectsCount: similarProjects.length,
      successRate: Math.round(successRate * 100) / 100,
      averageDelayMonths: Math.round(averageDelayMonths * 10) / 10,
      averageCostOverrunPercentage: Math.round(averageCostOverrunPercentage * 10) / 10,
      commonRiskPatterns,
      regionalTrends
    };
  }

  private identifyRiskPatterns(projects: HistoricalProject[]): RiskPattern[] {
    const riskCounts: Record<string, number> = {};
    const riskImpacts: Record<string, string[]> = {};

    projects.forEach(project => {
      project.riskFactors.forEach(risk => {
        riskCounts[risk] = (riskCounts[risk] || 0) + 1;
        if (!riskImpacts[risk]) riskImpacts[risk] = [];
        
        // Determine impact based on project outcome
        if (project.completionStatus === 'CANCELLED') {
          riskImpacts[risk].push('HIGH');
        } else if (project.completionStatus === 'DELAYED' || (project.actualCost && project.actualCost > project.estimatedCost * 1.2)) {
          riskImpacts[risk].push('MEDIUM');
        } else {
          riskImpacts[risk].push('LOW');
        }
      });
    });

    return Object.entries(riskCounts)
      .map(([pattern, frequency]) => {
        const impacts = riskImpacts[pattern];
        const highImpactCount = impacts.filter(i => i === 'HIGH').length;
        const mediumImpactCount = impacts.filter(i => i === 'MEDIUM').length;
        
        let impact: 'LOW' | 'MEDIUM' | 'HIGH';
        if (highImpactCount > impacts.length * 0.3) impact = 'HIGH';
        else if (mediumImpactCount > impacts.length * 0.3) impact = 'MEDIUM';
        else impact = 'LOW';

        return {
          pattern,
          frequency: frequency / projects.length,
          impact,
          associatedRisks: this.getAssociatedRisks(pattern)
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 patterns
  }

  private getAssociatedRisks(pattern: string): string[] {
    // Map risk patterns to associated risk categories
    const riskMappings: Record<string, string[]> = {
      'weather delays': ['DELAY', 'COST_OVERRUN'],
      'resource shortage': ['RESOURCE', 'DELAY'],
      'environmental clearance': ['ENVIRONMENTAL', 'DELAY'],
      'cost escalation': ['COST_OVERRUN'],
      'technical complexity': ['DELAY', 'COST_OVERRUN', 'RESOURCE'],
      'regulatory approval': ['DELAY', 'ENVIRONMENTAL']
    };

    return riskMappings[pattern.toLowerCase()] || ['GENERAL'];
  }

  private analyzeRegionalTrends(projects: HistoricalProject[]): RegionalTrend[] {
    const regionalData: Record<string, { delays: number[], overruns: number[], total: number }> = {};

    projects.forEach(project => {
      const region = project.locationState;
      if (!regionalData[region]) {
        regionalData[region] = { delays: [], overruns: [], total: 0 };
      }

      regionalData[region].total++;

      if (project.actualDurationMonths && project.actualDurationMonths > project.estimatedDurationMonths) {
        regionalData[region].delays.push(project.actualDurationMonths - project.estimatedDurationMonths);
      }

      if (project.actualCost && project.actualCost > project.estimatedCost) {
        regionalData[region].overruns.push((project.actualCost - project.estimatedCost) / project.estimatedCost);
      }
    });

    const trends: RegionalTrend[] = [];

    Object.entries(regionalData).forEach(([region, data]) => {
      if (data.total >= 5) { // Minimum sample size
        // Analyze delay trends
        if (data.delays.length > 0) {
          const avgDelay = data.delays.reduce((sum, d) => sum + d, 0) / data.delays.length;
          trends.push({
            region,
            riskCategory: 'DELAY',
            trendDirection: avgDelay > 6 ? 'INCREASING' : avgDelay < 3 ? 'DECREASING' : 'STABLE',
            impactLevel: Math.min(100, avgDelay * 10)
          });
        }

        // Analyze cost overrun trends
        if (data.overruns.length > 0) {
          const avgOverrun = data.overruns.reduce((sum, o) => sum + o, 0) / data.overruns.length;
          trends.push({
            region,
            riskCategory: 'COST_OVERRUN',
            trendDirection: avgOverrun > 0.2 ? 'INCREASING' : avgOverrun < 0.1 ? 'DECREASING' : 'STABLE',
            impactLevel: Math.min(100, avgOverrun * 100)
          });
        }
      }
    });

    return trends;
  }

  /**
   * Get model information for debugging and monitoring
   */
  getModelInfo(): Record<string, MLModelConfig> {
    return {
      costOverrun: this.costOverrunModel,
      delay: this.delayModel,
      environmental: this.environmentalModel,
      resource: this.resourceModel
    };
  }

  /**
   * Update model configuration (for model retraining)
   */
  updateModelConfig(category: string, config: Partial<MLModelConfig>): void {
    switch (category) {
      case 'costOverrun':
        this.costOverrunModel = { ...this.costOverrunModel, ...config };
        break;
      case 'delay':
        this.delayModel = { ...this.delayModel, ...config };
        break;
      case 'environmental':
        this.environmentalModel = { ...this.environmentalModel, ...config };
        break;
      case 'resource':
        this.resourceModel = { ...this.resourceModel, ...config };
        break;
      default:
        throw new Error(`Unknown model category: ${category}`);
    }
  }
}