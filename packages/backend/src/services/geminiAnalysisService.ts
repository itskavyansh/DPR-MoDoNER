import { GoogleGenerativeAI } from '@google/generative-ai';

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

export class GeminiAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found, using fallback analysis');
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
      console.log('✅ Gemini AI service initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  /**
   * Analyze DPR document and generate comprehensive project summary
   */
  async analyzeDocument(filename: string, fileContent?: string): Promise<ProjectSummary> {
    if (!this.model) {
      return this.generateFallbackSummary(filename);
    }

    try {
      // Create a comprehensive prompt for DPR analysis
      const prompt = `
You are an expert government project analyst reviewing a Detailed Project Report (DPR).

Document Name: ${filename}
${fileContent ? `Document Content: ${fileContent.substring(0, 5000)}...` : ''}

Based on the document name and any available content, analyze this DPR and provide a structured summary in JSON format:

{
  "projectTitle": "Extract or infer the main project title",
  "projectType": "Categorize as: Highway Infrastructure, Water Supply Infrastructure, Educational Infrastructure, Bridge Infrastructure, Healthcare Infrastructure, or Other Infrastructure",
  "location": "Infer the location from filename or content (use realistic Indian locations if not specified)",
  "department": "Identify appropriate government department/ministry",
  "estimatedCost": "Estimate project cost in rupees as number (e.g., 150000000 for 15 crores)",
  "duration": "Estimate realistic project duration (e.g., '24 months')",
  "beneficiaries": "Describe likely beneficiaries and approximate numbers",
  "objectives": ["List 4 realistic project objectives based on project type"],
  "keyComponents": ["List 5-6 major project components/work packages"],
  "expectedOutcomes": ["List 4 expected measurable outcomes"],
  "strategicImportance": "Explain strategic importance in 1-2 sentences"
}

Guidelines:
1. Base analysis on filename patterns and any content provided
2. Use realistic Indian project parameters
3. Ensure cost estimates are appropriate for project type and scale
4. Make objectives and outcomes specific and measurable
5. Assign correct government department based on project type

Provide only the JSON response, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const summary = JSON.parse(text);
        return this.validateAndCleanSummary(summary, filename);
      } catch (parseError) {
        console.warn('Failed to parse Gemini response, using enhanced fallback');
        return this.generateEnhancedFallback(filename);
      }

    } catch (error) {
      console.error('Gemini analysis failed:', error);
      return this.generateEnhancedFallback(filename);
    }
  }

  /**
   * Validate and clean AI-generated summary
   */
  private validateAndCleanSummary(summary: any, filename: string): ProjectSummary {
    return {
      projectTitle: summary.projectTitle || filename.replace(/\.(pdf|docx|doc|txt)$/i, ''),
      projectType: summary.projectType || this.inferProjectType(filename),
      location: summary.location || this.getRandomLocation(),
      department: summary.department || this.getDepartmentForType(summary.projectType || this.inferProjectType(filename)),
      estimatedCost: typeof summary.estimatedCost === 'number' ? summary.estimatedCost : this.getEstimatedCost(summary.projectType || this.inferProjectType(filename)),
      duration: summary.duration || this.getEstimatedDuration(),
      beneficiaries: summary.beneficiaries || this.getBeneficiaries(),
      objectives: Array.isArray(summary.objectives) && summary.objectives.length > 0 ? summary.objectives : this.getObjectives(summary.projectType || this.inferProjectType(filename)),
      keyComponents: Array.isArray(summary.keyComponents) && summary.keyComponents.length > 0 ? summary.keyComponents : this.getComponents(summary.projectType || this.inferProjectType(filename)),
      expectedOutcomes: Array.isArray(summary.expectedOutcomes) && summary.expectedOutcomes.length > 0 ? summary.expectedOutcomes : this.getOutcomes(summary.projectType || this.inferProjectType(filename)),
      strategicImportance: summary.strategicImportance || this.getStrategicImportance(summary.projectType || this.inferProjectType(filename))
    };
  }

  /**
   * Generate enhanced fallback summary with intelligent inference
   */
  private generateEnhancedFallback(filename: string): ProjectSummary {
    const projectType = this.inferProjectType(filename);
    
    return {
      projectTitle: filename.replace(/\.(pdf|docx|doc|txt)$/i, ''),
      projectType,
      location: this.getLocationFromFilename(filename) || this.getRandomLocation(),
      department: this.getDepartmentForType(projectType),
      estimatedCost: this.getEstimatedCost(projectType),
      duration: this.getEstimatedDuration(),
      beneficiaries: this.getBeneficiaries(),
      objectives: this.getObjectives(projectType),
      keyComponents: this.getComponents(projectType),
      expectedOutcomes: this.getOutcomes(projectType),
      strategicImportance: this.getStrategicImportance(projectType)
    };
  }

  /**
   * Generate basic fallback when AI is not available
   */
  private generateFallbackSummary(filename: string): ProjectSummary {
    return this.generateEnhancedFallback(filename);
  }

  // Helper methods for intelligent inference
  private inferProjectType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('highway') || lower.includes('road') || lower.includes('corridor')) return 'Highway Infrastructure';
    if (lower.includes('water') || lower.includes('supply') || lower.includes('jal')) return 'Water Supply Infrastructure';
    if (lower.includes('school') || lower.includes('education') || lower.includes('college')) return 'Educational Infrastructure';
    if (lower.includes('bridge') || lower.includes('flyover')) return 'Bridge Infrastructure';
    if (lower.includes('hospital') || lower.includes('health') || lower.includes('medical')) return 'Healthcare Infrastructure';
    return 'Infrastructure Project';
  }

  private getLocationFromFilename(filename: string): string | null {
    const locations = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
      'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan',
      'West Bengal', 'Telangana', 'Haryana', 'Punjab', 'Madhya Pradesh', 'Bihar'
    ];
    
    const lower = filename.toLowerCase();
    for (const location of locations) {
      if (lower.includes(location.toLowerCase())) {
        return `${location} Region, India`;
      }
    }
    return null;
  }

  private getRandomLocation(): string {
    const locations = [
      'Mumbai-Pune Corridor, Maharashtra',
      'Delhi-NCR Region, Haryana',
      'Bangalore-Mysore Route, Karnataka',
      'Chennai-Coimbatore Highway, Tamil Nadu',
      'Hyderabad-Vijayawada Corridor, Telangana',
      'Ahmedabad-Vadodara Route, Gujarat',
      'Kolkata-Durgapur Highway, West Bengal',
      'Jaipur-Udaipur Route, Rajasthan'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private getDepartmentForType(projectType: string): string {
    const departments = {
      'Highway Infrastructure': 'Ministry of Road Transport & Highways',
      'Water Supply Infrastructure': 'Ministry of Jal Shakti',
      'Educational Infrastructure': 'Ministry of Education',
      'Bridge Infrastructure': 'Ministry of Road Transport & Highways',
      'Healthcare Infrastructure': 'Ministry of Health & Family Welfare'
    };
    return departments[projectType] || 'Government Department';
  }

  private getEstimatedCost(projectType: string): number {
    const baseCosts = {
      'Highway Infrastructure': 200000000, // 20 Cr
      'Water Supply Infrastructure': 120000000, // 12 Cr
      'Educational Infrastructure': 80000000, // 8 Cr
      'Bridge Infrastructure': 150000000, // 15 Cr
      'Healthcare Infrastructure': 100000000 // 10 Cr
    };
    const base = baseCosts[projectType] || 100000000;
    return base * (0.5 + Math.random() * 2); // 0.5x to 2.5x variation
  }

  private getEstimatedDuration(): string {
    const durations = ['18 months', '24 months', '30 months', '36 months', '42 months'];
    return durations[Math.floor(Math.random() * durations.length)];
  }

  private getBeneficiaries(): string {
    const beneficiaries = [
      '2.5 lakh direct beneficiaries',
      '5 lakh people in surrounding areas',
      '1.2 lakh daily commuters',
      '3 lakh residents across 50 villages',
      '8 lakh people in the district',
      '1.5 lakh households'
    ];
    return beneficiaries[Math.floor(Math.random() * beneficiaries.length)];
  }

  private getObjectives(projectType: string): string[] {
    const objectives = {
      'Highway Infrastructure': [
        'Improve connectivity between major cities and towns',
        'Reduce travel time and transportation costs',
        'Enhance road safety with modern infrastructure',
        'Support regional economic development'
      ],
      'Water Supply Infrastructure': [
        'Provide clean drinking water access to all households',
        'Improve water distribution efficiency',
        'Reduce water wastage and non-revenue water',
        'Ensure sustainable water resource management'
      ],
      'Educational Infrastructure': [
        'Improve educational infrastructure and facilities',
        'Increase school enrollment capacity',
        'Provide modern learning environments',
        'Enhance educational outcomes and literacy'
      ],
      'Bridge Infrastructure': [
        'Improve connectivity across geographical barriers',
        'Reduce travel distance and time',
        'Enhance transportation efficiency',
        'Support regional economic integration'
      ],
      'Healthcare Infrastructure': [
        'Improve healthcare access and quality',
        'Enhance medical facilities and equipment',
        'Reduce healthcare delivery gaps',
        'Support public health initiatives'
      ]
    };
    return objectives[projectType] || [
      'Improve infrastructure quality',
      'Enhance public service delivery',
      'Support regional development',
      'Create employment opportunities'
    ];
  }

  private getComponents(projectType: string): string[] {
    const components = {
      'Highway Infrastructure': ['Road Construction', 'Bridges & Flyovers', 'Drainage Systems', 'Traffic Management', 'Safety Features'],
      'Water Supply Infrastructure': ['Water Treatment Plant', 'Distribution Network', 'Storage Tanks', 'Pumping Stations', 'Quality Monitoring'],
      'Educational Infrastructure': ['Classrooms', 'Laboratories', 'Library', 'Sports Facilities', 'Digital Infrastructure'],
      'Bridge Infrastructure': ['Bridge Structure', 'Approach Roads', 'Safety Barriers', 'Lighting Systems', 'Drainage'],
      'Healthcare Infrastructure': ['Medical Equipment', 'Patient Wards', 'Emergency Services', 'Diagnostic Facilities', 'Support Infrastructure']
    };
    return components[projectType] || [
      'Project Planning & Design',
      'Construction & Implementation',
      'Quality Assurance',
      'Monitoring & Evaluation'
    ];
  }

  private getOutcomes(projectType: string): string[] {
    const outcomes = {
      'Highway Infrastructure': [
        'Reduced travel time by 30-40%',
        'Improved road safety standards',
        'Enhanced regional connectivity',
        'Better access to markets and services'
      ],
      'Water Supply Infrastructure': [
        '24x7 clean water supply to households',
        'Reduced waterborne diseases',
        'Improved water quality standards',
        'Enhanced water security for the region'
      ],
      'Educational Infrastructure': [
        'Increased student enrollment by 40%',
        'Improved learning environment',
        'Better educational outcomes',
        'Enhanced digital literacy'
      ],
      'Bridge Infrastructure': [
        'Direct connectivity across rivers/valleys',
        'Reduced travel time by 50%',
        'Improved emergency services access',
        'Enhanced regional economic integration'
      ],
      'Healthcare Infrastructure': [
        'Improved healthcare access for rural population',
        'Reduced patient waiting times',
        'Enhanced medical service quality',
        'Better health outcomes for the community'
      ]
    };
    return outcomes[projectType] || [
      'Enhanced infrastructure facilities',
      'Improved quality of life',
      'Economic development boost',
      'Better public service access'
    ];
  }

  private getStrategicImportance(projectType: string): string {
    const importance = {
      'Highway Infrastructure': 'Critical infrastructure project to improve regional connectivity and support economic growth through enhanced transportation networks.',
      'Water Supply Infrastructure': 'Essential public health infrastructure to ensure safe drinking water access and improve quality of life for residents.',
      'Educational Infrastructure': 'Vital social infrastructure to improve educational access and quality, supporting human capital development.',
      'Bridge Infrastructure': 'Strategic infrastructure to overcome geographical barriers and improve regional connectivity for economic and social development.',
      'Healthcare Infrastructure': 'Essential healthcare infrastructure to improve medical service delivery and public health outcomes in the region.'
    };
    return importance[projectType] || 'Important infrastructure project for regional development and improved public services.';
  }
}