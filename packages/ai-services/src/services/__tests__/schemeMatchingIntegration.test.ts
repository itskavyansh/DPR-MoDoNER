import { describe, it, expect, beforeEach } from 'vitest';
import { SchemeMatchingService } from '../schemeMatchingService.js';
import { SchemeVerificationService } from '../schemeVerificationService.js';
import { GovernmentScheme, SchemeMatchingRequest } from '../../../../shared/src/types/index.js';

describe('Scheme Matching Integration Tests', () => {
  let matchingService: SchemeMatchingService;
  let verificationService: SchemeVerificationService;
  let mockSchemes: GovernmentScheme[];

  beforeEach(() => {
    matchingService = new SchemeMatchingService();
    verificationService = new SchemeVerificationService();
    
    // Comprehensive mock schemes for integration testing
    mockSchemes = [
      {
        id: '1',
        schemeName: 'Pradhan Mantri Gram Sadak Yojana',
        schemeCode: 'PMGSY',
        ministry: 'Ministry of Rural Development',
        department: 'Department of Rural Development',
        description: 'All-weather road connectivity to unconnected rural habitations',
        objectives: ['Rural connectivity', 'Economic development', 'Market access'],
        eligibilityCriteria: ['Rural habitations', 'Population above 250', 'No existing connectivity'],
        fundingRangeMin: 5000000,
        fundingRangeMax: 100000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Infrastructure', 'Rural Development', 'Transportation'],
        targetBeneficiaries: ['Rural Communities', 'Farmers', 'Local Businesses'],
        keywords: ['rural', 'roads', 'connectivity', 'infrastructure', 'transportation', 'bridges'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2000-12-25'),
        status: 'ACTIVE',
        websiteUrl: 'https://pmgsy.nic.in',
        requiredDocuments: ['Detailed Project Report', 'Environmental Clearance', 'Land Acquisition Certificate'],
        processingTimeDays: 120,
        approvalAuthority: 'Ministry of Rural Development',
        successMetrics: ['Road length completed', 'Villages connected', 'All-weather connectivity'],
        budgetAllocation: 15000000000,
        budgetYear: 2023,
        averageFundingAmount: 25000000,
        lastUpdated: new Date(),
        dataSource: 'Ministry of Rural Development',
        verificationStatus: 'VERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        schemeName: 'Mahatma Gandhi National Rural Employment Guarantee Act',
        schemeCode: 'MGNREGA',
        ministry: 'Ministry of Rural Development',
        department: 'Department of Rural Development',
        description: 'Employment guarantee scheme providing 100 days of wage employment',
        objectives: ['Employment generation', 'Rural asset creation', 'Livelihood security'],
        eligibilityCriteria: ['Rural households', 'Adult members willing to work', 'Demand-driven employment'],
        fundingRangeMin: 1000000,
        fundingRangeMax: 50000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Employment', 'Rural Development', 'Social Security', 'Infrastructure'],
        targetBeneficiaries: ['Rural Households', 'Unemployed Adults', 'Women', 'Marginalized Communities'],
        keywords: ['employment', 'rural', 'guarantee', 'work', 'wages', 'livelihood', 'assets'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2005-02-02'),
        status: 'ACTIVE',
        websiteUrl: 'https://nrega.nic.in',
        requiredDocuments: ['Job Card', 'Work Demand Application', 'Muster Roll'],
        processingTimeDays: 15,
        approvalAuthority: 'Gram Panchayat',
        successMetrics: ['Person-days generated', 'Assets created', 'Household coverage'],
        budgetAllocation: 73000000000,
        budgetYear: 2023,
        averageFundingAmount: 5000000,
        lastUpdated: new Date(),
        dataSource: 'Ministry of Rural Development',
        verificationStatus: 'VERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        schemeName: 'Swachh Bharat Mission Gramin',
        schemeCode: 'SBM-G',
        ministry: 'Ministry of Jal Shakti',
        department: 'Department of Drinking Water and Sanitation',
        description: 'Rural sanitation program to achieve Open Defecation Free villages',
        objectives: ['Sanitation coverage', 'Behavior change', 'Community participation'],
        eligibilityCriteria: ['Rural areas', 'Households without toilets', 'Community commitment'],
        fundingRangeMin: 2000000,
        fundingRangeMax: 30000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Sanitation', 'Health', 'Rural Development', 'Environment'],
        targetBeneficiaries: ['Rural Households', 'Women', 'Children', 'Community'],
        keywords: ['sanitation', 'toilets', 'hygiene', 'clean', 'rural', 'health', 'ODF'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2014-10-02'),
        status: 'ACTIVE',
        websiteUrl: 'https://swachhbharatmission.gov.in',
        requiredDocuments: ['Baseline Survey', 'Implementation Plan', 'IEC Strategy'],
        processingTimeDays: 60,
        approvalAuthority: 'State Implementation Agency',
        successMetrics: ['Toilet coverage', 'ODF villages', 'Behavior change'],
        budgetAllocation: 34699000000,
        budgetYear: 2023,
        averageFundingAmount: 8000000,
        lastUpdated: new Date(),
        dataSource: 'Ministry of Jal Shakti',
        verificationStatus: 'VERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        schemeName: 'Pradhan Mantri Awas Yojana Gramin',
        schemeCode: 'PMAY-G',
        ministry: 'Ministry of Rural Development',
        department: 'Department of Rural Development',
        description: 'Housing scheme for rural poor to achieve Housing for All by 2022',
        objectives: ['Rural housing', 'Shelter security', 'Quality construction'],
        eligibilityCriteria: ['Rural BPL families', 'Houseless families', 'Families with kutcha houses'],
        fundingRangeMin: 3000000,
        fundingRangeMax: 40000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Housing', 'Rural Development', 'Social Security'],
        targetBeneficiaries: ['Rural Poor', 'Homeless Families', 'Women'],
        keywords: ['housing', 'rural', 'shelter', 'construction', 'poor', 'BPL'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2016-11-20'),
        status: 'ACTIVE',
        websiteUrl: 'https://pmayg.nic.in',
        requiredDocuments: ['BPL Certificate', 'Land Documents', 'Construction Plan'],
        processingTimeDays: 90,
        approvalAuthority: 'District Collector',
        successMetrics: ['Houses completed', 'Beneficiary satisfaction', 'Quality compliance'],
        budgetAllocation: 48000000000,
        budgetYear: 2023,
        averageFundingAmount: 12000000,
        lastUpdated: new Date(),
        dataSource: 'Ministry of Rural Development',
        verificationStatus: 'VERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  describe('End-to-End Scheme Matching Workflow', () => {
    it('should perform complete scheme analysis for rural infrastructure project', async () => {
      const projectRequest: SchemeMatchingRequest = {
        documentId: 'integration-test-1',
        projectDescription: 'Comprehensive rural development project in Assam focusing on road connectivity, employment generation, and sanitation facilities for remote villages. The project aims to connect 50 villages through all-weather roads, create employment opportunities for 1000 households, and establish sanitation facilities in 200 households.',
        projectType: 'Rural Infrastructure Development',
        estimatedCost: 75000000,
        location: {
          state: 'Assam',
          district: 'Kamrup'
        },
        sectors: ['Infrastructure', 'Rural Development', 'Employment', 'Sanitation'],
        targetBeneficiaries: ['Rural Communities', 'Farmers', 'Unemployed Adults', 'Women'],
        existingSchemes: ['PMGSY', 'Invalid Old Scheme Name'],
        matchingOptions: {
          includeInactive: false,
          minRelevanceScore: 0.3,
          maxResults: 10
        }
      };

      // Step 1: Perform scheme matching
      const matchingResult = await matchingService.matchSchemes(projectRequest, mockSchemes);

      expect(matchingResult.documentId).toBe('integration-test-1');
      expect(matchingResult.totalSchemesAnalyzed).toBeGreaterThanOrEqual(2);
      expect(matchingResult.matchedSchemes.length).toBeGreaterThan(0);

      // Should match relevant schemes - at least PMGSY should match for infrastructure project
      const schemeNames = matchingResult.matchedSchemes.map(m => m.scheme.schemeName);
      expect(schemeNames).toContain('Pradhan Mantri Gram Sadak Yojana');
      
      // Other schemes may or may not match depending on relevance scores
      const hasEmploymentScheme = schemeNames.includes('Mahatma Gandhi National Rural Employment Guarantee Act');
      const hasSanitationScheme = schemeNames.includes('Swachh Bharat Mission Gramin');
      
      // At least one additional relevant scheme should match
      expect(hasEmploymentScheme || hasSanitationScheme).toBe(true);

      // Step 2: Verify existing scheme references
      const verificationResult = await verificationService.verifySchemeReferences(
        projectRequest.documentId,
        projectRequest.existingSchemes!,
        mockSchemes
      );

      expect(verificationResult.verifiedSchemes.length).toBe(1); // PMGSY should be verified
      expect(verificationResult.unverifiedReferences.length).toBe(1); // Invalid scheme
      expect(verificationResult.verifiedSchemes[0].schemeCode).toBe('PMGSY');

      // Step 3: Perform comprehensive gap analysis
      const gapAnalysis = await verificationService.performComprehensiveGapAnalysis(
        projectRequest.documentId,
        {
          description: projectRequest.projectDescription,
          sectors: projectRequest.sectors,
          location: projectRequest.location!,
          estimatedCost: projectRequest.estimatedCost!,
          targetBeneficiaries: projectRequest.targetBeneficiaries
        },
        projectRequest.existingSchemes!,
        mockSchemes
      );

      expect(gapAnalysis.documentId).toBe('integration-test-1');
      expect(gapAnalysis.verifiedSchemes.length).toBe(1);
      expect(gapAnalysis.missingOpportunities.length).toBeGreaterThan(0);
      expect(gapAnalysis.incorrectReferences.length).toBe(1);
      expect(gapAnalysis.completenessScore).toBeGreaterThan(0);
      expect(gapAnalysis.completenessScore).toBeLessThan(1);

      // Step 4: Generate optimization recommendations
      const recommendations = verificationService.generateSchemeOptimizationRecommendations(
        gapAnalysis,
        {
          estimatedCost: projectRequest.estimatedCost!,
          sectors: projectRequest.sectors,
          location: projectRequest.location!
        },
        mockSchemes
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should have high-priority recommendations for incorrect references
      const highPriorityRecs = recommendations.filter(r => r.priority === 'HIGH');
      expect(highPriorityRecs.length).toBeGreaterThan(0);

      // Should recommend new schemes
      const newSchemeRecs = recommendations.filter(r => r.type === 'NEW_SCHEME');
      expect(newSchemeRecs.length).toBeGreaterThan(0);

      console.log('Integration Test Results:');
      console.log(`- Schemes Analyzed: ${matchingResult.totalSchemesAnalyzed}`);
      console.log(`- Schemes Matched: ${matchingResult.matchedSchemes.length}`);
      console.log(`- Verified Schemes: ${verificationResult.verifiedSchemes.length}`);
      console.log(`- Missing Opportunities: ${gapAnalysis.missingOpportunities.length}`);
      console.log(`- Completeness Score: ${(gapAnalysis.completenessScore * 100).toFixed(1)}%`);
      console.log(`- Gap Severity: ${gapAnalysis.gapSeverity}`);
      console.log(`- Recommendations: ${recommendations.length}`);
    });

    it('should handle project with perfect scheme alignment', async () => {
      const perfectProjectRequest: SchemeMatchingRequest = {
        documentId: 'perfect-alignment-test',
        projectDescription: 'Rural road connectivity project under PMGSY with employment generation through MGNREGA and sanitation component under SBM-G',
        projectType: 'Integrated Rural Development',
        estimatedCost: 45000000,
        location: {
          state: 'Bihar',
          district: 'Patna'
        },
        sectors: ['Infrastructure', 'Rural Development', 'Employment', 'Sanitation'],
        targetBeneficiaries: ['Rural Communities', 'Farmers', 'Women'],
        existingSchemes: ['PMGSY', 'MGNREGA', 'SBM-G'], // All correct references
        matchingOptions: {
          minRelevanceScore: 0.4,
          maxResults: 5
        }
      };

      const matchingResult = await matchingService.matchSchemes(perfectProjectRequest, mockSchemes);
      
      const gapAnalysis = await verificationService.performComprehensiveGapAnalysis(
        perfectProjectRequest.documentId,
        {
          description: perfectProjectRequest.projectDescription,
          sectors: perfectProjectRequest.sectors,
          location: perfectProjectRequest.location!,
          estimatedCost: perfectProjectRequest.estimatedCost!,
          targetBeneficiaries: perfectProjectRequest.targetBeneficiaries
        },
        perfectProjectRequest.existingSchemes!,
        mockSchemes
      );

      // Should have high completeness score
      expect(gapAnalysis.completenessScore).toBeGreaterThan(0.7);
      expect(gapAnalysis.gapSeverity).toBe('LOW');
      expect(gapAnalysis.incorrectReferences.length).toBe(0);
      expect(gapAnalysis.verifiedSchemes.length).toBe(3);
    });

    it('should handle project with no scheme alignment', async () => {
      const poorProjectRequest: SchemeMatchingRequest = {
        documentId: 'poor-alignment-test',
        projectDescription: 'Urban technology project for software development and IT services',
        projectType: 'Technology Development',
        estimatedCost: 5000000,
        location: {
          state: 'Karnataka',
          district: 'Bangalore'
        },
        sectors: ['Technology', 'Software', 'IT Services'],
        targetBeneficiaries: ['IT Professionals', 'Startups'],
        existingSchemes: ['Non-existent Scheme 1', 'Invalid Scheme 2'],
        matchingOptions: {
          minRelevanceScore: 0.3,
          maxResults: 10
        }
      };

      const matchingResult = await matchingService.matchSchemes(poorProjectRequest, mockSchemes);
      
      const gapAnalysis = await verificationService.performComprehensiveGapAnalysis(
        poorProjectRequest.documentId,
        {
          description: poorProjectRequest.projectDescription,
          sectors: poorProjectRequest.sectors,
          location: poorProjectRequest.location!,
          estimatedCost: poorProjectRequest.estimatedCost!,
          targetBeneficiaries: poorProjectRequest.targetBeneficiaries
        },
        poorProjectRequest.existingSchemes!,
        mockSchemes
      );

      // Should have low completeness score and high severity
      expect(gapAnalysis.completenessScore).toBeLessThan(0.5);
      expect(gapAnalysis.gapSeverity).toBe('CRITICAL');
      expect(gapAnalysis.incorrectReferences.length).toBe(2);
      expect(gapAnalysis.verifiedSchemes.length).toBe(0);

      // Should have few or no relevant matches
      expect(matchingResult.matchedSchemes.length).toBeLessThanOrEqual(1);
    });

    it('should provide consistent results across multiple runs', async () => {
      const consistencyRequest: SchemeMatchingRequest = {
        documentId: 'consistency-test',
        projectDescription: 'Rural infrastructure development with focus on connectivity and employment',
        estimatedCost: 30000000,
        location: { state: 'Assam' },
        sectors: ['Infrastructure', 'Rural Development'],
        targetBeneficiaries: ['Rural Communities'],
        existingSchemes: ['PMGSY'],
        matchingOptions: { minRelevanceScore: 0.3 }
      };

      // Run the same analysis multiple times
      const results = await Promise.all([
        matchingService.matchSchemes(consistencyRequest, mockSchemes),
        matchingService.matchSchemes(consistencyRequest, mockSchemes),
        matchingService.matchSchemes(consistencyRequest, mockSchemes)
      ]);

      // Results should be consistent
      expect(results[0].totalSchemesAnalyzed).toBe(results[1].totalSchemesAnalyzed);
      expect(results[1].totalSchemesAnalyzed).toBe(results[2].totalSchemesAnalyzed);

      expect(results[0].matchedSchemes.length).toBe(results[1].matchedSchemes.length);
      expect(results[1].matchedSchemes.length).toBe(results[2].matchedSchemes.length);

      // Relevance scores should be identical
      for (let i = 0; i < results[0].matchedSchemes.length; i++) {
        expect(results[0].matchedSchemes[i].match.relevanceScore)
          .toBe(results[1].matchedSchemes[i].match.relevanceScore);
        expect(results[1].matchedSchemes[i].match.relevanceScore)
          .toBe(results[2].matchedSchemes[i].match.relevanceScore);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of schemes efficiently', async () => {
      // Create a large dataset
      const largeSchemeSet = Array.from({ length: 100 }, (_, index) => ({
        ...mockSchemes[index % mockSchemes.length],
        id: `scheme-${index}`,
        schemeName: `Test Scheme ${index}`,
        schemeCode: `TS-${index}`
      }));

      const performanceRequest: SchemeMatchingRequest = {
        documentId: 'performance-test',
        projectDescription: 'Large scale rural development project',
        estimatedCost: 50000000,
        location: { state: 'Assam' },
        sectors: ['Rural Development'],
        targetBeneficiaries: ['Rural Communities'],
        matchingOptions: { maxResults: 20 }
      };

      const startTime = Date.now();
      const result = await matchingService.matchSchemes(performanceRequest, largeSchemeSet);
      const endTime = Date.now();

      expect(result.totalSchemesAnalyzed).toBeGreaterThanOrEqual(50);
      expect(result.matchedSchemes.length).toBeLessThanOrEqual(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should handle complex project descriptions efficiently', async () => {
      const complexDescription = `
        This is a comprehensive multi-sectoral rural development project spanning across multiple districts in Assam.
        The project encompasses infrastructure development including construction of all-weather roads connecting remote villages,
        bridges across major rivers, and culverts for proper drainage. Employment generation is a key component through
        various works including road construction, maintenance activities, and skill development programs.
        Sanitation infrastructure will be developed including individual household toilets, community sanitation complexes,
        and waste management systems. Housing support will be provided to homeless and inadequately housed families.
        The project also includes capacity building of local institutions, training of community members,
        and establishment of monitoring and evaluation systems. Environmental sustainability measures include
        plantation drives, soil conservation works, and water harvesting structures.
        Technology integration through digital platforms for project monitoring, beneficiary tracking,
        and grievance redressal mechanisms. Community participation and social mobilization activities
        to ensure ownership and sustainability of project outcomes.
      `;

      const complexRequest: SchemeMatchingRequest = {
        documentId: 'complex-description-test',
        projectDescription: complexDescription,
        estimatedCost: 100000000,
        location: { state: 'Assam', district: 'Multiple Districts' },
        sectors: ['Infrastructure', 'Rural Development', 'Employment', 'Sanitation', 'Housing', 'Environment'],
        targetBeneficiaries: ['Rural Communities', 'Farmers', 'Women', 'Youth', 'Marginalized Groups'],
        existingSchemes: ['PMGSY', 'MGNREGA', 'SBM-G', 'PMAY-G'],
        matchingOptions: { minRelevanceScore: 0.2, maxResults: 15 }
      };

      const startTime = Date.now();
      const result = await matchingService.matchSchemes(complexRequest, mockSchemes);
      const endTime = Date.now();

      expect(result.matchedSchemes.length).toBeGreaterThan(0);
      expect(result.gapAnalysis).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle complexity efficiently
    });
  });

  describe('Data Quality and Validation', () => {
    it('should handle schemes with incomplete data gracefully', async () => {
      const incompleteSchemes = mockSchemes.map(scheme => ({
        ...scheme,
        keywords: [],
        objectives: [],
        fundingRangeMin: undefined,
        fundingRangeMax: undefined,
        targetBeneficiaries: [],
        successMetrics: []
      }));

      const request: SchemeMatchingRequest = {
        documentId: 'incomplete-data-test',
        projectDescription: 'Rural development project',
        estimatedCost: 20000000,
        location: { state: 'Assam' },
        sectors: ['Rural Development'],
        targetBeneficiaries: ['Rural Communities']
      };

      const result = await matchingService.matchSchemes(request, incompleteSchemes);

      expect(result).toBeDefined();
      expect(result.totalSchemesAnalyzed).toBe(incompleteSchemes.length);
      expect(result.matchedSchemes).toBeInstanceOf(Array);
      expect(result.gapAnalysis).toBeDefined();
    });

    it('should validate and sanitize input data', async () => {
      const malformedRequest: SchemeMatchingRequest = {
        documentId: 'malformed-test',
        projectDescription: '', // Empty description
        estimatedCost: -1000000, // Negative cost
        location: { state: '' }, // Empty state
        sectors: [], // Empty sectors
        targetBeneficiaries: undefined,
        existingSchemes: ['', '   ', 'invalid-scheme'] // Invalid scheme names
      };

      // Should handle malformed input gracefully
      const result = await matchingService.matchSchemes(malformedRequest, mockSchemes);

      expect(result).toBeDefined();
      expect(result.documentId).toBe('malformed-test');
      expect(result.matchedSchemes).toBeInstanceOf(Array);
    });
  });
});