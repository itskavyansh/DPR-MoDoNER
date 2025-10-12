import { DPRDocument, HistoricalProject } from '@dpr-system/shared';

// Types for completion feasibility prediction
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
}

export interface MLModelConfig {
  modelType: 'RANDOM_FOREST' | 'GRADIENT_BOOSTING' | 'NEURAL_NETWORK';
  hyperparameters: Record<string, any>;
  featureImportance: Record<string, number>;
  trainingMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    mse: number;
  };
}

export class CompletionFeasibilityService {
  private models: Map<string, MLModelConfig> = new Map();
  private historicalData: HistoricalProject[] = [];
  private featureWeights: Record<string, number> = {};

  constructor() {
    this.initializeModels();
    this.loadFeatureWeights();
  }

  /**
   * Predict completion feasibility for a DPR
   */
  async predictCompletionFeasibility(dpr: DPRDocument): Promise<CompletionFeasibilityResult> {
    try {
      // Extract features from DPR
      const features = await this.extractProjectFeatures(dpr);
      
      // Generate base prediction
      const baseProbability = await this.calculateBaseProbability(features);
      
      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(features, dpr);
      
      // Adjust probability based on risks
      const adjustedProbability = this.adjustProbabilityForRisks(baseProbability, riskFactors);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(riskFactors, features);
      
      // Create simulation scenarios
      const simulationData = await this.generateSimulationScenarios(features);
      
      return {
        dprId: dpr.id,
        completionProbability: Math.round(adjustedProbability * 100) / 100,
        riskFactors,
        recommendations,
        simulationData,
        analysisTimestamp: new Date(),
        confidence: this.calculateConfidence(features)
      };
    } catch (error) {
      console.error('Error predicting completion feasibility:', error);
      // Re-throw the original error if it's a known validation error
      if (error instanceof Error && error.message === 'DPR content not available for feature extraction') {
        throw error;
      }
      throw new Error('Failed to predict completion feasibility');
    }
  }

  /**
   * Extract relevant features from DPR for ML prediction
   */
  private async extractProjectFeatures(dpr: DPRDocument): Promise<ProjectFeatures> {
    const extractedContent = dpr.extractedContent;
    if (!extractedContent) {
      throw new Error('DPR content not available for feature extraction');
    }

    // Extract timeline features
    const timelineFeatures = this.extractTimelineFeatures(extractedContent);
    
    // Extract resource features
    const resourceFeatures = this.extractResourceFeatures(extractedContent);
    
    // Extract complexity features
    const complexityFeatures = this.extractComplexityFeatures(extractedContent);
    
    // Extract location features
    const locationFeatures = await this.extractLocationFeatures(extractedContent);
    
    // Get historical context
    const historicalContext = await this.getHistoricalContext(extractedContent);

    return {
      ...timelineFeatures,
      ...resourceFeatures,
      ...complexityFeatures,
      ...locationFeatures,
      ...historicalContext
    };
  }

  /**
   * Extract timeline-related features
   */
  private extractTimelineFeatures(content: any): Partial<ProjectFeatures> {
    // Find timeline section
    const timelineSection = content.sections.find((s: any) => s.type === 'TIMELINE');
    
    let estimatedDurationMonths = 12; // Default
    let seasonalityFactor = 1.0;
    let weatherRiskMonths = 0;

    if (timelineSection) {
      // Extract duration from timeline content
      const durationMatch = timelineSection.content.match(/(\d+)\s*(month|year)/i);
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        estimatedDurationMonths = durationMatch[2].toLowerCase() === 'year' ? value * 12 : value;
      }

      // Check for monsoon/weather mentions
      if (timelineSection.content.toLowerCase().includes('monsoon') || 
          timelineSection.content.toLowerCase().includes('weather')) {
        weatherRiskMonths = 4; // Typical monsoon period
        seasonalityFactor = 1.2;
      }
    }

    return {
      estimatedDurationMonths,
      seasonalityFactor,
      weatherRiskMonths
    };
  }

  /**
   * Extract resource-related features
   */
  private extractResourceFeatures(content: any): Partial<ProjectFeatures> {
    // Find cost estimate section
    const costSection = content.sections.find((s: any) => s.type === 'COST_ESTIMATE');
    const resourceSection = content.sections.find((s: any) => s.type === 'RESOURCES');
    
    let totalCost = 0;
    let resourceComplexityScore = 1.0;
    let laborIntensityScore = 1.0;

    // Extract total cost
    if (content.structuredData?.totalCost) {
      totalCost = content.structuredData.totalCost;
    } else if (costSection) {
      // Try to extract cost from text
      const costMatch = costSection.content.match(/(?:total|cost|amount).*?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|crore|rupee)/i);
      if (costMatch) {
        const value = parseFloat(costMatch[1].replace(/,/g, ''));
        totalCost = costSection.content.toLowerCase().includes('crore') ? value * 10000000 : value * 100000;
      }
    }

    // Analyze resource complexity
    if (resourceSection) {
      const resourceText = resourceSection.content.toLowerCase();
      
      // Check for complex resources
      const complexResources = ['specialized', 'technical', 'expert', 'skilled', 'imported', 'custom'];
      resourceComplexityScore = 1 + (complexResources.filter(r => resourceText.includes(r)).length * 0.2);
      
      // Check for labor intensity
      const laborKeywords = ['manpower', 'labor', 'worker', 'staff', 'personnel'];
      laborIntensityScore = 1 + (laborKeywords.filter(k => resourceText.includes(k)).length * 0.15);
    }

    const costPerMonth = totalCost > 0 && content.estimatedDurationMonths > 0 ? 
      totalCost / content.estimatedDurationMonths : 0;

    return {
      totalCost,
      costPerMonth,
      resourceComplexityScore: Math.min(resourceComplexityScore, 3.0),
      laborIntensityScore: Math.min(laborIntensityScore, 2.5)
    };
  }

  /**
   * Extract complexity-related features
   */
  private extractComplexityFeatures(content: any): Partial<ProjectFeatures> {
    const techSection = content.sections.find((s: any) => s.type === 'TECHNICAL_SPECS');
    const resourceSection = content.sections.find((s: any) => s.type === 'RESOURCES');
    const allContent = content.sections.map((s: any) => s.content).join(' ').toLowerCase();
    
    let technicalComplexityScore = 1.0;
    let environmentalComplexityScore = 1.0;
    let regulatoryComplexityScore = 1.0;

    // Technical complexity indicators
    const techKeywords = ['advanced', 'complex', 'sophisticated', 'specialized', 'innovative', 'cutting-edge', 'technical', 'equipment'];
    technicalComplexityScore = 1 + (techKeywords.filter(k => allContent.includes(k)).length * 0.25);

    // Environmental complexity indicators
    const envKeywords = ['environmental', 'forest', 'wildlife', 'river', 'mountain', 'protected', 'sensitive', 'clearance'];
    environmentalComplexityScore = 1 + (envKeywords.filter(k => allContent.includes(k)).length * 0.2);

    // Regulatory complexity indicators
    const regKeywords = ['clearance', 'approval', 'permit', 'license', 'compliance', 'regulation', 'required'];
    regulatoryComplexityScore = 1 + (regKeywords.filter(k => allContent.includes(k)).length * 0.3);

    return {
      technicalComplexityScore: Math.min(technicalComplexityScore, 3.0),
      environmentalComplexityScore: Math.min(environmentalComplexityScore, 2.5),
      regulatoryComplexityScore: Math.min(regulatoryComplexityScore, 3.0)
    };
  }

  /**
   * Extract location-related features
   */
  private async extractLocationFeatures(content: any): Promise<Partial<ProjectFeatures>> {
    let accessibilityScore = 2.0; // Default medium accessibility
    let infrastructureScore = 2.0; // Default medium infrastructure
    let remotenessScore = 1.0; // Default not remote

    // Extract location information
    const locationEntities = content.entities.filter((e: any) => e.type === 'LOCATION');
    const allContent = content.sections.map((s: any) => s.content).join(' ').toLowerCase();

    // Accessibility indicators
    const accessKeywords = ['remote', 'inaccessible', 'difficult', 'mountainous', 'tribal'];
    const accessCount = accessKeywords.filter(k => allContent.includes(k)).length;
    accessibilityScore = Math.max(1.0, 3.0 - (accessCount * 0.4));

    // Infrastructure indicators
    const infraKeywords = ['road', 'railway', 'airport', 'connectivity', 'power', 'water'];
    const infraCount = infraKeywords.filter(k => allContent.includes(k)).length;
    infrastructureScore = Math.min(3.0, 1.0 + (infraCount * 0.3));

    // Remoteness indicators
    const remoteKeywords = ['remote', 'isolated', 'far', 'distant', 'interior'];
    remotenessScore = 1 + (remoteKeywords.filter(k => allContent.includes(k)).length * 0.3);

    return {
      accessibilityScore: Math.min(Math.max(accessibilityScore, 1.0), 3.0),
      infrastructureScore: Math.min(Math.max(infrastructureScore, 1.0), 3.0),
      remotenessScore: Math.min(remotenessScore, 3.0)
    };
  }

  /**
   * Get historical context for the project
   */
  private async getHistoricalContext(content: any): Promise<Partial<ProjectFeatures>> {
    // This would typically query a database of historical projects
    // For now, we'll use mock data based on content analysis
    
    const allContent = content.sections.map((s: any) => s.content).join(' ').toLowerCase();
    
    // Determine project category
    let category = 'infrastructure';
    if (allContent.includes('road') || allContent.includes('highway')) category = 'road';
    else if (allContent.includes('water') || allContent.includes('irrigation')) category = 'water';
    else if (allContent.includes('building') || allContent.includes('construction')) category = 'building';
    else if (allContent.includes('power') || allContent.includes('energy')) category = 'energy';

    // Mock historical success rates (would come from database)
    const categorySuccessRates: Record<string, number> = {
      'road': 0.75,
      'water': 0.68,
      'building': 0.82,
      'energy': 0.71,
      'infrastructure': 0.73
    };

    return {
      similarProjectsCount: Math.floor(Math.random() * 50) + 10, // Mock data
      regionSuccessRate: 0.72, // Mock Northeast India success rate
      categorySuccessRate: categorySuccessRates[category] || 0.73
    };
  }

  /**
   * Calculate base completion probability using ML model
   */
  private async calculateBaseProbability(features: ProjectFeatures): Promise<number> {
    // This is a simplified ML prediction algorithm
    // In production, this would use trained models (Random Forest, etc.)
    
    let probability = 0.7; // Base probability
    
    // Timeline factors
    if (features.estimatedDurationMonths > 24) probability -= 0.1;
    if (features.estimatedDurationMonths > 36) probability -= 0.1;
    probability -= (features.weatherRiskMonths / 12) * 0.05;
    probability *= features.seasonalityFactor > 1 ? 0.95 : 1.0;
    
    // Resource factors
    if (features.resourceComplexityScore > 2.0) probability -= 0.08;
    if (features.laborIntensityScore > 2.0) probability -= 0.06;
    
    // Complexity factors
    probability -= (features.technicalComplexityScore - 1) * 0.05;
    probability -= (features.environmentalComplexityScore - 1) * 0.04;
    probability -= (features.regulatoryComplexityScore - 1) * 0.06;
    
    // Location factors
    probability -= (3 - features.accessibilityScore) * 0.03;
    probability -= (3 - features.infrastructureScore) * 0.04;
    probability -= (features.remotenessScore - 1) * 0.05;
    
    // Historical context
    probability = probability * 0.7 + features.regionSuccessRate * 0.2 + features.categorySuccessRate * 0.1;
    
    return Math.min(Math.max(probability, 0.1), 0.95);
  }

  /**
   * Identify risk factors that could affect completion
   */
  private async identifyRiskFactors(features: ProjectFeatures, dpr: DPRDocument): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Timeline risks
    if (features.estimatedDurationMonths > 24) {
      riskFactors.push({
        type: 'TIMELINE',
        description: 'Extended project duration increases risk of delays',
        impact: features.estimatedDurationMonths > 36 ? 'HIGH' : 'MEDIUM',
        probability: 0.6,
        mitigation: 'Break project into phases, implement milestone-based monitoring'
      });
    }

    if (features.weatherRiskMonths > 0) {
      riskFactors.push({
        type: 'ENVIRONMENTAL',
        description: 'Monsoon season may cause construction delays',
        impact: 'MEDIUM',
        probability: 0.7,
        mitigation: 'Plan construction activities around monsoon season, prepare weather contingencies'
      });
    }

    // Resource risks
    if (features.resourceComplexityScore > 2.0) {
      riskFactors.push({
        type: 'RESOURCE',
        description: 'Complex resource requirements may cause procurement delays',
        impact: 'MEDIUM',
        probability: 0.5,
        mitigation: 'Early procurement planning, identify alternative suppliers'
      });
    }

    // Complexity risks
    if (features.technicalComplexityScore > 2.0) {
      riskFactors.push({
        type: 'COMPLEXITY',
        description: 'High technical complexity increases implementation risk',
        impact: 'HIGH',
        probability: 0.6,
        mitigation: 'Engage technical experts, conduct detailed feasibility studies'
      });
    }

    if (features.regulatoryComplexityScore > 2.0) {
      riskFactors.push({
        type: 'COMPLEXITY',
        description: 'Multiple regulatory approvals required',
        impact: 'HIGH',
        probability: 0.8,
        mitigation: 'Start approval processes early, engage regulatory consultants'
      });
    }

    // Always add at least one complexity risk for projects with any complexity indicators
    if (features.technicalComplexityScore > 1.5 || features.environmentalComplexityScore > 1.5 || features.regulatoryComplexityScore > 1.5) {
      const hasComplexityRisk = riskFactors.some(rf => rf.type === 'COMPLEXITY');
      if (!hasComplexityRisk) {
        riskFactors.push({
          type: 'COMPLEXITY',
          description: 'Project complexity requires careful management and monitoring',
          impact: 'MEDIUM',
          probability: 0.5,
          mitigation: 'Implement robust project management practices and regular monitoring'
        });
      }
    }

    // Location risks
    if (features.accessibilityScore < 2.0) {
      riskFactors.push({
        type: 'ENVIRONMENTAL',
        description: 'Poor site accessibility may increase costs and delays',
        impact: 'MEDIUM',
        probability: 0.7,
        mitigation: 'Improve access roads, plan for higher transportation costs'
      });
    }

    // Financial risks
    if (features.totalCost > 50000000) { // 5 crores
      riskFactors.push({
        type: 'FINANCIAL',
        description: 'High project cost increases funding and cash flow risks',
        impact: 'MEDIUM',
        probability: 0.4,
        mitigation: 'Secure funding commitments, implement phased funding approach'
      });
    }

    return riskFactors;
  }

  /**
   * Adjust probability based on identified risks
   */
  private adjustProbabilityForRisks(baseProbability: number, riskFactors: RiskFactor[]): number {
    let adjustedProbability = baseProbability;
    
    for (const risk of riskFactors) {
      let adjustment = 0;
      
      switch (risk.impact) {
        case 'HIGH':
          adjustment = risk.probability * 0.15;
          break;
        case 'MEDIUM':
          adjustment = risk.probability * 0.08;
          break;
        case 'LOW':
          adjustment = risk.probability * 0.03;
          break;
      }
      
      adjustedProbability -= adjustment;
    }
    
    return Math.min(Math.max(adjustedProbability, 0.1), 0.95);
  }

  /**
   * Generate recommendations to improve completion likelihood
   */
  private async generateRecommendations(riskFactors: RiskFactor[], features: ProjectFeatures): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Add risk-specific recommendations
    riskFactors.forEach(risk => {
      recommendations.push(risk.mitigation);
    });
    
    // Add general recommendations based on features
    if (features.estimatedDurationMonths > 18) {
      recommendations.push('Consider breaking the project into smaller, manageable phases');
    }
    
    if (features.resourceComplexityScore > 1.5) {
      recommendations.push('Conduct detailed resource availability assessment before project start');
    }
    
    if (features.accessibilityScore < 2.5) {
      recommendations.push('Invest in improving site accessibility to reduce logistics costs');
    }
    
    if (features.regionSuccessRate < 0.7) {
      recommendations.push('Study successful similar projects in the region for best practices');
    }
    
    // Remove duplicates and limit to top 5
    return [...new Set(recommendations)].slice(0, 5);
  }

  /**
   * Generate simulation scenarios for what-if analysis
   */
  private async generateSimulationScenarios(features: ProjectFeatures): Promise<SimulationScenario[]> {
    const baseScenario: SimulationScenario = {
      scenarioName: 'Current Plan',
      adjustedTimeline: features.estimatedDurationMonths,
      adjustedResources: features.totalCost,
      adjustedComplexity: features.technicalComplexityScore,
      predictedProbability: await this.calculateBaseProbability(features)
    };
    
    const scenarios: SimulationScenario[] = [baseScenario];
    
    // Optimistic scenario (10% faster, 5% more resources)
    const optimisticFeatures = { ...features };
    optimisticFeatures.estimatedDurationMonths *= 0.9;
    optimisticFeatures.totalCost *= 1.05;
    optimisticFeatures.resourceComplexityScore *= 0.9;
    
    scenarios.push({
      scenarioName: 'Optimistic (10% faster timeline)',
      adjustedTimeline: optimisticFeatures.estimatedDurationMonths,
      adjustedResources: optimisticFeatures.totalCost,
      adjustedComplexity: optimisticFeatures.technicalComplexityScore,
      predictedProbability: await this.calculateBaseProbability(optimisticFeatures)
    });
    
    // Conservative scenario (20% longer, 10% more resources)
    const conservativeFeatures = { ...features };
    conservativeFeatures.estimatedDurationMonths *= 1.2;
    conservativeFeatures.totalCost *= 1.1;
    conservativeFeatures.resourceComplexityScore *= 1.1;
    
    scenarios.push({
      scenarioName: 'Conservative (20% longer timeline)',
      adjustedTimeline: conservativeFeatures.estimatedDurationMonths,
      adjustedResources: conservativeFeatures.totalCost,
      adjustedComplexity: conservativeFeatures.technicalComplexityScore,
      predictedProbability: await this.calculateBaseProbability(conservativeFeatures)
    });
    
    // High-resource scenario (same timeline, 25% more resources)
    const highResourceFeatures = { ...features };
    highResourceFeatures.totalCost *= 1.25;
    highResourceFeatures.resourceComplexityScore *= 0.8;
    
    scenarios.push({
      scenarioName: 'High Resource (25% more budget)',
      adjustedTimeline: highResourceFeatures.estimatedDurationMonths,
      adjustedResources: highResourceFeatures.totalCost,
      adjustedComplexity: highResourceFeatures.technicalComplexityScore,
      predictedProbability: await this.calculateBaseProbability(highResourceFeatures)
    });
    
    return scenarios;
  }

  /**
   * Calculate confidence score for the prediction
   */
  private calculateConfidence(features: ProjectFeatures): number {
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence for extreme values
    if (features.estimatedDurationMonths > 36) confidence -= 0.1;
    if (features.technicalComplexityScore > 2.5) confidence -= 0.1;
    if (features.similarProjectsCount < 5) confidence -= 0.15;
    if (features.accessibilityScore < 1.5) confidence -= 0.1;
    
    return Math.min(Math.max(confidence, 0.3), 0.95);
  }

  /**
   * Initialize ML models (placeholder for actual model loading)
   */
  private initializeModels(): void {
    // In production, this would load trained models from files
    this.models.set('completion_predictor', {
      modelType: 'RANDOM_FOREST',
      hyperparameters: {
        n_estimators: 100,
        max_depth: 10,
        min_samples_split: 5
      },
      featureImportance: {
        'estimatedDurationMonths': 0.15,
        'totalCost': 0.12,
        'technicalComplexityScore': 0.18,
        'accessibilityScore': 0.10,
        'regionSuccessRate': 0.20,
        'resourceComplexityScore': 0.08,
        'regulatoryComplexityScore': 0.17
      },
      trainingMetrics: {
        accuracy: 0.82,
        precision: 0.79,
        recall: 0.85,
        f1Score: 0.82,
        mse: 0.045
      }
    });
  }

  /**
   * Load feature weights for prediction
   */
  private loadFeatureWeights(): void {
    this.featureWeights = {
      timeline: 0.25,
      resources: 0.20,
      complexity: 0.30,
      location: 0.15,
      historical: 0.10
    };
  }

  /**
   * Load historical project data (placeholder)
   */
  async loadHistoricalData(): Promise<void> {
    // In production, this would load from database
    // For now, we'll use the existing data structure
    console.log('Historical data loading would be implemented here');
  }
}