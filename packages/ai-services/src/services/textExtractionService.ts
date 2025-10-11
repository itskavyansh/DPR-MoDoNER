import { DocumentProcessor, ProcessingResult } from './documentProcessor.js';
import { DPRDocument, ExtractedContent } from '@dpr-system/shared';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'text-extraction.log' })
  ]
});

export interface TextExtractionOptions {
  enableOCR?: boolean;
  ocrLanguages?: string[];
  cleaningEnabled?: boolean;
  confidenceThreshold?: number;
}

export class TextExtractionService {
  private documentProcessor: DocumentProcessor;
  private isInitialized: boolean = false;

  constructor() {
    this.documentProcessor = new DocumentProcessor();
  }

  /**
   * Initialize the text extraction service
   */
  async initialize(): Promise<void> {
    try {
      await this.documentProcessor.initialize();
      this.isInitialized = true;
      logger.info('Text extraction service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize text extraction service:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.documentProcessor.cleanup();
      this.isInitialized = false;
      logger.info('Text extraction service cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Extract text from a document file
   */
  async extractText(
    filePath: string, 
    document: DPRDocument, 
    options: TextExtractionOptions = {}
  ): Promise<ExtractedContent> {
    if (!this.isInitialized) {
      throw new Error('Text extraction service not initialized');
    }

    const startTime = Date.now();
    logger.info(`Starting text extraction for document: ${document.id}`);

    try {
      // Process the document
      const result = await this.documentProcessor.processDocument(filePath, document.fileType);
      
      // Validate extraction quality
      this.validateExtractionQuality(result, options.confidenceThreshold || 0.7);
      
      // Create extracted content structure
      const extractedContent: ExtractedContent = {
        sections: [], // Will be populated by section classification service
        entities: [], // Will be populated by entity extraction service
        rawText: result.rawText,
        structuredData: {
          // Basic structured data extraction
          totalCost: this.extractTotalCost(result.cleanedText),
          timeline: this.extractTimeline(result.cleanedText),
          location: this.extractLocation(result.cleanedText),
          resources: this.extractResources(result.cleanedText)
        }
      };

      const processingTime = Date.now() - startTime;
      logger.info(`Text extraction completed for document ${document.id}`, {
        processingTime,
        method: result.processingMethod,
        confidence: result.confidence,
        textLength: result.cleanedText.length
      });

      return extractedContent;

    } catch (error) {
      logger.error(`Text extraction failed for document ${document.id}:`, error);
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate the quality of text extraction
   */
  private validateExtractionQuality(result: ProcessingResult, threshold: number): void {
    if (result.confidence < threshold) {
      logger.warn(`Low confidence extraction: ${result.confidence} < ${threshold}`);
    }

    if (result.cleanedText.length < 100) {
      throw new Error('Extracted text too short - possible extraction failure');
    }

    // Check for reasonable text structure
    const words = result.cleanedText.split(/\s+/).length;
    const sentences = result.cleanedText.split(/[.!?]+/).length;
    
    if (words < 50) {
      throw new Error('Insufficient text content extracted');
    }

    if (sentences < 5) {
      logger.warn('Very few sentences detected - possible formatting issues');
    }
  }

  /**
   * Extract total cost information from text (basic implementation)
   */
  private extractTotalCost(text: string): number | undefined {
    // Look for cost patterns like "Total Cost: Rs. 1,00,000" or "₹ 1,00,000"
    const costPatterns = [
      /total\s+cost[:\s]+(?:rs\.?\s*|₹\s*)([\d,]+(?:\.\d{2})?)/i,
      /project\s+cost[:\s]+(?:rs\.?\s*|₹\s*)([\d,]+(?:\.\d{2})?)/i,
      /estimated\s+cost[:\s]+(?:rs\.?\s*|₹\s*)([\d,]+(?:\.\d{2})?)/i
    ];

    for (const pattern of costPatterns) {
      const match = text.match(pattern);
      if (match) {
        const costStr = match[1].replace(/,/g, '');
        const cost = parseFloat(costStr);
        if (!isNaN(cost)) {
          return cost;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract timeline information from text (basic implementation)
   */
  private extractTimeline(text: string): string | undefined {
    // Look for timeline patterns
    const timelinePatterns = [
      /(?:project\s+)?duration[:\s]+(\d+\s+(?:months?|years?))/i,
      /completion\s+time[:\s]+(\d+\s+(?:months?|years?))/i,
      /timeline[:\s]+([^\n.]+)/i
    ];

    for (const pattern of timelinePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract location information from text (basic implementation)
   */
  private extractLocation(text: string): string | undefined {
    // Look for location patterns
    const locationPatterns = [
      /(?:project\s+)?location[:\s]+([^\n.]+)/i,
      /site[:\s]+([^\n.]+)/i,
      /address[:\s]+([^\n.]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract resources information from text (basic implementation)
   */
  private extractResources(text: string): string[] {
    const resources: string[] = [];
    
    // Look for resource-related sections
    const resourcePatterns = [
      /(?:human\s+)?resources?[:\s]+([^\n.]+)/gi,
      /manpower[:\s]+([^\n.]+)/gi,
      /equipment[:\s]+([^\n.]+)/gi,
      /materials?[:\s]+([^\n.]+)/gi
    ];

    for (const pattern of resourcePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          resources.push(match[1].trim());
        }
      }
    }

    return resources;
  }

  /**
   * Get service health status
   */
  getHealthStatus(): { status: string; initialized: boolean; timestamp: Date } {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      initialized: this.isInitialized,
      timestamp: new Date()
    };
  }
}