// Constants for the DPR Quality Assessment System

export const FILE_LIMITS = {
  PDF_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  DOCX_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  TXT_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_BATCH_SIZE: 10,
} as const;

export const SUPPORTED_FILE_TYPES = ['PDF', 'DOCX', 'TXT'] as const;

export const SUPPORTED_LANGUAGES = ['EN', 'HI', 'AS'] as const;

export const DPR_SECTION_TYPES = [
  'EXECUTIVE_SUMMARY',
  'COST_ESTIMATE',
  'TIMELINE',
  'RESOURCES',
  'TECHNICAL_SPECS',
] as const;

export const PROCESSING_STATUS = [
  'UPLOADED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
] as const;

export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  DOCUMENTS: '/api/documents',
  ANALYSIS: '/api/analysis',
  REPORTS: '/api/reports',
} as const;