import { DPRDocument } from '@dpr-system/shared';
import { DocumentStorageService } from './documentStorageService.js';
import { WebSocketService } from './websocketService.js';
import axios from 'axios';

export interface ProcessingProgress {
  stage: 'UPLOADED' | 'EXTRACTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message: string;
  results?: any;
}

export class DocumentProcessingOrchestrator {
  private documentStorage: DocumentStorageService;
  private websocketService: WebSocketService;
  private aiServicesUrl: string;

  constructor(
    documentStorage: DocumentStorageService,
    websocketService: WebSocketService,
    aiServicesUrl: string = process.env.AI_SERVICES_URL || 'http://localhost:3002'
  ) {
    this.documentStorage = documentStorage;
    this.websocketService = websocketService;
    this.aiServicesUrl = aiServicesUrl;
  }

  async processDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Update status to processing
      await this.updateProgress(userId, documentId, {
        stage: 'EXTRACTING',
        progress: 10,
        message: 'Starting document processing...'
      });

      // Step 1: Text extraction and section classification
      const extractionResult = await this.performTextExtraction(documentId);
      
      await this.updateProgress(userId, documentId, {
        stage: 'ANALYZING',
        progress: 30,
        message: 'Text extraction completed, starting analysis...'
      });

      // Step 2: Run all analysis modules in parallel
      const analysisPromises = [
        this.performGapAnalysis(documentId, extractionResult),
        this.performPriceComparison(documentId, extractionResult),
        this.performCompletionFeasibility(documentId, extractionResult),
        this.performSchemeMatching(documentId, extractionResult),
        this.performRiskAssessment(documentId, extractionResult)
      ];

      await this.updateProgress(userId, documentId, {
        stage: 'ANALYZING',
        progress: 50,
        message: 'Running comprehensive analysis...'
      });

      const analysisResults = await Promise.allSettled(analysisPromises);

      await this.updateProgress(userId, documentId, {
        stage: 'ANALYZING',
        progress: 80,
        message: 'Finalizing results...'
      });

      // Step 3: Compile final results
      const finalResults = this.compileResults(analysisResults);

      // Step 4: Store results and update status
      await this.storeResults(documentId, finalResults);

      await this.updateProgress(userId, documentId, {
        stage: 'COMPLETED',
        progress: 100,
        message: 'Document processing completed successfully',
        results: finalResults
      });

    } catch (error) {
      console.error(`Document processing failed for ${documentId}:`, error);
      
      await this.updateProgress(userId, documentId, {
        stage: 'FAILED',
        progress: 0,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      throw error;
    }
  }

  private async performTextExtraction(documentId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServicesUrl}/api/text-extraction`, {
        documentId
      });
      return response.data;
    } catch (error) {
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async performGapAnalysis(documentId: string, extractionResult: any): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServicesUrl}/api/gap-analysis`, {
        documentId,
        extractedContent: extractionResult
      });
      return { type: 'gap-analysis', data: response.data };
    } catch (error) {
      return { type: 'gap-analysis', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async performPriceComparison(documentId: string, extractionResult: any): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServicesUrl}/api/price-comparison`, {
        documentId,
        extractedContent: extractionResult
      });
      return { type: 'price-comparison', data: response.data };
    } catch (error) {
      return { type: 'price-comparison', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async performCompletionFeasibility(documentId: string, extractionResult: any): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServicesUrl}/api/completion-feasibility`, {
        documentId,
        extractedContent: extractionResult
      });
      return { type: 'completion-feasibility', data: response.data };
    } catch (error) {
      return { type: 'completion-feasibility', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async performSchemeMatching(documentId: string, extractionResult: any): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServicesUrl}/api/scheme-matching`, {
        documentId,
        extractedContent: extractionResult
      });
      return { type: 'scheme-matching', data: response.data };
    } catch (error) {
      return { type: 'scheme-matching', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async performRiskAssessment(documentId: string, extractionResult: any): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServicesUrl}/api/risk-assessment`, {
        documentId,
        extractedContent: extractionResult
      });
      return { type: 'risk-assessment', data: response.data };
    } catch (error) {
      return { type: 'risk-assessment', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private compileResults(analysisResults: PromiseSettledResult<any>[]): any {
    const results: any = {
      timestamp: new Date().toISOString(),
      analyses: {}
    };

    analysisResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const analysis = result.value;
        results.analyses[analysis.type] = analysis.data || analysis.error;
      } else {
        // Handle rejected promises
        const analysisTypes = ['gap-analysis', 'price-comparison', 'completion-feasibility', 'scheme-matching', 'risk-assessment'];
        results.analyses[analysisTypes[index]] = { error: result.reason };
      }
    });

    return results;
  }

  private async storeResults(documentId: string, results: any): Promise<void> {
    // Store results in database - implement based on your database schema
    console.log(`Storing results for document ${documentId}:`, results);
    // TODO: Implement actual database storage
  }

  private async updateProgress(userId: string, documentId: string, progress: ProcessingProgress): Promise<void> {
    // Emit progress update via WebSocket
    this.websocketService.emitToUser(userId, 'document-processing-progress', {
      documentId,
      ...progress
    });

    // Also update document status in database
    // TODO: Implement database status update
    console.log(`Progress update for ${documentId}:`, progress);
  }
}