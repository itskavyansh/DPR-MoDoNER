import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { GovernmentSchemesRepository } from '../repositories/governmentSchemesRepository.js';
import { GovernmentSchemesService } from '../services/governmentSchemesService.js';
import { GovernmentScheme } from '../../../shared/src/types/index.js';

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dpr_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

describe('Government Schemes Service', () => {
  let pool: Pool;
  let repository: GovernmentSchemesRepository;
  let service: GovernmentSchemesService;
  let testSchemeId: string;

  const testScheme: Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'> = {
    schemeName: "Test Infrastructure Development Scheme",
    schemeCode: "TIDS-2024",
    ministry: "Ministry of Development of North Eastern Region",
    department: "Department of Development of North Eastern Region",
    description: "A test scheme for infrastructure development in Northeast India",
    objectives: ["Test objective 1", "Test objective 2"],
    eligibilityCriteria: ["Test criteria 1", "Test criteria 2"],
    fundingRangeMin: 10000000,
    fundingRangeMax: 100000000,
    applicableRegions: ["Assam", "Meghalaya"],
    applicableSectors: ["Infrastructure", "Development"],
    targetBeneficiaries: ["Rural Communities", "Local Governments"],
    keywords: ["test", "infrastructure", "development", "northeast"],
    schemeType: "CENTRALLY_SPONSORED",
    launchDate: new Date("2024-01-01"),
    status: "ACTIVE",
    websiteUrl: "https://test.gov.in",
    requiredDocuments: ["DPR", "Environmental Clearance"],
    processingTimeDays: 90,
    successMetrics: ["Projects completed", "Beneficiaries reached"],
    lastUpdated: new Date(),
    dataSource: "Test Data Source",
    verificationStatus: "PENDING"
  };

  beforeAll(async () => {
    // Skip tests if running in CI without database
    if (process.env.CI && !process.env.DB_HOST) {
      return;
    }

    pool = new Pool(testDbConfig);
    repository = new GovernmentSchemesRepository(pool);
    service = new GovernmentSchemesService(repository);

    // Test database connection
    try {
      await pool.query('SELECT 1');
    } catch (error) {
      console.warn('Database not available for testing, skipping tests');
      return;
    }
  });

  afterAll(async () => {
    if (pool) {
      // Clean up test data
      if (testSchemeId) {
        try {
          await service.deleteScheme(testSchemeId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      await pool.end();
    }
  });

  it('should create a new government scheme', async () => {
    if (!pool) return; // Skip if no database

    const createdScheme = await service.createScheme(testScheme);
    testSchemeId = createdScheme.id;

    expect(createdScheme).toBeDefined();
    expect(createdScheme.id).toBeDefined();
    expect(createdScheme.schemeName).toBe(testScheme.schemeName);
    expect(createdScheme.ministry).toBe(testScheme.ministry);
    expect(createdScheme.status).toBe('ACTIVE');
    expect(createdScheme.verificationStatus).toBe('PENDING');
  });

  it('should retrieve a scheme by ID', async () => {
    if (!pool || !testSchemeId) return; // Skip if no database or scheme

    const retrievedScheme = await service.getSchemeById(testSchemeId);

    expect(retrievedScheme).toBeDefined();
    expect(retrievedScheme?.id).toBe(testSchemeId);
    expect(retrievedScheme?.schemeName).toBe(testScheme.schemeName);
  });

  it('should search schemes with filters', async () => {
    if (!pool) return; // Skip if no database

    const searchResult = await service.searchSchemes({
      filters: {
        ministry: ["Ministry of Development of North Eastern Region"],
        status: ["ACTIVE"]
      },
      pagination: { page: 1, limit: 10 }
    });

    expect(searchResult).toBeDefined();
    expect(searchResult.schemes).toBeInstanceOf(Array);
    expect(searchResult.totalCount).toBeGreaterThanOrEqual(0);
    expect(searchResult.currentPage).toBe(1);
  });

  it('should update a scheme', async () => {
    if (!pool || !testSchemeId) return; // Skip if no database or scheme

    const updates = {
      description: "Updated test scheme description",
      status: "ACTIVE" as const
    };

    const updatedScheme = await service.updateScheme({
      schemeId: testSchemeId,
      updates,
      updatedBy: "test-user"
    });

    expect(updatedScheme).toBeDefined();
    expect(updatedScheme?.description).toBe(updates.description);
    expect(updatedScheme?.status).toBe(updates.status);
  });

  it('should get schemes by ministry', async () => {
    if (!pool) return; // Skip if no database

    const schemes = await service.getSchemesByMinistry("Ministry of Development of North Eastern Region");

    expect(schemes).toBeInstanceOf(Array);
    schemes.forEach(scheme => {
      expect(scheme.ministry).toBe("Ministry of Development of North Eastern Region");
      expect(scheme.status).toBe("ACTIVE");
    });
  });

  it('should get scheme statistics', async () => {
    if (!pool) return; // Skip if no database

    const stats = await service.getSchemeStatistics();

    expect(stats).toBeDefined();
    expect(typeof stats.totalSchemes).toBe('number');
    expect(typeof stats.activeSchemes).toBe('number');
    expect(stats.schemesByMinistry).toBeInstanceOf(Object);
    expect(stats.schemesByType).toBeInstanceOf(Object);
    expect(stats.schemesByStatus).toBeInstanceOf(Object);
  });

  it('should validate required fields when creating scheme', async () => {
    if (!pool) return; // Skip if no database

    const invalidScheme = {
      ...testScheme,
      schemeName: "", // Invalid empty name
    };

    await expect(service.createScheme(invalidScheme)).rejects.toThrow('Scheme name is required');
  });

  it('should handle non-existent scheme retrieval', async () => {
    if (!pool) return; // Skip if no database

    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const result = await service.getSchemeById(nonExistentId);

    expect(result).toBeNull();
  });
});