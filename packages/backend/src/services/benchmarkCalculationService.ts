import { HistoricalDataRepository } from '../repositories/historicalDataRepository';
import { CostNormalizationService } from './costNormalizationService';
import { PriceBenchmark, HistoricalCostItem } from '@dpr-system/shared';

export interface BenchmarkCalculationOptions {
  minSampleSize: number;
  outlierThreshold: number; // Z-score threshold for outlier removal
  confidenceLevel: number;
  targetYear: number;
  includeOutliers: boolean;
}

export interface BenchmarkStatistics {
  mean: number;
  median: number;
  mode?: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  outliers: number[];
  sampleSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
}

export class BenchmarkCalculationService {
  constructor(
    private historicalDataRepository: HistoricalDataRepository,
    private costNormalizationService: CostNormalizationService
  ) {}

  /**
   * Calculate comprehensive price benchmarks for all categories and regions
   */
  async calculateAllBenchmarks(options: BenchmarkCalculationOptions): Promise<PriceBenchmark[]> {
    console.log('Starting comprehensive benchmark calculation...');
    
    const benchmarks: PriceBenchmark[] = [];
    const states = ['Assam', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'];
    const categories = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'TRANSPORT', 'CONSTRUCTION'];

    for (const state of states) {
      for (const category of categories) {
        try {
          const stateBenchmarks = await this.calculateCategoryBenchmarks(
            category,
            state,
            options
          );
          benchmarks.push(...stateBenchmarks);
        } catch (error) {
          console.error(`Error calculating benchmarks for ${category} in ${state}:`, error);
        }
      }
    }

    // Calculate regional (Northeast India) benchmarks
    for (const category of categories) {
      try {
        const regionalBenchmarks = await this.calculateRegionalBenchmarks(
          category,
          states,
          options
        );
        benchmarks.push(...regionalBenchmarks);
      } catch (error) {
        console.error(`Error calculating regional benchmarks for ${category}:`, error);
      }
    }

    console.log(`Calculated ${benchmarks.length} benchmarks`);
    return benchmarks;
  }

  /**
   * Calculate benchmarks for a specific category and state
   */
  async calculateCategoryBenchmarks(
    category: string,
    state: string,
    options: BenchmarkCalculationOptions
  ): Promise<PriceBenchmark[]> {
    // Get all historical cost items for this category and state
    const historicalItems = await this.historicalDataRepository.getCostItemsByCategory(
      category,
      state
    );

    if (historicalItems.length < options.minSampleSize) {
      console.log(`Insufficient data for ${category} in ${state}: ${historicalItems.length} items`);
      return [];
    }

    // Normalize all items to target year
    const normalizedItems = await this.normalizeHistoricalItems(
      historicalItems,
      options.targetYear,
      state
    );

    // Group items by description similarity
    const itemGroups = this.groupSimilarItems(normalizedItems);
    const benchmarks: PriceBenchmark[] = [];

    for (const [description, items] of itemGroups) {
      if (items.length >= options.minSampleSize) {
        const benchmark = await this.calculateItemBenchmark(
          category,
          description,
          state,
          items,
          options
        );
        if (benchmark) {
          benchmarks.push(benchmark);
        }
      }
    }

    return benchmarks;
  }

  /**
   * Calculate regional benchmarks across multiple states
   */
  async calculateRegionalBenchmarks(
    category: string,
    states: string[],
    options: BenchmarkCalculationOptions
  ): Promise<PriceBenchmark[]> {
    const allItems: HistoricalCostItem[] = [];

    // Collect items from all states
    for (const state of states) {
      const stateItems = await this.historicalDataRepository.getCostItemsByCategory(
        category,
        state
      );
      allItems.push(...stateItems);
    }

    if (allItems.length < options.minSampleSize) {
      return [];
    }

    // Normalize all items (use average regional factors)
    const normalizedItems = await this.normalizeHistoricalItemsRegionally(
      allItems,
      options.targetYear,
      states
    );

    // Group items by description similarity
    const itemGroups = this.groupSimilarItems(normalizedItems);
    const benchmarks: PriceBenchmark[] = [];

    for (const [description, items] of itemGroups) {
      if (items.length >= options.minSampleSize) {
        const benchmark = await this.calculateItemBenchmark(
          category,
          description,
          'Northeast India',
          items,
          options
        );
        if (benchmark) {
          benchmarks.push(benchmark);
        }
      }
    }

    return benchmarks;
  }

  /**
   * Calculate benchmark for a specific item
   */
  private async calculateItemBenchmark(
    category: string,
    description: string,
    region: string,
    items: HistoricalCostItem[],
    options: BenchmarkCalculationOptions
  ): Promise<PriceBenchmark | null> {
    try {
      // Extract unit rates
      const rates = items
        .map(item => item.normalizedUnitRate || item.unitRate)
        .filter(rate => rate > 0);

      if (rates.length < options.minSampleSize) {
        return null;
      }

      // Calculate comprehensive statistics
      const stats = this.calculateStatistics(rates, options);

      // Determine the most common unit
      const units = items.map(item => item.unit).filter(unit => unit);
      const mostCommonUnit = this.getMostFrequent(units);

      // Create benchmark
      const benchmark: Omit<PriceBenchmark, 'id' | 'createdAt'> = {
        itemCategory: category,
        itemDescription: description,
        unit: mostCommonUnit,
        region,
        averageUnitRate: stats.mean,
        medianUnitRate: stats.median,
        minUnitRate: Math.min(...rates),
        maxUnitRate: Math.max(...rates),
        standardDeviation: stats.standardDeviation,
        sampleSize: stats.sampleSize,
        lastUpdated: new Date(),
        baseYear: options.targetYear
      };

      return await this.historicalDataRepository.createPriceBenchmark(benchmark);
    } catch (error) {
      console.error(`Error calculating benchmark for ${description}:`, error);
      return null;
    }
  }

  /**
   * Normalize historical items to target year and state
   */
  private async normalizeHistoricalItems(
    items: HistoricalCostItem[],
    targetYear: number,
    targetState: string
  ): Promise<HistoricalCostItem[]> {
    const normalizedItems: HistoricalCostItem[] = [];

    for (const item of items) {
      try {
        const normalized = await this.costNormalizationService.updateCostItemWithNormalizedValues(
          item,
          targetYear,
          targetState
        );
        normalizedItems.push(normalized);
      } catch (error) {
        console.error(`Error normalizing item ${item.id}:`, error);
        // Use original item if normalization fails
        normalizedItems.push(item);
      }
    }

    return normalizedItems;
  }

  /**
   * Normalize historical items for regional benchmarks
   */
  private async normalizeHistoricalItemsRegionally(
    items: HistoricalCostItem[],
    targetYear: number,
    states: string[]
  ): Promise<HistoricalCostItem[]> {
    const normalizedItems: HistoricalCostItem[] = [];

    for (const item of items) {
      try {
        // Use the item's original state for normalization
        const itemState = states.find(state => 
          // This is a simplified approach - in practice, you'd need to track the item's original state
          Math.random() > 0.5 // Placeholder logic
        ) || states[0];

        const normalized = await this.costNormalizationService.updateCostItemWithNormalizedValues(
          item,
          targetYear,
          itemState
        );
        normalizedItems.push(normalized);
      } catch (error) {
        console.error(`Error normalizing regional item ${item.id}:`, error);
        normalizedItems.push(item);
      }
    }

    return normalizedItems;
  }

  /**
   * Group similar items by description
   */
  private groupSimilarItems(items: HistoricalCostItem[]): Map<string, HistoricalCostItem[]> {
    const groups = new Map<string, HistoricalCostItem[]>();

    for (const item of items) {
      // Normalize description for grouping
      const normalizedDescription = this.normalizeDescription(item.itemDescription);
      
      // Find existing similar group
      let foundGroup = false;
      for (const [existingDescription, existingItems] of groups) {
        if (this.calculateTextSimilarity(normalizedDescription, existingDescription) > 0.8) {
          existingItems.push(item);
          foundGroup = true;
          break;
        }
      }

      // Create new group if no similar group found
      if (!foundGroup) {
        groups.set(normalizedDescription, [item]);
      }
    }

    return groups;
  }

  /**
   * Calculate comprehensive statistics for a dataset
   */
  private calculateStatistics(
    values: number[],
    options: BenchmarkCalculationOptions
  ): BenchmarkStatistics {
    // Remove outliers if specified
    const cleanedValues = options.includeOutliers 
      ? values 
      : this.removeOutliers(values, options.outlierThreshold);

    const n = cleanedValues.length;
    const sorted = [...cleanedValues].sort((a, b) => a - b);

    // Basic statistics
    const mean = cleanedValues.reduce((sum, val) => sum + val, 0) / n;
    const median = this.calculateMedian(sorted);
    
    // Variance and standard deviation
    const variance = cleanedValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);

    // Quartiles
    const q1 = this.calculatePercentile(sorted, 25);
    const q2 = median;
    const q3 = this.calculatePercentile(sorted, 75);

    // Skewness and kurtosis
    const skewness = this.calculateSkewness(cleanedValues, mean, standardDeviation);
    const kurtosis = this.calculateKurtosis(cleanedValues, mean, standardDeviation);

    // Confidence interval
    const marginOfError = this.calculateMarginOfError(
      standardDeviation,
      n,
      options.confidenceLevel
    );

    // Outliers
    const outliers = values.filter(val => !cleanedValues.includes(val));

    return {
      mean,
      median,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      quartiles: { q1, q2, q3 },
      outliers,
      sampleSize: n,
      confidenceInterval: {
        lower: mean - marginOfError,
        upper: mean + marginOfError,
        level: options.confidenceLevel
      }
    };
  }

  /**
   * Remove outliers using Z-score method
   */
  private removeOutliers(values: number[], threshold: number): number[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    return values.filter(val => Math.abs((val - mean) / stdDev) <= threshold);
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Calculate median
   */
  private calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  /**
   * Calculate skewness
   */
  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    const skewSum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * skewSum;
  }

  /**
   * Calculate kurtosis
   */
  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    const kurtSum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurtSum - 
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  /**
   * Calculate margin of error for confidence interval
   */
  private calculateMarginOfError(
    stdDev: number,
    sampleSize: number,
    confidenceLevel: number
  ): number {
    // Critical values for common confidence levels
    const criticalValues: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };

    const criticalValue = criticalValues[confidenceLevel] || 1.96;
    return criticalValue * (stdDev / Math.sqrt(sampleSize));
  }

  /**
   * Normalize description for grouping
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get most frequent item in array
   */
  private getMostFrequent<T>(items: T[]): T | undefined {
    const frequency = new Map<T, number>();
    
    for (const item of items) {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
    
    let maxCount = 0;
    let mostFrequent: T | undefined;
    
    for (const [item, count] of frequency) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }
}