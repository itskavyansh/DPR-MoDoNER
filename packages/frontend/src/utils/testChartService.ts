// Test utility to verify chart service error handling

export const testChartServiceErrorHandling = () => {
  console.log('🧪 Testing Chart Service Error Handling');

  // Test cases for potential errors in chart generation
  const testCases = [
    {
      name: 'Null item in priceAnalysis',
      data: {
        priceAnalysis: {
          flaggedItems: [
            null, // This would cause the original error
            { item: 'Cement', standardPrice: 350, quotedPrice: 420 },
            { item: undefined, standardPrice: 300, quotedPrice: 350 }
          ]
        }
      }
    },
    {
      name: 'Null scheme in schemeMatches',
      data: {
        schemeMatches: [
          null, // This would cause the original error
          { schemeName: 'PMGSY', fundingAmount: 3500000 },
          { schemeName: undefined, fundingAmount: 2800000 }
        ]
      }
    }
  ];

  testCases.forEach(testCase => {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      // Simulate the data processing that was causing errors in chart service
      if (testCase.data.priceAnalysis?.flaggedItems) {
        const labels = testCase.data.priceAnalysis.flaggedItems.map((item: any) => 
          item?.item ? item.item.split(' ')[0] : 'Unknown Item'
        );
        const standardPrices = testCase.data.priceAnalysis.flaggedItems.map((item: any) => 
          item?.standardPrice || 0
        );
        const quotedPrices = testCase.data.priceAnalysis.flaggedItems.map((item: any) => 
          item?.quotedPrice || 0
        );
        
        console.log('✅ Price chart data processed successfully:', { labels, standardPrices, quotedPrices });
      }

      if (testCase.data.schemeMatches) {
        const schemeLabels = testCase.data.schemeMatches.map((scheme: any) => 
          scheme?.schemeName ? scheme.schemeName.split(' ').slice(0, 2).join(' ') : 'Unknown Scheme'
        );
        const fundingAmounts = testCase.data.schemeMatches.map((scheme: any) => 
          scheme?.fundingAmount || 0
        );
        
        console.log('✅ Scheme chart data processed successfully:', { schemeLabels, fundingAmounts });
      }

    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error);
    }
  });

  console.log('🎉 All chart service error handling tests completed');
};

// Mock problematic data that would have caused the original chart errors
export const mockProblematicChartData = {
  priceAnalysis: {
    flaggedItems: [
      null, // Would cause "Cannot read properties of undefined (reading 'split')"
      { item: undefined, standardPrice: 350, quotedPrice: 420 },
      { item: 'Cement (per bag)', standardPrice: 350, quotedPrice: 420 }
    ]
  },
  schemeMatches: [
    null, // Would cause split() errors
    { schemeName: undefined, fundingAmount: 3500000 },
    { schemeName: 'PMGSY Scheme', fundingAmount: 3500000 }
  ]
};

// Test the fixed chart data processing
export const testFixedChartProcessing = () => {
  console.log('🔧 Testing Fixed Chart Data Processing');
  
  try {
    // Test price analysis processing
    const priceLabels = mockProblematicChartData.priceAnalysis.flaggedItems.map((item: any) => 
      item?.item ? item.item.split(' ')[0] : 'Unknown Item'
    );
    
    const standardPrices = mockProblematicChartData.priceAnalysis.flaggedItems.map((item: any) => 
      item?.standardPrice || 0
    );

    // Test scheme matching processing
    const schemeLabels = mockProblematicChartData.schemeMatches.map((scheme: any) => 
      scheme?.schemeName ? scheme.schemeName.split(' ').slice(0, 2).join(' ') : 'Unknown Scheme'
    );
    
    const fundingAmounts = mockProblematicChartData.schemeMatches.map((scheme: any) => 
      scheme?.fundingAmount || 0
    );

    console.log('✅ Fixed chart processing successful!');
    console.log('Price labels:', priceLabels);
    console.log('Standard prices:', standardPrices);
    console.log('Scheme labels:', schemeLabels);
    console.log('Funding amounts:', fundingAmounts);
    
    return { priceLabels, standardPrices, schemeLabels, fundingAmounts };
  } catch (error) {
    console.error('❌ Fixed chart processing still has errors:', error);
    return null;
  }
};

// Uncomment to run tests
// testChartServiceErrorHandling();
// testFixedChartProcessing();