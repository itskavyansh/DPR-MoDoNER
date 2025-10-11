import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

interface ProjectSummary {
  projectTitle: string;
  projectType: string;
  location: string;
  department: string;
  estimatedCost: number;
  duration: string;
  beneficiaries: string;
  objectives: string[];
  keyComponents: string[];
  expectedOutcomes: string[];
  strategicImportance: string;
}

export class DPRSummarizationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Extract text content from uploaded file
   */
  private async extractTextFromFile(filePath: string): Promise<string> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(dataBuffer);
        return pdfData.text;
      } else if (fileExtension === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } else if (fileExtension === '.txt') {
        return await fs.readFile(filePath, 'utf-8');
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  /**
   * Generate project summary using Gemini AI
   */
  async generateProjectSummary(filePath: string, fileName: string): Promise<ProjectSummary> {
    try {
      // Extract text from the document
      const documentText = await this.extractTextFromFile(filePath);
      
      // Truncate text if too long (Gemini has token limits)
      const maxLength = 30000; // Approximately 7500 tokens
      const truncatedText = documentText.length > maxLength 
        ? documentText.substring(0, maxLength) + '...[truncated]'
        : documentText;

      // Create a comprehensive prompt for DPR analysis
      const prompt = `
You are an expert government project analyst. Analyze this Detailed Project Report (DPR) and extract key information to create a comprehensive project summary.

Document Name: ${fileName}
Document Content:
${truncatedText}

Please analyze the document and provide a structured summary in the following JSON format:

{
  "projectTitle": "Extract the main project title/name",
  "projectType": "Categorize as: Highway Infrastructure, Water Supply Infrastructure, Educational Infrastructure, Bridge Infrastructure, Healthcare Infrastructure, or Other Infrastructure",
  "location": "Extract specific location/area where project will be implemented",
  "department": "Identify the responsible government department/ministry",
  "estimatedCost": "Extract total project cost in rupees (as number, e.g., 150000000 for 15 crores)",
  "duration": "Extract project timeline/duration (e.g., '24 months')",
  "beneficiaries": "Describe who will benefit and approximate numbers",
  "objectives": ["List 3-4 main project objectives"],
  "keyComponents": ["List 4-6 major project components/work packages"],
  "expectedOutcomes": ["List 3-4 expected outcomes/benefits"],
  "strategicImportance": "Explain the strategic importance and impact of this project in 1-2 sentences"
}

Important guidelines:
1. Extract actual information from the document, don't make assumptions
2. If specific information is not available, use "Not specified in document"
3. For costs, convert lakhs/crores to actual numbers (1 crore = 10000000)
4. Be precise and factual
5. Focus on government infrastructure project terminology

Provide only the JSON response, no additional text.
`;

      // Generate summary using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      try {
        const summary = JSON.parse(text);
        
        // Validate and clean the response
        return this.validateAndCleanSummary(summary, fileName);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw response:', text);
        
        // Fallback to basic summary if parsing fails
        return this.generateFallbackSummary(fileName, documentText);
      }

    } catch (error) {
      console.error('Error generating project summary:', error);
      
      // Return fallback summary if AI fails
      return this.generateFallbackSummary(fileName);
    }
  }

  /**
   * Validate and clean the AI-generated summary
   */
  private validateAndCleanSummary(summary: any, fileName: string): ProjectSummary {
    return {
      projectTitle: summary.projectTitle || fileName.replace(/\.(pdf|docx|doc|txt)$/i, ''),
      projectType: summary.projectType || 'Infrastructure Project',
      location: summary.location || 'Location not specified',
      department: summary.department || 'Government Department',
      estimatedCost: typeof summary.estimatedCost === 'number' ? summary.estimatedCost : 100000000,
      duration: summary.duration || '24 months',
      beneficiaries: summary.beneficiaries || 'Local community',
      objectives: Array.isArray(summary.objectives) ? summary.objectives : [
        'Improve infrastructure',
        'Enhance public services',
        'Support economic development'
      ],
      keyComponents: Array.isArray(summary.keyComponents) ? summary.keyComponents : [
        'Planning and Design',
        'Construction',
        'Quality Control',
        'Project Management'
      ],
      expectedOutcomes: Array.isArray(summary.expectedOutcomes) ? summary.expectedOutcomes : [
        'Improved infrastructure',
        'Better public services',
        'Economic benefits'
      ],
      strategicImportance: summary.strategicImportance || 'Important infrastructure project for regional development.'
    };
  }

  /**
   * Generate fallback summary when AI processing fails
   */
  private generateFallbackSummary(fileName: string, documentText?: string): ProjectSummary {
    // Try to infer project type from filename
    const filenameLower = fileName.toLowerCase();
    let projectType = 'Infrastructure Project';
    let department = 'Government Department';
    
    if (filenameLower.includes('highway') || filenameLower.includes('road')) {
      projectType = 'Highway Infrastructure';
      department = 'Ministry of Road Transport & Highways';
    } else if (filenameLower.includes('water') || filenameLower.includes('supply')) {
      projectType = 'Water Supply Infrastructure';
      department = 'Ministry of Jal Shakti';
    } else if (filenameLower.includes('school') || filenameLower.includes('education')) {
      projectType = 'Educational Infrastructure';
      department = 'Ministry of Education';
    } else if (filenameLower.includes('bridge')) {
      projectType = 'Bridge Infrastructure';
      department = 'Ministry of Road Transport & Highways';
    } else if (filenameLower.includes('hospital') || filenameLower.includes('health')) {
      projectType = 'Healthcare Infrastructure';
      department = 'Ministry of Health & Family Welfare';
    }

    return {
      projectTitle: fileName.replace(/\.(pdf|docx|doc|txt)$/i, ''),
      projectType,
      location: 'Location to be extracted from document',
      department,
      estimatedCost: 100000000, // 10 crores default
      duration: '24 months',
      beneficiaries: 'Local community and stakeholders',
      objectives: [
        'Improve infrastructure quality',
        'Enhance public service delivery',
        'Support regional development',
        'Create employment opportunities'
      ],
      keyComponents: [
        'Project Planning & Design',
        'Construction & Implementation',
        'Quality Assurance',
        'Monitoring & Evaluation'
      ],
      expectedOutcomes: [
        'Enhanced infrastructure facilities',
        'Improved quality of life',
        'Economic development boost',
        'Better public service access'
      ],
      strategicImportance: `This ${projectType.toLowerCase()} project is strategically important for regional development and improving public infrastructure services.`
    };
  }

  /**
   * Batch process multiple DPR documents
   */
  async batchGenerateSummaries(filePaths: { path: string; name: string }[]): Promise<ProjectSummary[]> {
    const summaries: ProjectSummary[] = [];
    
    for (const file of filePaths) {
      try {
        const summary = await this.generateProjectSummary(file.path, file.name);
        summaries.push(summary);
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        summaries.push(this.generateFallbackSummary(file.name));
      }
    }
    
    return summaries;
  }
}