import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { HistoricalDataRepository } from '../repositories/historicalDataRepository';
import { CostNormalizationService } from '../services/costNormalizationService';
import { PriceComparisonService, DPRCostItem, PriceAnalysisOptions } from '../services/priceComparisonService';
import { BenchmarkCalculationService, BenchmarkCalculationOptions } from '../services/benchmarkCalculationService';
import { PriceReportingService } from '../services/priceReportingService';
import { 
  HistoricalProject, 
  HistoricalCostItem, 
  RegionalCostFactor, 
  InflationFactor, 
  PriceBenchmark 
} from '@dpr-system/shared';

export function createHistoricalDataRoutes(pool: Pool): Router {
  const router = Router();
  const historicalDataRepository = new HistoricalDataRepository(pool);
  const costNormalizationService = new CostNormalizationService(historicalDataRepository);
  const priceComparisonService = new PriceComparisonService(historicalDataRepository, costNormalizationService);
  const benchmarkCalculationService = new BenchmarkCalculationService(historicalDataRepository, costNormalizationService);
  const priceReportingService = new PriceReportingService();

  // Historical Projects endpoints
  router.post('/projects', async (req: Request, res: Response) => {
    try {
      const projectData = req.body as Omit<HistoricalProject, 'id' | 'createdAt' | 'updatedAt'>;
      
      // Validate required fields
      if (!projectData.projectName || !projectData.projectType || !projectData.locationState) {
        return res.status(400).json({
          error: 'Missing required fields: projectName, projectType, locationState'
        });
      }

      const project = await historicalDataRepository.createHistoricalProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating historical project:', error);
      res.status(500).json({ error: 'Failed to create historical project' });
    }
  });

  router.post('/projects/batch', async (req: Request, res: Response) => {
    try {
      const projectsData = req.body.projects as Omit<HistoricalProject, 'id' | 'createdAt' | 'updatedAt'>[];
      
      if (!Array.isArray(projectsData) || projectsData.length === 0) {
        return res.status(400).json({ error: 'Invalid projects data' });
      }

      // Validate each project
      for (const project of projectsData) {
        if (!project.projectName || !project.projectType || !project.locationState) {
          return res.status(400).json({
            error: 'Each project must have projectName, projectType, and locationState'
          });
        }
      }

      const projects = await historicalDataRepository.batchCreateHistoricalProjects(projectsData);
      res.status(201).json({ 
        message: `Successfully created ${projects.length} historical projects`,
        projects 
      });
    } catch (error) {
      console.error('Error batch creating historical projects:', error);
      res.status(500).json({ error: 'Failed to batch create historical projects' });
    }
  });

  router.get('/projects/region/:state', async (req: Request, res: Response) => {
    try {
      const { state } = req.params;
      const { district } = req.query;
      
      const projects = await historicalDataRepository.getHistoricalProjectsByRegion(
        state, 
        district as string
      );
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects by region:', error);
      res.status(500).json({ error: 'Failed to fetch projects by region' });
    }
  });

  router.get('/projects/category/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { state } = req.query;
      
      const projects = await historicalDataRepository.getHistoricalProjectsByCategory(
        category,
        state as string
      );
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects by category:', error);
      res.status(500).json({ error: 'Failed to fetch projects by category' });
    }
  });

  // Historical Cost Items endpoints
  router.post('/cost-items', async (req: Request, res: Response) => {
    try {
      const costItemData = req.body as Omit<HistoricalCostItem, 'id' | 'createdAt'>;
      
      if (!costItemData.projectId || !costItemData.itemCategory || !costItemData.itemDescription) {
        return res.status(400).json({
          error: 'Missing required fields: projectId, itemCategory, itemDescription'
        });
      }

      const costItem = await historicalDataRepository.createHistoricalCostItem(costItemData);
      res.status(201).json(costItem);
    } catch (error) {
      console.error('Error creating historical cost item:', error);
      res.status(500).json({ error: 'Failed to create historical cost item' });
    }
  });

  router.get('/cost-items/project/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const costItems = await historicalDataRepository.getCostItemsByProject(projectId);
      res.json(costItems);
    } catch (error) {
      console.error('Error fetching cost items by project:', error);
      res.status(500).json({ error: 'Failed to fetch cost items by project' });
    }
  });

  router.get('/cost-items/category/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { state } = req.query;
      
      const costItems = await historicalDataRepository.getCostItemsByCategory(
        category,
        state as string
      );
      res.json(costItems);
    } catch (error) {
      console.error('Error fetching cost items by category:', error);
      res.status(500).json({ error: 'Failed to fetch cost items by category' });
    }
  });

  // Regional Cost Factors endpoints
  router.post('/regional-factors', async (req: Request, res: Response) => {
    try {
      const factorData = req.body as Omit<RegionalCostFactor, 'id' | 'createdAt'>;
      
      if (!factorData.state || !factorData.category || !factorData.baseYear) {
        return res.status(400).json({
          error: 'Missing required fields: state, category, baseYear'
        });
      }

      const factor = await historicalDataRepository.createRegionalCostFactor(factorData);
      res.status(201).json(factor);
    } catch (error) {
      console.error('Error creating regional cost factor:', error);
      res.status(500).json({ error: 'Failed to create regional cost factor' });
    }
  });

  router.get('/regional-factors/:state/:category', async (req: Request, res: Response) => {
    try {
      const { state, category } = req.params;
      const { district, date } = req.query;
      
      const queryDate = date ? new Date(date as string) : new Date();
      const factor = await historicalDataRepository.getRegionalCostFactor(
        state,
        category,
        queryDate,
        district as string
      );
      
      if (!factor) {
        return res.status(404).json({ error: 'Regional cost factor not found' });
      }
      
      res.json(factor);
    } catch (error) {
      console.error('Error fetching regional cost factor:', error);
      res.status(500).json({ error: 'Failed to fetch regional cost factor' });
    }
  });

  // Inflation Factors endpoints
  router.post('/inflation-factors', async (req: Request, res: Response) => {
    try {
      const factorData = req.body as Omit<InflationFactor, 'id' | 'createdAt'>;
      
      if (!factorData.year || !factorData.category || factorData.inflationRate === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: year, category, inflationRate'
        });
      }

      const factor = await historicalDataRepository.createInflationFactor(factorData);
      res.status(201).json(factor);
    } catch (error) {
      console.error('Error creating inflation factor:', error);
      res.status(500).json({ error: 'Failed to create inflation factor' });
    }
  });

  router.get('/inflation-factors/:year/:category', async (req: Request, res: Response) => {
    try {
      const { year, category } = req.params;
      const { baseYear } = req.query;
      
      const factor = await historicalDataRepository.getInflationFactor(
        parseInt(year),
        category,
        baseYear ? parseInt(baseYear as string) : 2020
      );
      
      if (!factor) {
        return res.status(404).json({ error: 'Inflation factor not found' });
      }
      
      res.json(factor);
    } catch (error) {
      console.error('Error fetching inflation factor:', error);
      res.status(500).json({ error: 'Failed to fetch inflation factor' });
    }
  });

  // Price Benchmarks endpoints
  router.post('/price-benchmarks', async (req: Request, res: Response) => {
    try {
      const benchmarkData = req.body as Omit<PriceBenchmark, 'id' | 'createdAt'>;
      
      if (!benchmarkData.itemCategory || !benchmarkData.itemDescription || !benchmarkData.region) {
        return res.status(400).json({
          error: 'Missing required fields: itemCategory, itemDescription, region'
        });
      }

      const benchmark = await historicalDataRepository.createPriceBenchmark(benchmarkData);
      res.status(201).json(benchmark);
    } catch (error) {
      console.error('Error creating price benchmark:', error);
      res.status(500).json({ error: 'Failed to create price benchmark' });
    }
  });

  router.get('/price-benchmarks/:category/:region', async (req: Request, res: Response) => {
    try {
      const { category, region } = req.params;
      const { description, unit, search } = req.query;
      
      if (description) {
        // Get specific benchmark
        const benchmark = await historicalDataRepository.getPriceBenchmark(
          category,
          description as string,
          region,
          unit as string
        );
        
        if (!benchmark) {
          return res.status(404).json({ error: 'Price benchmark not found' });
        }
        
        res.json(benchmark);
      } else {
        // Search benchmarks
        const benchmarks = await historicalDataRepository.searchPriceBenchmarks(
          category,
          region,
          search as string
        );
        res.json(benchmarks);
      }
    } catch (error) {
      console.error('Error fetching price benchmarks:', error);
      res.status(500).json({ error: 'Failed to fetch price benchmarks' });
    }
  });

  // Cost normalization endpoints
  router.post('/normalize-cost', async (req: Request, res: Response) => {
    try {
      const { costItem, targetYear, targetState, targetDistrict } = req.body;
      
      if (!costItem || !targetState) {
        return res.status(400).json({
          error: 'Missing required fields: costItem, targetState'
        });
      }

      const normalization = await costNormalizationService.normalizeCostItem(
        costItem,
        targetYear || new Date().getFullYear(),
        targetState,
        targetDistrict
      );
      
      res.json(normalization);
    } catch (error) {
      console.error('Error normalizing cost:', error);
      res.status(500).json({ error: 'Failed to normalize cost' });
    }
  });

  router.post('/normalize-costs/batch', async (req: Request, res: Response) => {
    try {
      const { costItems, targetYear, targetState, targetDistrict } = req.body;
      
      if (!Array.isArray(costItems) || !targetState) {
        return res.status(400).json({
          error: 'Missing required fields: costItems (array), targetState'
        });
      }

      const normalizations = await costNormalizationService.batchNormalizeCostItems(
        costItems,
        targetYear || new Date().getFullYear(),
        targetState,
        targetDistrict
      );
      
      // Convert Map to object for JSON response
      const result = Object.fromEntries(normalizations);
      res.json(result);
    } catch (error) {
      console.error('Error batch normalizing costs:', error);
      res.status(500).json({ error: 'Failed to batch normalize costs' });
    }
  });

  // Price comparison and anomaly detection endpoints
  router.post('/price-comparison/analyze', async (req: Request, res: Response) => {
    try {
      const { dprId, costItems, options } = req.body;
      
      if (!dprId || !Array.isArray(costItems) || !options?.targetState) {
        return res.status(400).json({
          error: 'Missing required fields: dprId, costItems (array), options.targetState'
        });
      }

      const analysisOptions: PriceAnalysisOptions = {
        deviationThreshold: options.deviationThreshold || 0.20, // 20%
        confidenceLevel: options.confidenceLevel || 0.95,
        minSampleSize: options.minSampleSize || 5,
        targetYear: options.targetYear || new Date().getFullYear(),
        targetState: options.targetState,
        targetDistrict: options.targetDistrict
      };

      const result = await priceComparisonService.compareDPRPrices(
        dprId,
        costItems as DPRCostItem[],
        analysisOptions
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error analyzing DPR prices:', error);
      res.status(500).json({ error: 'Failed to analyze DPR prices' });
    }
  });

  router.get('/price-comparison/benchmarks/search', async (req: Request, res: Response) => {
    try {
      const { category, region, search, limit } = req.query;
      
      if (!category || !region) {
        return res.status(400).json({
          error: 'Missing required parameters: category, region'
        });
      }

      const benchmarks = await historicalDataRepository.searchPriceBenchmarks(
        category as string,
        region as string,
        search as string
      );
      
      const limitedResults = limit 
        ? benchmarks.slice(0, parseInt(limit as string))
        : benchmarks;
      
      res.json(limitedResults);
    } catch (error) {
      console.error('Error searching price benchmarks:', error);
      res.status(500).json({ error: 'Failed to search price benchmarks' });
    }
  });

  // Benchmark calculation endpoints
  router.post('/benchmarks/calculate', async (req: Request, res: Response) => {
    try {
      const options: BenchmarkCalculationOptions = {
        minSampleSize: req.body.minSampleSize || 5,
        outlierThreshold: req.body.outlierThreshold || 2.0,
        confidenceLevel: req.body.confidenceLevel || 0.95,
        targetYear: req.body.targetYear || new Date().getFullYear(),
        includeOutliers: req.body.includeOutliers || false
      };

      const benchmarks = await benchmarkCalculationService.calculateAllBenchmarks(options);
      
      res.json({
        message: `Successfully calculated ${benchmarks.length} benchmarks`,
        benchmarks: benchmarks.slice(0, 10), // Return first 10 for preview
        totalCount: benchmarks.length
      });
    } catch (error) {
      console.error('Error calculating benchmarks:', error);
      res.status(500).json({ error: 'Failed to calculate benchmarks' });
    }
  });

  router.post('/benchmarks/calculate/:category/:state', async (req: Request, res: Response) => {
    try {
      const { category, state } = req.params;
      
      const options: BenchmarkCalculationOptions = {
        minSampleSize: req.body.minSampleSize || 5,
        outlierThreshold: req.body.outlierThreshold || 2.0,
        confidenceLevel: req.body.confidenceLevel || 0.95,
        targetYear: req.body.targetYear || new Date().getFullYear(),
        includeOutliers: req.body.includeOutliers || false
      };

      const benchmarks = await benchmarkCalculationService.calculateCategoryBenchmarks(
        category,
        state,
        options
      );
      
      res.json({
        message: `Successfully calculated ${benchmarks.length} benchmarks for ${category} in ${state}`,
        benchmarks
      });
    } catch (error) {
      console.error('Error calculating category benchmarks:', error);
      res.status(500).json({ error: 'Failed to calculate category benchmarks' });
    }
  });

  // Price reporting endpoints
  router.post('/reports/price-analysis', async (req: Request, res: Response) => {
    try {
      const { comparisonResult } = req.body;
      
      if (!comparisonResult) {
        return res.status(400).json({
          error: 'Missing required field: comparisonResult'
        });
      }

      const report = await priceReportingService.generatePriceAnalysisReport(comparisonResult);
      
      res.json(report);
    } catch (error) {
      console.error('Error generating price analysis report:', error);
      res.status(500).json({ error: 'Failed to generate price analysis report' });
    }
  });

  router.get('/reports/charts/comparison/:dprId', async (req: Request, res: Response) => {
    try {
      const { dprId } = req.params;
      const { comparisonResult } = req.query;
      
      if (!comparisonResult) {
        return res.status(400).json({
          error: 'Missing comparison result data'
        });
      }

      const parsedResult = JSON.parse(comparisonResult as string);
      const chart = priceReportingService.generateDPRComparisonChart(parsedResult);
      
      res.json(chart);
    } catch (error) {
      console.error('Error generating comparison chart:', error);
      res.status(500).json({ error: 'Failed to generate comparison chart' });
    }
  });

  router.get('/reports/charts/flagged-items/:dprId', async (req: Request, res: Response) => {
    try {
      const { dprId } = req.params;
      const { flaggedItems } = req.query;
      
      if (!flaggedItems) {
        return res.status(400).json({
          error: 'Missing flagged items data'
        });
      }

      const parsedItems = JSON.parse(flaggedItems as string);
      const chart = priceReportingService.generateFlaggedItemsChart(parsedItems);
      
      res.json(chart);
    } catch (error) {
      console.error('Error generating flagged items chart:', error);
      res.status(500).json({ error: 'Failed to generate flagged items chart' });
    }
  });

  return router;
}