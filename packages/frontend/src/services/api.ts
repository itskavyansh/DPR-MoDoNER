import axios from 'axios';
// Import types directly - will be replaced with proper shared package import
interface DPRDocument {
  id: string;
  originalFileName: string;
  fileType: 'PDF' | 'DOCX' | 'TXT';
  uploadTimestamp: Date;
  fileSize: number;
  language: 'EN' | 'HI' | 'AS';
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface AnalysisResults {
  dprId: string;
  documentName: string;
  completenessScore: number;
  feasibilityRating: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priceDeviationPercentage: number;
  schemeMatches: number;
  analysisTimestamp: Date;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

interface PriceComparisonResult {
  dprId: string;
  totalEstimate: number;
  regionalAverage: number;
  deviationPercentage: number;
}

interface CompletionFeasibilityResult {
  dprId: string;
  completionProbability: number;
}

interface SchemeMatchingResult {
  dprId: string;
  matchedSchemes: any[];
}

interface GeospatialVerificationResult {
  dprId: string;
  verificationStatus: string;
}
import { DashboardSummary } from '../types/dashboard';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error:', error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Return empty data instead of rejecting for specific endpoints
    if (error.config && (
      error.config.url.includes('/api/processing/status') ||
      error.config.url.includes('/api/dashboard/summary') ||
      error.config.url.includes('/api/analysis')
    )) {
      console.info('Returning fallback data for:', error.config.url);
      return Promise.resolve({ 
        data: error.config.url.includes('/api/analysis') ? [] : {} 
      });
    }
    
    return Promise.reject(error);
  }
);

export const dashboardApi = {
  // Dashboard summary
  getSummary: async (): Promise<DashboardSummary> => {
    try {
      const response = await api.get('/api/dashboard/summary');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch dashboard summary:', error);
      return {} as DashboardSummary;
    }
  },

  // Document management
  getDocuments: async (): Promise<DPRDocument[]> => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  getDocument: async (id: string): Promise<DPRDocument> => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  uploadDocument: async (file: File, onProgress?: (progress: number) => void): Promise<DPRDocument> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  batchUpload: async (files: File[], onProgress?: (progress: number) => void): Promise<DPRDocument[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/api/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  // Analysis results
  getAnalysisResults: async (dprId: string): Promise<AnalysisResults> => {
    const response = await api.get(`/api/analysis/${dprId}`);
    return response.data;
  },

  getAllAnalysisResults: async (): Promise<AnalysisResults[]> => {
    try {
      const response = await api.get('/api/analysis');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch analysis results:', error);
      return [];
    }
  },

  // Price comparison
  getPriceComparison: async (dprId: string): Promise<PriceComparisonResult> => {
    const response = await api.get(`/api/analysis/${dprId}/price-comparison`);
    return response.data;
  },

  // Completion feasibility
  getCompletionFeasibility: async (dprId: string): Promise<CompletionFeasibilityResult> => {
    const response = await api.get(`/api/analysis/${dprId}/completion-feasibility`);
    return response.data;
  },

  // Scheme matching
  getSchemeMatches: async (dprId: string): Promise<SchemeMatchingResult> => {
    const response = await api.get(`/api/analysis/${dprId}/scheme-matches`);
    return response.data;
  },

  // Geospatial verification
  getGeospatialVerification: async (dprId: string): Promise<GeospatialVerificationResult> => {
    const response = await api.get(`/api/analysis/${dprId}/geospatial`);
    return response.data;
  },

  // Reports
  generateReport: async (dprId: string, format: 'pdf' | 'excel'): Promise<Blob> => {
    const response = await api.get(`/api/reports/${dprId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;