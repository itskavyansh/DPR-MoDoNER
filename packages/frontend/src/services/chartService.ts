import { Chart, ChartConfiguration, registerables } from 'chart.js';
import jsPDF from 'jspdf';

// Register Chart.js components
Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export class ChartService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    // Create a canvas element for chart generation
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateBarChart(data: ChartData, title: string): Promise<string> {
    const config: ChartConfiguration = {
      type: 'bar',
      data,
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#e0e0e0' },
            ticks: { font: { size: 12 } }
          },
          x: {
            grid: { color: '#e0e0e0' },
            ticks: { font: { size: 12 } }
          }
        }
      }
    };

    const chart = new Chart(this.ctx, config);
    
    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageData = this.canvas.toDataURL('image/png');
    chart.destroy();
    
    return imageData;
  }

  async generatePieChart(data: ChartData, title: string): Promise<string> {
    const config: ChartConfiguration = {
      type: 'pie',
      data,
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'right'
          }
        }
      }
    };

    const chart = new Chart(this.ctx, config);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageData = this.canvas.toDataURL('image/png');
    chart.destroy();
    
    return imageData;
  }

  async generateLineChart(data: ChartData, title: string): Promise<string> {
    const config: ChartConfiguration = {
      type: 'line',
      data,
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#e0e0e0' },
            ticks: { font: { size: 12 } }
          },
          x: {
            grid: { color: '#e0e0e0' },
            ticks: { font: { size: 12 } }
          }
        }
      }
    };

    const chart = new Chart(this.ctx, config);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageData = this.canvas.toDataURL('image/png');
    chart.destroy();
    
    return imageData;
  }

  async generateRadarChart(data: ChartData, title: string): Promise<string> {
    const config: ChartConfiguration = {
      type: 'radar',
      data,
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#e0e0e0' },
            pointLabels: { font: { size: 10 } },
            ticks: { font: { size: 10 } }
          }
        }
      }
    };

    const chart = new Chart(this.ctx, config);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageData = this.canvas.toDataURL('image/png');
    chart.destroy();
    
    return imageData;
  }

  // Generate charts for DPR analysis
  async generateAnalysisCharts(reportData: any) {
    const charts: { [key: string]: string } = {};

    // 1. Performance Overview Bar Chart
    const overviewData: ChartData = {
      labels: ['Completeness', 'Feasibility', 'Price Accuracy'],
      datasets: [{
        label: 'Score (%)',
        data: [
          reportData.completenessScore,
          reportData.feasibilityRating,
          Math.max(0, 100 - Math.abs(reportData.priceDeviationPercentage))
        ],
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
        borderColor: ['#388e3c', '#1976d2', '#f57c00'],
        borderWidth: 2
      }]
    };
    charts.overview = await this.generateBarChart(overviewData, 'DPR Performance Overview');

    // 2. Risk Assessment Radar Chart
    if (reportData.riskAssessment) {
      const riskLevel = reportData.riskLevel;
      const riskScore = riskLevel === 'HIGH' ? 80 : riskLevel === 'MEDIUM' ? 50 : 20;
      const priceRisk = Math.abs(reportData.priceDeviationPercentage) > 15 ? 70 : 30;
      const completenessRisk = reportData.completenessScore < 70 ? 60 : 20;
      const feasibilityRisk = reportData.feasibilityRating < 70 ? 70 : 30;

      const riskData: ChartData = {
        labels: ['Technical Risk', 'Financial Risk', 'Environmental Risk', 'Social Risk', 'Implementation Risk'],
        datasets: [{
          label: 'Risk Level',
          data: [riskScore, priceRisk, riskScore * 0.8, completenessRisk, feasibilityRisk],
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          borderColor: '#f44336',
          borderWidth: 2
        }]
      };
      charts.risk = await this.generateRadarChart(riskData, 'Risk Assessment Profile');
    }

    // 3. Price Analysis Chart
    if (reportData.priceAnalysis?.flaggedItems) {
      const priceData: ChartData = {
        labels: reportData.priceAnalysis.flaggedItems.map((item: any) => 
          item?.item ? item.item.split(' ')[0] : 'Unknown Item'
        ),
        datasets: [
          {
            label: 'Standard Price (₹)',
            data: reportData.priceAnalysis.flaggedItems.map((item: any) => item?.standardPrice || 0),
            backgroundColor: '#4caf50',
            borderColor: '#388e3c',
            borderWidth: 2
          },
          {
            label: 'Quoted Price (₹)',
            data: reportData.priceAnalysis.flaggedItems.map((item: any) => item?.quotedPrice || 0),
            backgroundColor: '#2196f3',
            borderColor: '#1976d2',
            borderWidth: 2
          }
        ]
      };
      charts.price = await this.generateBarChart(priceData, 'Price Comparison Analysis');
    }

    // 4. Scheme Funding Pie Chart
    if (reportData.schemeMatches) {
      const schemeData: ChartData = {
        labels: reportData.schemeMatches.map((scheme: any) => 
          scheme?.schemeName ? scheme.schemeName.split(' ').slice(0, 2).join(' ') : 'Unknown Scheme'
        ),
        datasets: [{
          label: 'Funding Amount (₹)',
          data: reportData.schemeMatches.map((scheme: any) => scheme?.fundingAmount || 0),
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      };
      charts.schemes = await this.generatePieChart(schemeData, 'Government Scheme Funding Distribution');
    }

    // 5. Gap Analysis Progress Chart
    if (reportData.gapAnalysis) {
      const totalComponents = 10; // Assume standard DPR has 10 components
      const missingCount = reportData.gapAnalysis.missingComponents.length;
      const completedCount = totalComponents - missingCount;

      const gapData: ChartData = {
        labels: ['Completed Components', 'Missing Components'],
        datasets: [{
          label: 'Components',
          data: [completedCount, missingCount],
          backgroundColor: ['#4caf50', '#f44336'],
          borderColor: ['#388e3c', '#d32f2f'],
          borderWidth: 2
        }]
      };
      charts.gap = await this.generatePieChart(gapData, 'DPR Completeness Analysis');
    }

    return charts;
  }

  destroy() {
    // Clean up canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export const chartService = new ChartService();