import express from 'express';
import { ReportGenerationService, ReportData } from '../services/reportGenerationService.js';

const router = express.Router();
const reportService = ReportGenerationService.getInstance();

// GET /api/reports/templates - Get available report templates
router.get('/templates', async (req, res) => {
  try {
    const templates = reportService.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ error: 'Failed to fetch report templates' });
  }
});

// GET /api/reports/:id - Generate and download report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      format = 'pdf', 
      template = 'detailed',
      includeCharts = 'false',
      includeDetailedBreakdown = 'true',
      includeRawData = 'false'
    } = req.query;
    
    // Mock document lookup - in real implementation, fetch from database
    const mockDocuments = [
      { id: '1', processingStatus: 'COMPLETED', originalFileName: 'Highway Project DPR.pdf' },
      { id: '2', processingStatus: 'COMPLETED', originalFileName: 'Water Supply Project.pdf' },
      { id: '3', processingStatus: 'COMPLETED', originalFileName: 'School Building DPR.pdf' },
      { id: '4', processingStatus: 'COMPLETED', originalFileName: 'Bridge Construction.docx' },
    ];
    
    const document = mockDocuments.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.processingStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Analysis not completed for this document' });
    }

    // Fetch detailed analysis data - in real implementation, get from analysis service
    const analysisResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/analysis/${id}`);
    let analysisData;
    
    if (analysisResponse.ok) {
      analysisData = await analysisResponse.json();
    } else {
      // Fallback to mock data if analysis service is not available
      analysisData = {
        dprId: id,
        documentName: document.originalFileName,
        completenessScore: Math.random() * 40 + 60,
        feasibilityRating: Math.random() * 50 + 50,
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        priceDeviationPercentage: (Math.random() - 0.5) * 40,
        schemeMatches: Math.floor(Math.random() * 10) + 1,
        analysisTimestamp: new Date(),
        projectSummary: {
          projectTitle: document.originalFileName.replace(/\.(pdf|docx|doc)$/i, ''),
          projectType: 'Infrastructure Development',
          location: 'Northeast India',
          department: 'Ministry of Development of North Eastern Region',
          estimatedCost: 50000000 + Math.random() * 200000000,
          duration: '24 months',
          beneficiaries: '2.5 lakh direct beneficiaries'
        },
        gapAnalysis: {
          completedSections: ['Executive Summary', 'Project Background', 'Technical Specifications'],
          missingComponents: ['Environmental Impact Assessment', 'Risk Mitigation Plan'],
          recommendations: ['Complete Environmental Impact Assessment', 'Develop comprehensive Risk Mitigation Plan']
        },
        priceAnalysis: {
          totalEstimate: 150000000,
          regionalAverage: 140000000,
          flaggedItems: []
        },
        riskAnalysis: {
          riskFactors: [
            {
              type: 'Environmental Compliance',
              impact: 'MEDIUM',
              description: 'Potential delays due to environmental clearance requirements',
              mitigation: 'Engage environmental consultants early'
            }
          ]
        },
        schemeAnalysis: {
          applicableSchemes: [
            {
              name: 'Pradhan Mantri Gram Sadak Yojana',
              fundingRange: '₹10-50 Cr',
              relevance: 95,
              eligibility: 'Fully Eligible'
            }
          ]
        },
        feasibilityAnalysis: {
          completionProbability: Math.random() * 50 + 50,
          timelineRisk: 'MEDIUM',
          resourceRisk: 'MEDIUM',
          technicalRisk: 'LOW'
        },
        recommendations: [
          'Complete missing documentation components',
          'Address identified risk factors',
          'Explore applicable government schemes for funding'
        ]
      };
    }

    // Generate report based on format
    if (format === 'pdf') {
      const pdfBuffer = await reportService.generatePDFReport(
        analysisData as ReportData,
        template as string,
        {
          includeCharts: includeCharts === 'true',
          includeDetailedBreakdown: includeDetailedBreakdown === 'true'
        }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="dpr-analysis-${id}-${template}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await reportService.generateExcelReport(
        analysisData as ReportData,
        template as string,
        {
          includeCharts: includeCharts === 'true',
          includeRawData: includeRawData === 'true'
        }
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="dpr-analysis-${id}-${template}.xlsx"`);
      res.send(excelBuffer);
    } else {
      res.status(400).json({ error: 'Unsupported format. Use pdf or excel.' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: (error as Error).message });
  }
});

// POST /api/reports/:id/custom - Generate custom report with specific sections
router.post('/:id/custom', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      format = 'pdf',
      sections = [],
      options = {},
      templateName = 'Custom Report'
    } = req.body;

    // Validate sections
    const validSections = ['projectSummary', 'keyMetrics', 'gapAnalysis', 'priceAnalysis', 'riskAnalysis', 'schemeAnalysis', 'feasibilityAnalysis', 'recommendations'];
    const invalidSections = sections.filter((section: string) => !validSections.includes(section));
    
    if (invalidSections.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid sections specified', 
        invalidSections,
        validSections 
      });
    }

    // Mock document lookup
    const mockDocuments = [
      { id: '1', processingStatus: 'COMPLETED', originalFileName: 'Highway Project DPR.pdf' },
      { id: '2', processingStatus: 'COMPLETED', originalFileName: 'Water Supply Project.pdf' },
      { id: '3', processingStatus: 'COMPLETED', originalFileName: 'School Building DPR.pdf' },
      { id: '4', processingStatus: 'COMPLETED', originalFileName: 'Bridge Construction.docx' },
    ];
    
    const document = mockDocuments.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.processingStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Analysis not completed for this document' });
    }

    // Create custom template
    const customTemplate = {
      id: 'custom',
      name: templateName,
      description: 'Custom report with selected sections',
      sections: sections.length > 0 ? sections : ['projectSummary', 'keyMetrics', 'recommendations'],
      format: format as 'pdf' | 'excel' | 'both'
    };

    // Temporarily add custom template
    const reportServiceInstance = reportService as any;
    reportServiceInstance.templates.set('custom', customTemplate);

    try {
      // Fetch analysis data
      const analysisResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/analysis/${id}`);
      let analysisData;
      
      if (analysisResponse.ok) {
        analysisData = await analysisResponse.json();
      } else {
        // Fallback to mock data
        analysisData = {
          dprId: id,
          documentName: document.originalFileName,
          completenessScore: Math.random() * 40 + 60,
          feasibilityRating: Math.random() * 50 + 50,
          riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
          priceDeviationPercentage: (Math.random() - 0.5) * 40,
          schemeMatches: Math.floor(Math.random() * 10) + 1,
          analysisTimestamp: new Date(),
          projectSummary: {
            projectTitle: document.originalFileName.replace(/\.(pdf|docx|doc)$/i, ''),
            projectType: 'Infrastructure Development',
            location: 'Northeast India',
            department: 'Ministry of Development of North Eastern Region',
            estimatedCost: 50000000 + Math.random() * 200000000,
            duration: '24 months',
            beneficiaries: '2.5 lakh direct beneficiaries'
          },
          gapAnalysis: {
            completedSections: ['Executive Summary', 'Project Background'],
            missingComponents: ['Environmental Impact Assessment', 'Risk Mitigation Plan'],
            recommendations: ['Complete Environmental Impact Assessment']
          },
          priceAnalysis: {
            totalEstimate: 150000000,
            regionalAverage: 140000000,
            flaggedItems: []
          },
          riskAnalysis: {
            riskFactors: [
              {
                type: 'Environmental Compliance',
                impact: 'MEDIUM',
                description: 'Potential delays due to environmental clearance',
                mitigation: 'Engage environmental consultants early'
              }
            ]
          },
          schemeAnalysis: {
            applicableSchemes: [
              {
                name: 'Pradhan Mantri Gram Sadak Yojana',
                fundingRange: '₹10-50 Cr',
                relevance: 95,
                eligibility: 'Fully Eligible'
              }
            ]
          },
          feasibilityAnalysis: {
            completionProbability: Math.random() * 50 + 50,
            timelineRisk: 'MEDIUM',
            resourceRisk: 'MEDIUM',
            technicalRisk: 'LOW'
          },
          recommendations: [
            'Complete missing documentation components',
            'Address identified risk factors'
          ]
        };
      }

      // Generate report
      if (format === 'pdf') {
        const pdfBuffer = await reportService.generatePDFReport(analysisData as ReportData, 'custom', options);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="dpr-custom-report-${id}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'excel') {
        const excelBuffer = await reportService.generateExcelReport(analysisData as ReportData, 'custom', options);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="dpr-custom-report-${id}.xlsx"`);
        res.send(excelBuffer);
      } else {
        res.status(400).json({ error: 'Unsupported format. Use pdf or excel.' });
      }
    } finally {
      // Remove custom template
      reportServiceInstance.templates.delete('custom');
    }
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ error: 'Failed to generate custom report', details: (error as Error).message });
  }
});

export default router;