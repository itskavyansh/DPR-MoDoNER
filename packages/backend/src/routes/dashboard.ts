import express from 'express';

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    // Mock data for demonstration - in real implementation, this would come from database
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
    
    // Mock analysis data
    const mockAnalysisResults = mockDocuments
      .filter(doc => doc.processingStatus === 'COMPLETED')
      .map(doc => ({
        dprId: doc.id,
        documentName: doc.originalFileName,
        completenessScore: Math.random() * 40 + 60, // 60-100%
        feasibilityRating: Math.random() * 50 + 50, // 50-100%
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        priceDeviationPercentage: (Math.random() - 0.5) * 40, // -20% to +20%
        schemeMatches: Math.floor(Math.random() * 10) + 1,
        analysisTimestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        status: 'COMPLETED' as const,
      }));

    const averageCompletenessScore = mockAnalysisResults.length > 0 
      ? mockAnalysisResults.reduce((sum, result) => sum + result.completenessScore, 0) / mockAnalysisResults.length
      : 75;

    const averageFeasibilityScore = mockAnalysisResults.length > 0
      ? mockAnalysisResults.reduce((sum, result) => sum + result.feasibilityRating, 0) / mockAnalysisResults.length
      : 68;

    const highRiskProjects = mockAnalysisResults.filter(result => 
      result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL'
    ).length;

    const summary = {
      totalDocuments,
      processingDocuments,
      completedAnalyses,
      averageCompletenessScore,
      averageFeasibilityScore,
      highRiskProjects,
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;