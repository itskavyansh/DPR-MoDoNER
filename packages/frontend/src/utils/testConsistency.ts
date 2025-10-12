// Test utility to demonstrate consistent file analysis

import { generateFileHash, generateConsistentDprId, fileAnalysisCache } from './fileHasher';

export const testFileConsistency = async (file: File) => {
  console.log('🧪 Testing File Consistency');
  console.log('📄 File Details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  });

  // Generate hash multiple times to show consistency
  const hash1 = await generateFileHash(file);
  const hash2 = await generateFileHash(file);
  const hash3 = await generateFileHash(file);

  console.log('🔑 File Hashes (should be identical):');
  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  console.log('Hash 3:', hash3);
  console.log('✅ Hashes consistent:', hash1 === hash2 && hash2 === hash3);

  // Generate DPR IDs
  const dprId1 = await generateConsistentDprId(file);
  const dprId2 = await generateConsistentDprId(file);

  console.log('🆔 DPR IDs (should be identical):');
  console.log('DPR ID 1:', dprId1);
  console.log('DPR ID 2:', dprId2);
  console.log('✅ DPR IDs consistent:', dprId1 === dprId2);

  // Test caching
  const cachedAnalysis = await fileAnalysisCache.getCachedAnalysis(file);
  console.log('💾 Cached Analysis:', cachedAnalysis ? 'Found' : 'Not found');

  return {
    hash: hash1,
    dprId: dprId1,
    isConsistent: hash1 === hash2 && hash2 === hash3 && dprId1 === dprId2,
    hasCachedAnalysis: !!cachedAnalysis
  };
};

// Function to simulate file upload with consistent results
export const simulateConsistentUpload = async (file: File) => {
  const dprId = await generateConsistentDprId(file);
  
  // Check if we have cached results
  let cachedAnalysis = await fileAnalysisCache.getCachedAnalysis(file);
  
  if (cachedAnalysis) {
    console.log('✅ Using cached analysis for consistent results');
    return cachedAnalysis;
  }

  // Generate new analysis (this would normally call the AI service)
  const newAnalysis = {
    dprId,
    fileName: file.name,
    fileSize: file.size,
    uploadTimestamp: new Date(),
    analysisResults: {
      completenessScore: 75, // This would come from AI analysis
      feasibilityRating: 80,
      riskLevel: 'MEDIUM'
    }
  };

  // Cache the results
  await fileAnalysisCache.setCachedAnalysis(file, newAnalysis);
  console.log('💾 Cached new analysis for future consistency');

  return newAnalysis;
};