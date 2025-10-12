// Utility to generate consistent hash for files to ensure same file = same results

export const generateFileHash = async (file: File): Promise<string> => {
  // Create a consistent hash based on file content and metadata
  const fileContent = await file.arrayBuffer();
  const fileData = new Uint8Array(fileContent);
  
  // Simple hash function based on file content, name, and size
  let hash = 0;
  const str = `${file.name}-${file.size}-${file.lastModified}`;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add content-based hash for first 1KB of file
  const sampleSize = Math.min(1024, fileData.length);
  for (let i = 0; i < sampleSize; i++) {
    hash = ((hash << 5) - hash) + fileData[i];
    hash = hash & hash;
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export const generateConsistentDprId = async (file: File): Promise<string> => {
  const hash = await generateFileHash(file);
  return `dpr-${hash}`;
};

// Cache for file analysis results to ensure consistency
interface CachedAnalysis {
  dprId: string;
  fileName: string;
  fileSize: number;
  uploadTimestamp: Date;
  analysisResults: any;
}

class FileAnalysisCache {
  private cache = new Map<string, CachedAnalysis>();
  
  async getCachedAnalysis(file: File): Promise<CachedAnalysis | null> {
    const hash = await generateFileHash(file);
    return this.cache.get(hash) || null;
  }
  
  async setCachedAnalysis(file: File, analysis: CachedAnalysis): Promise<void> {
    const hash = await generateFileHash(file);
    this.cache.set(hash, analysis);
    
    // Also store in localStorage for persistence across sessions
    try {
      const cacheData = JSON.stringify({
        ...analysis,
        uploadTimestamp: analysis.uploadTimestamp.toISOString()
      });
      localStorage.setItem(`dpr-cache-${hash}`, cacheData);
    } catch (error) {
      console.warn('Failed to cache analysis in localStorage:', error);
    }
  }
  
  async loadFromLocalStorage(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('dpr-cache-')) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            parsed.uploadTimestamp = new Date(parsed.uploadTimestamp);
            const hash = key.replace('dpr-cache-', '');
            this.cache.set(hash, parsed);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }
  
  clearCache(): void {
    this.cache.clear();
    // Clear from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dpr-cache-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const fileAnalysisCache = new FileAnalysisCache();

// Initialize cache from localStorage on module load
fileAnalysisCache.loadFromLocalStorage();