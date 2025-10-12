// Test utility to verify AnalysisDetail error handling

export const testAnalysisDetailErrorHandling = () => {
  console.log('🧪 Testing AnalysisDetail Error Handling');

  // Test cases for potential errors
  const testCases = [
    {
      name: 'Null item in priceAnalysis',
      data: {
        priceAnalysis: {
          flaggedItems: [
            null, // This would cause the original error
            { item: 'Cement', standardPrice: 350, quotedPrice: 420, deviation: 20 }
          ]
        }
      }
    },
    {
      name: 'Undefined item.item',
      data: {
        priceAnalysis: {
          flaggedItems: [
            { item: undefined, standardPrice: 350, quotedPrice: 420, deviation: 20 }
          ]
        }
      }
    },
    {
      name: 'Null scheme in schemeMatches',
      data: {
        schemeMatches: [
          null,
          { schemeName: 'PMGSY', eligibility: 'Eligible', fundingAmount: 3500000 }
        ]
      }
    },
    {
      name: 'Undefined schemeName',
      data: {
        schemeMatches: [
          { schemeName: undefined, eligibility: 'Eligible', fundingAmount: 3500000 }
        ]
      }
    }
  ];

  testCases.forEach(testCase => {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      // Simulate the data processing that was causing errors
      if (testCase.data.priceAnalysis?.flaggedItems) {
        const priceData = testCase.data.priceAnalysis.flaggedItems.map(item => ({
          name: item?.item ? item.item.split(' ')[0] : 'Unknown',
          standard: item?.standardPrice || 0,
          quoted: item?.quotedPrice || 0,
          deviation: item?.deviation || 0
        }));
        console.log('✅ Price data processed successfully:', priceData);
      }

      if (testCase.data.schemeMatches) {
        const schemeData = testCase.data.schemeMatches.map(scheme => ({
          name: scheme?.schemeName ? scheme.schemeName.split(' ').slice(0, 2).join(' ') : 'Unknown Scheme',
          funding: (scheme?.fundingAmount || 0) / 100000,
          eligible: scheme?.eligibility?.includes('Eligible') ? 1 : 0.5
        }));
        console.log('✅ Scheme data processed successfully:', schemeData);
      }

    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error);
    }
  });

  console.log('🎉 All error handling tests completed');
};

// Mock data that would have caused the original error
export const mockProblematicData = {
  dprId: 'test-123',
  documentName: 'Test DPR',
  completenessScore: 85,
  feasibilityRating: 78,
  riskLevel: 'MEDIUM',
  priceDeviationPercentage: 12.5,
  analysisTimestamp: new Date(),
  priceAnalysis: {
    flaggedItems: [
      null, // This would cause "Cannot read properties of undefined (reading 'split')"
      { item: undefined, standardPrice: 350, quotedPrice: 420, deviation: 20 },
      { item: 'Cement (per bag)', standardPrice: 350, quotedPrice: 420, deviation: 20 }
    ]
  },
  schemeMatches: [
    null, // This would also cause errors
    { schemeName: undefined, eligibility: 'Eligible', fundingAmount: 3500000 },
    { schemeName: 'PMGSY Scheme', eligibility: 'Eligible', fundingAmount: 3500000 }
  ]
};

// Test the fixed data processing
export const testFixedDataProcessing = () => {
  console.log('🔧 Testing Fixed Data Processing');
  
  try {
    const priceData = mockProblematicData.priceAnalysis.flaggedItems.map(item => ({
      name: item?.item ? item.item.split(' ')[0] : 'Unknown',
      standard: item?.standardPrice || 0,
      quoted: item?.quotedPrice || 0,
      deviation: item?.deviation || 0
    }));

    const schemeData = mockProblematicData.schemeMatches.map(scheme => ({
      name: scheme?.schemeName ? scheme.schemeName.split(' ').slice(0, 2).join(' ') : 'Unknown Scheme',
      funding: (scheme?.fundingAmount || 0) / 100000,
      eligible: scheme?.eligibility?.includes('Eligible') ? 1 : 0.5
    }));

    console.log('✅ Fixed processing successful!');
    console.log('Price data:', priceData);
    console.log('Scheme data:', schemeData);
    
    return { priceData, schemeData };
  } catch (error) {
    console.error('❌ Fixed processing still has errors:', error);
    return null;
  }
};

// Uncomment to run tests
// testAnalysisDetailErrorHandling();
// testFixedDataProcessing();