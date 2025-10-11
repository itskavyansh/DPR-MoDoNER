import axios from 'axios';
import { GovernmentSchemesService } from './governmentSchemesService.js';
import { 
  SchemeMatchingRequest,
  SchemeMatchingResult,
  SchemeGapAnalysis,
  SchemeRecommendation,
  GovernmentScheme
} from '../../../shared/src/types/index.js';

/**
 * Integration service for scheme matching functionality
 * Coordinates between backend services and AI services
 */
export class SchemeMatchingIntegrationService {
  private readonly AI_SERVICES_BASE_URL: string;
  
  constructor(
    private governmentSchemesService: GovernmentSchemesService,
    aiServicesUrl?: string
  ) {
    this.AI_SERVICES_BASE_URL = aiServicesUrl || process.env.AI_SERVICES_URL || 'http://localhost:3002';
  }

  /**
   * Perform comprehensive scheme matching for a DPR document
   */
  async performSchemeMatching(request: SchemeMatchingRequest): Promise<SchemeMatchingResult> {
    try {
      // Get all available schemes from database
      const availableSchemes = await this.getRelevantSchemes(request);
      
      // Call AI services for scheme matching
      const response = await axios.post(`${this.AI_SERVICES_BASE_URL}/api/schemes/match`, {
        ...request,
        availableSchemes
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Scheme matching failed');
      }

      return response.data.data as SchemeMatchingResult;
    } catch (error) {
      console.error('Error in scheme matching integration:', error);
      throw new Error(`Scheme matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify existing scheme references in DPR
   */
  async verifySchemeReferences(
    documentId: string,
    mentionedSchemes: string[]
  ): Promise<{
    verifiedSchemes: GovernmentScheme[];
    unverifiedReferences: string[];
    suggestions: Array<{ reference: string; suggestedScheme: GovernmentScheme; confidence: number }>;
  }> {
    try {
      // Get all available schemes
      const availableSchemes = await this.getAllActiveSchemes();
      
      // Call AI services for verification
      const response = await axios.post(`${this.AI_SERVICES_BASE_URL}/api/schemes/verify`, {
        documentId,
        mentionedSchemes,
        availableSchemes
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Scheme verification failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error in scheme verification:', error);
      throw new Error(`Scheme verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform comprehensive gap analysis
   */
  async performGapAnalysis(
    documentId: string,
    projectData: {
      description: string;
      sectors: string[];
      location: { state: string; district?: string };
      estimatedCost: number;
      targetBeneficiaries?: string[];
    },
    mentionedSchemes: string[]
  ): Promise<SchemeGapAnalysis> {
    try {
      // Get all available schemes
      const availableSchemes = await this.getAllActiveSchemes();
      
      // Call AI services for gap analysis
      const response = await axios.post(`${this.AI_SERVICES_BASE_URL}/api/schemes/gap-analysis`, {
        documentId,
        projectData,
        mentionedSchemes,
        availableSchemes
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Gap analysis failed');
      }

      return response.data.data as SchemeGapAnalysis;
    } catch (error) {
      console.error('Error in gap analysis:', error);
      throw new Error(`Gap analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Identify missing scheme opportunities
   */
  async identifyMissingOpportunities(
    documentId: string,
    projectDescription: string,
    projectSectors: string[],
    projectLocation: { state: string; district?: string },
    estimatedCost: number,
    existingSchemes: GovernmentScheme[]
  ): Promise<{
    missingOpportunities: GovernmentScheme[];
    opportunityAnalysis: Array<{
      scheme: GovernmentScheme;
      relevanceScore: number;
      potentialBenefit: string;
      implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
      timeToImplement: string;
    }>;
  }> {
    try {
      // Get all available schemes
      const availableSchemes = await this.getAllActiveSchemes();
      
      // Call AI services for opportunity identification
      const response = await axios.post(`${this.AI_SERVICES_BASE_URL}/api/schemes/missing-opportunities`, {
        documentId,
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost,
        existingSchemes,
        availableSchemes
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Missing opportunities identification failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error identifying missing opportunities:', error);
      throw new Error(`Missing opportunities identification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(
    gapAnalysis: SchemeGapAnalysis,
    projectData: {
      estimatedCost: number;
      sectors: string[];
      location: { state: string; district?: string };
    }
  ): Promise<SchemeRecommendation[]> {
    try {
      // Get all available schemes
      const availableSchemes = await this.getAllActiveSchemes();
      
      // Call AI services for optimization recommendations
      const response = await axios.post(`${this.AI_SERVICES_BASE_URL}/api/schemes/optimization-recommendations`, {
        gapAnalysis,
        projectData,
        availableSchemes
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Optimization recommendations generation failed');
      }

      return response.data.data.recommendations as SchemeRecommendation[];
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      throw new Error(`Optimization recommendations generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive scheme analysis for a DPR
   */
  async getComprehensiveSchemeAnalysis(
    documentId: string,
    projectData: {
      description: string;
      sectors: string[];
      location: { state: string; district?: string };
      estimatedCost: number;
      targetBeneficiaries?: string[];
      projectType?: string;
    },
    mentionedSchemes: string[] = [],
    matchingOptions?: {
      includeInactive?: boolean;
      minRelevanceScore?: number;
      maxResults?: number;
      preferredSchemeTypes?: string[];
    }
  ): Promise<{
    matchingResult: SchemeMatchingResult;
    gapAnalysis: SchemeGapAnalysis;
    recommendations: SchemeRecommendation[];
    summary: {
      totalSchemesAnalyzed: number;
      matchedSchemes: number;
      verifiedExistingSchemes: number;
      missingOpportunities: number;
      incorrectReferences: number;
      completenessScore: number;
      gapSeverity: string;
      highPriorityRecommendations: number;
    };
  }> {
    try {
      // Prepare scheme matching request
      const matchingRequest: SchemeMatchingRequest = {
        documentId,
        projectDescription: projectData.description,
        projectType: projectData.projectType,
        estimatedCost: projectData.estimatedCost,
        location: projectData.location,
        sectors: projectData.sectors,
        targetBeneficiaries: projectData.targetBeneficiaries,
        existingSchemes: mentionedSchemes,
        matchingOptions
      };

      // Perform scheme matching
      const matchingResult = await this.performSchemeMatching(matchingRequest);

      // Perform gap analysis
      const gapAnalysis = await this.performGapAnalysis(
        documentId,
        projectData,
        mentionedSchemes
      );

      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        gapAnalysis,
        {
          estimatedCost: projectData.estimatedCost,
          sectors: projectData.sectors,
          location: projectData.location
        }
      );

      // Create summary
      const summary = {
        totalSchemesAnalyzed: matchingResult.totalSchemesAnalyzed,
        matchedSchemes: matchingResult.matchedSchemes.length,
        verifiedExistingSchemes: gapAnalysis.verifiedSchemes.length,
        missingOpportunities: gapAnalysis.missingOpportunities.length,
        incorrectReferences: gapAnalysis.incorrectReferences.length,
        completenessScore: gapAnalysis.completenessScore || 0,
        gapSeverity: gapAnalysis.gapSeverity,
        highPriorityRecommendations: recommendations.filter(r => r.priority === 'HIGH').length
      };

      return {
        matchingResult,
        gapAnalysis,
        recommendations,
        summary
      };
    } catch (error) {
      console.error('Error in comprehensive scheme analysis:', error);
      throw new Error(`Comprehensive scheme analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check AI services health
   */
  async checkAIServicesHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.get(`${this.AI_SERVICES_BASE_URL}/api/schemes/health`, {
        timeout: 5000
      });

      if (response.data.success) {
        return {
          status: 'healthy',
          message: 'AI services are operational'
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'AI services reported issues'
        };
      }
    } catch (error) {
      return {
        status: 'unavailable',
        message: `AI services unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods

  private async getRelevantSchemes(request: SchemeMatchingRequest): Promise<GovernmentScheme[]> {
    // Build search filters based on request
    const searchFilters: any = {};

    if (request.location?.state) {
      searchFilters.applicableRegions = [request.location.state, 'ALL_STATES', 'NORTHEAST'];
    }

    if (request.sectors && request.sectors.length > 0) {
      searchFilters.applicableSectors = request.sectors;
    }

    if (!request.matchingOptions?.includeInactive) {
      searchFilters.status = ['ACTIVE'];
    }

    if (request.matchingOptions?.preferredSchemeTypes) {
      searchFilters.schemeType = request.matchingOptions.preferredSchemeTypes;
    }

    // Search for relevant schemes
    const searchResult = await this.governmentSchemesService.searchSchemes({
      filters: searchFilters,
      pagination: { page: 1, limit: 1000 } // Get all relevant schemes
    });

    return searchResult.schemes;
  }

  private async getAllActiveSchemes(): Promise<GovernmentScheme[]> {
    const searchResult = await this.governmentSchemesService.searchSchemes({
      filters: { status: ['ACTIVE'] },
      pagination: { page: 1, limit: 1000 }
    });

    return searchResult.schemes;
  }
}