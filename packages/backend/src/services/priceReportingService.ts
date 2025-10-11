import { PriceComparisonResult, PriceFlaggedItem } from '@dpr-system/shared';

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  data: ChartDataPoint[];
  options: ChartOptions;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartOptions {
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  height?: number;
  width?: number;
}

export interface PriceAnalysisReport {
  reportId: string;
  dprId: string;
  generatedAt: Date;
  summary: ReportSummary;
  charts: ChartData[];
  detailedAnalysis: DetailedAnalysis;
  recommendations: string[];
  flaggedItems: PriceFlaggedItem[];
  exportFormats: {
    pdf?: string; // Base64 encoded PDF
    excel?: string; // Base64 encoded Excel
    json: string; // JSON string
  };
}

export interface ReportSummary {
  totalEstimate: number;
  regionalAverage: number;
  overallDeviation: number;
  deviationStatus: 'WITHIN_RANGE' | 'OVERPRICED' | 'UNDERPRICED';
  flaggedItemsCount: number;
  highRiskItemsCount: number;
  potentialSavings?: number;
}

export interface DetailedAnalysis {
  categoryBreakdown: CategoryAnalysis[];
  riskAssessment: RiskAssessment;
  costOptimization: CostOptimization;
  benchmarkComparison: BenchmarkComparison;
}

export interface CategoryAnalysis {
  category: string;
  totalCost: number;
  averageBenchmark: number;
  deviation: number;
  itemCount: number;
  flaggedCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  mitigationStrategies: string[];
  confidenceScore: number;
}

export interface CostOptimization {
  potentialSavings: number;
  optimizationOpportunities: OptimizationOpportunity[];
  quickWins: string[];
  longTermStrategies: string[];
}

export interface OptimizationOpportunity {
  category: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BenchmarkComparison {
  regionalComparison: RegionalComparison[];
  historicalTrends: HistoricalTrend[];
  peerProjects: PeerProjectComparison[];
}

export interface RegionalComparison {
  region: string;
  averageCost: number;
  deviation: number;
  sampleSize: number;
}

export interface HistoricalTrend {
  year: number;
  averageCost: number;
  inflationAdjusted: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface PeerProjectComparison {
  projectName: string;
  projectType: string;
  totalCost: number;
  costPerUnit?: number;
  similarity: number;
}

export class PriceReportingService {
  /**
   * Generate comprehensive price analysis report
   */
  async generatePriceAnalysisReport(
    comparisonResult: PriceComparisonResult,
    additionalData?: any
  ): Promise<PriceAnalysisReport> {
    const reportId = this.generateReportId();
    
    // Generate summary
    const summary = this.generateReportSummary(comparisonResult);
    
    // Generate charts
    const charts = this.generateCharts(comparisonResult);
    
    // Generate detailed analysis
    const detailedAnalysis = this.generateDetailedAnalysis(comparisonResult);
    
    // Generate export formats
    const exportFormats = await this.generateExportFormats(comparisonResult, charts);
    
    return {
      reportId,
      dprId: comparisonResult.dprId,
      generatedAt: new Date(),
      summary,
      charts,
      detailedAnalysis,
      recommendations: comparisonResult.recommendations,
      flaggedItems: comparisonResult.flaggedItems,
      exportFormats
    };
  }

  /**
   * Generate bar chart for DPR vs regional average comparison
   */
  generateDPRComparisonChart(comparisonResult: PriceComparisonResult): ChartData {
    const data: ChartDataPoint[] = [
      {
        label: 'DPR Estimate',
        value: comparisonResult.totalEstimate,
        category: 'estimate',
        color: '#3498db',
        metadata: { type: 'dpr' }
      },
      {
        label: 'Regional Average',
        value: comparisonResult.regionalAverage,
        category: 'benchmark',
        color: '#2ecc71',
        metadata: { type: 'benchmark' }
      }
    ];

    return {
      type: 'bar',
      title: 'DPR Cost vs Regional Average',
      data,
      options: {
        xAxisLabel: 'Cost Type',
        yAxisLabel: 'Cost (₹)',
        showLegend: true,
        showGrid: true,
        colors: ['#3498db', '#2ecc71'],
        height: 400,
        width: 600
      }
    };
  }

  /**
   * Generate flagged items chart
   */
  generateFlaggedItemsChart(flaggedItems: PriceFlaggedItem[]): ChartData {
    const data: ChartDataPoint[] = flaggedItems
      .sort((a, b) => Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage))
      .slice(0, 10) // Top 10 flagged items
      .map(item => ({
        label: this.truncateText(item.itemDescription, 30),
        value: Math.abs(item.deviationPercentage),
        category: item.flagType,
        color: item.flagType === 'OVERPRICED' ? '#e74c3c' : '#f39c12',
        metadata: {
          fullDescription: item.itemDescription,
          dprRate: item.dprUnitRate,
          benchmarkRate: item.benchmarkUnitRate,
          confidence: item.confidence
        }
      }));

    return {
      type: 'bar',
      title: 'Top Flagged Items by Deviation',
      data,
      options: {
        xAxisLabel: 'Items',
        yAxisLabel: 'Deviation (%)',
        showLegend: true,
        showGrid: true,
        colors: ['#e74c3c', '#f39c12'],
        height: 500,
        width: 800
      }
    };
  }

  /**
   * Generate category breakdown chart
   */
  generateCategoryBreakdownChart(categoryAnalysis: CategoryAnalysis[]): ChartData {
    const data: ChartDataPoint[] = categoryAnalysis.map(category => ({
      label: category.category,
      value: category.totalCost,
      category: category.riskLevel,
      color: this.getRiskColor(category.riskLevel),
      metadata: {
        deviation: category.deviation,
        itemCount: category.itemCount,
        flaggedCount: category.flaggedCount
      }
    }));

    return {
      type: 'pie',
      title: 'Cost Distribution by Category',
      data,
      options: {
        showLegend: true,
        colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'],
        height: 400,
        width: 400
      }
    };
  }

  /**
   * Generate deviation scatter plot
   */
  generateDeviationScatterPlot(flaggedItems: PriceFlaggedItem[]): ChartData {
    const data: ChartDataPoint[] = flaggedItems.map(item => ({
      label: this.truncateText(item.itemDescription, 20),
      value: item.deviationPercentage,
      category: item.flagType,
      color: item.flagType === 'OVERPRICED' ? '#e74c3c' : '#f39c12',
      metadata: {
        confidence: item.confidence,
        dprRate: item.dprUnitRate,
        benchmarkRate: item.benchmarkUnitRate
      }
    }));

    return {
      type: 'scatter',
      title: 'Price Deviation Analysis',
      data,
      options: {
        xAxisLabel: 'Items',
        yAxisLabel: 'Deviation (%)',
        showLegend: true,
        showGrid: true,
        colors: ['#e74c3c', '#f39c12'],
        height: 400,
        width: 700
      }
    };
  }

  /**
   * Generate all charts for the report
   */
  private generateCharts(comparisonResult: PriceComparisonResult): ChartData[] {
    const charts: ChartData[] = [];

    // Main comparison chart
    charts.push(this.generateDPRComparisonChart(comparisonResult));

    // Flagged items chart (if any)
    if (comparisonResult.flaggedItems.length > 0) {
      charts.push(this.generateFlaggedItemsChart(comparisonResult.flaggedItems));
      charts.push(this.generateDeviationScatterPlot(comparisonResult.flaggedItems));
    }

    // Category breakdown (would need additional data)
    const categoryAnalysis = this.generateCategoryAnalysisFromFlaggedItems(
      comparisonResult.flaggedItems
    );
    if (categoryAnalysis.length > 0) {
      charts.push(this.generateCategoryBreakdownChart(categoryAnalysis));
    }

    return charts;
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(comparisonResult: PriceComparisonResult): ReportSummary {
    const deviation = comparisonResult.deviationPercentage;
    let deviationStatus: 'WITHIN_RANGE' | 'OVERPRICED' | 'UNDERPRICED' = 'WITHIN_RANGE';
    
    if (deviation > 20) {
      deviationStatus = 'OVERPRICED';
    } else if (deviation < -10) {
      deviationStatus = 'UNDERPRICED';
    }

    const highRiskItems = comparisonResult.flaggedItems.filter(
      item => Math.abs(item.deviationPercentage) > 50
    );

    const potentialSavings = comparisonResult.flaggedItems
      .filter(item => item.flagType === 'OVERPRICED')
      .reduce((sum, item) => {
        const savings = (item.dprUnitRate - item.benchmarkUnitRate);
        return sum + Math.max(0, savings);
      }, 0);

    return {
      totalEstimate: comparisonResult.totalEstimate,
      regionalAverage: comparisonResult.regionalAverage,
      overallDeviation: deviation,
      deviationStatus,
      flaggedItemsCount: comparisonResult.flaggedItems.length,
      highRiskItemsCount: highRiskItems.length,
      potentialSavings: potentialSavings > 0 ? potentialSavings : undefined
    };
  }

  /**
   * Generate detailed analysis
   */
  private generateDetailedAnalysis(comparisonResult: PriceComparisonResult): DetailedAnalysis {
    const categoryBreakdown = this.generateCategoryAnalysisFromFlaggedItems(
      comparisonResult.flaggedItems
    );

    const riskAssessment = this.generateRiskAssessment(comparisonResult);
    const costOptimization = this.generateCostOptimization(comparisonResult);
    const benchmarkComparison = this.generateBenchmarkComparison(comparisonResult);

    return {
      categoryBreakdown,
      riskAssessment,
      costOptimization,
      benchmarkComparison
    };
  }

  /**
   * Generate category analysis from flagged items
   */
  private generateCategoryAnalysisFromFlaggedItems(flaggedItems: PriceFlaggedItem[]): CategoryAnalysis[] {
    const categoryMap = new Map<string, {
      totalCost: number;
      totalBenchmark: number;
      items: PriceFlaggedItem[];
    }>();

    // Group flagged items by category
    flaggedItems.forEach(item => {
      const category = item.itemCategory;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          totalCost: 0,
          totalBenchmark: 0,
          items: []
        });
      }
      
      const categoryData = categoryMap.get(category)!;
      categoryData.totalCost += item.dprUnitRate;
      categoryData.totalBenchmark += item.benchmarkUnitRate;
      categoryData.items.push(item);
    });

    // Convert to CategoryAnalysis array
    return Array.from(categoryMap.entries()).map(([category, data]) => {
      const deviation = ((data.totalCost - data.totalBenchmark) / data.totalBenchmark) * 100;
      const avgDeviation = data.items.reduce((sum, item) => 
        sum + Math.abs(item.deviationPercentage), 0) / data.items.length;
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (avgDeviation > 50) riskLevel = 'HIGH';
      else if (avgDeviation > 20) riskLevel = 'MEDIUM';

      return {
        category,
        totalCost: data.totalCost,
        averageBenchmark: data.totalBenchmark,
        deviation,
        itemCount: data.items.length,
        flaggedCount: data.items.length, // All items in this analysis are flagged
        riskLevel
      };
    });
  }

  /**
   * Generate risk assessment
   */
  private generateRiskAssessment(comparisonResult: PriceComparisonResult): RiskAssessment {
    const flaggedItems = comparisonResult.flaggedItems;
    const highRiskItems = flaggedItems.filter(item => Math.abs(item.deviationPercentage) > 50);
    const overallDeviation = Math.abs(comparisonResult.deviationPercentage);

    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (highRiskItems.length > 3 || overallDeviation > 30) {
      overallRisk = 'HIGH';
    } else if (highRiskItems.length > 1 || overallDeviation > 15) {
      overallRisk = 'MEDIUM';
    }

    const riskFactors: string[] = [];
    if (overallDeviation > 20) {
      riskFactors.push(`Overall cost deviation of ${overallDeviation.toFixed(1)}%`);
    }
    if (highRiskItems.length > 0) {
      riskFactors.push(`${highRiskItems.length} items with extreme price deviations`);
    }

    const avgConfidence = flaggedItems.length > 0 
      ? flaggedItems.reduce((sum, item) => sum + item.confidence, 0) / flaggedItems.length
      : 1.0;

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies: this.generateMitigationStrategies(overallRisk, riskFactors),
      confidenceScore: avgConfidence
    };
  }

  /**
   * Generate cost optimization analysis
   */
  private generateCostOptimization(comparisonResult: PriceComparisonResult): CostOptimization {
    const overpricedItems = comparisonResult.flaggedItems.filter(
      item => item.flagType === 'OVERPRICED'
    );

    const potentialSavings = overpricedItems.reduce((sum, item) => {
      return sum + (item.dprUnitRate - item.benchmarkUnitRate);
    }, 0);

    const optimizationOpportunities: OptimizationOpportunity[] = overpricedItems
      .sort((a, b) => (b.dprUnitRate - b.benchmarkUnitRate) - (a.dprUnitRate - a.benchmarkUnitRate))
      .slice(0, 5)
      .map(item => ({
        category: item.itemCategory,
        description: item.itemDescription,
        currentCost: item.dprUnitRate,
        optimizedCost: item.benchmarkUnitRate,
        savings: item.dprUnitRate - item.benchmarkUnitRate,
        effort: Math.abs(item.deviationPercentage) > 50 ? 'HIGH' : 'MEDIUM',
        impact: item.dprUnitRate > 100000 ? 'HIGH' : 'MEDIUM'
      }));

    return {
      potentialSavings,
      optimizationOpportunities,
      quickWins: this.generateQuickWins(overpricedItems),
      longTermStrategies: this.generateLongTermStrategies(comparisonResult)
    };
  }

  /**
   * Generate benchmark comparison
   */
  private generateBenchmarkComparison(comparisonResult: PriceComparisonResult): BenchmarkComparison {
    // This would typically involve more complex analysis with historical data
    // For now, providing a simplified implementation
    return {
      regionalComparison: [
        {
          region: 'Northeast India',
          averageCost: comparisonResult.regionalAverage,
          deviation: 0,
          sampleSize: 50 // Placeholder
        }
      ],
      historicalTrends: [],
      peerProjects: []
    };
  }

  /**
   * Generate export formats
   */
  private async generateExportFormats(
    comparisonResult: PriceComparisonResult,
    charts: ChartData[]
  ): Promise<{ pdf?: string; excel?: string; json: string }> {
    // JSON export (always available)
    const jsonExport = JSON.stringify({
      comparisonResult,
      charts,
      generatedAt: new Date().toISOString()
    }, null, 2);

    return {
      json: jsonExport
      // PDF and Excel generation would be implemented here
      // using libraries like puppeteer for PDF and exceljs for Excel
    };
  }

  /**
   * Helper methods
   */
  private generateReportId(): string {
    return `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substr(0, maxLength) + '...' : text;
  }

  private getRiskColor(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (riskLevel) {
      case 'LOW': return '#2ecc71';
      case 'MEDIUM': return '#f39c12';
      case 'HIGH': return '#e74c3c';
      default: return '#95a5a6';
    }
  }

  private generateMitigationStrategies(
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    riskFactors: string[]
  ): string[] {
    const strategies: string[] = [];
    
    if (riskLevel === 'HIGH') {
      strategies.push('Conduct detailed supplier negotiations');
      strategies.push('Consider alternative procurement methods');
      strategies.push('Implement strict cost monitoring');
    }
    
    if (riskFactors.some(factor => factor.includes('extreme'))) {
      strategies.push('Review specifications for overpriced items');
      strategies.push('Seek multiple quotations');
    }
    
    return strategies;
  }

  private generateQuickWins(overpricedItems: PriceFlaggedItem[]): string[] {
    return overpricedItems
      .filter(item => item.deviationPercentage < 30) // Easier to negotiate
      .slice(0, 3)
      .map(item => `Negotiate ${item.itemDescription} price (potential ${item.deviationPercentage.toFixed(1)}% reduction)`);
  }

  private generateLongTermStrategies(comparisonResult: PriceComparisonResult): string[] {
    const strategies = [
      'Establish framework agreements with suppliers',
      'Implement bulk procurement strategies',
      'Develop regional supplier networks'
    ];

    if (comparisonResult.deviationPercentage > 20) {
      strategies.push('Review and update cost estimation methodologies');
    }

    return strategies;
  }
}