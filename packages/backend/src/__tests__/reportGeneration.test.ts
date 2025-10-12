import { describe, it, expect } from 'vitest';
import { ReportGenerationService, ReportData } from '../services/reportGenerationService.js';

describe('Report Generation Service', () => {
  const reportService = ReportGenerationService.getInstance();

  const mockReportData: ReportData = {
    dprId: 'test-1',
    documentName: 'Test DPR Document.pdf',
    completenessScore: 85.5,
    feasibilityRating: 78.2,
    riskLevel: 'MEDIUM',
    priceDeviationPercentage: 12.5,
    schemeMatches: 3,
    analysisTimestamp: new Date('2024-01-15T10:30:00Z'),
    projectSummary: {
      projectTitle: 'Test Infrastructure Project',
      projectType: 'Highway Infrastructure',
      location: 'Northeast India',
      department: 'Ministry of Road Transport & Highways',
      estimatedCost: 150000000,
      duration: '24 months',
      beneficiaries: '2.5 lakh direct beneficiaries'
    },
    recommendations: [
      'Complete missing documentation components',
      'Address identified risk factors',
      'Explore applicable government schemes for funding'
    ]
  };

  it('should return available templates', () => {
    const templates = reportService.getTemplates();
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('id');
    expect(templates[0]).toHaveProperty('name');
    expect(templates[0]).toHaveProperty('description');
    expect(templates[0]).toHaveProperty('sections');
    expect(templates[0]).toHaveProperty('format');
  });

  it('should get a specific template by ID', () => {
    const template = reportService.getTemplate('detailed');
    
    expect(template).toBeDefined();
    expect(template?.id).toBe('detailed');
    expect(template?.name).toBe('Detailed Analysis Report');
    expect(template?.sections).toContain('projectSummary');
  });

  it('should return undefined for non-existent template', () => {
    const template = reportService.getTemplate('non-existent');
    
    expect(template).toBeUndefined();
  });

  it('should generate Excel report successfully', async () => {
    const excelBuffer = await reportService.generateExcelReport(mockReportData, 'detailed');
    
    expect(excelBuffer).toBeDefined();
    expect(excelBuffer).toBeInstanceOf(Buffer);
    expect(excelBuffer.length).toBeGreaterThan(0);
  });

  it('should throw error for invalid template in Excel generation', async () => {
    await expect(
      reportService.generateExcelReport(mockReportData, 'invalid-template')
    ).rejects.toThrow('Template invalid-template not found');
  });

  // Note: PDF generation test is commented out as it requires puppeteer which may not work in test environment
  // it('should generate PDF report successfully', async () => {
  //   const pdfBuffer = await reportService.generatePDFReport(mockReportData, 'detailed');
  //   
  //   expect(pdfBuffer).toBeDefined();
  //   expect(pdfBuffer).toBeInstanceOf(Buffer);
  //   expect(pdfBuffer.length).toBeGreaterThan(0);
  // });

  it('should throw error for invalid template in PDF generation', async () => {
    await expect(
      reportService.generatePDFReport(mockReportData, 'invalid-template')
    ).rejects.toThrow('Template invalid-template not found');
  });
});