import { HistoricalDataRepository } from '../repositories/historicalDataRepository';
import { HistoricalCostItem, RegionalCostFactor, InflationFactor } from '@dpr-system/shared';

export interface NormalizationResult {
  normalizedUnitRate: number;
  normalizedTotalCost: number;
  regionalFactor: number;
  inflationFactor: number;
  adjustmentDetails: {
    originalUnitRate: number;
    regionalAdjustment: number;
    inflationAdjustment: number;
    finalRate: number;
  };
}

export class CostNormalizationService {
  constructor(private historicalDataRepository: HistoricalDataRepository) {}

  /**
   * Normalize cost item for inflation and regional factors
   */
  async normalizeCostItem(
    costItem: HistoricalCostItem,
    targetYear: number = new Date().getFullYear(),
    targetState: string,
    targetDistrict?: string
  ): Promise<NormalizationResult> {
    // Get regional cost factor
    const regionalFactor = await this.getRegionalCostFactor(
      costItem.itemCategory,
      targetState,
      targetDistrict,
      new Date()
    );

    // Get inflation factor
    const inflationFactor = await this.getInflationFactor(
      costItem.itemCategory,
      targetYear,
      2020 // Base year
    );

    // Calculate normalized rates
    const regionalAdjustment = costItem.unitRate * regionalFactor;
    const inflationAdjustment = regionalAdjustment * inflationFactor;
    const normalizedUnitRate = inflationAdjustment;
    const normalizedTotalCost = costItem.quantity 
      ? normalizedUnitRate * costItem.quantity 
      : normalizedUnitRate;

    return {
      normalizedUnitRate,
      normalizedTotalCost,
      regionalFactor,
      inflationFactor,
      adjustmentDetails: {
        originalUnitRate: costItem.unitRate,
        regionalAdjustment,
        inflationAdjustment,
        finalRate: normalizedUnitRate
      }
    };
  }

  /**
   * Batch normalize multiple cost items
   */
  async batchNormalizeCostItems(
    costItems: HistoricalCostItem[],
    targetYear: number = new Date().getFullYear(),
    targetState: string,
    targetDistrict?: string
  ): Promise<Map<string, NormalizationResult>> {
    const results = new Map<string, NormalizationResult>();

    for (const item of costItems) {
      try {
        const normalized = await this.normalizeCostItem(
          item,
          targetYear,
          targetState,
          targetDistrict
        );
        results.set(item.id, normalized);
      } catch (error) {
        console.error(`Failed to normalize cost item ${item.id}:`, error);
        // Use default factors if normalization fails
        results.set(item.id, {
          normalizedUnitRate: item.unitRate,
          normalizedTotalCost: item.totalCost,
          regionalFactor: 1.0,
          inflationFactor: 1.0,
          adjustmentDetails: {
            originalUnitRate: item.unitRate,
            regionalAdjustment: item.unitRate,
            inflationAdjustment: item.unitRate,
            finalRate: item.unitRate
          }
        });
      }
    }

    return results;
  }

  /**
   * Get regional cost factor for a specific category and location
   */
  private async getRegionalCostFactor(
    category: string,
    state: string,
    district?: string,
    date: Date = new Date()
  ): Promise<number> {
    try {
      // Try to get district-specific factor first
      if (district) {
        const districtFactor = await this.historicalDataRepository.getRegionalCostFactor(
          state,
          category,
          date,
          district
        );
        if (districtFactor) {
          return districtFactor.factor;
        }
      }

      // Fall back to state-level factor
      const stateFactor = await this.historicalDataRepository.getRegionalCostFactor(
        state,
        category,
        date
      );
      if (stateFactor) {
        return stateFactor.factor;
      }

      // Default factor if no regional data available
      return 1.0;
    } catch (error) {
      console.error(`Failed to get regional cost factor for ${category} in ${state}:`, error);
      return 1.0;
    }
  }

  /**
   * Get inflation factor for a specific category and year
   */
  private async getInflationFactor(
    category: string,
    targetYear: number,
    baseYear: number = 2020
  ): Promise<number> {
    try {
      const factor = await this.historicalDataRepository.getInflationFactor(
        targetYear,
        category,
        baseYear
      );
      
      if (factor) {
        return factor.cumulativeFactor;
      }

      // If exact year not found, calculate based on available data
      return await this.calculateInflationFactor(category, targetYear, baseYear);
    } catch (error) {
      console.error(`Failed to get inflation factor for ${category} in ${targetYear}:`, error);
      return 1.0;
    }
  }

  /**
   * Calculate inflation factor when exact year data is not available
   */
  private async calculateInflationFactor(
    category: string,
    targetYear: number,
    baseYear: number = 2020
  ): Promise<number> {
    // This is a simplified calculation - in production, you'd want more sophisticated interpolation
    const averageInflationRate = await this.getAverageInflationRate(category, baseYear);
    const yearsDifference = targetYear - baseYear;
    
    // Compound inflation calculation
    return Math.pow(1 + averageInflationRate, yearsDifference);
  }

  /**
   * Get average inflation rate for a category
   */
  private async getAverageInflationRate(category: string, baseYear: number): Promise<number> {
    // Default inflation rates for different categories (these should be configurable)
    const defaultRates: Record<string, number> = {
      'CONSTRUCTION': 0.06, // 6% annual inflation
      'LABOR': 0.08,        // 8% annual inflation
      'MATERIALS': 0.07,    // 7% annual inflation
      'EQUIPMENT': 0.05,    // 5% annual inflation
      'TRANSPORT': 0.06,    // 6% annual inflation
    };

    return defaultRates[category] || 0.06; // Default 6% if category not found
  }

  /**
   * Update cost item with normalized values
   */
  async updateCostItemWithNormalizedValues(
    costItem: HistoricalCostItem,
    targetYear: number,
    targetState: string,
    targetDistrict?: string
  ): Promise<HistoricalCostItem> {
    const normalization = await this.normalizeCostItem(
      costItem,
      targetYear,
      targetState,
      targetDistrict
    );

    return {
      ...costItem,
      normalizedUnitRate: normalization.normalizedUnitRate,
      normalizedTotalCost: normalization.normalizedTotalCost,
      regionalFactor: normalization.regionalFactor,
      inflationFactor: normalization.inflationFactor
    };
  }

  /**
   * Calculate cost adjustment summary for reporting
   */
  calculateAdjustmentSummary(
    originalCost: number,
    normalizedCost: number,
    regionalFactor: number,
    inflationFactor: number
  ): {
    totalAdjustmentPercentage: number;
    regionalAdjustmentPercentage: number;
    inflationAdjustmentPercentage: number;
    adjustmentBreakdown: string;
  } {
    const totalAdjustmentPercentage = ((normalizedCost - originalCost) / originalCost) * 100;
    const regionalAdjustmentPercentage = ((regionalFactor - 1) * 100);
    const inflationAdjustmentPercentage = ((inflationFactor - 1) * 100);

    const adjustmentBreakdown = [
      `Original: ₹${originalCost.toLocaleString('en-IN')}`,
      `Regional Factor: ${regionalFactor.toFixed(3)} (${regionalAdjustmentPercentage.toFixed(1)}%)`,
      `Inflation Factor: ${inflationFactor.toFixed(3)} (${inflationAdjustmentPercentage.toFixed(1)}%)`,
      `Normalized: ₹${normalizedCost.toLocaleString('en-IN')} (${totalAdjustmentPercentage.toFixed(1)}%)`
    ].join(' → ');

    return {
      totalAdjustmentPercentage,
      regionalAdjustmentPercentage,
      inflationAdjustmentPercentage,
      adjustmentBreakdown
    };
  }
}