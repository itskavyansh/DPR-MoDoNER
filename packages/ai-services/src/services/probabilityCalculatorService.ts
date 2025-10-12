import { DPRDocument, ProjectFeatures, RiskFactor } from '@dpr-system/shared';

// Types for probability calculation and risk analysis
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

export class ProbabilityCalculatorService {
  private readonly PROBABILITY_WEIGHTS = {
    timeline: 0.25,
    resources: 0.20,
    complexity: 0.25,
    location: 0.15,
    historical: 0.15
  };

  private readonly RISK_THRESHOLDS = {
    low: 0.30,
    medium: 0.50,
    high: 0.70,
    critical: 0.85
  };

  /**
   * Calculate completion probability with detailed breakdown
   */
  async calculateCompletionProbability(
    dpr: DPRDocument, 
    features: ProjectFeatures, 
    riskFactors: RiskFactor[]
  ): Promise<ProbabilityCalculationResult> {
    try {
      // Calculate base probability components
      const timelineScore = this.calculateTimelineScore(features);
      const resourceScore = this.calculateResourceScore(features);
      const complexityScore = this.calculateComplexityScore(features);
      const locationScore = this.calculateLocationScore(features);
      const historicalScore = this.calculateHistoricalScore(features);

      // Calculate weighted base score
      const baseScore = (
        timelineScore * this.PROBABILITY_WEIGHTS.timeline +
        resourceScore * this.PROBABILITY_WEIGHTS.resources +
        complexityScore * this.PROBABILITY_WEIGHTS.complexity +
        locationScore * this.PROBABILITY_WEIGHTS.location +
        historicalScore * this.PROBABILITY_WEIGHTS.historical
      );

      // Calculate risk adjustment
      const riskAdjustment = this.calculateRiskAdjustment(riskFactors);

      // Apply adjustments
      const timelineAdjustment = (timelineScore - 0.7) * this.PROBABILITY_WEIGHTS.timeline;
      const resourceAdjustment = (resourceScore - 0.7) * this.PROBABILITY_WEIGHTS.resources;
      const complexityAdjustment = (complexityScore - 0.7) * this.PROBABILITY_WEIGHTS.complexity;
      const locationAdjustment = (locationScore - 0.7) * this.PROBABILITY_WEIGHTS.location;
      const historicalAdjustment = (historicalScore - 0.7) * this.PROBABILITY_WEIGHTS.historical;

      // Calculate final probability
      const finalScore = Math.min(Math.max(baseScore - riskAdjustment, 0.05), 0.95);
      const completionProbability = Math.round(finalScore * 100);

      return {
        dprId: dpr.id,
        completionProbability,
        probabilityBreakdown: {
          baseScore: Math.round(baseScore * 100),
          timelineAdjustment: Math.round(timelineAdjustment * 100),
          resourceAdjustment: Math.round(resourceAdjustment * 100),
          complexityAdjustment: Math.round(complexityAdjustment * 100),
          locationAdjustment: Math.round(locationAdjustment * 100),
          historicalAdjustment: Math.round(historicalAdjustment * 100),
          riskAdjustment: Math.round(riskAdjustment * 100),
          finalScore: completionProbability
        },
        confidenceLevel: this.calculateConfidenceLevel(features),
        calculationTimestamp: new Date()
      };
    } catch (error) {
      console.error('Error calculating completion probability:', error);
      throw new Error('Failed to calculate completion probability');
    }
  }

  /**
   * Analyze risks and provide detailed risk assessment
   */
  async analyzeRisks(
    dpr: DPRDocument, 
    features: ProjectFeatures, 
    riskFactors: RiskFactor[]
  ): Promise<RiskAnalysisResult> {
    try {
      // Calculate risk scores by category
      const timelineRisk = this.calculateTimelineRisk(features, riskFactors);
      const resourceRisk = this.calculateResourceRisk(features, riskFactors);
      const complexityRisk = this.calculateComplexityRisk(features, riskFactors);
      const environmentalRisk = this.calculateEnvironmentalRisk(features, riskFactors);
      const financialRisk = this.calculateFinancialRisk(features, riskFactors);

      // Calculate overall risk score
      const overallRisk = (
        timelineRisk * 0.25 +
        resourceRisk * 0.20 +
        complexityRisk * 0.25 +
        environmentalRisk * 0.15 +
        financialRisk * 0.15
      );

      // Determine risk level
      const overallRiskLevel = this.determineRiskLevel(overallRisk);

      return {
        dprId: dpr.id,
        overallRiskLevel,
        riskScore: Math.round(overallRisk * 100),
        riskFactors,
        riskBreakdown: {
          timelineRisk: Math.round(timelineRisk * 100),
          resourceRisk: Math.round(resourceRisk * 100),
          complexityRisk: Math.round(complexityRisk * 100),
          environmentalRisk: Math.round(environmentalRisk * 100),
          financialRisk: Math.round(financialRisk * 100),
          overallRisk: Math.round(overallRisk * 100)
        },
        analysisTimestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing risks:', error);
      throw new Error('Failed to analyze risks');
    }
  }

  /**
   * Generate recommendations to improve completion likelihood
   */
  async generateRecommendations(
    dpr: DPRDocument,
    features: ProjectFeatures,
    riskFactors: RiskFactor[],
    currentProbability: number
  ): Promise<RecommendationEngineResult> {
    try {
      const recommendations: CompletionRecommendation[] = [];

      // Timeline-based recommendations
      if (features.estimatedDurationMonths > 24) {
        recommendations.push({
          category: 'TIMELINE',
          priority: 'HIGH',
          recommendation: 'Break project into smaller phases to reduce timeline risk and enable early wins',
          expectedImpact: 15,
          implementationEffort: 'MEDIUM',
          timeframe: '2-4 weeks planning'
        });
      }

      if (features.weatherRiskMonths > 0) {
        recommendations.push({
          category: 'TIMELINE',
          priority: 'MEDIUM',
          recommendation: 'Adjust project schedule to minimize weather-related delays during monsoon season',
          expectedImpact: 8,
          implementationEffort: 'LOW',
          timeframe: '1-2 weeks planning'
        });
      }

      // Resource-based recommendations
      if (features.resourceComplexityScore > 2.0) {
        recommendations.push({
          category: 'RESOURCE',
          priority: 'HIGH',
          recommendation: 'Secure specialized resources early and establish backup suppliers',
          expectedImpact: 12,
          implementationEffort: 'HIGH',
          timeframe: '4-8 weeks procurement'
        });
      }

      if (features.totalCost > 50000000) { // 5 crores
        recommendations.push({
          category: 'RESOURCE',
          priority: 'MEDIUM',
          recommendation: 'Implement phased funding approach to reduce financial risk',
          expectedImpact: 10,
          implementationEffort: 'MEDIUM',
          timeframe: '2-3 weeks financial planning'
        });
      }

      // Complexity-based recommendations
      if (features.technicalComplexityScore > 2.0) {
        recommendations.push({
          category: 'COMPLEXITY',
          priority: 'HIGH',
          recommendation: 'Engage technical experts and conduct detailed feasibility studies before implementation',
          expectedImpact: 18,
          implementationEffort: 'HIGH',
          timeframe: '6-12 weeks study period'
        });
      }

      if (features.regulatoryComplexityScore > 2.0) {
        recommendations.push({
          category: 'COMPLEXITY',
          priority: 'HIGH',
          recommendation: 'Start regulatory approval processes immediately and engage compliance consultants',
          expectedImpact: 20,
          implementationEffort: 'MEDIUM',
          timeframe: '8-16 weeks approval process'
        });
      }

      // Location-based recommendations
      if (features.accessibilityScore < 2.0) {
        recommendations.push({
          category: 'GENERAL',
          priority: 'MEDIUM',
          recommendation: 'Improve site accessibility infrastructure before main construction begins',
          expectedImpact: 7,
          implementationEffort: 'HIGH',
          timeframe: '4-8 weeks infrastructure work'
        });
      }

      // Risk mitigation recommendations
      const highRiskFactors = riskFactors.filter(rf => rf.impact === 'HIGH');
      if (highRiskFactors.length > 2) {
        recommendations.push({
          category: 'RISK_MITIGATION',
          priority: 'HIGH',
          recommendation: 'Implement comprehensive risk monitoring and early warning systems',
          expectedImpact: 15,
          implementationEffort: 'MEDIUM',
          timeframe: '2-4 weeks setup'
        });
      }

      // General recommendations based on historical success rates
      if (features.regionSuccessRate < 0.7) {
        recommendations.push({
          category: 'GENERAL',
          priority: 'MEDIUM',
          recommendation: 'Study successful similar projects in the region and adopt proven practices',
          expectedImpact: 8,
          implementationEffort: 'LOW',
          timeframe: '1-2 weeks research'
        });
      }

      // Sort recommendations by priority and expected impact
      recommendations.sort((a, b) => {
        const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expectedImpact - a.expectedImpact;
      });

      // Calculate potential improvement
      const potentialImprovement = recommendations
        .slice(0, 5) // Top 5 recommendations
        .reduce((sum, rec) => sum + rec.expectedImpact, 0);

      // Generate prioritized actions
      const prioritizedActions = recommendations
        .slice(0, 3)
        .map(rec => rec.recommendation);

      return {
        dprId: dpr.id,
        currentProbability,
        potentialImprovement: Math.min(potentialImprovement, 25), // Cap at 25% improvement
        recommendations: recommendations.slice(0, 8), // Limit to top 8 recommendations
        prioritizedActions,
        generatedTimestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  // Private helper methods for score calculations

  private calculateTimelineScore(features: ProjectFeatures): number {
    let score = 0.8; // Base timeline score

    // Adjust for duration
    if (features.estimatedDurationMonths <= 12) score += 0.1;
    else if (features.estimatedDurationMonths <= 24) score += 0.05;
    else if (features.estimatedDurationMonths > 36) score -= 0.15;

    // Adjust for seasonality
    score -= (features.seasonalityFactor - 1) * 0.1;

    // Adjust for weather risk
    score -= (features.weatherRiskMonths / 12) * 0.1;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  private calculateResourceScore(features: ProjectFeatures): number {
    let score = 0.75; // Base resource score

    // Adjust for complexity
    score -= (features.resourceComplexityScore - 1) * 0.1;
    score -= (features.laborIntensityScore - 1) * 0.08;

    // Adjust for cost per month (higher cost per month indicates resource intensity)
    if (features.costPerMonth > 5000000) score -= 0.1; // 50 lakhs per month
    if (features.costPerMonth > 10000000) score -= 0.1; // 1 crore per month

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  private calculateComplexityScore(features: ProjectFeatures): number {
    let score = 0.8; // Base complexity score

    // Adjust for different complexity factors
    score -= (features.technicalComplexityScore - 1) * 0.12;
    score -= (features.environmentalComplexityScore - 1) * 0.08;
    score -= (features.regulatoryComplexityScore - 1) * 0.15;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  private calculateLocationScore(features: ProjectFeatures): number {
    let score = 0.7; // Base location score

    // Adjust for accessibility and infrastructure
    score += (features.accessibilityScore - 2) * 0.1;
    score += (features.infrastructureScore - 2) * 0.12;
    score -= (features.remotenessScore - 1) * 0.08;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  private calculateHistoricalScore(features: ProjectFeatures): number {
    let score = 0.7; // Base historical score

    // Adjust based on historical success rates
    score = score * 0.3 + features.regionSuccessRate * 0.4 + features.categorySuccessRate * 0.3;

    // Adjust for similar projects count (more data = higher confidence)
    if (features.similarProjectsCount > 20) score += 0.05;
    else if (features.similarProjectsCount < 5) score -= 0.1;

    return Math.min(Math.max(score, 0.1), 1.0);
  }

  private calculateRiskAdjustment(riskFactors: RiskFactor[]): number {
    let adjustment = 0;

    for (const risk of riskFactors) {
      let riskImpact = 0;
      switch (risk.impact) {
        case 'HIGH':
          riskImpact = 0.15;
          break;
        case 'MEDIUM':
          riskImpact = 0.08;
          break;
        case 'LOW':
          riskImpact = 0.03;
          break;
      }
      adjustment += riskImpact * risk.probability;
    }

    return Math.min(adjustment, 0.4); // Cap total risk adjustment at 40%
  }

  private calculateTimelineRisk(features: ProjectFeatures, riskFactors: RiskFactor[]): number {
    let risk = 0.2; // Base timeline risk

    if (features.estimatedDurationMonths > 24) risk += 0.2;
    if (features.estimatedDurationMonths > 36) risk += 0.2;
    if (features.weatherRiskMonths > 0) risk += 0.15;

    // Add risk from timeline-related risk factors
    const timelineRiskFactors = riskFactors.filter(rf => rf.type === 'TIMELINE');
    for (const rf of timelineRiskFactors) {
      risk += rf.probability * (rf.impact === 'HIGH' ? 0.3 : rf.impact === 'MEDIUM' ? 0.2 : 0.1);
    }

    return Math.min(risk, 1.0);
  }

  private calculateResourceRisk(features: ProjectFeatures, riskFactors: RiskFactor[]): number {
    let risk = 0.15; // Base resource risk

    if (features.resourceComplexityScore > 2.0) risk += 0.2;
    if (features.laborIntensityScore > 2.0) risk += 0.15;

    // Add risk from resource-related risk factors
    const resourceRiskFactors = riskFactors.filter(rf => rf.type === 'RESOURCE');
    for (const rf of resourceRiskFactors) {
      risk += rf.probability * (rf.impact === 'HIGH' ? 0.3 : rf.impact === 'MEDIUM' ? 0.2 : 0.1);
    }

    return Math.min(risk, 1.0);
  }

  private calculateComplexityRisk(features: ProjectFeatures, riskFactors: RiskFactor[]): number {
    let risk = 0.1; // Base complexity risk

    risk += (features.technicalComplexityScore - 1) * 0.15;
    risk += (features.environmentalComplexityScore - 1) * 0.1;
    risk += (features.regulatoryComplexityScore - 1) * 0.2;

    // Add risk from complexity-related risk factors
    const complexityRiskFactors = riskFactors.filter(rf => rf.type === 'COMPLEXITY');
    for (const rf of complexityRiskFactors) {
      risk += rf.probability * (rf.impact === 'HIGH' ? 0.35 : rf.impact === 'MEDIUM' ? 0.25 : 0.15);
    }

    return Math.min(risk, 1.0);
  }

  private calculateEnvironmentalRisk(features: ProjectFeatures, riskFactors: RiskFactor[]): number {
    let risk = 0.1; // Base environmental risk

    if (features.remotenessScore > 2.0) risk += 0.15;
    if (features.accessibilityScore < 2.0) risk += 0.1;
    if (features.weatherRiskMonths > 0) risk += 0.1;

    // Add risk from environmental risk factors
    const envRiskFactors = riskFactors.filter(rf => rf.type === 'ENVIRONMENTAL');
    for (const rf of envRiskFactors) {
      risk += rf.probability * (rf.impact === 'HIGH' ? 0.2 : rf.impact === 'MEDIUM' ? 0.12 : 0.06);
    }

    return Math.min(risk, 1.0);
  }

  private calculateFinancialRisk(features: ProjectFeatures, riskFactors: RiskFactor[]): number {
    let risk = 0.1; // Base financial risk

    if (features.totalCost > 100000000) risk += 0.2; // 10 crores
    if (features.totalCost > 500000000) risk += 0.2; // 50 crores
    if (features.costPerMonth > 10000000) risk += 0.15; // 1 crore per month

    // Add risk from financial risk factors
    const financialRiskFactors = riskFactors.filter(rf => rf.type === 'FINANCIAL');
    for (const rf of financialRiskFactors) {
      risk += rf.probability * (rf.impact === 'HIGH' ? 0.4 : rf.impact === 'MEDIUM' ? 0.25 : 0.15);
    }

    return Math.min(risk, 1.0);
  }

  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= this.RISK_THRESHOLDS.critical) return 'CRITICAL';
    if (riskScore >= this.RISK_THRESHOLDS.high) return 'HIGH';
    if (riskScore >= this.RISK_THRESHOLDS.medium) return 'MEDIUM';
    return 'LOW';
  }

  private calculateConfidenceLevel(features: ProjectFeatures): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on data availability and quality
    if (features.similarProjectsCount > 20) confidence += 0.1;
    else if (features.similarProjectsCount < 5) confidence -= 0.2;

    if (features.regionSuccessRate > 0.8) confidence += 0.05;
    else if (features.regionSuccessRate < 0.6) confidence -= 0.1;

    // Reduce confidence for extreme values
    if (features.estimatedDurationMonths > 48) confidence -= 0.1;
    if (features.technicalComplexityScore > 2.5) confidence -= 0.1;
    if (features.accessibilityScore < 1.5) confidence -= 0.1;

    return Math.min(Math.max(confidence, 0.3), 0.95);
  }
}