const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'DPR Backend API', 
    timestamp: new Date().toISOString()
  });
});

// API root
app.get('/api', (req, res) => {
  res.json({ message: 'DPR Quality Assessment System API' });
});

// Dashboard summary endpoint
app.get('/api/dashboard/summary', (req, res) => {
  try {
    // Mock data for demonstration
    const mockDocuments = [
      { id: '1', processingStatus: 'COMPLETED', originalFileName: 'Highway Project DPR.pdf' },
      { id: '2', processingStatus: 'PROCESSING', originalFileName: 'Bridge Construction.docx' },
      { id: '3', processingStatus: 'COMPLETED', originalFileName: 'Water Supply Project.pdf' },
      { id: '4', processingStatus: 'COMPLETED', originalFileName: 'School Building DPR.pdf' },
      { id: '5', processingStatus: 'PROCESSING', originalFileName: 'Hospital Project.docx' },
    ];
    
    const totalDocuments = mockDocuments.length;
    const processingDocuments = mockDocuments.filter(doc => doc.processingStatus === 'PROCESSING').length;
    const completedAnalyses = mockDocuments.filter(doc => doc.processingStatus === 'COMPLETED').length;
    
    const summary = {
      totalDocuments,
      processingDocuments,
      completedAnalyses,
      averageCompletenessScore: 75,
      averageFeasibilityScore: 68,
      highRiskProjects: 1,
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Analysis results endpoint
app.get('/api/analysis', (req, res) => {
  try {
    const mockAnalysisResults = [
      {
        dprId: '1',
        documentName: 'Highway Project DPR.pdf',
        completenessScore: 85,
        feasibilityRating: 72,
        riskLevel: 'MEDIUM',
        priceDeviationPercentage: 5.2,
        schemeMatches: 7,
        analysisTimestamp: new Date('2024-01-15'),
        status: 'COMPLETED',
      },
      {
        dprId: '3',
        documentName: 'Water Supply Project.pdf',
        completenessScore: 92,
        feasibilityRating: 88,
        riskLevel: 'LOW',
        priceDeviationPercentage: -2.1,
        schemeMatches: 5,
        analysisTimestamp: new Date('2024-01-14'),
        status: 'COMPLETED',
      },
      {
        dprId: '4',
        documentName: 'School Building DPR.pdf',
        completenessScore: 67,
        feasibilityRating: 45,
        riskLevel: 'HIGH',
        priceDeviationPercentage: 15.8,
        schemeMatches: 3,
        analysisTimestamp: new Date('2024-01-13'),
        status: 'COMPLETED',
      },
    ];

    res.json(mockAnalysisResults);
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    res.status(500).json({ error: 'Failed to fetch analysis results' });
  }
});

// Specific analysis result endpoint
app.get('/api/analysis/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const mockResults = {
      '1': {
        dprId: '1',
        documentName: 'Highway Project DPR.pdf',
        completenessScore: 85,
        feasibilityRating: 72,
        riskLevel: 'MEDIUM',
        priceDeviationPercentage: 5.2,
        schemeMatches: 7,
        analysisTimestamp: new Date(),
        status: 'COMPLETED',
      },
      '3': {
        dprId: '3',
        documentName: 'Water Supply Project.pdf',
        completenessScore: 92,
        feasibilityRating: 88,
        riskLevel: 'LOW',
        priceDeviationPercentage: -2.1,
        schemeMatches: 5,
        analysisTimestamp: new Date(),
        status: 'COMPLETED',
      },
    };

    const result = mockResults[id];
    if (!result) {
      return res.status(404).json({ error: 'Analysis result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching analysis result:', error);
    res.status(500).json({ error: 'Failed to fetch analysis result' });
  }
});

// Reports endpoint
app.get('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;
    
    const mockReportContent = `DPR Analysis Report
Document ID: ${id}
Generated: ${new Date().toISOString()}

Analysis Summary:
- Completeness Score: 85%
- Feasibility Rating: 72%
- Risk Level: MEDIUM
- Price Deviation: +5.2%

This is a mock report for demonstration purposes.`;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="dpr-analysis-${id}.pdf"`);
      res.send(Buffer.from(mockReportContent));
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="dpr-analysis-${id}.xlsx"`);
      res.send(Buffer.from(mockReportContent));
    } else {
      res.status(400).json({ error: 'Unsupported format. Use pdf or excel.' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Upload endpoint (mock)
app.post('/api/upload', (req, res) => {
  try {
    // Mock successful upload
    const mockDocument = {
      id: Date.now().toString(),
      originalFileName: 'uploaded-document.pdf',
      fileType: 'PDF',
      uploadTimestamp: new Date(),
      fileSize: 1024000,
      language: 'EN',
      processingStatus: 'UPLOADED',
    };

    console.log('Mock upload received:', mockDocument);
    res.json(mockDocument);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Documents endpoint
app.get('/api/documents', (req, res) => {
  try {
    const mockDocuments = [
      {
        id: '1',
        originalFileName: 'Highway Project DPR.pdf',
        fileType: 'PDF',
        uploadTimestamp: new Date('2024-01-15'),
        fileSize: 2048000,
        language: 'EN',
        processingStatus: 'COMPLETED',
      },
      {
        id: '2',
        originalFileName: 'Bridge Construction.docx',
        fileType: 'DOCX',
        uploadTimestamp: new Date('2024-01-16'),
        fileSize: 1536000,
        language: 'EN',
        processingStatus: 'PROCESSING',
      },
    ];

    res.json(mockDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      field: 'server',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      field: 'route',
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api`);
});