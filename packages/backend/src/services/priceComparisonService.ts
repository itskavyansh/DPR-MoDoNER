import { HistoricalDataRepository } from '../repositories/historicalDataRepository';
import { CostNormalizationService } from './costNormalizationService';
import { 
  PriceComparisonResult, 
  PriceFlaggedItem, 
  HistoricalCostItem, 
  PriceBenchmark,
  ExtractedEntity 
} from '@dpr-system/shared';

export interface DPRCostItem {
  category: string;
  description: string;
  unit?: string;
  quantity?: number;
  unitRate: number;
  totalCost: number;
}

export interface PriceAnalysisOptions {
  deviationThreshold: number; // Default 20% (0.20)
  confidenceLevel: number;    // Default 95% (0.95)
  minSampleSize: number;      // Minimum samples for reliable benchmark
  targetYear?: number;
  targetState: string;
  targetDistrict?: string;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  deviationType: 'OVERPRICED' | 'UNDERPRICED' | 'NORMAL';
  deviationPercentage: number;
  confidence: number;
  statisticalSignificance: number;
  recommendation: string;
}

export interface RegionalBenchmarkResult {
  averageRate: number;
  medianRate: number;
  standardDeviation: number;
  sampleSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export class PriceComparisonService {
  constructor(
    private historicalDataRepository: HistoricalDataRepository,
    private costNormalizationService: CostNormalizationService
  ) {}

  /**
   * Compare DPR cost estimates against regional benchmarks
   */
  async compareDPRPrices(
    dprId: string,
    dprCostItems: DPRCostItem[],
    options: PriceAnalysisOptions
  ): Promise<PriceComparisonResult> {
    const flaggedItems: PriceFlaggedItem[] = [];
    let totalDPRCost = 0;
    let totalBenchmarkCost = 0;
    const recommendations: string[] = [];

    for (const item of dprCostItems) {
      totalDPRCost += item.totalCost;

      try {
        // Get regional benchmark for this item
        const benchmark = await this.getRegionalBenchmark(
          item.category,
          item.description,
          options.targetState,
          item.unit
        );

        if (benchmark) {
          // Normalize benchmark rate to current year and region
          const normalizedBenchmark = await this.normalizeBenchmarkRate(
            benchmark,
            options.targetYear || new Date().getFullYear(),
            options.targetState,
            options.targetDistrict
          );

          const benchmarkTotalCost = item.quantity 
            ? normalizedBenchmark * item.quantity 
            : normalizedBenchmark;

          totalBenchmarkCost += benchmarkTotalCost;

          // Detect anomalies
          const anomaly = await this.detectPriceAnomaly(
            item.unitRate,
            normalizedBenchmark,
            benchmark,
            options
          );

          if (anomaly.isAnomaly) {
            flaggedItems.push({
              itemCategory: item.category,
              itemDescription: item.description,
              dprUnitRate: item.unitRate,
              benchmarkUnitRate: normalizedBenchmark,
              deviationPercentage: anomaly.deviationPercentage,
              flagType: anomaly.deviationType as 'OVERPRICED' | 'UNDERPRICED',
              confidence: anomaly.confidence,
              recommendation: anomaly.recommendation
            });
          }
        } else {
          // No benchmark available
          recommendations.push(
            `No benchmark data available for ${item.description} in ${options.targetState}. Manual review recommended.`
          );
        }
      } catch (error) {
        console.error(`Error comparing price for item ${item.description}:`, error);
        recommendations.push(
          `Failed to analyze ${item.description}. Manual review required.`
        );
      }
    }

    // Calculate overall deviation
    const overallDeviationPercentage = totalBenchmarkCost > 0 
      ? ((totalDPRCost - totalBenchmarkCost) / totalBenchmarkCost) * 100
      : 0;

    // Generate cost optimization recommendations
    const optimizationRecommendations = this.generateCostOptimizationSuggestions(
      flaggedItems,
      overallDeviationPercentage
    );
    recommendations.push(...optimizationRecommendations);

    return {
      dprId,
      totalEstimate: totalDPRCost,
      regionalAverage: totalBenchmarkCost,
      deviationPercentage: overallDeviationPercentage,
      flaggedItems,
      recommendations,
      analysisTimestamp: new Date()
    };
  }

  /**
   * Detect price anomalies using statistical models
   */
  private async detectPriceAnomaly(
    dprRate: number,
    benchmarkRate: number,
    benchmark: PriceBenchmark,
    options: PriceAnalysisOptions
  ): Promise<AnomalyDetectionResult> {
    // Calculate deviation percentage
    const deviationPercentage = ((dprRate - benchmarkRate) / benchmarkRate) * 100;
    const absoluteDeviation = Math.abs(deviationPercentage);

    // Check if deviation exceeds threshold
    const exceedsThreshold = absoluteDeviation > (options.deviationThreshold * 100);

    // Calculate statistical significance using z-score
    const zScore = benchmark.standardDeviation && benchmark.standardDeviation > 0
      ? (dprRate - benchmarkRate) / benchmark.standardDeviation
      : 0;

    // Determine confidence based on sample size and z-score
    const confidence = this.calculateConfidence(
      benchmark.sampleSize,
      Math.abs(zScore),
      options.minSampleSize
    );

    // Determine if it's a significant anomaly
    const isStatisticallySignificant = Math.abs(zScore) > 1.96; // 95% confidence
    const isAnomaly = exceedsThreshold && confidence > 0.7;

    // Determine deviation type
    let deviationType: 'OVERPRICED' | 'UNDERPRICED' | 'NORMAL' = 'NORMAL';
    if (isAnomaly) {
      deviationType = deviationPercentage > 0 ? 'OVERPRICED' : 'UNDERPRICED';
    }

    // Generate recommendation
    const recommendation = this.generateAnomalyRecommendation(
      deviationType,
      deviationPercentage,
      confidence,
      benchmark.sampleSize
    );

    return {
      isAnomaly,
      deviationType,
      deviationPercentage,
      confidence,
      statisticalSignificance: Math.abs(zScore),
      recommendation
    };
  }

  /**
   * Calculate regional benchmark for an item
   */
  private async calculateRegionalBenchmark(
    category: string,
    description: string,
    state: string,
    unit?: string
  ): Promise<RegionalBenchmarkResult | null> {
    try {
      // Get historical cost items for this category and region
      const historicalItems = await this.historicalDataRepository.getCostItemsByCategory(
        category,
        state
      );

      // Filter by description similarity and unit
      const relevantItems = historicalItems.filter(item => {
        const descriptionMatch = this.calculateTextSimilarity(
          item.itemDescription.toLowerCase(),
          description.toLowerCase()
        ) > 0.7;
        
        const unitMatch = !unit || !item.unit || item.unit === unit;
        
        return descriptionMatch && unitMatch && item.normalizedUnitRate;
      });

      if (relevantItems.length < 3) {
        return null; // Not enough data for reliable benchmark
      }

      // Calculate statistics
      const rates = relevantItems.map(item => item.normalizedUnitRate!);
      const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const medianRate = this.calculateMedian(rates);
      const standardDeviation = this.calculateStandardDeviation(rates, averageRate);

      // Calculate confidence interval (95%)
      const marginOfError = 1.96 * (standardDeviation / Math.sqrt(rates.length));
      const confidenceInterval = {
        lower: averageRate - marginOfError,
        upper: averageRate + marginOfError
      };

      return {
        averageRate,
        medianRate,
        standardDeviation,
        sampleSize: rates.length,
        confidenceInterval
      };
    } catch (error) {
      console.error('Error calculating regional benchmark:', error);
      return null;
    }
  }

  /**
   * Get regional benchmark from database or calculate if not exists
   */
  private async getRegionalBenchmark(
    category: string,
    description: string,
    state: string,
    unit?: string
  ): Promise<PriceBenchmark | null> {
    // Try to get existing benchmark
    let benchmark = await this.historicalDataRepository.getPriceBenchmark(
      category,
      description,
      state,
      unit
    );

    // If not found, try regional benchmark
    if (!benchmark) {
      benchmark = await this.historicalDataRepository.getPriceBenchmark(
        category,
        description,
        'Northeast India',
        unit
      );
    }

    // If still not found, calculate from historical data
    if (!benchmark) {
      const calculated = await this.calculateRegionalBenchmark(
        category,
        description,
        state,
        unit
      );

      if (calculated) {
        // Create and store new benchmark
        const newBenchmark: Omit<PriceBenchmark, 'id' | 'createdAt'> = {
          itemCategory: category,
          itemDescription: description,
          unit,
          region: state,
          averageUnitRate: calculated.averageRate,
          medianUnitRate: calculated.medianRate,
          minUnitRate: calculated.confidenceInterval.lower,
          maxUnitRate: calculated.confidenceInterval.upper,
          standardDeviation: calculated.standardDeviation,
          sampleSize: calculated.sampleSize,
          lastUpdated: new Date(),
          baseYear: new Date().getFullYear()
        };

        benchmark = await this.historicalDataRepository.createPriceBenchmark(newBenchmark);
      }
    }

    return benchmark;
  }

  /**
   * Normalize benchmark rate for current year and region
   */
  private async normalizeBenchmarkRate(
    benchmark: PriceBenchmark,
    targetYear: number,
    targetState: string,
    targetDistrict?: string
  ): Promise<number> {
    // Create a mock cost item for normalization
    const mockCostItem: HistoricalCostItem = {
      id: 'temp',
      projectId: 'temp',
      itemCategory: benchmark.itemCategory,
      itemDescription: benchmark.itemDescription,
      unit: benchmark.unit,
      unitRate: benchmark.averageUnitRate,
      totalCost: benchmark.averageUnitRate,
      regionalFactor: 1.0,
      inflationFactor: 1.0,
      createdAt: benchmark.createdAt
    };

    const normalization = await this.costNormalizationService.normalizeCostItem(
      mockCostItem,
      targetYear,
      targetState,
      targetDistrict
    );

    return normalization.normalizedUnitRate;
  }

  /**
   * Generate cost optimization suggestions
   */
  private generateCostOptimizationSuggestions(
    flaggedItems: PriceFlaggedItem[],
    overallDeviation: number
  ): string[] {
    const suggestions: string[] = [];

    // Overall cost analysis
    if (overallDeviation > 20) {
      suggestions.push(
        `Overall project cost is ${overallDeviation.toFixed(1)}% above regional average. Consider reviewing major cost components.`
      );
    } else if (overallDeviation < -10) {
      suggestions.push(
        `Project cost is ${Math.abs(overallDeviation).toFixed(1)}% below regional average. Verify if quality standards are maintained.`
      );
    }

    // Category-specific suggestions
    const overpricedCategories = new Map<string, number>();
    const underpricedCategories = new Map<string, number>();

    flaggedItems.forEach(item => {
      if (item.flagType === 'OVERPRICED') {
        overpricedCategories.set(
          item.itemCategory,
          (overpricedCategories.get(item.itemCategory) || 0) + 1
        );
      } else {
        underpricedCategories.set(
          item.itemCategory,
          (underpricedCategories.get(item.itemCategory) || 0) + 1
        );
      }
    });

    // Suggestions for overpriced categories
    overpricedCategories.forEach((count, category) => {
      if (count >= 2) {
        suggestions.push(
          `Multiple ${category} items are overpriced. Consider bulk procurement or alternative suppliers.`
        );
      }
    });

    // High-impact item suggestions
    const highImpactItems = flaggedItems
      .filter(item => Math.abs(item.deviationPercentage) > 50)
      .sort((a, b) => Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage))
      .slice(0, 3);

    highImpactItems.forEach(item => {
      suggestions.push(
        `${item.itemDescription}: ${item.deviationPercentage > 0 ? 'Significantly overpriced' : 'Unusually underpriced'} by ${Math.abs(item.deviationPercentage).toFixed(1)}%. Requires immediate review.`
      );
    });

    return suggestions;
  }

  /**
   * Generate recommendation for anomaly
   */
  private generateAnomalyRecommendation(
    deviationType: 'OVERPRICED' | 'UNDERPRICED' | 'NORMAL',
    deviationPercentage: number,
    confidence: number,
    sampleSize: number
  ): string {
    const absDeviation = Math.abs(deviationPercentage);
    const confidenceText = confidence > 0.9 ? 'high' : confidence > 0.7 ? 'medium' : 'low';

    if (deviationType === 'OVERPRICED') {
      if (absDeviation > 50) {
        return `Significantly overpriced by ${absDeviation.toFixed(1)}% (${confidenceText} confidence). Immediate cost review and supplier negotiation recommended.`;
      } else {
        return `Overpriced by ${absDeviation.toFixed(1)}% (${confidenceText} confidence). Consider alternative suppliers or bulk procurement.`;
      }
    } else if (deviationType === 'UNDERPRICED') {
      if (absDeviation > 30) {
        return `Unusually underpriced by ${absDeviation.toFixed(1)}% (${confidenceText} confidence). Verify quality standards and supplier reliability.`;
      } else {
        return `Below market rate by ${absDeviation.toFixed(1)}% (${confidenceText} confidence). Good value, but ensure quality compliance.`;
      }
    }

    return `Price within normal range (${confidenceText} confidence based on ${sampleSize} samples).`;
  }

  /**
   * Calculate confidence based on sample size and statistical significance
   */
  private calculateConfidence(
    sampleSize: number,
    zScore: number,
    minSampleSize: number
  ): number {
    // Base confidence from sample size
    const sampleConfidence = Math.min(sampleSize / minSampleSize, 1.0);
    
    // Statistical confidence from z-score
    const statisticalConfidence = Math.min(zScore / 2.0, 1.0);
    
    // Combined confidence (weighted average)
    return (sampleConfidence * 0.6) + (statisticalConfidence * 0.4);
  }

  /**
   * Calculate text similarity using simple Jaccard similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate median of an array
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}