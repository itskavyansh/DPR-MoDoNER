import { Pool } from 'pg';
import { 
  HistoricalProject, 
  HistoricalCostItem, 
  RegionalCostFactor, 
  InflationFactor, 
  PriceBenchmark 
} from '@dpr-system/shared';

export class HistoricalDataRepository {
  constructor(private pool: Pool) {}

  // Historical Projects CRUD operations
  async createHistoricalProject(project: Omit<HistoricalProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<HistoricalProject> {
    const query = `
      INSERT INTO historical_projects (
        project_name, project_type, location_state, location_district, 
        location_coordinates, estimated_cost, actual_cost, estimated_duration_months,
        actual_duration_months, completion_status, start_date, completion_date,
        ministry, implementing_agency, schemes_used, risk_factors, project_category,
        inflation_year, data_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;

    const coordinates = project.locationCoordinates 
      ? `(${project.locationCoordinates.lat}, ${project.locationCoordinates.lng})`
      : null;

    const values = [
      project.projectName,
      project.projectType,
      project.locationState,
      project.locationDistrict,
      coordinates,
      project.estimatedCost,
      project.actualCost,
      project.estimatedDurationMonths,
      project.actualDurationMonths,
      project.completionStatus,
      project.startDate,
      project.completionDate,
      project.ministry,
      project.implementingAgency,
      project.schemesUsed,
      project.riskFactors,
      project.projectCategory,
      project.inflationYear,
      project.dataSource
    ];

    const result = await this.pool.query(query, values);
    return this.mapHistoricalProjectRow(result.rows[0]);
  }

  async getHistoricalProjectsByRegion(state: string, district?: string): Promise<HistoricalProject[]> {
    let query = `
      SELECT * FROM historical_projects 
      WHERE location_state = $1
    `;
    const values: any[] = [state];

    if (district) {
      query += ` AND location_district = $2`;
      values.push(district);
    }

    query += ` ORDER BY start_date DESC`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapHistoricalProjectRow(row));
  }

  async getHistoricalProjectsByCategory(category: string, state?: string): Promise<HistoricalProject[]> {
    let query = `
      SELECT * FROM historical_projects 
      WHERE project_category = $1
    `;
    const values: any[] = [category];

    if (state) {
      query += ` AND location_state = $2`;
      values.push(state);
    }

    query += ` ORDER BY start_date DESC`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapHistoricalProjectRow(row));
  }

  // Historical Cost Items CRUD operations
  async createHistoricalCostItem(costItem: Omit<HistoricalCostItem, 'id' | 'createdAt'>): Promise<HistoricalCostItem> {
    const query = `
      INSERT INTO historical_cost_items (
        project_id, item_category, item_description, unit, quantity,
        unit_rate, total_cost, normalized_unit_rate, normalized_total_cost,
        regional_factor, inflation_factor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      costItem.projectId,
      costItem.itemCategory,
      costItem.itemDescription,
      costItem.unit,
      costItem.quantity,
      costItem.unitRate,
      costItem.totalCost,
      costItem.normalizedUnitRate,
      costItem.normalizedTotalCost,
      costItem.regionalFactor,
      costItem.inflationFactor
    ];

    const result = await this.pool.query(query, values);
    return this.mapHistoricalCostItemRow(result.rows[0]);
  }

  async getCostItemsByProject(projectId: string): Promise<HistoricalCostItem[]> {
    const query = `
      SELECT * FROM historical_cost_items 
      WHERE project_id = $1
      ORDER BY item_category, item_description
    `;

    const result = await this.pool.query(query, [projectId]);
    return result.rows.map(row => this.mapHistoricalCostItemRow(row));
  }

  async getCostItemsByCategory(category: string, state?: string): Promise<HistoricalCostItem[]> {
    let query = `
      SELECT hci.* FROM historical_cost_items hci
      JOIN historical_projects hp ON hci.project_id = hp.id
      WHERE hci.item_category = $1
    `;
    const values: any[] = [category];

    if (state) {
      query += ` AND hp.location_state = $2`;
      values.push(state);
    }

    query += ` ORDER BY hci.item_description`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapHistoricalCostItemRow(row));
  }

  // Regional Cost Factors CRUD operations
  async createRegionalCostFactor(factor: Omit<RegionalCostFactor, 'id' | 'createdAt'>): Promise<RegionalCostFactor> {
    const query = `
      INSERT INTO regional_cost_factors (
        state, district, category, factor, base_year, effective_from, effective_to, data_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      factor.state,
      factor.district,
      factor.category,
      factor.factor,
      factor.baseYear,
      factor.effectiveFrom,
      factor.effectiveTo,
      factor.dataSource
    ];

    const result = await this.pool.query(query, values);
    return this.mapRegionalCostFactorRow(result.rows[0]);
  }

  async getRegionalCostFactor(state: string, category: string, date: Date, district?: string): Promise<RegionalCostFactor | null> {
    let query = `
      SELECT * FROM regional_cost_factors 
      WHERE state = $1 AND category = $2 
      AND effective_from <= $3 
      AND (effective_to IS NULL OR effective_to >= $3)
    `;
    const values: any[] = [state, category, date];

    if (district) {
      query += ` AND district = $4`;
      values.push(district);
    } else {
      query += ` AND district IS NULL`;
    }

    query += ` ORDER BY effective_from DESC LIMIT 1`;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRegionalCostFactorRow(result.rows[0]) : null;
  }

  // Inflation Factors CRUD operations
  async createInflationFactor(factor: Omit<InflationFactor, 'id' | 'createdAt'>): Promise<InflationFactor> {
    const query = `
      INSERT INTO inflation_factors (
        year, category, inflation_rate, cumulative_factor, base_year, data_source
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      factor.year,
      factor.category,
      factor.inflationRate,
      factor.cumulativeFactor,
      factor.baseYear,
      factor.dataSource
    ];

    const result = await this.pool.query(query, values);
    return this.mapInflationFactorRow(result.rows[0]);
  }

  async getInflationFactor(year: number, category: string, baseYear: number = 2020): Promise<InflationFactor | null> {
    const query = `
      SELECT * FROM inflation_factors 
      WHERE year = $1 AND category = $2 AND base_year = $3
    `;

    const result = await this.pool.query(query, [year, category, baseYear]);
    return result.rows.length > 0 ? this.mapInflationFactorRow(result.rows[0]) : null;
  }

  // Price Benchmarks CRUD operations
  async createPriceBenchmark(benchmark: Omit<PriceBenchmark, 'id' | 'createdAt'>): Promise<PriceBenchmark> {
    const query = `
      INSERT INTO price_benchmarks (
        item_category, item_description, unit, region, average_unit_rate,
        median_unit_rate, min_unit_rate, max_unit_rate, standard_deviation,
        sample_size, last_updated, base_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      benchmark.itemCategory,
      benchmark.itemDescription,
      benchmark.unit,
      benchmark.region,
      benchmark.averageUnitRate,
      benchmark.medianUnitRate,
      benchmark.minUnitRate,
      benchmark.maxUnitRate,
      benchmark.standardDeviation,
      benchmark.sampleSize,
      benchmark.lastUpdated,
      benchmark.baseYear
    ];

    const result = await this.pool.query(query, values);
    return this.mapPriceBenchmarkRow(result.rows[0]);
  }

  async getPriceBenchmark(category: string, description: string, region: string, unit?: string): Promise<PriceBenchmark | null> {
    let query = `
      SELECT * FROM price_benchmarks 
      WHERE item_category = $1 AND item_description = $2 AND region = $3
    `;
    const values: any[] = [category, description, region];

    if (unit) {
      query += ` AND unit = $4`;
      values.push(unit);
    } else {
      query += ` AND unit IS NULL`;
    }

    query += ` ORDER BY last_updated DESC LIMIT 1`;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapPriceBenchmarkRow(result.rows[0]) : null;
  }

  async searchPriceBenchmarks(category: string, region: string, searchTerm?: string): Promise<PriceBenchmark[]> {
    let query = `
      SELECT * FROM price_benchmarks 
      WHERE item_category = $1 AND region = $2
    `;
    const values: any[] = [category, region];

    if (searchTerm) {
      query += ` AND to_tsvector('english', item_description) @@ plainto_tsquery('english', $3)`;
      values.push(searchTerm);
    }

    query += ` ORDER BY item_description`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapPriceBenchmarkRow(row));
  }

  // Batch operations for data ingestion
  async batchCreateHistoricalProjects(projects: Omit<HistoricalProject, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<HistoricalProject[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const results: HistoricalProject[] = [];

      for (const project of projects) {
        const query = `
          INSERT INTO historical_projects (
            project_name, project_type, location_state, location_district, 
            location_coordinates, estimated_cost, actual_cost, estimated_duration_months,
            actual_duration_months, completion_status, start_date, completion_date,
            ministry, implementing_agency, schemes_used, risk_factors, project_category,
            inflation_year, data_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING *
        `;

        const coordinates = project.locationCoordinates 
          ? `(${project.locationCoordinates.lat}, ${project.locationCoordinates.lng})`
          : null;

        const values = [
          project.projectName,
          project.projectType,
          project.locationState,
          project.locationDistrict,
          coordinates,
          project.estimatedCost,
          project.actualCost,
          project.estimatedDurationMonths,
          project.actualDurationMonths,
          project.completionStatus,
          project.startDate,
          project.completionDate,
          project.ministry,
          project.implementingAgency,
          project.schemesUsed,
          project.riskFactors,
          project.projectCategory,
          project.inflationYear,
          project.dataSource
        ];

        const result = await client.query(query, values);
        results.push(this.mapHistoricalProjectRow(result.rows[0]));
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper methods to map database rows to TypeScript objects
  private mapHistoricalProjectRow(row: any): HistoricalProject {
    return {
      id: row.id,
      projectName: row.project_name,
      projectType: row.project_type,
      locationState: row.location_state,
      locationDistrict: row.location_district,
      locationCoordinates: row.location_coordinates ? {
        lat: parseFloat(row.location_coordinates.split(',')[0].replace('(', '')),
        lng: parseFloat(row.location_coordinates.split(',')[1].replace(')', ''))
      } : undefined,
      estimatedCost: parseFloat(row.estimated_cost),
      actualCost: row.actual_cost ? parseFloat(row.actual_cost) : undefined,
      estimatedDurationMonths: row.estimated_duration_months,
      actualDurationMonths: row.actual_duration_months,
      completionStatus: row.completion_status,
      startDate: new Date(row.start_date),
      completionDate: row.completion_date ? new Date(row.completion_date) : undefined,
      ministry: row.ministry,
      implementingAgency: row.implementing_agency,
      schemesUsed: row.schemes_used || [],
      riskFactors: row.risk_factors || [],
      projectCategory: row.project_category,
      inflationYear: row.inflation_year,
      dataSource: row.data_source,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapHistoricalCostItemRow(row: any): HistoricalCostItem {
    return {
      id: row.id,
      projectId: row.project_id,
      itemCategory: row.item_category,
      itemDescription: row.item_description,
      unit: row.unit,
      quantity: row.quantity ? parseFloat(row.quantity) : undefined,
      unitRate: parseFloat(row.unit_rate),
      totalCost: parseFloat(row.total_cost),
      normalizedUnitRate: row.normalized_unit_rate ? parseFloat(row.normalized_unit_rate) : undefined,
      normalizedTotalCost: row.normalized_total_cost ? parseFloat(row.normalized_total_cost) : undefined,
      regionalFactor: parseFloat(row.regional_factor),
      inflationFactor: parseFloat(row.inflation_factor),
      createdAt: new Date(row.created_at)
    };
  }

  private mapRegionalCostFactorRow(row: any): RegionalCostFactor {
    return {
      id: row.id,
      state: row.state,
      district: row.district,
      category: row.category,
      factor: parseFloat(row.factor),
      baseYear: row.base_year,
      effectiveFrom: new Date(row.effective_from),
      effectiveTo: row.effective_to ? new Date(row.effective_to) : undefined,
      dataSource: row.data_source,
      createdAt: new Date(row.created_at)
    };
  }

  private mapInflationFactorRow(row: any): InflationFactor {
    return {
      id: row.id,
      year: row.year,
      category: row.category,
      inflationRate: parseFloat(row.inflation_rate),
      cumulativeFactor: parseFloat(row.cumulative_factor),
      baseYear: row.base_year,
      dataSource: row.data_source,
      createdAt: new Date(row.created_at)
    };
  }

  private mapPriceBenchmarkRow(row: any): PriceBenchmark {
    return {
      id: row.id,
      itemCategory: row.item_category,
      itemDescription: row.item_description,
      unit: row.unit,
      region: row.region,
      averageUnitRate: parseFloat(row.average_unit_rate),
      medianUnitRate: parseFloat(row.median_unit_rate),
      minUnitRate: parseFloat(row.min_unit_rate),
      maxUnitRate: parseFloat(row.max_unit_rate),
      standardDeviation: row.standard_deviation ? parseFloat(row.standard_deviation) : undefined,
      sampleSize: row.sample_size,
      lastUpdated: new Date(row.last_updated),
      baseYear: row.base_year,
      createdAt: new Date(row.created_at)
    };
  }
}