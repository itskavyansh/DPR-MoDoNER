import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { registerSchemeMatchingRoutes } from './routes/schemeMatching.js';
import { registerRiskMitigationRoutes } from './routes/riskMitigation.js';
import { registerRiskClassificationRoutes } from './routes/riskClassification.js';
import { geospatialVerificationRoutes } from './routes/geospatialVerification.js';
import { dprSummarizationRoutes } from './routes/dprSummarization.js';
import reportGenerationRoutes from './routes/reportGeneration.js';

// Export all services for external use
export * from './services/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || '3002');

// Register plugins
fastify.register(cors, {
  origin: true,
});

fastify.register(multipart);

// Register route modules
fastify.register(registerSchemeMatchingRoutes);
fastify.register(registerRiskMitigationRoutes);
fastify.register(registerRiskClassificationRoutes);
fastify.register(geospatialVerificationRoutes, { prefix: '/api/geospatial' });
fastify.register(dprSummarizationRoutes, { prefix: '/api/dpr' });
fastify.register(reportGenerationRoutes, { prefix: '/api/ai' });

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'OK', 
    service: 'DPR AI Services', 
    timestamp: new Date().toISOString() 
  };
});

// API routes placeholder
fastify.get('/api', async (request, reply) => {
  return { message: 'DPR AI Services API' };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`AI Services server running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();