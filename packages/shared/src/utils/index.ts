// Utility functions for the DPR Quality Assessment System

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileType = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toUpperCase();
  return ['PDF', 'DOCX', 'TXT'].includes(extension || '');
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const isValidLanguage = (lang: string): boolean => {
  return ['EN', 'HI', 'AS'].includes(lang.toUpperCase());
};