import { Pool } from 'pg';
import { HistoricalDataRepository } from '../repositories/historicalDataRepository';
import { 
  HistoricalProject, 
  HistoricalCostItem, 
  RegionalCostFactor, 
  InflationFactor, 
  PriceBenchmark 
} from '@dpr-system/shared';

export class HistoricalDataSeeder {
  private repository: HistoricalDataRepository;

  constructor(pool: Pool) {
    this.repository = new HistoricalDataRepository(pool);
  }

  async seedSampleData(): Promise<void> {
    console.log('Starting historical data seeding...');

    try {
      // Seed regional cost factors
      await this.seedRegionalCostFactors();
      
      // Seed inflation factors
      await this.seedInflationFactors();
      
      // Seed sample historical projects
      const projects = await this.seedHistoricalProjects();
      
      // Seed cost items for projects
      await this.seedHistoricalCostItems(projects);
      
      // Generate price benchmarks
      await this.generatePriceBenchmarks();
      
      console.log('Historical data seeding completed successfully');
    } catch (error) {
      console.error('Error seeding historical data:', error);
      throw error;
    }
  }

  private async seedRegionalCostFactors(): Promise<void> {
    const factors: Omit<RegionalCostFactor, 'id' | 'createdAt'>[] = [
      // Assam factors
      { state: 'Assam', category: 'LABOR', factor: 0.85, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'Ministry of Labor' },
      { state: 'Assam', category: 'MATERIALS', factor: 1.15, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'PWD Assam' },
      { state: 'Assam', category: 'EQUIPMENT', factor: 1.10, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'PWD Assam' },
      { state: 'Assam', category: 'TRANSPORT', factor: 1.20, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'Transport Dept' },
      
      // Meghalaya factors
      { state: 'Meghalaya', category: 'LABOR', factor: 0.90, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'Ministry of Labor' },
      { state: 'Meghalaya', category: 'MATERIALS', factor: 1.25, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'PWD Meghalaya' },
      { state: 'Meghalaya', category: 'EQUIPMENT', factor: 1.15, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'PWD Meghalaya' },
      { state: 'Meghalaya', category: 'TRANSPORT', factor: 1.30, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'Transport Dept' },
      
      // Arunachal Pradesh factors
      { state: 'Arunachal Pradesh', category: 'LABOR', factor: 0.95, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'Ministry of Labor' },
      { state: 'Arunachal Pradesh', category: 'MATERIALS', factor: 1.35, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'PWD Arunachal' },
      { state: 'Arunachal Pradesh', category: 'EQUIPMENT', factor: 1.25, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'PWD Arunachal' },
      { state: 'Arunachal Pradesh', category: 'TRANSPORT', factor: 1.40, baseYear: 2020, effectiveFrom: new Date('2020-01-01'), dataSource: 'Transport Dept' },
    ];

    for (const factor of factors) {
      await this.repository.createRegionalCostFactor(factor);
    }
    console.log(`Seeded ${factors.length} regional cost factors`);
  }

  private async seedInflationFactors(): Promise<void> {
    const factors: Omit<InflationFactor, 'id' | 'createdAt'>[] = [
      // 2020 base year
      { year: 2020, category: 'CONSTRUCTION', inflationRate: 0.0, cumulativeFactor: 1.0, baseYear: 2020, dataSource: 'RBI' },
      { year: 2021, category: 'CONSTRUCTION', inflationRate: 0.065, cumulativeFactor: 1.065, baseYear: 2020, dataSource: 'RBI' },
      { year: 2022, category: 'CONSTRUCTION', inflationRate: 0.072, cumulativeFactor: 1.142, baseYear: 2020, dataSource: 'RBI' },
      { year: 2023, category: 'CONSTRUCTION', inflationRate: 0.058, cumulativeFactor: 1.208, baseYear: 2020, dataSource: 'RBI' },
      { year: 2024, category: 'CONSTRUCTION', inflationRate: 0.055, cumulativeFactor: 1.274, baseYear: 2020, dataSource: 'RBI' },
      
      { year: 2020, category: 'LABOR', inflationRate: 0.0, cumulativeFactor: 1.0, baseYear: 2020, dataSource: 'Ministry of Labor' },
      { year: 2021, category: 'LABOR', inflationRate: 0.085, cumulativeFactor: 1.085, baseYear: 2020, dataSource: 'Ministry of Labor' },
      { year: 2022, category: 'LABOR', inflationRate: 0.092, cumulativeFactor: 1.185, baseYear: 2020, dataSource: 'Ministry of Labor' },
      { year: 2023, category: 'LABOR', inflationRate: 0.078, cumulativeFactor: 1.277, baseYear: 2020, dataSource: 'Ministry of Labor' },
      { year: 2024, category: 'LABOR', inflationRate: 0.075, cumulativeFactor: 1.373, baseYear: 2020, dataSource: 'Ministry of Labor' },
      
      { year: 2020, category: 'MATERIALS', inflationRate: 0.0, cumulativeFactor: 1.0, baseYear: 2020, dataSource: 'Industry Reports' },
      { year: 2021, category: 'MATERIALS', inflationRate: 0.075, cumulativeFactor: 1.075, baseYear: 2020, dataSource: 'Industry Reports' },
      { year: 2022, category: 'MATERIALS', inflationRate: 0.088, cumulativeFactor: 1.170, baseYear: 2020, dataSource: 'Industry Reports' },
      { year: 2023, category: 'MATERIALS', inflationRate: 0.062, cumulativeFactor: 1.242, baseYear: 2020, dataSource: 'Industry Reports' },
      { year: 2024, category: 'MATERIALS', inflationRate: 0.058, cumulativeFactor: 1.314, baseYear: 2020, dataSource: 'Industry Reports' },
    ];

    for (const factor of factors) {
      await this.repository.createInflationFactor(factor);
    }
    console.log(`Seeded ${factors.length} inflation factors`);
  }

  private async seedHistoricalProjects(): Promise<HistoricalProject[]> {
    const projects: Omit<HistoricalProject, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        projectName: 'Rural Road Connectivity - Assam Phase 1',
        projectType: 'Infrastructure',
        locationState: 'Assam',
        locationDistrict: 'Kamrup',
        locationCoordinates: { lat: 26.1445, lng: 91.7362 },
        estimatedCost: 15000000,
        actualCost: 16500000,
        estimatedDurationMonths: 18,
        actualDurationMonths: 22,
        completionStatus: 'COMPLETED',
        startDate: new Date('2021-04-01'),
        completionDate: new Date('2023-02-15'),
        ministry: 'MDoNER',
        implementingAgency: 'PWD Assam',
        schemesUsed: ['PMGSY', 'NEC Scheme'],
        riskFactors: ['Weather delays', 'Material shortage'],
        projectCategory: 'Road Construction',
        inflationYear: 2021,
        dataSource: 'PWD Assam Records'
      },
      {
        projectName: 'Water Supply System - Shillong',
        projectType: 'Infrastructure',
        locationState: 'Meghalaya',
        locationDistrict: 'East Khasi Hills',
        locationCoordinates: { lat: 25.5788, lng: 91.8933 },
        estimatedCost: 8500000,
        actualCost: 9200000,
        estimatedDurationMonths: 12,
        actualDurationMonths: 15,
        completionStatus: 'COMPLETED',
        startDate: new Date('2022-01-15'),
        completionDate: new Date('2023-04-30'),
        ministry: 'MDoNER',
        implementingAgency: 'PHED Meghalaya',
        schemesUsed: ['Jal Jeevan Mission', 'NEC Scheme'],
        riskFactors: ['Terrain challenges', 'Equipment delays'],
        projectCategory: 'Water Supply',
        inflationYear: 2022,
        dataSource: 'PHED Meghalaya'
      },
      {
        projectName: 'Border Area Development - Arunachal',
        projectType: 'Infrastructure',
        locationState: 'Arunachal Pradesh',
        locationDistrict: 'Tawang',
        locationCoordinates: { lat: 27.5856, lng: 91.8573 },
        estimatedCost: 25000000,
        actualCost: 28500000,
        estimatedDurationMonths: 24,
        actualDurationMonths: 30,
        completionStatus: 'COMPLETED',
        startDate: new Date('2020-10-01'),
        completionDate: new Date('2023-04-15'),
        ministry: 'MDoNER',
        implementingAgency: 'BRO',
        schemesUsed: ['Border Area Development Programme'],
        riskFactors: ['Weather conditions', 'Remote location', 'Security clearances'],
        projectCategory: 'Border Infrastructure',
        inflationYear: 2020,
        dataSource: 'BRO Records'
      }
    ];

    const createdProjects: HistoricalProject[] = [];
    for (const project of projects) {
      const created = await this.repository.createHistoricalProject(project);
      createdProjects.push(created);
    }
    
    console.log(`Seeded ${createdProjects.length} historical projects`);
    return createdProjects;
  }

  private async seedHistoricalCostItems(projects: HistoricalProject[]): Promise<void> {
    const costItems: Omit<HistoricalCostItem, 'id' | 'createdAt'>[] = [];

    // Cost items for Road Construction project
    const roadProject = projects.find(p => p.projectCategory === 'Road Construction');
    if (roadProject) {
      costItems.push(
        {
          projectId: roadProject.id,
          itemCategory: 'MATERIALS',
          itemDescription: 'Bitumen for road surfacing',
          unit: 'MT',
          quantity: 150,
          unitRate: 45000,
          totalCost: 6750000,
          regionalFactor: 1.15,
          inflationFactor: 1.065
        },
        {
          projectId: roadProject.id,
          itemCategory: 'LABOR',
          itemDescription: 'Skilled construction workers',
          unit: 'Person-days',
          quantity: 2400,
          unitRate: 800,
          totalCost: 1920000,
          regionalFactor: 0.85,
          inflationFactor: 1.085
        },
        {
          projectId: roadProject.id,
          itemCategory: 'EQUIPMENT',
          itemDescription: 'Road roller rental',
          unit: 'Days',
          quantity: 60,
          unitRate: 8500,
          totalCost: 510000,
          regionalFactor: 1.10,
          inflationFactor: 1.065
        }
      );
    }

    // Cost items for Water Supply project
    const waterProject = projects.find(p => p.projectCategory === 'Water Supply');
    if (waterProject) {
      costItems.push(
        {
          projectId: waterProject.id,
          itemCategory: 'MATERIALS',
          itemDescription: 'PVC pipes for water distribution',
          unit: 'RM',
          quantity: 5000,
          unitRate: 350,
          totalCost: 1750000,
          regionalFactor: 1.25,
          inflationFactor: 1.170
        },
        {
          projectId: waterProject.id,
          itemCategory: 'EQUIPMENT',
          itemDescription: 'Water pumps and motors',
          unit: 'Set',
          quantity: 8,
          unitRate: 125000,
          totalCost: 1000000,
          regionalFactor: 1.15,
          inflationFactor: 1.170
        }
      );
    }

    for (const item of costItems) {
      await this.repository.createHistoricalCostItem(item);
    }
    
    console.log(`Seeded ${costItems.length} historical cost items`);
  }

  private async generatePriceBenchmarks(): Promise<void> {
    // This would typically be generated from historical cost items
    // For now, we'll create some sample benchmarks
    const benchmarks: Omit<PriceBenchmark, 'id' | 'createdAt'>[] = [
      {
        itemCategory: 'MATERIALS',
        itemDescription: 'Bitumen for road surfacing',
        unit: 'MT',
        region: 'Northeast India',
        averageUnitRate: 46500,
        medianUnitRate: 45000,
        minUnitRate: 42000,
        maxUnitRate: 52000,
        standardDeviation: 3200,
        sampleSize: 15,
        lastUpdated: new Date(),
        baseYear: 2024
      },
      {
        itemCategory: 'LABOR',
        itemDescription: 'Skilled construction workers',
        unit: 'Person-days',
        region: 'Assam',
        averageUnitRate: 850,
        medianUnitRate: 800,
        minUnitRate: 700,
        maxUnitRate: 1000,
        standardDeviation: 95,
        sampleSize: 25,
        lastUpdated: new Date(),
        baseYear: 2024
      },
      {
        itemCategory: 'MATERIALS',
        itemDescription: 'PVC pipes for water distribution',
        unit: 'RM',
        region: 'Meghalaya',
        averageUnitRate: 380,
        medianUnitRate: 350,
        minUnitRate: 320,
        maxUnitRate: 450,
        standardDeviation: 42,
        sampleSize: 18,
        lastUpdated: new Date(),
        baseYear: 2024
      }
    ];

    for (const benchmark of benchmarks) {
      await this.repository.createPriceBenchmark(benchmark);
    }
    
    console.log(`Generated ${benchmarks.length} price benchmarks`);
  }
}