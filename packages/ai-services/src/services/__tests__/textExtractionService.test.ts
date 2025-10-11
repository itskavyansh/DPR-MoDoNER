import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TextExtractionService } from '../textExtractionService.js';
import { DPRDocument } from '@dpr-system/shared';
import fs from 'fs/promises';
import path from 'path';

// Mock the document processor to avoid actual OCR/file processing in tests
vi.mock('../documentProcessor.js', () => ({
  DocumentProcessor: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
    processDocument: vi.fn().mockImplementation((filePath: string, fileType: string) => {
      // Return mock processing results based on file type
      const mockResults = {
        'PDF': {
          rawText: `Detailed Project Report for Infrastructure Development in Northeast India
          
          Executive Summary:
          This project aims to develop critical infrastructure in the Guwahati region to support economic growth and improve connectivity. The project involves construction of roads, bridges, and supporting facilities.
          
          Project Details:
          The infrastructure development project will span across multiple districts in Assam, focusing on improving transportation networks and connectivity. The project includes construction of 50 km of roads, 3 major bridges, and supporting infrastructure.
          
          Cost Estimate:
          Total Cost: Rs. 10,00,000 for the complete project implementation. This includes material costs, labor charges, equipment rental, and administrative expenses.
          
          Timeline:
          Duration: 12 months from project commencement to completion, including all phases of construction and testing.
          
          Location:
          Location: Guwahati, Assam and surrounding districts. The project will cover multiple sites across the region.
          
          Resources:
          Human Resources: 50 skilled workers, 10 engineers, 5 supervisors
          Equipment: Excavators, concrete mixers, transportation vehicles
          Materials: Cement, steel, aggregates, bitumen`,
          cleanedText: `Detailed Project Report for Infrastructure Development in Northeast India
          
          Executive Summary:
          This project aims to develop critical infrastructure in the Guwahati region to support economic growth and improve connectivity. The project involves construction of roads, bridges, and supporting facilities.
          
          Project Details:
          The infrastructure development project will span across multiple districts in Assam, focusing on improving transportation networks and connectivity. The project includes construction of 50 km of roads, 3 major bridges, and supporting infrastructure.
          
          Cost Estimate:
          Total Cost: Rs. 10,00,000 for the complete project implementation. This includes material costs, labor charges, equipment rental, and administrative expenses.
          
          Timeline:
          Duration: 12 months from project commencement to completion, including all phases of construction and testing.
          
          Location:
          Location: Guwahati, Assam and surrounding districts. The project will cover multiple sites across the region.
          
          Resources:
          Human Resources: 50 skilled workers, 10 engineers, 5 supervisors
          Equipment: Excavators, concrete mixers, transportation vehicles
          Materials: Cement, steel, aggregates, bitumen`,
          confidence: 0.95,
          processingMethod: 'PDF_PARSE'
        },
        'DOCX': {
          rawText: `Water Supply Project - Detailed Project Report
          
          Project Overview:
          This comprehensive water supply project aims to provide clean drinking water to rural communities in Shillong and surrounding areas. The project includes installation of water treatment plants, distribution networks, and storage facilities.
          
          Technical Specifications:
          The project involves setting up 5 water treatment plants with a combined capacity of 10 million liters per day. Distribution network will cover 25 villages with a total pipeline length of 100 kilometers.
          
          Financial Details:
          Project Cost: ₹ 5,00,000 allocated for the complete implementation including equipment procurement, installation, and commissioning.
          
          Implementation Schedule:
          Timeline: 8 months for complete project execution from initiation to final testing and commissioning.
          
          Project Location:
          Site: Shillong, Meghalaya and surrounding rural areas. The project will benefit approximately 50,000 residents.
          
          Resource Requirements:
          Manpower: 30 technical staff, 20 field workers, 5 project managers
          Equipment: Water treatment units, pumps, pipes, storage tanks
          Materials: PVC pipes, fittings, chemicals for water treatment`,
          cleanedText: `Water Supply Project - Detailed Project Report
          
          Project Overview:
          This comprehensive water supply project aims to provide clean drinking water to rural communities in Shillong and surrounding areas. The project includes installation of water treatment plants, distribution networks, and storage facilities.
          
          Technical Specifications:
          The project involves setting up 5 water treatment plants with a combined capacity of 10 million liters per day. Distribution network will cover 25 villages with a total pipeline length of 100 kilometers.
          
          Financial Details:
          Project Cost: ₹ 5,00,000 allocated for the complete implementation including equipment procurement, installation, and commissioning.
          
          Implementation Schedule:
          Timeline: 8 months for complete project execution from initiation to final testing and commissioning.
          
          Project Location:
          Site: Shillong, Meghalaya and surrounding rural areas. The project will benefit approximately 50,000 residents.
          
          Resource Requirements:
          Manpower: 30 technical staff, 20 field workers, 5 project managers
          Equipment: Water treatment units, pumps, pipes, storage tanks
          Materials: PVC pipes, fittings, chemicals for water treatment`,
          confidence: 0.98,
          processingMethod: 'DOCX_PARSE'
        },
        'TXT': {
          rawText: `Educational Infrastructure Development Project
          
          Project Description:
          This project focuses on developing educational infrastructure in rural areas of Manipur. The initiative includes construction of school buildings, laboratories, libraries, and supporting facilities to improve educational outcomes.
          
          Scope of Work:
          Construction of 10 school buildings with modern facilities, establishment of science laboratories, computer labs, and libraries. The project also includes provision of furniture, equipment, and basic amenities.
          
          Budget Allocation:
          Estimated Cost: Rs. 2,50,000 for the complete project including construction, equipment procurement, and setup costs.
          
          Project Duration:
          Completion Time: 6 months from project start date, including all construction and setup activities.
          
          Geographic Coverage:
          Address: Imphal, Manipur and surrounding rural districts. The project will serve 15 villages and benefit approximately 2,000 students.
          
          Resource Planning:
          Human Resources: 25 construction workers, 8 technical supervisors, 3 project coordinators
          Equipment: Construction machinery, educational equipment, furniture
          Materials: Building materials, laboratory equipment, books and educational resources`,
          cleanedText: `Educational Infrastructure Development Project
          
          Project Description:
          This project focuses on developing educational infrastructure in rural areas of Manipur. The initiative includes construction of school buildings, laboratories, libraries, and supporting facilities to improve educational outcomes.
          
          Scope of Work:
          Construction of 10 school buildings with modern facilities, establishment of science laboratories, computer labs, and libraries. The project also includes provision of furniture, equipment, and basic amenities.
          
          Budget Allocation:
          Estimated Cost: Rs. 2,50,000 for the complete project including construction, equipment procurement, and setup costs.
          
          Project Duration:
          Completion Time: 6 months from project start date, including all construction and setup activities.
          
          Geographic Coverage:
          Address: Imphal, Manipur and surrounding rural districts. The project will serve 15 villages and benefit approximately 2,000 students.
          
          Resource Planning:
          Human Resources: 25 construction workers, 8 technical supervisors, 3 project coordinators
          Equipment: Construction machinery, educational equipment, furniture
          Materials: Building materials, laboratory equipment, books and educational resources`,
          confidence: 1.0,
          processingMethod: 'TEXT_READ'
        }
      };
      
      return Promise.resolve(mockResults[fileType as keyof typeof mockResults] || mockResults.TXT);
    })
  }))
}));

describe('TextExtractionService', () => {
  let service: TextExtractionService;
  
  const mockDocument: DPRDocument = {
    id: 'test-doc-1',
    originalFileName: 'test-dpr.pdf',
    fileType: 'PDF',
    uploadTimestamp: new Date(),
    fileSize: 1024000,
    language: 'EN',
    processingStatus: 'UPLOADED'
  };

  beforeAll(async () => {
    service = new TextExtractionService();
    await service.initialize();
  });

  afterAll(async () => {
    await service.cleanup();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      const newService = new TextExtractionService();
      await expect(newService.initialize()).resolves.not.toThrow();
      await newService.cleanup();
    });

    it('should return healthy status when initialized', () => {
      const status = service.getHealthStatus();
      expect(status.status).toBe('healthy');
      expect(status.initialized).toBe(true);
      expect(status.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Text Extraction', () => {
    it('should extract text from PDF documents', async () => {
      const result = await service.extractText('/mock/path/test.pdf', {
        ...mockDocument,
        fileType: 'PDF'
      });

      expect(result).toBeDefined();
      expect(result.rawText).toContain('Detailed Project Report for Infrastructure Development');
      expect(result.structuredData.totalCost).toBe(1000000);
      expect(result.structuredData.timeline).toBe('12 months');
      expect(result.structuredData.location).toBe('Location: Guwahati, Assam and surrounding districts');
    });

    it('should extract text from DOCX documents', async () => {
      const result = await service.extractText('/mock/path/test.docx', {
        ...mockDocument,
        fileType: 'DOCX'
      });

      expect(result).toBeDefined();
      expect(result.rawText).toContain('Water Supply Project - Detailed Project Report');
      expect(result.structuredData.totalCost).toBe(500000);
      expect(result.structuredData.timeline).toBe('8 months for complete project execution from initiation to final testing and commissioning');
      expect(result.structuredData.location).toBe('Site: Shillong, Meghalaya and surrounding rural areas');
    });

    it('should extract text from TXT documents', async () => {
      const result = await service.extractText('/mock/path/test.txt', {
        ...mockDocument,
        fileType: 'TXT'
      });

      expect(result).toBeDefined();
      expect(result.rawText).toContain('Educational Infrastructure Development Project');
      expect(result.structuredData.totalCost).toBe(250000);
      expect(result.structuredData.timeline).toBe('6 months');
      expect(result.structuredData.location).toBeDefined();
    });

    it('should handle extraction options', async () => {
      const options = {
        enableOCR: true,
        confidenceThreshold: 0.8,
        cleaningEnabled: true
      };

      const result = await service.extractText('/mock/path/test.pdf', mockDocument, options);
      expect(result).toBeDefined();
    });

    it('should throw error for uninitialized service', async () => {
      const uninitializedService = new TextExtractionService();
      
      await expect(
        uninitializedService.extractText('/mock/path/test.pdf', mockDocument)
      ).rejects.toThrow('Text extraction service not initialized');
    });
  });

  describe('Data Extraction', () => {
    it('should extract cost information correctly', async () => {
      const result = await service.extractText('/mock/path/test.pdf', mockDocument);
      expect(result.structuredData.totalCost).toBe(1000000);
    });

    it('should extract timeline information correctly', async () => {
      const result = await service.extractText('/mock/path/test.pdf', mockDocument);
      expect(result.structuredData.timeline).toBe('12 months');
    });

    it('should extract location information correctly', async () => {
      const result = await service.extractText('/mock/path/test.pdf', mockDocument);
      expect(result.structuredData.location).toBe('Location: Guwahati, Assam and surrounding districts');
    });

    it('should handle missing structured data gracefully', async () => {
      // Mock a document with no structured data
      vi.mocked(service['documentProcessor'].processDocument).mockResolvedValueOnce({
        rawText: 'Simple text without structured information. This is a longer text that meets the minimum length requirements for validation. It contains multiple sentences and sufficient content to pass the quality checks. However, it does not contain any structured data like costs, timelines, or locations that can be extracted. This text continues to provide more content to ensure it meets the minimum word count requirements for the validation process. The text includes various sentences that describe different aspects of a document without providing specific structured information that would typically be found in a detailed project report.',
        cleanedText: 'Simple text without structured information. This is a longer text that meets the minimum length requirements for validation. It contains multiple sentences and sufficient content to pass the quality checks. However, it does not contain any structured data like costs, timelines, or locations that can be extracted. This text continues to provide more content to ensure it meets the minimum word count requirements for the validation process. The text includes various sentences that describe different aspects of a document without providing specific structured information that would typically be found in a detailed project report.',
        confidence: 0.9,
        processingMethod: 'TEXT_READ'
      });

      const result = await service.extractText('/mock/path/simple.txt', {
        ...mockDocument,
        fileType: 'TXT'
      });

      expect(result.structuredData.totalCost).toBeUndefined();
      expect(result.structuredData.timeline).toBeUndefined();
      expect(result.structuredData.location).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // Mock a processing error
      vi.mocked(service['documentProcessor'].processDocument).mockRejectedValueOnce(
        new Error('Processing failed')
      );

      await expect(
        service.extractText('/mock/path/error.pdf', mockDocument)
      ).rejects.toThrow('Text extraction failed: Processing failed');
    });

    it('should validate extraction quality', async () => {
      // Mock low-quality extraction
      vi.mocked(service['documentProcessor'].processDocument).mockResolvedValueOnce({
        rawText: 'Short',
        cleanedText: 'Short',
        confidence: 0.3,
        processingMethod: 'OCR'
      });

      await expect(
        service.extractText('/mock/path/poor.pdf', mockDocument, { confidenceThreshold: 0.7 })
      ).rejects.toThrow('Extracted text too short');
    });
  });

  describe('Service Cleanup', () => {
    it('should cleanup resources properly', async () => {
      const testService = new TextExtractionService();
      await testService.initialize();
      
      await expect(testService.cleanup()).resolves.not.toThrow();
      
      const status = testService.getHealthStatus();
      expect(status.initialized).toBe(false);
      expect(status.status).toBe('not_initialized');
    });
  });
});