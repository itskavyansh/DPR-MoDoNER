import { GovernmentSchemesRepository } from '../repositories/governmentSchemesRepository.js';
import { 
  GovernmentScheme, 
  SchemeSearchRequest,
  SchemeSearchResult,
  SchemeDataIngestionRequest,
  SchemeDataIngestionResult,
  SchemeUpdateRequest,
  SchemeVerificationRequest,
  SchemeVerificationResult
} from '../../../shared/src/types/index.js';

export class GovernmentSchemesService {
  constructor(private repository: GovernmentSchemesRepository) {}

  // Create a new government scheme
  async createScheme(schemeData: Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'>): Promise<GovernmentScheme> {
    // Validate required fields
    this.validateSchemeData(schemeData);
    
    // Set default values
    const schemeWithDefaults = {
      ...schemeData,
      status: schemeData.status || 'ACTIVE',
      verificationStatus: schemeData.verificationStatus || 'PENDING',
      lastUpdated: new Date(),
      keywords: schemeData.keywords || [],
      objectives: schemeData.objectives || [],
      successMetrics: schemeData.successMetrics || [],
      requiredDocuments: schemeData.requiredDocuments || []
    };

    return await this.repository.createScheme(schemeWithDefaults);
  }

  // Get scheme by ID
  async getSchemeById(id: string): Promise<GovernmentScheme | null> {
    if (!id) {
      throw new Error('Scheme ID is required');
    }
    return await this.repository.getSchemeById(id);
  }

  // Search schemes with advanced filtering
  async searchSchemes(searchRequest: SchemeSearchRequest): Promise<SchemeSearchResult> {
    // Set default pagination if not provided
    const requestWithDefaults = {
      ...searchRequest,
      pagination: {
        page: searchRequest.pagination?.page || 1,
        limit: Math.min(searchRequest.pagination?.limit || 20, 100) // Max 100 results per page
      }
    };

    return await this.repository.searchSchemes(requestWithDefaults);
  }

  // Bulk data ingestion for government schemes
  async ingestSchemeData(ingestionRequest: SchemeDataIngestionRequest): Promise<SchemeDataIngestionResult> {
    const startTime = Date.now();
    const { schemes, ingestionMode, validationLevel, batchSize = 50 } = ingestionRequest;
    
    const result: SchemeDataIngestionResult = {
      totalProcessed: 0,
      successfullyIngested: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      processingTimeMs: 0,
      ingestionTimestamp: new Date()
    };

    // Process schemes in batches
    for (let i = 0; i < schemes.length; i += batchSize) {
      const batch = schemes.slice(i, i + batchSize);
      
      for (const schemeData of batch) {
        result.totalProcessed++;
        
        try {
          // Validate scheme data based on validation level
          if (validationLevel === 'STRICT') {
            this.validateSchemeDataStrict(schemeData);
          } else if (validationLevel === 'MODERATE') {
            this.validateSchemeData(schemeData);
          }
          // LENIENT validation allows most data through

          // Check for duplicates if in CREATE mode
          if (ingestionMode === 'CREATE' && schemeData.schemeCode) {
            const existing = await this.repository.searchSchemes({
              filters: { ministry: [schemeData.ministry!] },
              query: schemeData.schemeCode,
              pagination: { page: 1, limit: 1 }
            });
            
            if (existing.schemes.length > 0) {
              result.skipped++;
              result.warnings.push(`Scheme with code ${schemeData.schemeCode} already exists`);
              continue;
            }
          }

          // Create the scheme
          const completeSchemeData = this.fillDefaultValues(schemeData);
          await this.repository.createScheme(completeSchemeData);
          result.successfullyIngested++;

        } catch (error) {
          result.failed++;
          result.errors.push({
            schemeData,
            errorType: 'PROCESSING_ERROR',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            fieldErrors: this.extractFieldErrors(error)
          });
        }
      }
    }

    result.processingTimeMs = Date.now() - startTime;
    return result;
  }

  // Update existing scheme
  async updateScheme(updateRequest: SchemeUpdateRequest): Promise<GovernmentScheme | null> {
    const { schemeId, updates } = updateRequest;
    
    if (!schemeId) {
      throw new Error('Scheme ID is required for update');
    }

    // Validate updates
    if (updates.schemeName && updates.schemeName.trim().length === 0) {
      throw new Error('Scheme name cannot be empty');
    }

    if (updates.ministry && updates.ministry.trim().length === 0) {
      throw new Error('Ministry cannot be empty');
    }

    // Add lastUpdated timestamp
    const updatesWithTimestamp = {
      ...updates,
      lastUpdated: new Date()
    };

    return await this.repository.updateScheme({
      schemeId,
      updates: updatesWithTimestamp
    });
  }

  // Delete scheme
  async deleteScheme(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Scheme ID is required');
    }
    return await this.repository.deleteScheme(id);
  }

  // Get schemes by ministry
  async getSchemesByMinistry(ministry: string): Promise<GovernmentScheme[]> {
    if (!ministry) {
      throw new Error('Ministry is required');
    }
    return await this.repository.getSchemesByMinistry(ministry);
  }

  // Get schemes by region
  async getSchemesByRegion(region: string): Promise<GovernmentScheme[]> {
    if (!region) {
      throw new Error('Region is required');
    }
    return await this.repository.getSchemesByRegion(region);
  }

  // Get schemes by sector
  async getSchemesBySector(sector: string): Promise<GovernmentScheme[]> {
    if (!sector) {
      throw new Error('Sector is required');
    }
    return await this.repository.getSchemesBySector(sector);
  }

  // Verify schemes
  async verifySchemes(verificationRequest: SchemeVerificationRequest): Promise<SchemeVerificationResult> {
    const { schemeIds, verificationSource, verifiedBy } = verificationRequest;
    
    if (!schemeIds || schemeIds.length === 0) {
      throw new Error('At least one scheme ID is required for verification');
    }

    if (!verificationSource) {
      throw new Error('Verification source is required');
    }

    if (!verifiedBy) {
      throw new Error('Verified by field is required');
    }

    return await this.repository.verifySchemes(verificationRequest);
  }

  // Get scheme statistics
  async getSchemeStatistics(): Promise<{
    totalSchemes: number;
    activeSchemes: number;
    schemesByMinistry: Record<string, number>;
    schemesByType: Record<string, number>;
    schemesByStatus: Record<string, number>;
    recentlyAdded: number;
  }> {
    // Get all schemes for statistics
    const allSchemes = await this.repository.searchSchemes({
      pagination: { page: 1, limit: 10000 } // Large limit to get all
    });

    const schemes = allSchemes.schemes;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const stats = {
      totalSchemes: schemes.length,
      activeSchemes: schemes.filter(s => s.status === 'ACTIVE').length,
      schemesByMinistry: {} as Record<string, number>,
      schemesByType: {} as Record<string, number>,
      schemesByStatus: {} as Record<string, number>,
      recentlyAdded: schemes.filter(s => s.createdAt > oneWeekAgo).length
    };

    // Calculate ministry distribution
    schemes.forEach(scheme => {
      stats.schemesByMinistry[scheme.ministry] = (stats.schemesByMinistry[scheme.ministry] || 0) + 1;
      stats.schemesByType[scheme.schemeType] = (stats.schemesByType[scheme.schemeType] || 0) + 1;
      stats.schemesByStatus[scheme.status] = (stats.schemesByStatus[scheme.status] || 0) + 1;
    });

    return stats;
  }

  // Private validation methods
  private validateSchemeData(schemeData: Partial<GovernmentScheme>): void {
    if (!schemeData.schemeName || schemeData.schemeName.trim().length === 0) {
      throw new Error('Scheme name is required');
    }

    if (!schemeData.ministry || schemeData.ministry.trim().length === 0) {
      throw new Error('Ministry is required');
    }

    if (!schemeData.description || schemeData.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!schemeData.dataSource || schemeData.dataSource.trim().length === 0) {
      throw new Error('Data source is required');
    }

    if (!schemeData.schemeType) {
      throw new Error('Scheme type is required');
    }

    if (!schemeData.applicableRegions || schemeData.applicableRegions.length === 0) {
      throw new Error('At least one applicable region is required');
    }

    if (!schemeData.applicableSectors || schemeData.applicableSectors.length === 0) {
      throw new Error('At least one applicable sector is required');
    }

    if (!schemeData.eligibilityCriteria || schemeData.eligibilityCriteria.length === 0) {
      throw new Error('At least one eligibility criterion is required');
    }
  }

  private validateSchemeDataStrict(schemeData: Partial<GovernmentScheme>): void {
    this.validateSchemeData(schemeData);

    if (!schemeData.schemeCode || schemeData.schemeCode.trim().length === 0) {
      throw new Error('Scheme code is required in strict validation');
    }

    if (!schemeData.websiteUrl || schemeData.websiteUrl.trim().length === 0) {
      throw new Error('Website URL is required in strict validation');
    }

    if (!schemeData.launchDate) {
      throw new Error('Launch date is required in strict validation');
    }

    if (schemeData.fundingRangeMin !== undefined && schemeData.fundingRangeMax !== undefined) {
      if (schemeData.fundingRangeMin > schemeData.fundingRangeMax) {
        throw new Error('Minimum funding range cannot be greater than maximum');
      }
    }
  }

  private fillDefaultValues(schemeData: Partial<GovernmentScheme>): Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      schemeName: schemeData.schemeName!,
      schemeCode: schemeData.schemeCode,
      ministry: schemeData.ministry!,
      department: schemeData.department,
      description: schemeData.description!,
      objectives: schemeData.objectives || [],
      eligibilityCriteria: schemeData.eligibilityCriteria!,
      fundingRangeMin: schemeData.fundingRangeMin,
      fundingRangeMax: schemeData.fundingRangeMax,
      applicableRegions: schemeData.applicableRegions!,
      applicableSectors: schemeData.applicableSectors!,
      targetBeneficiaries: schemeData.targetBeneficiaries || [],
      keywords: schemeData.keywords || [],
      schemeType: schemeData.schemeType!,
      launchDate: schemeData.launchDate,
      endDate: schemeData.endDate,
      status: schemeData.status || 'ACTIVE',
      websiteUrl: schemeData.websiteUrl,
      contactDetails: schemeData.contactDetails,
      guidelinesUrl: schemeData.guidelinesUrl,
      applicationProcess: schemeData.applicationProcess,
      requiredDocuments: schemeData.requiredDocuments || [],
      processingTimeDays: schemeData.processingTimeDays,
      approvalAuthority: schemeData.approvalAuthority,
      monitoringMechanism: schemeData.monitoringMechanism,
      successMetrics: schemeData.successMetrics || [],
      budgetAllocation: schemeData.budgetAllocation,
      budgetYear: schemeData.budgetYear,
      utilizationPercentage: schemeData.utilizationPercentage,
      beneficiariesCount: schemeData.beneficiariesCount,
      projectsFunded: schemeData.projectsFunded,
      averageFundingAmount: schemeData.averageFundingAmount,
      lastUpdated: new Date(),
      dataSource: schemeData.dataSource!,
      verificationStatus: schemeData.verificationStatus || 'PENDING'
    };
  }

  private extractFieldErrors(error: any): Record<string, string> | undefined {
    // Extract field-specific errors from database or validation errors
    if (error && error.constraint) {
      return { [error.constraint]: error.detail || error.message };
    }
    return undefined;
  }
}