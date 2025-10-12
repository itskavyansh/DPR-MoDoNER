import { Pool, PoolClient } from 'pg';
import { 
  GovernmentScheme, 
  SchemeCategory, 
  SchemeMatch, 
  SchemeGapAnalysis,
  SchemeSearchRequest,
  SchemeSearchResult,
  SchemeDataIngestionRequest,
  SchemeDataIngestionResult,
  SchemeIngestionError,
  SchemeUpdateRequest,
  SchemeVerificationRequest,
  SchemeVerificationResult
} from '../../../shared/src/types';

export class GovernmentSchemesRepository {
  constructor(private pool: Pool) {}

  // Create a new government scheme
  async createScheme(scheme: Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'>): Promise<GovernmentScheme> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO government_schemes (
          scheme_name, scheme_code, ministry, department, description, objectives,
          eligibility_criteria, funding_range_min, funding_range_max, applicable_regions,
          applicable_sectors, target_beneficiaries, keywords, scheme_type, launch_date,
          end_date, status, website_url, contact_details, guidelines_url, application_process,
          required_documents, processing_time_days, approval_authority, monitoring_mechanism,
          success_metrics, budget_allocation, budget_year, utilization_percentage,
          beneficiaries_count, projects_funded, average_funding_amount, last_updated,
          data_source, verification_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        ) RETURNING *
      `;

      const values = [
        scheme.schemeName, scheme.schemeCode, scheme.ministry, scheme.department,
        scheme.description, scheme.objectives, scheme.eligibilityCriteria,
        scheme.fundingRangeMin, scheme.fundingRangeMax, scheme.applicableRegions,
        scheme.applicableSectors, scheme.targetBeneficiaries, scheme.keywords,
        scheme.schemeType, scheme.launchDate, scheme.endDate, scheme.status,
        scheme.websiteUrl, scheme.contactDetails, scheme.guidelinesUrl,
        scheme.applicationProcess, scheme.requiredDocuments, scheme.processingTimeDays,
        scheme.approvalAuthority, scheme.monitoringMechanism, scheme.successMetrics,
        scheme.budgetAllocation, scheme.budgetYear, scheme.utilizationPercentage,
        scheme.beneficiariesCount, scheme.projectsFunded, scheme.averageFundingAmount,
        scheme.lastUpdated, scheme.dataSource, scheme.verificationStatus
      ];

      const result = await client.query(query, values);
      return this.mapRowToScheme(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Get scheme by ID
  async getSchemeById(id: string): Promise<GovernmentScheme | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM government_schemes WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToScheme(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Search schemes with filters and pagination
  async searchSchemes(searchRequest: SchemeSearchRequest): Promise<SchemeSearchResult> {
    const client = await this.pool.connect();
    try {
      const { query, filters, sorting, pagination } = searchRequest;
      
      // Build WHERE clause
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (query) {
        whereConditions.push(`to_tsvector('english', scheme_name || ' ' || description || ' ' || array_to_string(keywords, ' ')) @@ plainto_tsquery('english', $${paramIndex})`);
        queryParams.push(query);
        paramIndex++;
      }

      if (filters?.ministry && filters.ministry.length > 0) {
        whereConditions.push(`ministry = ANY($${paramIndex})`);
        queryParams.push(filters.ministry);
        paramIndex++;
      }

      if (filters?.schemeType && filters.schemeType.length > 0) {
        whereConditions.push(`scheme_type = ANY($${paramIndex})`);
        queryParams.push(filters.schemeType);
        paramIndex++;
      }

      if (filters?.status && filters.status.length > 0) {
        whereConditions.push(`status = ANY($${paramIndex})`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters?.applicableRegions && filters.applicableRegions.length > 0) {
        whereConditions.push(`applicable_regions && $${paramIndex}`);
        queryParams.push(filters.applicableRegions);
        paramIndex++;
      }

      if (filters?.applicableSectors && filters.applicableSectors.length > 0) {
        whereConditions.push(`applicable_sectors && $${paramIndex}`);
        queryParams.push(filters.applicableSectors);
        paramIndex++;
      }

      if (filters?.fundingRange) {
        if (filters.fundingRange.min !== undefined) {
          whereConditions.push(`(funding_range_max IS NULL OR funding_range_max >= $${paramIndex})`);
          queryParams.push(filters.fundingRange.min);
          paramIndex++;
        }
        if (filters.fundingRange.max !== undefined) {
          whereConditions.push(`(funding_range_min IS NULL OR funding_range_min <= $${paramIndex})`);
          queryParams.push(filters.fundingRange.max);
          paramIndex++;
        }
      }

      if (filters?.launchDateRange) {
        if (filters.launchDateRange.from) {
          whereConditions.push(`launch_date >= $${paramIndex}`);
          queryParams.push(filters.launchDateRange.from);
          paramIndex++;
        }
        if (filters.launchDateRange.to) {
          whereConditions.push(`launch_date <= $${paramIndex}`);
          queryParams.push(filters.launchDateRange.to);
          paramIndex++;
        }
      }

      if (filters?.keywords && filters.keywords.length > 0) {
        whereConditions.push(`keywords && $${paramIndex}`);
        queryParams.push(filters.keywords);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      let orderByClause = 'ORDER BY created_at DESC';
      if (sorting) {
        const fieldMap: Record<string, string> = {
          schemeName: 'scheme_name',
          ministry: 'ministry',
          launchDate: 'launch_date',
          budgetAllocation: 'budget_allocation',
          relevanceScore: 'scheme_name' // Default fallback
        };
        const dbField = fieldMap[sorting.field] || 'created_at';
        orderByClause = `ORDER BY ${dbField} ${sorting.order}`;
      }

      // Build pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM government_schemes ${whereClause}`;
      const countResult = await client.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get schemes
      const schemesQuery = `
        SELECT * FROM government_schemes 
        ${whereClause} 
        ${orderByClause} 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const schemesResult = await client.query(schemesQuery, queryParams);
      const schemes = schemesResult.rows.map(row => this.mapRowToScheme(row));

      const totalPages = Math.ceil(totalCount / limit);

      return {
        schemes,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        searchQuery: query,
        appliedFilters: filters || {},
        searchTimestamp: new Date()
      };
    } finally {
      client.release();
    }
  }

  // Bulk create schemes for data ingestion
  async bulkCreateSchemes(schemes: Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<GovernmentScheme[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const createdSchemes: GovernmentScheme[] = [];
      
      for (const scheme of schemes) {
        try {
          const createdScheme = await this.createScheme(scheme);
          createdSchemes.push(createdScheme);
        } catch (error) {
          console.error(`Failed to create scheme ${scheme.schemeName}:`, error);
          // Continue with other schemes
        }
      }
      
      await client.query('COMMIT');
      return createdSchemes;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update scheme
  async updateScheme(updateRequest: SchemeUpdateRequest): Promise<GovernmentScheme | null> {
    const client = await this.pool.connect();
    try {
      const { schemeId, updates } = updateRequest;
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbField = this.camelToSnakeCase(key);
          updateFields.push(`${dbField} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return await this.getSchemeById(schemeId);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      queryParams.push(schemeId);

      const query = `
        UPDATE government_schemes 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;

      const result = await client.query(query, queryParams);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToScheme(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Delete scheme
  async deleteScheme(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM government_schemes WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  // Get schemes by ministry
  async getSchemesByMinistry(ministry: string): Promise<GovernmentScheme[]> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM government_schemes WHERE ministry = $1 AND status = $2 ORDER BY scheme_name';
      const result = await client.query(query, [ministry, 'ACTIVE']);
      return result.rows.map(row => this.mapRowToScheme(row));
    } finally {
      client.release();
    }
  }

  // Get schemes by region
  async getSchemesByRegion(region: string): Promise<GovernmentScheme[]> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM government_schemes WHERE $1 = ANY(applicable_regions) AND status = $2 ORDER BY scheme_name';
      const result = await client.query(query, [region, 'ACTIVE']);
      return result.rows.map(row => this.mapRowToScheme(row));
    } finally {
      client.release();
    }
  }

  // Get schemes by sector
  async getSchemesBySector(sector: string): Promise<GovernmentScheme[]> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM government_schemes WHERE $1 = ANY(applicable_sectors) AND status = $2 ORDER BY scheme_name';
      const result = await client.query(query, [sector, 'ACTIVE']);
      return result.rows.map(row => this.mapRowToScheme(row));
    } finally {
      client.release();
    }
  }

  // Verify schemes
  async verifySchemes(verificationRequest: SchemeVerificationRequest): Promise<SchemeVerificationResult> {
    const client = await this.pool.connect();
    try {
      const { schemeIds, verificationSource, verifiedBy, verificationNotes } = verificationRequest;
      
      await client.query('BEGIN');
      
      const verifiedSchemes: string[] = [];
      const failedVerifications: { schemeId: string; reason: string }[] = [];
      
      for (const schemeId of schemeIds) {
        try {
          const query = `
            UPDATE government_schemes 
            SET verification_status = 'VERIFIED', 
                last_updated = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND status = 'ACTIVE'
            RETURNING id
          `;
          
          const result = await client.query(query, [schemeId]);
          
          if (result.rows.length > 0) {
            verifiedSchemes.push(schemeId);
          } else {
            failedVerifications.push({
              schemeId,
              reason: 'Scheme not found or not active'
            });
          }
        } catch (error) {
          failedVerifications.push({
            schemeId,
            reason: `Database error: ${error.message}`
          });
        }
      }
      
      await client.query('COMMIT');
      
      return {
        verifiedSchemes,
        failedVerifications,
        verificationTimestamp: new Date()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper method to map database row to GovernmentScheme object
  private mapRowToScheme(row: any): GovernmentScheme {
    return {
      id: row.id,
      schemeName: row.scheme_name,
      schemeCode: row.scheme_code,
      ministry: row.ministry,
      department: row.department,
      description: row.description,
      objectives: row.objectives || [],
      eligibilityCriteria: row.eligibility_criteria || [],
      fundingRangeMin: row.funding_range_min,
      fundingRangeMax: row.funding_range_max,
      applicableRegions: row.applicable_regions || [],
      applicableSectors: row.applicable_sectors || [],
      targetBeneficiaries: row.target_beneficiaries || [],
      keywords: row.keywords || [],
      schemeType: row.scheme_type,
      launchDate: row.launch_date,
      endDate: row.end_date,
      status: row.status,
      websiteUrl: row.website_url,
      contactDetails: row.contact_details,
      guidelinesUrl: row.guidelines_url,
      applicationProcess: row.application_process,
      requiredDocuments: row.required_documents || [],
      processingTimeDays: row.processing_time_days,
      approvalAuthority: row.approval_authority,
      monitoringMechanism: row.monitoring_mechanism,
      successMetrics: row.success_metrics || [],
      budgetAllocation: row.budget_allocation,
      budgetYear: row.budget_year,
      utilizationPercentage: row.utilization_percentage,
      beneficiariesCount: row.beneficiaries_count,
      projectsFunded: row.projects_funded,
      averageFundingAmount: row.average_funding_amount,
      lastUpdated: row.last_updated,
      dataSource: row.data_source,
      verificationStatus: row.verification_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Helper method to convert camelCase to snake_case
  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}