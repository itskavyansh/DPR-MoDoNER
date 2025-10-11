import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GeminiAnalysisService } from './services/geminiAnalysisService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Initialize AI services
const geminiService = new GeminiAnalysisService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'DPR Backend API', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'DPR Quality Assessment System API' });
});

// Dashboard summary - now dynamic based on actual data
app.get('/api/dashboard/summary', (req, res) => {
  const totalDocuments = uploadedDocuments.length;
  const processingDocuments = uploadedDocuments.filter(doc => doc.processingStatus === 'PROCESSING').length;
  const completedAnalyses = analysisResults.length;
  
  const averageCompletenessScore = analysisResults.length > 0 
    ? analysisResults.reduce((sum, result) => sum + result.completenessScore, 0) / analysisResults.length
    : 0;

  const averageFeasibilityScore = analysisResults.length > 0
    ? analysisResults.reduce((sum, result) => sum + result.feasibilityRating, 0) / analysisResults.length
    : 0;

  const highRiskProjects = analysisResults.filter(result => 
    result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL'
  ).length;

  const summary = {
    totalDocuments,
    processingDocuments,
    completedAnalyses,
    averageCompletenessScore: Math.round(averageCompletenessScore * 10) / 10,
    averageFeasibilityScore: Math.round(averageFeasibilityScore * 10) / 10,
    highRiskProjects,
  };
  
  res.json(summary);
});

// Analysis results - now dynamic based on uploaded documents
app.get('/api/analysis', (req, res) => {
  // Sort by most recent first
  const sortedResults = analysisResults.sort((a, b) => 
    new Date(b.analysisTimestamp).getTime() - new Date(a.analysisTimestamp).getTime()
  );
  res.json(sortedResults);
});

// Individual analysis result with detailed data
app.get('/api/analysis/:id', async (req, res) => {
  const { id } = req.params;
  const analysis = analysisResults.find(result => result.dprId === id);
  const document = uploadedDocuments.find(doc => doc.id === id);
  
  if (!analysis || !document) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  
  try {
    // Generate detailed analysis based on the actual document and analysis data
    const detailedAnalysis = {
      ...analysis,
      documentInfo: {
        originalFileName: document.originalFileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadTimestamp: document.uploadTimestamp,
        processingStatus: document.processingStatus
      },
      projectSummary: await generateProjectSummary(document.originalFileName),
      gapAnalysis: generateGapAnalysis(analysis),
      priceAnalysis: generatePriceAnalysis(analysis),
      riskAnalysis: generateRiskAnalysis(analysis),
      schemeAnalysis: generateSchemeAnalysis(analysis),
      feasibilityAnalysis: generateFeasibilityAnalysis(analysis),
      recommendations: generateRecommendations(analysis)
    };
    
    res.json(detailedAnalysis);
  } catch (error) {
    console.error('Error generating detailed analysis:', error);
    res.status(500).json({ error: 'Failed to generate detailed analysis' });
  }
});

// Helper functions to generate realistic analysis data based on actual scores
async function generateProjectSummary(documentName, fileContent) {
  // Try to use Gemini AI for analysis
  try {
    const aiSummary = await geminiService.analyzeDocument(documentName, fileContent);
    console.log(`🤖 AI-generated summary for: ${documentName}`);
    return aiSummary;
  } catch (error) {
    console.log(`⚠️  AI analysis failed, using fallback for: ${documentName}`);
    return generateFallbackProjectSummary(documentName);
  }
}

function generateFallbackProjectSummary(documentName) {
  const projectTypes = {
    'highway': {
      type: 'Highway Infrastructure',
      department: 'Ministry of Road Transport & Highways',
      objectives: [
        'Improve connectivity between major cities and towns',
        'Reduce travel time and transportation costs',
        'Enhance road safety with modern infrastructure',
        'Support regional economic development'
      ],
      components: ['Road Construction', 'Bridges & Flyovers', 'Drainage Systems', 'Traffic Management', 'Safety Features'],
      outcomes: [
        'Reduced travel time by 30-40%',
        'Improved road safety standards',
        'Enhanced regional connectivity',
        'Better access to markets and services'
      ],
      strategicImportance: 'Critical infrastructure project to improve regional connectivity and support economic growth through enhanced transportation networks.'
    },
    'water': {
      type: 'Water Supply Infrastructure',
      department: 'Ministry of Jal Shakti',
      objectives: [
        'Provide clean drinking water access to all households',
        'Improve water distribution efficiency',
        'Reduce water wastage and non-revenue water',
        'Ensure sustainable water resource management'
      ],
      components: ['Water Treatment Plant', 'Distribution Network', 'Storage Tanks', 'Pumping Stations', 'Quality Monitoring'],
      outcomes: [
        '24x7 clean water supply to households',
        'Reduced waterborne diseases',
        'Improved water quality standards',
        'Enhanced water security for the region'
      ],
      strategicImportance: 'Essential public health infrastructure to ensure safe drinking water access and improve quality of life for residents.'
    },
    'school': {
      type: 'Educational Infrastructure',
      department: 'Ministry of Education',
      objectives: [
        'Improve educational infrastructure and facilities',
        'Increase school enrollment capacity',
        'Provide modern learning environments',
        'Enhance educational outcomes and literacy'
      ],
      components: ['Classrooms', 'Laboratories', 'Library', 'Sports Facilities', 'Digital Infrastructure'],
      outcomes: [
        'Increased student enrollment by 40%',
        'Improved learning environment',
        'Better educational outcomes',
        'Enhanced digital literacy'
      ],
      strategicImportance: 'Vital social infrastructure to improve educational access and quality, supporting human capital development.'
    },
    'bridge': {
      type: 'Bridge Infrastructure',
      department: 'Ministry of Road Transport & Highways',
      objectives: [
        'Improve connectivity across geographical barriers',
        'Reduce travel distance and time',
        'Enhance transportation efficiency',
        'Support regional economic integration'
      ],
      components: ['Bridge Structure', 'Approach Roads', 'Safety Barriers', 'Lighting Systems', 'Drainage'],
      outcomes: [
        'Direct connectivity across rivers/valleys',
        'Reduced travel time by 50%',
        'Improved emergency services access',
        'Enhanced regional economic integration'
      ],
      strategicImportance: 'Strategic infrastructure to overcome geographical barriers and improve regional connectivity for economic and social development.'
    }
  };

  // Determine project type from document name
  let projectInfo = projectTypes['highway']; // default
  const docLower = documentName.toLowerCase();
  
  if (docLower.includes('water') || docLower.includes('supply')) {
    projectInfo = projectTypes['water'];
  } else if (docLower.includes('school') || docLower.includes('education')) {
    projectInfo = projectTypes['school'];
  } else if (docLower.includes('bridge')) {
    projectInfo = projectTypes['bridge'];
  }

  // Generate realistic project details
  const locations = [
    'Mumbai-Pune Corridor, Maharashtra',
    'Delhi-Gurgaon Highway, NCR',
    'Bangalore-Mysore Route, Karnataka',
    'Chennai-Coimbatore Highway, Tamil Nadu',
    'Hyderabad-Vijayawada Corridor, Telangana',
    'Ahmedabad-Vadodara Route, Gujarat',
    'Kolkata-Durgapur Highway, West Bengal',
    'Jaipur-Udaipur Route, Rajasthan'
  ];

  const durations = ['18 months', '24 months', '30 months', '36 months'];
  const beneficiaries = [
    '2.5 lakh direct beneficiaries',
    '5 lakh people in surrounding areas',
    '1.2 lakh daily commuters',
    '3 lakh residents across 50 villages',
    '8 lakh people in the district',
    '1.5 lakh households'
  ];

  // Generate cost based on project type
  const baseCosts = {
    'Highway Infrastructure': 150000000, // 15 Cr
    'Water Supply Infrastructure': 80000000, // 8 Cr  
    'Educational Infrastructure': 50000000, // 5 Cr
    'Bridge Infrastructure': 120000000 // 12 Cr
  };

  const estimatedCost = baseCosts[projectInfo.type] * (1 + Math.random() * 2); // 1x to 3x base cost

  return {
    projectTitle: documentName.replace(/\.(pdf|docx|doc)$/i, ''),
    projectType: projectInfo.type,
    location: locations[Math.floor(Math.random() * locations.length)],
    department: projectInfo.department,
    estimatedCost,
    duration: durations[Math.floor(Math.random() * durations.length)],
    beneficiaries: beneficiaries[Math.floor(Math.random() * beneficiaries.length)],
    objectives: projectInfo.objectives,
    keyComponents: projectInfo.components,
    expectedOutcomes: projectInfo.outcomes,
    strategicImportance: projectInfo.strategicImportance
  };
}

function generateGapAnalysis(analysis) {
  const completenessScore = analysis.completenessScore;
  const missingComponents = [];
  const completedSections = [
    'Executive Summary',
    'Project Description',
    'Technical Specifications'
  ];
  
  // Generate missing components based on completeness score
  if (completenessScore < 90) {
    missingComponents.push('Environmental Impact Assessment');
  }
  if (completenessScore < 80) {
    missingComponents.push('Detailed Cost Breakdown for Phase 2');
    missingComponents.push('Risk Mitigation Strategies');
  }
  if (completenessScore < 70) {
    missingComponents.push('Stakeholder Consultation Report');
    missingComponents.push('Implementation Timeline Details');
  }
  if (completenessScore < 60) {
    missingComponents.push('Financial Viability Analysis');
    missingComponents.push('Resource Allocation Plan');
  }
  
  // Add more completed sections for higher scores
  if (completenessScore >= 70) {
    completedSections.push('Financial Analysis', 'Implementation Timeline');
  }
  if (completenessScore >= 80) {
    completedSections.push('Resource Planning', 'Quality Assurance Plan');
  }
  if (completenessScore >= 90) {
    completedSections.push('Environmental Assessment', 'Risk Management Plan');
  }
  
  const recommendations = missingComponents.map(component => 
    `Include comprehensive ${component.toLowerCase()}`
  );
  
  return {
    missingComponents,
    completedSections,
    recommendations
  };
}

function generatePriceAnalysis(analysis) {
  const deviation = analysis.priceDeviationPercentage;
  const baseEstimate = 15000000 + (Math.random() * 10000000); // 15-25 crores
  const regionalAverage = baseEstimate / (1 + (deviation / 100));
  
  const flaggedItems = [];
  
  if (Math.abs(deviation) > 10) {
    flaggedItems.push({
      item: 'Construction Materials',
      dprCost: Math.round(baseEstimate * 0.55),
      benchmarkCost: Math.round(regionalAverage * 0.55),
      deviation: deviation * 0.8
    });
  }
  
  if (Math.abs(deviation) > 15) {
    flaggedItems.push({
      item: 'Labor Costs',
      dprCost: Math.round(baseEstimate * 0.25),
      benchmarkCost: Math.round(regionalAverage * 0.25),
      deviation: deviation * 0.6
    });
  }
  
  if (Math.abs(deviation) > 5) {
    flaggedItems.push({
      item: 'Equipment Rental',
      dprCost: Math.round(baseEstimate * 0.20),
      benchmarkCost: Math.round(regionalAverage * 0.20),
      deviation: deviation * 0.4
    });
  }
  
  return {
    totalEstimate: Math.round(baseEstimate),
    regionalAverage: Math.round(regionalAverage),
    flaggedItems
  };
}

function generateRiskAnalysis(analysis) {
  const riskLevel = analysis.riskLevel;
  const riskFactors = [];
  
  // Generate risk factors based on risk level
  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    riskFactors.push({
      type: 'Timeline Risk',
      description: 'Monsoon season may significantly delay construction activities',
      impact: 'HIGH',
      mitigation: 'Plan construction activities during dry season, prepare covered work areas'
    });
    riskFactors.push({
      type: 'Cost Risk',
      description: 'Material costs significantly higher than regional average',
      impact: 'HIGH',
      mitigation: 'Negotiate bulk purchase agreements, consider alternative materials'
    });
  }
  
  if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    riskFactors.push({
      type: 'Technical Risk',
      description: 'Complex terrain may require specialized equipment',
      impact: 'MEDIUM',
      mitigation: 'Conduct detailed site survey, arrange specialized equipment in advance'
    });
  }
  
  if (riskLevel === 'LOW') {
    riskFactors.push({
      type: 'Weather Risk',
      description: 'Minor seasonal variations may affect timeline',
      impact: 'LOW',
      mitigation: 'Monitor weather patterns and adjust schedule accordingly'
    });
  }
  
  return { riskFactors };
}

function generateSchemeAnalysis(analysis) {
  const schemeMatches = analysis.schemeMatches;
  const applicableSchemes = [];
  
  // Generate schemes based on number of matches
  if (schemeMatches >= 1) {
    applicableSchemes.push({
      name: 'North East Strategic Investment Scheme',
      relevance: Math.min(95, 70 + (schemeMatches * 5)),
      fundingRange: '₹10-50 Crores',
      eligibility: schemeMatches >= 3 ? 'Fully Eligible' : 'Partially Eligible'
    });
  }
  
  if (schemeMatches >= 2) {
    applicableSchemes.push({
      name: 'Infrastructure Development Scheme',
      relevance: Math.min(85, 60 + (schemeMatches * 4)),
      fundingRange: '₹5-25 Crores',
      eligibility: schemeMatches >= 4 ? 'Fully Eligible' : 'Eligible with conditions'
    });
  }
  
  if (schemeMatches >= 3) {
    applicableSchemes.push({
      name: 'Rural Development Fund',
      relevance: Math.min(75, 50 + (schemeMatches * 3)),
      fundingRange: '₹2-15 Crores',
      eligibility: 'Eligible with conditions'
    });
  }
  
  return { applicableSchemes };
}

function generateFeasibilityAnalysis(analysis) {
  const feasibilityRating = analysis.feasibilityRating;
  
  // Determine risk levels based on feasibility rating
  const timelineRisk = feasibilityRating >= 80 ? 'LOW' : feasibilityRating >= 60 ? 'MEDIUM' : 'HIGH';
  const resourceRisk = feasibilityRating >= 75 ? 'LOW' : feasibilityRating >= 55 ? 'MEDIUM' : 'HIGH';
  const technicalRisk = feasibilityRating >= 70 ? 'LOW' : feasibilityRating >= 50 ? 'MEDIUM' : 'HIGH';
  
  return {
    completionProbability: feasibilityRating,
    timelineRisk,
    resourceRisk,
    technicalRisk
  };
}

function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.completenessScore < 80) {
    recommendations.push('Address missing components identified in gap analysis');
  }
  
  if (Math.abs(analysis.priceDeviationPercentage) > 15) {
    recommendations.push('Review flagged price items for cost optimization');
  }
  
  if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL') {
    recommendations.push('Implement comprehensive risk mitigation strategies');
  }
  
  if (analysis.schemeMatches > 0) {
    recommendations.push('Consider applicable government schemes for funding');
  }
  
  if (analysis.feasibilityRating < 70) {
    recommendations.push('Improve project feasibility through resource optimization');
  }
  
  return recommendations;
}

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple demo authentication
  if ((email === 'admin@mdoner.gov.in' && password === 'admin123') ||
      (email === 'officer@mdoner.gov.in' && password === 'officer123')) {
    
    const user = {
      id: email === 'admin@mdoner.gov.in' ? '1' : '2',
      email,
      role: email === 'admin@mdoner.gov.in' ? 'admin' : 'officer',
      name: email === 'admin@mdoner.gov.in' ? 'System Administrator' : 'DPR Officer'
    };

    res.json({
      success: true,
      token: 'demo-token-' + Date.now(),
      user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// In-memory storage for uploaded documents and analysis results
const uploadedDocuments = [];
const analysisResults = [];

// Upload endpoints with analysis simulation
app.post('/api/upload', upload.single('file'), async (req, res) => {
  let filename = 'uploaded-document.pdf';
  let fileSize = 1024000;
  let fileContent = '';
  
  // Handle real file upload
  if (req.file) {
    filename = req.file.originalname;
    fileSize = req.file.size;
    // Convert buffer to string for text analysis
    fileContent = req.file.buffer.toString('utf8');
  } else if (req.body?.filename) {
    // Handle JSON upload (for testing)
    filename = req.body.filename;
  }
  
  const fileExtension = filename.split('.').pop()?.toLowerCase() || 'pdf';
  
  const document = {
    id: 'doc-' + Date.now(),
    originalFileName: filename,
    fileType: fileExtension.toUpperCase(),
    uploadTimestamp: new Date(),
    fileSize: fileSize,
    language: 'EN',
    processingStatus: 'PROCESSING'
  };
  
  uploadedDocuments.push(document);
  
  // Simulate analysis processing with AI
  setTimeout(async () => {
    try {
      // Update document status
      const docIndex = uploadedDocuments.findIndex(d => d.id === document.id);
      if (docIndex !== -1) {
        uploadedDocuments[docIndex].processingStatus = 'COMPLETED';
      }
      
      // Generate analysis result
      const analysisResult = {
        dprId: document.id,
        documentName: document.originalFileName,
        completenessScore: Math.floor(Math.random() * 40) + 60, // 60-100%
        feasibilityRating: Math.floor(Math.random() * 50) + 50, // 50-100%
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        priceDeviationPercentage: (Math.random() - 0.5) * 40, // -20% to +20%
        schemeMatches: Math.floor(Math.random() * 10) + 1,
        analysisTimestamp: new Date(),
        status: 'COMPLETED',
      };
      
      analysisResults.push(analysisResult);
      console.log(`✅ Analysis completed for: ${document.originalFileName}`);
    } catch (error) {
      console.error('Analysis processing error:', error);
    }
  }, 3000); // 3 second processing simulation
  
  res.json({
    success: true,
    message: 'File uploaded successfully and analysis started',
    document
  });
});

app.post('/api/upload/batch', upload.array('files', 10), (req, res) => {
  const documents = [];
  const files = req.files as Express.Multer.File[] || [];
  
  // Use actual uploaded files if available, otherwise simulate
  const filesToProcess = files.length > 0 ? files : [
    { originalname: 'document1.pdf', size: 1500000 },
    { originalname: 'document2.pdf', size: 2000000 }
  ];
  
  filesToProcess.forEach((file, i) => {
    const filename = file.originalname || `document${i + 1}.pdf`;
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'pdf';
    
    const document = {
      id: 'doc-' + (Date.now() + i),
      originalFileName: filename,
      fileType: fileExtension.toUpperCase(),
      uploadTimestamp: new Date(),
      fileSize: file.size || Math.floor(Math.random() * 2000000) + 1000000,
      language: 'EN',
      processingStatus: 'PROCESSING'
    };
    
    documents.push(document);
    uploadedDocuments.push(document);
    
    // Simulate analysis processing with staggered timing
    setTimeout(() => {
      // Update document status
      const docIndex = uploadedDocuments.findIndex(d => d.id === document.id);
      if (docIndex !== -1) {
        uploadedDocuments[docIndex].processingStatus = 'COMPLETED';
      }
      
      // Generate analysis result
      const analysisResult = {
        dprId: document.id,
        documentName: document.originalFileName,
        completenessScore: Math.floor(Math.random() * 40) + 60,
        feasibilityRating: Math.floor(Math.random() * 50) + 50,
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        priceDeviationPercentage: (Math.random() - 0.5) * 40,
        schemeMatches: Math.floor(Math.random() * 10) + 1,
        analysisTimestamp: new Date(),
        status: 'COMPLETED',
      };
      
      analysisResults.push(analysisResult);
      console.log(`✅ Analysis completed for: ${document.originalFileName}`);
    }, (i + 1) * 2000); // Staggered processing: 2s, 4s, 6s
  });
  
  res.json({
    success: true,
    message: `${documents.length} files uploaded successfully and analysis started`,
    documents
  });
});

// Documents endpoint - now dynamic based on uploads
app.get('/api/documents', (req, res) => {
  // Sort by most recent first
  const sortedDocuments = uploadedDocuments.sort((a, b) => 
    new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime()
  );
  res.json(sortedDocuments);
});

// Processing status endpoint
app.get('/api/processing/status', (req, res) => {
  const processingDocs = uploadedDocuments.filter(doc => doc.processingStatus === 'PROCESSING');
  const completedDocs = uploadedDocuments.filter(doc => doc.processingStatus === 'COMPLETED');
  
  res.json({
    processing: processingDocs.length,
    completed: completedDocs.length,
    total: uploadedDocuments.length,
    recentlyCompleted: analysisResults.slice(-3) // Last 3 completed analyses
  });
});

// Individual document status
app.get('/api/documents/:id/status', (req, res) => {
  const { id } = req.params;
  const document = uploadedDocuments.find(doc => doc.id === id);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  const analysis = analysisResults.find(result => result.dprId === id);
  
  res.json({
    document,
    analysis: analysis || null,
    hasAnalysis: !!analysis
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));

// Catch-all handler for SPA routing
app.use('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 DPR Backend Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

export default app;