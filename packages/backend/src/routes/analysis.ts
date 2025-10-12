import express from 'express';

const router = express.Router();

// GET /api/analysis - Get all analysis results
router.get('/', async (req, res) => {
  try {
    // Mock documents for demonstration
    const mockDocuments = [
      { id: '1', processingStatus: 'COMPLETED', originalFileName: 'Highway Project DPR.pdf' },
      { id: '2', processingStatus: 'COMPLETED', originalFileName: 'Water Supply Project.pdf' },
      { id: '3', processingStatus: 'COMPLETED', originalFileName: 'School Building DPR.pdf' },
      { id: '4', processingStatus: 'COMPLETED', originalFileName: 'Bridge Construction.docx' },
    ];
    
    // Mock analysis results
    const analysisResults = mockDocuments
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
      }))
      .sort((a, b) => b.analysisTimestamp.getTime() - a.analysisTimestamp.getTime());

    res.json(analysisResults);
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    res.status(500).json({ error: 'Failed to fetch analysis results' });
  }
});

// GET /api/analysis/:id - Get specific analysis result with detailed breakdown
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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

    // Generate basic analysis scores
    const completenessScore = Math.random() * 40 + 60; // 60-100%
    const feasibilityRating = Math.random() * 50 + 50; // 50-100%
    const riskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)];
    const priceDeviationPercentage = (Math.random() - 0.5) * 40; // -20% to +20%
    const schemeMatches = Math.floor(Math.random() * 10) + 1;

    // Generate detailed analysis based on basic scores
    const generateDetailedAnalysis = async (completeness: number, feasibility: number, risk: string, priceDeviation: number, schemes: number, documentName: string) => {
      // Project Summary - try AI service first, fallback to mock data
      const generateProjectSummary = async (docName: string) => {
        try {
          // Try to get AI-generated summary from AI services
          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002';
          const response = await fetch(`${aiServiceUrl}/api/dpr/summarize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: `/uploads/${docName}`, // This would be the actual file path
              fileName: docName
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.summary) {
              return result.summary;
            }
          }
        } catch (error) {
          console.log('AI summarization not available, using fallback data');
        }

        // Fallback to mock data if AI service is not available
        return generateMockProjectSummary(docName);
      };

      const generateMockProjectSummary = (docName: string) => {
        const projectTypes = {
          'highway': {
            type: 'Highway Infrastructure',
            department: 'Ministry of Road Transport & Highways',
            objectives: [
              'Improve connectivity between major cities',
              'Reduce travel time and transportation costs',
              'Enhance road safety standards',
              'Support economic development in the region'
            ],
            components: ['Road Construction', 'Bridges & Flyovers', 'Drainage Systems', 'Traffic Management', 'Safety Features'],
            outcomes: [
              'Reduced travel time by 30-40%',
              'Improved road safety with modern infrastructure',
              'Enhanced regional economic connectivity',
              'Better access to markets and services'
            ],
            strategicImportance: 'Critical infrastructure project to improve regional connectivity and support economic growth through enhanced transportation networks.'
          },
          'water': {
            type: 'Water Supply Infrastructure',
            department: 'Ministry of Jal Shakti',
            objectives: [
              'Provide clean drinking water access',
              'Improve water distribution efficiency',
              'Reduce water wastage and losses',
              'Ensure sustainable water management'
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
              'Improve educational infrastructure',
              'Increase school enrollment capacity',
              'Provide modern learning facilities',
              'Enhance educational outcomes'
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
              'Improve river/valley crossing connectivity',
              'Reduce travel distance and time',
              'Enhance transportation efficiency',
              'Support regional development'
            ],
            components: ['Bridge Structure', 'Approach Roads', 'Safety Barriers', 'Lighting Systems', 'Drainage'],
            outcomes: [
              'Direct connectivity across geographical barriers',
              'Reduced travel time by 50%',
              'Improved emergency services access',
              'Enhanced regional economic integration'
            ],
            strategicImportance: 'Strategic infrastructure to overcome geographical barriers and improve regional connectivity for economic and social development.'
          }
        };

        // Determine project type from document name
        let projectInfo = projectTypes['highway']; // default
        const docLower = docName.toLowerCase();
        
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
          'Ahmedabad-Vadodara Route, Gujarat'
        ];

        const durations = ['18 months', '24 months', '30 months', '36 months'];
        const beneficiaries = [
          '2.5 lakh direct beneficiaries',
          '5 lakh people in surrounding areas',
          '1.2 lakh daily commuters',
          '3 lakh residents across 50 villages'
        ];

        // Generate cost based on project type and feasibility
        const baseCosts = {
          'Highway Infrastructure': 150000000, // 15 Cr
          'Water Supply Infrastructure': 80000000, // 8 Cr  
          'Educational Infrastructure': 50000000, // 5 Cr
          'Bridge Infrastructure': 120000000 // 12 Cr
        };

        const estimatedCost = baseCosts[projectInfo.type] * (1 + Math.random() * 2); // 1x to 3x base cost

        return {
          projectTitle: docName.replace(/\.(pdf|docx|doc)$/i, ''),
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
      };
      // Gap Analysis based on completeness
      const generateGapAnalysis = (score: number) => {
        const allComponents = [
          'Executive Summary', 'Project Background', 'Technical Specifications',
          'Environmental Impact Assessment', 'Cost Breakdown Analysis', 
          'Risk Mitigation Plan', 'Stakeholder Consultation Report',
          'Financial Viability Study', 'Resource Planning Matrix'
        ];
        
        let missingCount = 0;
        if (score < 60) missingCount = 6;
        else if (score < 70) missingCount = 4;
        else if (score < 80) missingCount = 3;
        else if (score < 90) missingCount = 2;
        else missingCount = 1;
        
        const missingComponents = allComponents.slice(-missingCount);
        const completedSections = allComponents.slice(0, -missingCount);
        
        return {
          missingComponents,
          completedSections,
          recommendations: missingComponents.map(comp => 
            `Complete ${comp} to improve DPR quality and compliance`
          )
        };
      };

      // Price Analysis based on deviation
      const generatePriceAnalysis = (deviation: number) => {
        const baseEstimate = 50000000 + Math.random() * 200000000; // 5-25 Cr
        const regionalAverage = baseEstimate * (1 - deviation / 100);
        
        const flaggedItems = [];
        if (Math.abs(deviation) > 5) {
          const itemCount = Math.abs(deviation) > 15 ? 3 : Math.abs(deviation) > 10 ? 2 : 1;
          const items = ['Steel & Reinforcement', 'Concrete Work', 'Earthwork', 'Electrical Systems', 'Plumbing'];
          
          for (let i = 0; i < itemCount; i++) {
            const itemDeviation = deviation + (Math.random() - 0.5) * 10;
            const benchmarkCost = 5000000 + Math.random() * 10000000;
            flaggedItems.push({
              item: items[i],
              dprCost: benchmarkCost * (1 + itemDeviation / 100),
              benchmarkCost,
              deviation: itemDeviation
            });
          }
        }
        
        return {
          totalEstimate: baseEstimate,
          regionalAverage,
          flaggedItems
        };
      };

      // Risk Analysis based on risk level
      const generateRiskAnalysis = (riskLevel: string) => {
        const riskFactors = [];
        
        if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
          riskFactors.push(
            {
              type: 'Environmental Compliance',
              impact: 'HIGH',
              description: 'Potential delays due to environmental clearance requirements',
              mitigation: 'Engage environmental consultants early and ensure all clearances are obtained'
            },
            {
              type: 'Resource Availability',
              impact: 'HIGH',
              description: 'Skilled labor and material shortage in the region',
              mitigation: 'Establish multiple supplier contracts and training programs'
            }
          );
        }
        
        if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
          riskFactors.push({
            type: 'Budget Overrun',
            impact: 'MEDIUM',
            description: 'Cost escalation due to market fluctuations',
            mitigation: 'Include contingency buffer and regular cost reviews'
          });
        }
        
        if (riskLevel === 'LOW') {
          riskFactors.push({
            type: 'Weather Dependency',
            impact: 'LOW',
            description: 'Minor delays possible during monsoon season',
            mitigation: 'Plan construction schedule considering seasonal variations'
          });
        }
        
        return { riskFactors };
      };

      // Scheme Analysis based on matches
      const generateSchemeAnalysis = (matchCount: number) => {
        const allSchemes = [
          { name: 'Pradhan Mantri Gram Sadak Yojana', fundingRange: '₹10-50 Cr', relevance: 95 },
          { name: 'Smart Cities Mission', fundingRange: '₹100-500 Cr', relevance: 88 },
          { name: 'Swachh Bharat Mission', fundingRange: '₹5-25 Cr', relevance: 82 },
          { name: 'National Rural Infrastructure Development Fund', fundingRange: '₹20-100 Cr', relevance: 78 },
          { name: 'Atal Mission for Rejuvenation', fundingRange: '₹15-75 Cr', relevance: 72 }
        ];
        
        const applicableSchemes = allSchemes.slice(0, Math.min(matchCount, 5)).map(scheme => ({
          ...scheme,
          eligibility: scheme.relevance > 85 ? 'Fully Eligible' : scheme.relevance > 70 ? 'Conditionally Eligible' : 'Under Review'
        }));
        
        return { applicableSchemes };
      };

      // Feasibility Analysis based on rating
      const generateFeasibilityAnalysis = (rating: number) => {
        const getTimelineRisk = (score: number) => score > 80 ? 'LOW' : score > 60 ? 'MEDIUM' : 'HIGH';
        const getResourceRisk = (score: number) => score > 75 ? 'LOW' : score > 55 ? 'MEDIUM' : 'HIGH';
        const getTechnicalRisk = (score: number) => score > 70 ? 'LOW' : score > 50 ? 'MEDIUM' : 'HIGH';
        
        return {
          completionProbability: rating,
          timelineRisk: getTimelineRisk(rating),
          resourceRisk: getResourceRisk(rating),
          technicalRisk: getTechnicalRisk(rating)
        };
      };

      return {
        projectSummary: await generateProjectSummary(documentName),
        gapAnalysis: generateGapAnalysis(completeness),
        priceAnalysis: generatePriceAnalysis(priceDeviation),
        riskAnalysis: generateRiskAnalysis(risk),
        schemeAnalysis: generateSchemeAnalysis(schemes),
        feasibilityAnalysis: generateFeasibilityAnalysis(feasibility),
        recommendations: [
          `Focus on completing missing components to reach ${Math.min(100, completeness + 15)}% completeness`,
          `Address ${risk.toLowerCase()} risk factors through proper mitigation strategies`,
          schemes > 0 ? `Explore ${schemes} applicable government schemes for funding` : 'Consider alternative funding sources',
          Math.abs(priceDeviation) > 10 ? 'Review cost estimates for significant price deviations' : 'Cost estimates are within acceptable range'
        ].filter(Boolean)
      };
    };

    // Generate complete detailed analysis
    const detailedAnalysis = await generateDetailedAnalysis(
      completenessScore, 
      feasibilityRating, 
      riskLevel, 
      priceDeviationPercentage, 
      schemeMatches,
      document.originalFileName
    );

    // Complete analysis result with detailed breakdown
    const analysisResult = {
      dprId: document.id,
      documentName: document.originalFileName,
      completenessScore,
      feasibilityRating,
      riskLevel,
      priceDeviationPercentage,
      schemeMatches,
      analysisTimestamp: new Date(),
      status: 'COMPLETED' as const,
      ...detailedAnalysis
    };

    res.json(analysisResult);
  } catch (error) {
    console.error('Error fetching detailed analysis result:', error);
    res.status(500).json({ error: 'Failed to fetch detailed analysis result' });
  }
});

export default router;