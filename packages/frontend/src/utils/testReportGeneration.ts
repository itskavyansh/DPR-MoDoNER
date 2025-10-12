// Test utility to verify report generation functionality
import { reportService } from '../services/reportService';

export const testReportGeneration = async () => {
  try {
    console.log('Testing PDF report generation...');
    await reportService.generatePDFReport('test-dpr-123');
    console.log('✅ PDF report generated successfully');

    console.log('Testing Excel report generation...');
    await reportService.generateExcelReport('test-dpr-123');
    console.log('✅ Excel report generated successfully');

    return true;
  } catch (error) {
    console.error('❌ Report generation test failed:', error);
    return false;
  }
};

// Uncomment to run test
// testReportGeneration();