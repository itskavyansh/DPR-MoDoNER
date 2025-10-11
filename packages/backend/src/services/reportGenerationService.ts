import puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';

export interface ReportData {
  dprId: string;
  documentName: string;
  completenessScore: number;
  feasibilityRating: number;
  riskLevel: string;
  priceDeviationPercentage: number;
  schemeMatches: number;
  analysisTimestamp: Date;
  projectSummary?: any;
  gapAnalysis?: any;
  priceAnalysis?: any;
  riskAnalysis?: any;
  schemeAnalysis?: any;
  feasibilityAnalysis?: any;
  recommendations?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  format: 'pdf' | 'excel' | 'both';
}

export class ReportGenerationService {
  private static instance: ReportGenerationService;
  private templates: Map<string, ReportTemplate> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): ReportGenerationService {
    if (!ReportGenerationService.instance) {
      ReportGenerationService.instance = new ReportGenerationService();
    }
    return ReportGenerationService.instance;
  }

  private initializeDefaultTemplates(): void {
    this.templates.set('executive', {
      id: 'executive',
      name: 'Executive Summary Report',
      description: 'High-level overview for decision makers',
      sections: ['projectSummary', 'keyMetrics', 'recommendations'],
      format: 'pdf'
    });

    this.templates.set('detailed', {
      id: 'detailed',
      name: 'Detailed Analysis Report',
      description: 'Comprehensive analysis with all sections',
      sections: ['projectSummary', 'gapAnalysis', 'priceAnalysis', 'riskAnalysis', 'schemeAnalysis', 'feasibilityAnalysis', 'recommendations'],
      format: 'both'
    });

    this.templates.set('technical', {
      id: 'technical',
      name: 'Technical Review Report',
      description: 'Focus on technical aspects and feasibility',
      sections: ['projectSummary', 'gapAnalysis', 'feasibilityAnalysis', 'riskAnalysis'],
      format: 'pdf'
    });

    this.templates.set('financial', {
      id: 'financial',
      name: 'Financial Analysis Report',
      description: 'Cost analysis and scheme recommendations',
      sections: ['projectSummary', 'priceAnalysis', 'schemeAnalysis'],
      format: 'excel'
    });
  }

  public getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(templateId: string): ReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  public async generatePDFReport(
    data: ReportData, 
    templateId: string = 'detailed',
    customOptions?: { 
      includeCharts?: boolean;
      includeDetailedBreakdown?: boolean;
      logoUrl?: string;
    }
  ): Promise<Buffer> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const html = this.generateHTMLContent(data, template, customOptions);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  public async generateExcelReport(
    data: ReportData, 
    templateId: string = 'detailed',
    _customOptions?: {
      includeCharts?: boolean;
      includeRawData?: boolean;
    }
  ): Promise<Buffer> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DPR Quality Assessment System';
    workbook.created = new Date();

    // Create summary sheet
    const worksheet = workbook.addWorksheet('Summary');
    
    // Set column widths
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Add title
    worksheet.mergeCells('A1:B1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `DPR Analysis Summary - ${data.documentName}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add data
    worksheet.addRow([]);
    worksheet.addRow(['Completeness Score', `${data.completenessScore.toFixed(1)}%`]);
    worksheet.addRow(['Feasibility Rating', `${data.feasibilityRating.toFixed(1)}%`]);
    worksheet.addRow(['Risk Level', data.riskLevel]);
    worksheet.addRow(['Price Deviation', `${data.priceDeviationPercentage > 0 ? '+' : ''}${data.priceDeviationPercentage.toFixed(1)}%`]);
    worksheet.addRow(['Scheme Matches', data.schemeMatches.toString()]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private generateHTMLContent(
    data: ReportData, 
    _template: ReportTemplate,
    _options?: { includeCharts?: boolean; includeDetailedBreakdown?: boolean; logoUrl?: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>DPR Analysis Report - ${data.documentName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .metric-label { font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DPR Quality Assessment Report</h1>
          <h2>${data.documentName}</h2>
          <p>Generated on: ${data.analysisTimestamp.toLocaleDateString('en-IN')}</p>
        </div>
        
        <div class="section">
          <h2>Key Metrics</h2>
          <div class="metric">
            <div class="metric-value">${data.completenessScore.toFixed(1)}%</div>
            <div class="metric-label">Completeness Score</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.feasibilityRating.toFixed(1)}%</div>
            <div class="metric-label">Feasibility Rating</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.riskLevel}</div>
            <div class="metric-label">Risk Level</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.priceDeviationPercentage > 0 ? '+' : ''}${data.priceDeviationPercentage.toFixed(1)}%</div>
            <div class="metric-label">Price Deviation</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.schemeMatches}</div>
            <div class="metric-label">Scheme Matches</div>
          </div>
        </div>

        ${data.recommendations && data.recommendations.length > 0 ? `
          <div class="section">
            <h2>Recommendations</h2>
            <ul>
              ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  }
}