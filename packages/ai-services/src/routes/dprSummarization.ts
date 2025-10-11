import { FastifyInstance } from 'fastify';
import { DPRSummarizationService } from '../services/dprSummarizationService.js';

export async function dprSummarizationRoutes(fastify: FastifyInstance) {
  const summarizationService = new DPRSummarizationService();

  // Generate project summary for a single DPR
  fastify.post('/summarize', async (request, reply) => {
    try {
      const { filePath, fileName } = request.body as { filePath: string; fileName: string };

      if (!filePath || !fileName) {
        return reply.status(400).send({
          error: 'Missing required fields: filePath and fileName'
        });
      }

      const summary = await summarizationService.generateProjectSummary(filePath, fileName);

      return {
        success: true,
        summary,
        message: 'Project summary generated successfully'
      };

    } catch (error: any) {
      console.error('Error in DPR summarization:', error);
      return reply.status(500).send({
        error: 'Failed to generate project summary',
        details: error.message
      });
    }
  });

  // Batch summarize multiple DPRs
  fastify.post('/summarize/batch', async (request, reply) => {
    try {
      const { files } = request.body as { files: { path: string; name: string }[] };

      if (!files || !Array.isArray(files)) {
        return reply.status(400).send({
          error: 'Missing required field: files (array of {path, name})'
        });
      }

      const summaries = await summarizationService.batchGenerateSummaries(files);

      return {
        success: true,
        summaries,
        count: summaries.length,
        message: 'Batch project summaries generated successfully'
      };

    } catch (error: any) {
      console.error('Error in batch DPR summarization:', error);
      return reply.status(500).send({
        error: 'Failed to generate batch project summaries',
        details: error.message
      });
    }
  });

  // Health check for summarization service
  fastify.get('/summarize/health', async (request, reply) => {
    try {
      // Check if Gemini API key is configured
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      
      return {
        status: 'healthy',
        service: 'DPR Summarization Service',
        geminiConfigured: hasApiKey,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return reply.status(500).send({
        status: 'unhealthy',
        error: error.message
      });
    }
  });
}