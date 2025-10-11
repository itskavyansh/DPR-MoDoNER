import express from 'express';

const router = express.Router();

// GET /api/reports/:id - Generate and download report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;
    
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

    // Mock report generation - in real implementation, this would generate actual PDF/Excel
    const mockReportContent = `DPR Analysis Report
Document: ${document.originalFileName}
Generated: ${new Date().toISOString()}

Analysis Summary:
- Completeness Score: ${Math.round(Math.random() * 40 + 60)}%
- Feasibility Rating: ${Math.round(Math.random() * 50 + 50)}%
- Risk Level: ${['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)]}
- Price Deviation: ${((Math.random() - 0.5) * 40).toFixed(1)}%

This is a mock report for demonstration purposes.`;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="dpr-analysis-${id}.pdf"`);
      // In real implementation, generate actual PDF
      res.send(Buffer.from(mockReportContent));
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="dpr-analysis-${id}.xlsx"`);
      // In real implementation, generate actual Excel file
      res.send(Buffer.from(mockReportContent));
    } else {
      res.status(400).json({ error: 'Unsupported format. Use pdf or excel.' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;