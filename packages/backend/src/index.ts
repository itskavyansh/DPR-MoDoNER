import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Import services and routes
import { UploadService } from './services/uploadService.js';
import { WebSocketService } from './services/websocketService.js';
import { DocumentStorageService } from './services/documentStorageService.js';
import { DatabaseConnection } from './database/connection.js';
import uploadRoutes, { initializeUploadRoutes } from './routes/upload.js';
import documentRoutes, { initializeDocumentRoutes } from './routes/documents.js';
import { createHistoricalDataRoutes } from './routes/historicalData.js';
import completionFeasibilityRoutes from './routes/completionFeasibility.js';
import governmentSchemesRoutes, { initializeGovernmentSchemesRoutes } from './routes/governmentSchemes.js';
import schemeMatchingRoutes, { initializeSchemeMatchingRoutes } from './routes/schemeMatching.js';
import dashboardRoutes from './routes/dashboard.js';
import analysisRoutes from './routes/analysis.js';
import reportsRoutes from './routes/reports.js';
import authRoutes from './routes/auth.js';
import { DocumentProcessingOrchestrator } from './services/documentProcessingOrchestrator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize database
const db = DatabaseConnection.getInstance();

// Initialize services
const uploadService = new UploadService();
const websocketService = new WebSocketService(server);
const documentStorageService = new DocumentStorageService();
const documentProcessor = new DocumentProcessingOrchestrator(
  documentStorageService,
  websocketService
);

// Initialize routes with services
initializeUploadRoutes(uploadService, websocketService);
initializeDocumentRoutes(documentStorageService);
initializeGovernmentSchemesRoutes(db.getPool());
initializeSchemeMatchingRoutes(db.getPool());

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '60mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Serve uploaded files statically (for development)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'DPR Backend API', 
    timestamp: new Date().toISOString(),
    websocket: {
      connected: websocketService.getConnectedClientsCount()
    }
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'DPR Quality Assessment System API' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Document management routes
app.use('/api/documents', documentRoutes);

// Historical data routes
app.use('/api/historical', createHistoricalDataRoutes(db.getPool()));

// Completion feasibility routes
app.use('/api/completion-feasibility', completionFeasibilityRoutes);

// Government schemes routes
app.use('/api/schemes', governmentSchemesRoutes);

// Scheme matching routes
app.use('/api/scheme-matching', schemeMatchingRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Analysis routes
app.use('/api/analysis', analysisRoutes);

// Reports routes
app.use('/api/reports', reportsRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        field: 'fileSize',
        message: 'File size too large',
        code: 'FILE_SIZE_EXCEEDED'
      }
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: {
        field: 'files',
        message: 'Too many files in batch upload',
        code: 'BATCH_SIZE_EXCEEDED'
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      field: 'server',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      field: 'route',
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND'
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize database schema
    await db.initializeSchema();

    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log(`WebSocket server ready for connections`);
      console.log(`Database connected and schema initialized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();