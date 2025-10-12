import { describe, it, expect, beforeEach } from 'vitest';
import { SchemeVerificationService } from '../schemeVerificationService.js';
import { GovernmentScheme, SchemeGapAnalysis } from '../../../../shared/src/types/index.js';

describe('SchemeVerificationService', () => {
  let service: SchemeVerificationService;
  let mockSchemes: GovernmentScheme[];

  beforeEach(() => {
    service = new SchemeVerificationService();
    
    // Mock government schemes
    mockSchemes = [
      {
        id: '1',
        schemeName: 'Pradhan Mantri Gram Sadak Yojana',
        schemeCode: 'PMGSY',
        ministry: 'Ministry of Rural Development',
        department: 'Department of Rural Development',
        description: 'Rural road connectivity scheme for all-weather roads',
        objectives: ['Rural connectivity', 'Economic development', 'Access to markets'],
        eligibilityCriteria: ['Rural habitations', 'Population above 250', 'No existing connectivity'],
        fundingRangeMin: 5000000,
        fundingRangeMax: 100000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Infrastructure', 'Rural Development', 'Transportation'],
        targetBeneficiaries: ['Rural Communities', 'Farmers'],
        keywords: ['rural', 'roads', 'connectivity', 'infrastructure', 'transportation'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2000-12-25'),
        status: 'ACTIVE',
        websiteUrl: 'https://pmgsy.nic.in',
        requiredDocuments: ['DPR', 'Environmental Clearance', 'Land Acquisition'],
        processingTimeDays: 120,
        approvalAuthority: 'Ministry of Rural Development',
        successMetrics: ['Road length completed', 'Villages connected'],
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
        description: 'Employment guarantee scheme for rural households',
        objectives: ['Employment generation', 'Rural development', 'Asset creation'],
        eligibilityCriteria: ['Rural households', 'Adult members', 'Demand for work'],
        fundingRangeMin: 1000000,
        fundingRangeMax: 50000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Employment', 'Rural Development', 'Social Security'],
        targetBeneficiaries: ['Rural Households', 'Unemployed Adults'],
        keywords: ['employment', 'rural', 'guarantee', 'work', 'wages'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2005-02-02'),
        status: 'ACTIVE',
        websiteUrl: 'https://nrega.nic.in',
        requiredDocuments: ['Job Card', 'Work Demand', 'Muster Roll'],
        processingTimeDays: 15,
        approvalAuthority: 'Gram Panchayat',
        successMetrics: ['Person-days generated', 'Assets created'],
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
        description: 'Rural sanitation program for clean India mission',
        objectives: ['Sanitation coverage', 'Open defecation free villages', 'Behavior change'],
        eligibilityCriteria: ['Rural areas', 'Households without toilets', 'Community participation'],
        fundingRangeMin: 2000000,
        fundingRangeMax: 30000000,
        applicableRegions: ['ALL_STATES'],
        applicableSectors: ['Sanitation', 'Health', 'Rural Development'],
        targetBeneficiaries: ['Rural Households', 'Women', 'Children'],
        keywords: ['sanitation', 'toilets', 'hygiene', 'clean', 'rural'],
        schemeType: 'CENTRALLY_SPONSORED',
        launchDate: new Date('2014-10-02'),
        status: 'ACTIVE',
        websiteUrl: 'https://swachhbharatmission.gov.in',
        requiredDocuments: ['Household Survey', 'Implementation Plan', 'IEC Strategy'],
        processingTimeDays: 60,
        approvalAuthority: 'State Implementation Agency',
        successMetrics: ['Toilet coverage', 'ODF villages'],
        budgetAllocation: 34699000000,
        budgetYear: 2023,
        averageFundingAmount: 8000000,
        lastUpdated: new Date(),
        dataSource: 'Ministry of Jal Shakti',
        verificationStatus: 'VERIFIED',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  describe('verifySchemeReferences', () => {
    it('should verify exact scheme name matches', async () => {
      const mentionedSchemes = ['Pradhan Mantri Gram Sadak Yojana', 'MGNREGA'];
      
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        mentionedSchemes,
        mockSchemes
      );

      expect(result.verifiedSchemes).toHaveLength(2);
      expect(result.verifiedSchemes[0].schemeName).toBe('Pradhan Mantri Gram Sadak Yojana');
      expect(result.verifiedSchemes[1].schemeName).toBe('Mahatma Gandhi National Rural Employment Guarantee Act');
      expect(result.unverifiedReferences).toHaveLength(0);
    });

    it('should verify scheme code matches', async () => {
      const mentionedSchemes = ['PMGSY', 'SBM-G'];
      
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        mentionedSchemes,
        mockSchemes
      );

      expect(result.verifiedSchemes).toHaveLength(2);
      expect(result.verifiedSchemes[0].schemeCode).toBe('PMGSY');
      expect(result.verifiedSchemes[1].schemeCode).toBe('SBM-G');
      expect(result.unverifiedReferences).toHaveLength(0);
    });

    it('should identify unverified references', async () => {
      const mentionedSchemes = ['Invalid Scheme Name', 'Another Invalid Scheme'];
      
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        mentionedSchemes,
        mockSchemes
      );

      expect(result.verifiedSchemes).toHaveLength(0);
      expect(result.unverifiedReferences).toHaveLength(2);
      expect(result.unverifiedReferences).toContain('Invalid Scheme Name');
      expect(result.unverifiedReferences).toContain('Another Invalid Scheme');
    });

    it('should provide suggestions for similar scheme names', async () => {
      const mentionedSchemes = ['Pradhan Mantri Gram Sadak', 'NREGA']; // Partial/similar names
      
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        mentionedSchemes,
        mockSchemes
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      
      const pmgsySuggestion = result.suggestions.find(s => 
        s.suggestedScheme.schemeName === 'Pradhan Mantri Gram Sadak Yojana'
      );
      expect(pmgsySuggestion).toBeDefined();
      expect(pmgsySuggestion!.confidence).toBeGreaterThan(0.7);
    });

    it('should handle mixed verified and unverified references', async () => {
      const mentionedSchemes = ['PMGSY', 'Invalid Scheme', 'MGNREGA'];
      
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        mentionedSchemes,
        mockSchemes
      );

      expect(result.verifiedSchemes).toHaveLength(2);
      expect(result.unverifiedReferences).toHaveLength(1);
      expect(result.unverifiedReferences[0]).toBe('Invalid Scheme');
    });
  });

  describe('identifyMissingOpportunities', () => {
    it('should identify relevant missing schemes', async () => {
      const existingSchemes = [mockSchemes[0]]; // Only PMGSY
      const projectDescription = 'Rural development project focusing on sanitation and employment generation';
      const projectSectors = ['Rural Development', 'Sanitation', 'Employment'];
      const projectLocation = { state: 'Assam', district: 'Kamrup' };
      const estimatedCost = 20000000;

      const result = await service.identifyMissingOpportunities(
        'test-doc-1',
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost,
        existingSchemes,
        mockSchemes
      );

      expect(result.missingOpportunities.length).toBeGreaterThan(0);
      
      // Should identify MGNREGA and SBM-G as missing opportunities
      const schemeNames = result.missingOpportunities.map(s => s.schemeName);
      expect(schemeNames).toContain('Mahatma Gandhi National Rural Employment Guarantee Act');
      expect(schemeNames).toContain('Swachh Bharat Mission Gramin');
    });

    it('should calculate relevance scores for opportunities', async () => {
      const existingSchemes: GovernmentScheme[] = [];
      const projectDescription = 'Sanitation infrastructure development in rural areas';
      const projectSectors = ['Sanitation', 'Rural Development'];
      const projectLocation = { state: 'Bihar' };
      const estimatedCost = 15000000;

      const result = await service.identifyMissingOpportunities(
        'test-doc-1',
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost,
        existingSchemes,
        mockSchemes
      );

      expect(result.opportunityAnalysis.length).toBeGreaterThan(0);
      
      // SBM-G should have high relevance for sanitation project
      const sbmAnalysis = result.opportunityAnalysis.find(a => 
        a.scheme.schemeName === 'Swachh Bharat Mission Gramin'
      );
      expect(sbmAnalysis).toBeDefined();
      expect(sbmAnalysis!.relevanceScore).toBeGreaterThan(0.5);
    });

    it('should assess implementation complexity', async () => {
      const existingSchemes: GovernmentScheme[] = [];
      const projectDescription = 'Rural infrastructure development';
      const projectSectors = ['Infrastructure'];
      const projectLocation = { state: 'Odisha' };
      const estimatedCost = 50000000;

      const result = await service.identifyMissingOpportunities(
        'test-doc-1',
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost,
        existingSchemes,
        mockSchemes
      );

      expect(result.opportunityAnalysis.length).toBeGreaterThan(0);
      
      result.opportunityAnalysis.forEach(analysis => {
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(analysis.implementationComplexity);
        expect(analysis.timeToImplement).toBeDefined();
        expect(analysis.potentialBenefit).toBeDefined();
      });
    });
  });

  describe('performComprehensiveGapAnalysis', () => {
    it('should perform complete gap analysis', async () => {
      const projectData = {
        description: 'Rural road construction and employment generation project',
        sectors: ['Infrastructure', 'Employment', 'Rural Development'],
        location: { state: 'Assam', district: 'Kamrup' },
        estimatedCost: 30000000,
        targetBeneficiaries: ['Rural Communities', 'Unemployed Adults']
      };
      const mentionedSchemes = ['PMGSY', 'Invalid Scheme Name'];

      const result = await service.performComprehensiveGapAnalysis(
        'test-doc-1',
        projectData,
        mentionedSchemes,
        mockSchemes
      );

      expect(result).toBeDefined();
      expect(result.documentId).toBe('test-doc-1');
      expect(result.existingSchemesMentioned).toEqual(mentionedSchemes);
      expect(result.verifiedSchemes.length).toBeGreaterThan(0);
      expect(result.missingOpportunities.length).toBeGreaterThan(0);
      expect(result.incorrectReferences.length).toBeGreaterThan(0);
      expect(result.completenessScore).toBeGreaterThanOrEqual(0);
      expect(result.completenessScore).toBeLessThanOrEqual(1);
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.gapSeverity);
    });

    it('should calculate appropriate completeness score', async () => {
      const projectData = {
        description: 'Well-planned rural development project',
        sectors: ['Rural Development', 'Infrastructure'],
        location: { state: 'Kerala' },
        estimatedCost: 25000000
      };
      
      // All correct scheme references
      const mentionedSchemes = ['PMGSY', 'MGNREGA'];

      const result = await service.performComprehensiveGapAnalysis(
        'test-doc-1',
        projectData,
        mentionedSchemes,
        mockSchemes
      );

      expect(result.completenessScore).toBeGreaterThan(0.5);
      expect(result.gapSeverity).not.toBe('CRITICAL');
    });

    it('should identify critical gaps', async () => {
      const projectData = {
        description: 'Poorly planned project with no scheme alignment',
        sectors: ['Unknown Sector'],
        location: { state: 'Unknown State' },
        estimatedCost: 1000000
      };
      
      // All incorrect scheme references
      const mentionedSchemes = ['Invalid Scheme 1', 'Invalid Scheme 2', 'Invalid Scheme 3'];

      const result = await service.performComprehensiveGapAnalysis(
        'test-doc-1',
        projectData,
        mentionedSchemes,
        mockSchemes
      );

      expect(result.completenessScore).toBeLessThan(0.5);
      expect(result.gapSeverity).toBe('CRITICAL');
      expect(result.incorrectReferences.length).toBe(3);
    });
  });

  describe('generateSchemeOptimizationRecommendations', () => {
    it('should generate recommendations for incorrect references', async () => {
      const gapAnalysis: SchemeGapAnalysis = {
        id: 'gap-1',
        documentId: 'test-doc-1',
        existingSchemesMentioned: ['Invalid Scheme'],
        verifiedSchemes: [],
        missingOpportunities: ['PMGSY'],
        incorrectReferences: ['Invalid Scheme'],
        optimizationSuggestions: [],
        completenessScore: 0.3,
        gapSeverity: 'HIGH',
        analysisTimestamp: new Date(),
        analysisVersion: '1.0',
        createdAt: new Date()
      };

      const projectData = {
        estimatedCost: 20000000,
        sectors: ['Infrastructure'],
        location: { state: 'Assam' }
      };

      const recommendations = service.generateSchemeOptimizationRecommendations(
        gapAnalysis,
        projectData,
        mockSchemes
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      const verificationRec = recommendations.find(r => r.type === 'SCHEME_VERIFICATION');
      expect(verificationRec).toBeDefined();
      expect(verificationRec!.priority).toBe('HIGH');
    });

    it('should generate recommendations for missing opportunities', async () => {
      const gapAnalysis: SchemeGapAnalysis = {
        id: 'gap-1',
        documentId: 'test-doc-1',
        existingSchemesMentioned: ['PMGSY'],
        verifiedSchemes: ['Pradhan Mantri Gram Sadak Yojana'],
        missingOpportunities: ['Mahatma Gandhi National Rural Employment Guarantee Act', 'Swachh Bharat Mission Gramin'],
        incorrectReferences: [],
        optimizationSuggestions: [],
        completenessScore: 0.6,
        gapSeverity: 'MEDIUM',
        analysisTimestamp: new Date(),
        analysisVersion: '1.0',
        createdAt: new Date()
      };

      const projectData = {
        estimatedCost: 30000000,
        sectors: ['Rural Development', 'Employment'],
        location: { state: 'Bihar' }
      };

      const recommendations = service.generateSchemeOptimizationRecommendations(
        gapAnalysis,
        projectData,
        mockSchemes
      );

      const newSchemeRecs = recommendations.filter(r => r.type === 'NEW_SCHEME');
      expect(newSchemeRecs.length).toBeGreaterThan(0);
      
      // Should recommend MGNREGA for employment-related project
      const mgnregaRec = newSchemeRecs.find(r => 
        r.scheme?.schemeName === 'Mahatma Gandhi National Rural Employment Guarantee Act'
      );
      expect(mgnregaRec).toBeDefined();
    });

    it('should prioritize recommendations correctly', async () => {
      const gapAnalysis: SchemeGapAnalysis = {
        id: 'gap-1',
        documentId: 'test-doc-1',
        existingSchemesMentioned: ['Invalid Scheme 1', 'Invalid Scheme 2'],
        verifiedSchemes: [],
        missingOpportunities: ['PMGSY', 'MGNREGA'],
        incorrectReferences: ['Invalid Scheme 1', 'Invalid Scheme 2'],
        optimizationSuggestions: [],
        completenessScore: 0.2,
        gapSeverity: 'CRITICAL',
        analysisTimestamp: new Date(),
        analysisVersion: '1.0',
        createdAt: new Date()
      };

      const projectData = {
        estimatedCost: 40000000,
        sectors: ['Infrastructure', 'Employment'],
        location: { state: 'Assam' }
      };

      const recommendations = service.generateSchemeOptimizationRecommendations(
        gapAnalysis,
        projectData,
        mockSchemes
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      // First recommendation should be high priority
      expect(recommendations[0].priority).toBe('HIGH');
      
      // Should have scheme verification as high priority due to incorrect references
      const highPriorityRecs = recommendations.filter(r => r.priority === 'HIGH');
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty mentioned schemes', async () => {
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        [],
        mockSchemes
      );

      expect(result.verifiedSchemes).toHaveLength(0);
      expect(result.unverifiedReferences).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle empty available schemes', async () => {
      const mentionedSchemes = ['Some Scheme'];
      
      const result = await service.verifySchemeReferences(
        'test-doc-1',
        mentionedSchemes,
        []
      );

      expect(result.verifiedSchemes).toHaveLength(0);
      expect(result.unverifiedReferences).toHaveLength(1);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle schemes with missing optional fields', async () => {
      const incompleteSchemes = mockSchemes.map(scheme => ({
        ...scheme,
        keywords: [],
        objectives: [],
        fundingRangeMin: undefined,
        fundingRangeMax: undefined
      }));

      const result = await service.identifyMissingOpportunities(
        'test-doc-1',
        'Rural development project',
        ['Rural Development'],
        { state: 'Assam' },
        10000000,
        [],
        incompleteSchemes
      );

      expect(result).toBeDefined();
      expect(result.missingOpportunities).toBeInstanceOf(Array);
      expect(result.opportunityAnalysis).toBeInstanceOf(Array);
    });

    it('should handle very low estimated cost', async () => {
      const result = await service.identifyMissingOpportunities(
        'test-doc-1',
        'Small rural project',
        ['Rural Development'],
        { state: 'Assam' },
        100000, // Very low cost
        [],
        mockSchemes
      );

      expect(result).toBeDefined();
      // Should still identify opportunities even for low-cost projects
      expect(result.opportunityAnalysis).toBeInstanceOf(Array);
    });

    it('should handle very high estimated cost', async () => {
      const result = await service.identifyMissingOpportunities(
        'test-doc-1',
        'Large infrastructure project',
        ['Infrastructure'],
        { state: 'Assam' },
        1000000000, // Very high cost
        [],
        mockSchemes
      );

      expect(result).toBeDefined();
      expect(result.opportunityAnalysis).toBeInstanceOf(Array);
    });
  });
});