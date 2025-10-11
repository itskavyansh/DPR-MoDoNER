import { DPRSection } from '@dpr-system/shared';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'section-classification.log' })
  ]
});

export interface SectionClassificationResult {
  sections: DPRSection[];
  totalSections: number;
  confidence: number;
  processingTime: number;
}

export interface ClassificationOptions {
  confidenceThreshold?: number;
  enableOverlapDetection?: boolean;
  minSectionLength?: number;
  maxSections?: number;
}

export class SectionClassificationService {
  private isInitialized: boolean = false;
  
  // Section patterns and keywords for classification
  private readonly sectionPatterns = {
    EXECUTIVE_SUMMARY: {
      keywords: [
        'executive summary', 'summary', 'overview', 'abstract', 'introduction',
        'project overview', 'brief', 'synopsis', 'outline', 'background'
      ],
      patterns: [
        /executive\s+summary/i,
        /project\s+overview/i,
        /summary/i,
        /introduction/i,
        /background/i,
        /brief/i
      ],
      contextKeywords: [
        'project', 'objective', 'goal', 'purpose', 'scope', 'overview',
        'initiative', 'development', 'implementation'
      ]
    },
    COST_ESTIMATE: {
      keywords: [
        'cost estimate', 'budget', 'financial', 'expenditure', 'cost analysis',
        'pricing', 'cost breakdown', 'budget allocation', 'financial plan',
        'cost summary', 'estimated cost', 'project cost'
      ],
      patterns: [
        /cost\s+estimate/i,
        /budget/i,
        /financial/i,
        /expenditure/i,
        /cost\s+analysis/i,
        /cost\s+breakdown/i,
        /estimated\s+cost/i,
        /project\s+cost/i
      ],
      contextKeywords: [
        'rupees', 'rs', '₹', 'lakh', 'crore', 'amount', 'total', 'price',
        'material', 'labor', 'equipment', 'overhead', 'contingency'
      ]
    },
    TIMELINE: {
      keywords: [
        'timeline', 'schedule', 'duration', 'time frame', 'project schedule',
        'implementation schedule', 'work plan', 'milestones', 'phases',
        'completion time', 'project duration', 'time plan'
      ],
      patterns: [
        /timeline/i,
        /schedule/i,
        /duration/i,
        /time\s+frame/i,
        /project\s+schedule/i,
        /implementation\s+schedule/i,
        /completion\s+time/i,
        /project\s+duration/i
      ],
      contextKeywords: [
        'months', 'years', 'weeks', 'days', 'phase', 'milestone', 'start',
        'end', 'completion', 'delivery', 'deadline', 'period'
      ]
    },
    RESOURCES: {
      keywords: [
        'resources', 'manpower', 'human resources', 'personnel', 'staff',
        'team', 'workforce', 'equipment', 'machinery', 'materials',
        'resource allocation', 'resource requirement'
      ],
      patterns: [
        /resources/i,
        /manpower/i,
        /human\s+resources/i,
        /personnel/i,
        /workforce/i,
        /equipment/i,
        /machinery/i,
        /materials/i,
        /resource\s+allocation/i,
        /resource\s+requirement/i
      ],
      contextKeywords: [
        'engineer', 'worker', 'supervisor', 'manager', 'technician',
        'skilled', 'unskilled', 'contractor', 'consultant', 'expert'
      ]
    },
    TECHNICAL_SPECS: {
      keywords: [
        'technical specifications', 'technical details', 'specifications',
        'technical requirements', 'design specifications', 'technical design',
        'engineering details', 'technical parameters', 'system specifications'
      ],
      patterns: [
        /technical\s+specifications/i,
        /technical\s+details/i,
        /specifications/i,
        /technical\s+requirements/i,
        /design\s+specifications/i,
        /technical\s+design/i,
        /engineering\s+details/i,
        /technical\s+parameters/i
      ],
      contextKeywords: [
        'design', 'engineering', 'technical', 'specification', 'parameter',
        'standard', 'requirement', 'capacity', 'performance', 'quality'
      ]
    }
  };

  constructor() {}

  /**
   * Initialize the section classification service
   */
  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      logger.info('Section classification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize section classification service:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.isInitialized = false;
      logger.info('Section classification service cleaned up');
    } catch (error) {
      logger.error('Error during section classification cleanup:', error);
    }
  }

  /**
   * Classify sections in the given text
   */
  classifySections(
    text: string, 
    options: ClassificationOptions = {}
  ): SectionClassificationResult {
    if (!this.isInitialized) {
      throw new Error('Section classification service not initialized');
    }

    const startTime = Date.now();
    const {
      confidenceThreshold = 0.6,
      enableOverlapDetection = true,
      minSectionLength = 50,
      maxSections = 20
    } = options;

    try {
      logger.info('Starting section classification', { textLength: text.length });

      // Step 1: Split text into potential sections
      const potentialSections = this.splitTextIntoSections(text);
      
      // Step 2: Classify each section
      const classifiedSections: DPRSection[] = [];
      
      for (const section of potentialSections) {
        if (section.content.length < minSectionLength) {
          continue;
        }

        const classification = this.classifySection(section.content);
        
        if (classification.confidence >= confidenceThreshold) {
          classifiedSections.push({
            type: classification.type,
            content: section.content,
            confidence: classification.confidence,
            startPosition: section.startPosition,
            endPosition: section.endPosition
          });
        }
      }

      // Step 3: Handle overlaps if enabled
      const finalSections = enableOverlapDetection 
        ? this.resolveOverlaps(classifiedSections)
        : classifiedSections;

      // Step 4: Limit number of sections
      const limitedSections = finalSections.slice(0, maxSections);

      const processingTime = Date.now() - startTime;
      const overallConfidence = this.calculateOverallConfidence(limitedSections);

      logger.info('Section classification completed', {
        sectionsFound: limitedSections.length,
        processingTime,
        overallConfidence
      });

      return {
        sections: limitedSections,
        totalSections: limitedSections.length,
        confidence: overallConfidence,
        processingTime
      };

    } catch (error) {
      logger.error('Section classification failed:', error);
      throw new Error(`Section classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split text into potential sections based on common patterns
   */
  private splitTextIntoSections(text: string): Array<{
    content: string;
    startPosition: number;
    endPosition: number;
  }> {
    const sections: Array<{
      content: string;
      startPosition: number;
      endPosition: number;
    }> = [];

    // Split by common section delimiters
    const sectionDelimiters = [
      /\n\s*\d+\.\s+/g,           // Numbered sections (1. 2. 3.)
      /\n\s*[A-Z][A-Z\s]{5,}:/g,  // ALL CAPS headers with colon
      /\n\s*[A-Z][a-z\s]{10,}:/g, // Title case headers with colon
      /\n\s*#{1,6}\s+/g,          // Markdown headers
      /\n\s*\*{2,}\s*/g,          // Asterisk separators
      /\n\s*={3,}\s*/g,           // Equal sign separators
      /\n\s*-{3,}\s*/g            // Dash separators
    ];

    let currentText = text;
    let currentPosition = 0;

    // Try to find section boundaries
    const boundaries: number[] = [0];
    
    for (const delimiter of sectionDelimiters) {
      const matches = [...currentText.matchAll(delimiter)];
      for (const match of matches) {
        if (match.index !== undefined) {
          boundaries.push(match.index);
        }
      }
    }

    // Add end of text
    boundaries.push(text.length);

    // Sort and deduplicate boundaries
    const uniqueBoundaries = [...new Set(boundaries)].sort((a, b) => a - b);

    // Create sections from boundaries
    for (let i = 0; i < uniqueBoundaries.length - 1; i++) {
      const start = uniqueBoundaries[i];
      const end = uniqueBoundaries[i + 1];
      const content = text.slice(start, end).trim();

      if (content.length > 20) { // Minimum content length
        sections.push({
          content,
          startPosition: start,
          endPosition: end
        });
      }
    }

    // If no clear sections found, create sections by paragraphs
    if (sections.length === 0) {
      const paragraphs = text.split(/\n\s*\n/);
      let position = 0;

      for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (trimmed.length > 50) {
          sections.push({
            content: trimmed,
            startPosition: position,
            endPosition: position + trimmed.length
          });
        }
        position += paragraph.length + 2; // Account for newlines
      }
    }

    return sections;
  }

  /**
   * Classify a single section
   */
  private classifySection(content: string): {
    type: DPRSection['type'];
    confidence: number;
  } {
    const scores: Record<DPRSection['type'], number> = {
      EXECUTIVE_SUMMARY: 0,
      COST_ESTIMATE: 0,
      TIMELINE: 0,
      RESOURCES: 0,
      TECHNICAL_SPECS: 0
    };

    const lowerContent = content.toLowerCase();

    // Calculate scores for each section type
    for (const [sectionType, patterns] of Object.entries(this.sectionPatterns)) {
      const typeKey = sectionType as DPRSection['type'];
      let score = 0;

      // Check keywords
      for (const keyword of patterns.keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }

      // Check regex patterns
      for (const pattern of patterns.patterns) {
        if (pattern.test(content)) {
          score += 3;
        }
      }

      // Check context keywords
      for (const contextKeyword of patterns.contextKeywords) {
        if (lowerContent.includes(contextKeyword.toLowerCase())) {
          score += 1;
        }
      }

      // Position-based scoring (some sections are more likely at certain positions)
      score += this.getPositionalScore(typeKey, content);

      scores[typeKey] = score;
    }

    // Find the highest scoring section type
    const maxScore = Math.max(...Object.values(scores));
    const bestType = Object.keys(scores).find(
      key => scores[key as DPRSection['type']] === maxScore
    ) as DPRSection['type'];

    // Calculate confidence based on score and content analysis
    const confidence = this.calculateSectionConfidence(maxScore, content, bestType);

    return {
      type: bestType,
      confidence
    };
  }

  /**
   * Get positional score bonus for section types
   */
  private getPositionalScore(sectionType: DPRSection['type'], content: string): number {
    const contentLength = content.length;
    
    // Executive summary is often at the beginning
    if (sectionType === 'EXECUTIVE_SUMMARY' && contentLength < 1000) {
      return 1;
    }

    // Cost estimates often contain numbers and currency
    if (sectionType === 'COST_ESTIMATE') {
      const hasNumbers = /\d+/.test(content);
      const hasCurrency = /(?:rs|₹|rupees|lakh|crore)/i.test(content);
      return (hasNumbers ? 1 : 0) + (hasCurrency ? 2 : 0);
    }

    // Timeline sections often contain time-related terms
    if (sectionType === 'TIMELINE') {
      const hasTimeTerms = /(?:month|year|week|day|phase|milestone)/i.test(content);
      return hasTimeTerms ? 1 : 0;
    }

    return 0;
  }

  /**
   * Calculate confidence for a section classification
   */
  private calculateSectionConfidence(
    score: number, 
    content: string, 
    sectionType: DPRSection['type']
  ): number {
    let confidence = Math.min(score / 10, 1.0); // Base confidence from score

    // Adjust based on content length
    const contentLength = content.length;
    if (contentLength > 100) confidence += 0.1;
    if (contentLength > 500) confidence += 0.1;

    // Adjust based on section-specific characteristics
    if (sectionType === 'COST_ESTIMATE' && /\d+/.test(content)) {
      confidence += 0.2;
    }

    if (sectionType === 'TIMELINE' && /(?:month|year|phase)/i.test(content)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Resolve overlapping sections by keeping the highest confidence ones
   */
  private resolveOverlaps(sections: DPRSection[]): DPRSection[] {
    const sortedSections = [...sections].sort((a, b) => a.startPosition - b.startPosition);
    const resolvedSections: DPRSection[] = [];

    for (const section of sortedSections) {
      let hasOverlap = false;

      for (const existing of resolvedSections) {
        // Check for overlap
        if (this.sectionsOverlap(section, existing)) {
          hasOverlap = true;
          // Keep the section with higher confidence
          if (section.confidence > existing.confidence) {
            const index = resolvedSections.indexOf(existing);
            resolvedSections[index] = section;
          }
          break;
        }
      }

      if (!hasOverlap) {
        resolvedSections.push(section);
      }
    }

    return resolvedSections;
  }

  /**
   * Check if two sections overlap
   */
  private sectionsOverlap(section1: DPRSection, section2: DPRSection): boolean {
    return !(section1.endPosition <= section2.startPosition || 
             section2.endPosition <= section1.startPosition);
  }

  /**
   * Calculate overall confidence for all classified sections
   */
  private calculateOverallConfidence(sections: DPRSection[]): number {
    if (sections.length === 0) return 0;

    const totalConfidence = sections.reduce((sum, section) => sum + section.confidence, 0);
    const averageConfidence = totalConfidence / sections.length;

    // Bonus for having multiple different section types
    const uniqueTypes = new Set(sections.map(s => s.type));
    const diversityBonus = Math.min(uniqueTypes.size * 0.1, 0.3);

    return Math.min(averageConfidence + diversityBonus, 1.0);
  }

  /**
   * Get service health status
   */
  getHealthStatus(): { status: string; initialized: boolean; timestamp: Date } {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      initialized: this.isInitialized,
      timestamp: new Date()
    };
  }

  /**
   * Get supported section types
   */
  getSupportedSectionTypes(): DPRSection['type'][] {
    return ['EXECUTIVE_SUMMARY', 'COST_ESTIMATE', 'TIMELINE', 'RESOURCES', 'TECHNICAL_SPECS'];
  }
}