import { DPRSection, ExtractedEntity } from '@dpr-system/shared';

export interface DPRChecklist {
  id: string;
  name: string;
  version: string;
  sections: ChecklistSection[];
  totalWeight: number;
}

export interface ChecklistSection {
  id: string;
  name: string;
  type: 'EXECUTIVE_SUMMARY' | 'COST_ESTIMATE' | 'TIMELINE' | 'RESOURCES' | 'TECHNICAL_SPECS' | 'ENVIRONMENTAL' | 'LEGAL' | 'RISK_ASSESSMENT';
  weight: number;
  required: boolean;
  fields: ChecklistField[];
}

export interface ChecklistField {
  id: string;
  name: string;
  description: string;
  type: 'TEXT' | 'MONETARY' | 'DATE' | 'LOCATION' | 'RESOURCE' | 'PERCENTAGE' | 'BOOLEAN';
  required: boolean;
  weight: number;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  type: 'MIN_LENGTH' | 'MAX_LENGTH' | 'RANGE' | 'PATTERN' | 'REQUIRED_KEYWORDS';
  value: any;
  message: string;
}

export interface GapAnalysisResult {
  overallScore: number;
  completenessPercentage: number;
  sectionScores: SectionScore[];
  missingFields: MissingField[];
  incompleteFields: IncompleteField[];
  recommendations: string[];
  summary: GapAnalysisSummary;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  score: number;
  maxScore: number;
  completenessPercentage: number;
  present: boolean;
  fieldScores: FieldScore[];
}

export interface FieldScore {
  fieldId: string;
  fieldName: string;
  score: number;
  maxScore: number;
  present: boolean;
  confidence: number;
  extractedValue?: string;
  validationErrors: string[];
}

export interface MissingField {
  sectionId: string;
  sectionName: string;
  fieldId: string;
  fieldName: string;
  description: string;
  weight: number;
  required: boolean;
}

export interface IncompleteField {
  sectionId: string;
  sectionName: string;
  fieldId: string;
  fieldName: string;
  extractedValue: string;
  issues: string[];
  confidence: number;
}

export interface GapAnalysisSummary {
  totalSections: number;
  presentSections: number;
  missingSections: number;
  totalFields: number;
  presentFields: number;
  missingFields: number;
  incompleteFields: number;
  criticalIssues: number;
}

export class GapAnalysisService {
  private dprChecklist: DPRChecklist;

  constructor() {
    this.dprChecklist = this.getDefaultDPRChecklist();
  }

  /**
   * Perform comprehensive gap analysis on DPR content
   */
  async performGapAnalysis(
    sections: DPRSection[],
    entities: ExtractedEntity[],
    rawText: string
  ): Promise<GapAnalysisResult> {
    try {
      // Analyze each section against the checklist
      const sectionScores = await this.analyzeSections(sections, entities, rawText);
      
      // Calculate overall scores
      const overallScore = this.calculateOverallScore(sectionScores);
      const completenessPercentage = this.calculateCompletenessPercentage(sectionScores);
      
      // Identify missing and incomplete fields
      const missingFields = this.identifyMissingFields(sectionScores);
      const incompleteFields = this.identifyIncompleteFields(sectionScores);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(sectionScores, missingFields, incompleteFields);
      
      // Create summary
      const summary = this.createSummary(sectionScores, missingFields, incompleteFields);

      return {
        overallScore,
        completenessPercentage,
        sectionScores,
        missingFields,
        incompleteFields,
        recommendations,
        summary
      };
    } catch (error) {
      throw new Error(`Gap analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze each section against checklist requirements
   */
  private async analyzeSections(
    sections: DPRSection[],
    entities: ExtractedEntity[],
    rawText: string
  ): Promise<SectionScore[]> {
    const sectionScores: SectionScore[] = [];

    for (const checklistSection of this.dprChecklist.sections) {
      // Find corresponding extracted section
      const extractedSection = sections.find(s => s.type === checklistSection.type);
      
      const sectionScore: SectionScore = {
        sectionId: checklistSection.id,
        sectionName: checklistSection.name,
        score: 0,
        maxScore: checklistSection.weight,
        completenessPercentage: 0,
        present: !!extractedSection,
        fieldScores: []
      };

      if (extractedSection) {
        // Analyze fields within the section
        sectionScore.fieldScores = await this.analyzeFields(
          checklistSection,
          extractedSection,
          entities,
          rawText
        );
        
        // Calculate section score
        sectionScore.score = sectionScore.fieldScores.reduce((sum, field) => sum + field.score, 0);
        sectionScore.completenessPercentage = (sectionScore.score / sectionScore.maxScore) * 100;
      } else {
        // Section is missing - create field scores with zero values
        sectionScore.fieldScores = checklistSection.fields.map(field => ({
          fieldId: field.id,
          fieldName: field.name,
          score: 0,
          maxScore: field.weight,
          present: false,
          confidence: 0,
          validationErrors: ['Section not found in document']
        }));
      }

      sectionScores.push(sectionScore);
    }

    return sectionScores;
  }

  /**
   * Analyze fields within a section
   */
  private async analyzeFields(
    checklistSection: ChecklistSection,
    extractedSection: DPRSection,
    entities: ExtractedEntity[],
    rawText: string
  ): Promise<FieldScore[]> {
    const fieldScores: FieldScore[] = [];

    for (const field of checklistSection.fields) {
      const fieldScore: FieldScore = {
        fieldId: field.id,
        fieldName: field.name,
        score: 0,
        maxScore: field.weight,
        present: false,
        confidence: 0,
        validationErrors: []
      };

      // Try to find field content in the section
      const fieldContent = await this.extractFieldContent(
        field,
        extractedSection,
        entities,
        rawText
      );

      if (fieldContent) {
        fieldScore.present = true;
        fieldScore.extractedValue = fieldContent.value;
        fieldScore.confidence = fieldContent.confidence;

        // Validate field content
        const validationResult = this.validateFieldContent(field, fieldContent.value);
        fieldScore.validationErrors = validationResult.errors;

        // Calculate score based on presence, confidence, and validation
        fieldScore.score = this.calculateFieldScore(
          field,
          fieldContent.confidence,
          validationResult.isValid
        );
      } else {
        fieldScore.validationErrors.push('Field content not found or extracted');
      }

      fieldScores.push(fieldScore);
    }

    return fieldScores;
  }

  /**
   * Extract content for a specific field from section and entities
   */
  private async extractFieldContent(
    field: ChecklistField,
    section: DPRSection,
    entities: ExtractedEntity[],
    rawText: string
  ): Promise<{ value: string; confidence: number } | null> {
    // Create search patterns based on field type and name
    const searchPatterns = this.createFieldSearchPatterns(field);
    
    // First, try to find content in relevant entities
    const relevantEntities = entities.filter(entity => {
      return this.isEntityRelevantToField(entity, field);
    });

    if (relevantEntities.length > 0) {
      // Use the entity with highest confidence
      const bestEntity = relevantEntities.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return {
        value: bestEntity.value,
        confidence: bestEntity.confidence
      };
    }

    // If no relevant entities found, search in section content
    const sectionContent = section.content.toLowerCase();
    
    for (const pattern of searchPatterns) {
      const match = sectionContent.match(pattern);
      if (match) {
        const extractedValue = match[1] || match[0];
        return {
          value: extractedValue.trim(),
          confidence: section.confidence * 0.8 // Slightly lower confidence for pattern matching
        };
      }
    }

    // Last resort: check if field keywords exist in section
    const fieldKeywords = this.getFieldKeywords(field);
    const hasKeywords = fieldKeywords.some(keyword => 
      sectionContent.includes(keyword.toLowerCase())
    );

    if (hasKeywords) {
      return {
        value: 'Present (keywords found)',
        confidence: 0.5 // Low confidence for keyword-only matches
      };
    }

    return null;
  }

  /**
   * Create search patterns for field extraction
   */
  private createFieldSearchPatterns(field: ChecklistField): RegExp[] {
    const patterns: RegExp[] = [];
    const fieldName = field.name.toLowerCase();

    switch (field.type) {
      case 'MONETARY':
        patterns.push(
          new RegExp(`${fieldName}[:\\s]*(?:rs\\.?\\s*|₹\\s*|inr\\s*)([\\d,\\.]+(?:\\s*(?:lakh|crore|thousand))?)`,'gi'),
          /(?:cost|budget|amount|estimate|price)[:\s]*(?:rs\.?\s*|₹\s*|inr\s*)([\d,\.]+(?:\s*(?:lakh|crore|thousand))?)/gi
        );
        break;
      
      case 'DATE':
        patterns.push(
          new RegExp(`${fieldName}[:\\s]*([\\d]{1,2}[/\\-][\\d]{1,2}[/\\-][\\d]{2,4})`,'gi'),
          new RegExp(`${fieldName}[:\\s]*([a-z]+\\s+[\\d]{1,2},?\\s+[\\d]{4})`,'gi')
        );
        break;
      
      case 'LOCATION':
        patterns.push(
          new RegExp(`${fieldName}[:\\s]*([a-z\\s,]+(?:district|state|city|village))`,'gi'),
          /(?:location|site|address)[:\s]*([a-z\s,]+)/gi
        );
        break;
      
      case 'RESOURCE':
        patterns.push(
          new RegExp(`${fieldName}[:\\s]*([\\d]+\\s*[a-z]+)`,'gi'),
          /(?:resource|manpower|equipment)[:\s]*([a-z\d\s,]+)/gi
        );
        break;
      
      case 'PERCENTAGE':
        patterns.push(
          new RegExp(`${fieldName}[:\\s]*([\\d\\.]+\\s*%)`,'gi')
        );
        break;
      
      default:
        patterns.push(
          new RegExp(`${fieldName}[:\\s]*([^\\n\\.]{10,200})`,'gi')
        );
    }

    return patterns;
  }

  /**
   * Check if an entity is relevant to a field
   */
  private isEntityRelevantToField(entity: ExtractedEntity, field: ChecklistField): boolean {
    // Direct type matching
    if (entity.type === field.type) {
      return true;
    }

    // Cross-type relevance
    const fieldNameLower = field.name.toLowerCase();
    const entityValueLower = entity.value.toLowerCase();

    // Check for keyword matches
    const fieldKeywords = this.getFieldKeywords(field);
    return fieldKeywords.some(keyword => 
      entityValueLower.includes(keyword.toLowerCase()) ||
      fieldNameLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Get relevant keywords for a field
   */
  private getFieldKeywords(field: ChecklistField): string[] {
    const keywords: string[] = [field.name];
    
    // Add type-specific keywords
    switch (field.type) {
      case 'MONETARY':
        keywords.push('cost', 'budget', 'amount', 'price', 'estimate', 'fund');
        break;
      case 'DATE':
        keywords.push('date', 'timeline', 'schedule', 'deadline', 'start', 'end');
        break;
      case 'LOCATION':
        keywords.push('location', 'site', 'address', 'place', 'area');
        break;
      case 'RESOURCE':
        keywords.push('resource', 'manpower', 'equipment', 'material', 'staff');
        break;
    }

    return keywords;
  }

  /**
   * Validate field content against rules
   */
  private validateFieldContent(field: ChecklistField, value: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!field.validationRules) {
      return { isValid: true, errors };
    }

    for (const rule of field.validationRules) {
      switch (rule.type) {
        case 'MIN_LENGTH':
          if (value.length < rule.value) {
            errors.push(`${rule.message || 'Content too short'} (minimum ${rule.value} characters)`);
          }
          break;
        
        case 'MAX_LENGTH':
          if (value.length > rule.value) {
            errors.push(`${rule.message || 'Content too long'} (maximum ${rule.value} characters)`);
          }
          break;
        
        case 'PATTERN':
          const pattern = new RegExp(rule.value);
          if (!pattern.test(value)) {
            errors.push(rule.message || 'Content does not match required pattern');
          }
          break;
        
        case 'REQUIRED_KEYWORDS':
          const keywords = Array.isArray(rule.value) ? rule.value : [rule.value];
          const hasAllKeywords = keywords.every(keyword => 
            value.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasAllKeywords) {
            errors.push(`${rule.message || 'Missing required keywords'}: ${keywords.join(', ')}`);
          }
          break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculate score for a field
   */
  private calculateFieldScore(field: ChecklistField, confidence: number, isValid: boolean): number {
    let score = 0;
    
    // Base score for presence
    score += field.weight * 0.5;
    
    // Confidence-based score
    score += field.weight * 0.3 * confidence;
    
    // Validation-based score
    if (isValid) {
      score += field.weight * 0.2;
    }

    return Math.min(score, field.weight);
  }

  /**
   * Calculate overall score across all sections
   */
  private calculateOverallScore(sectionScores: SectionScore[]): number {
    const totalScore = sectionScores.reduce((sum, section) => sum + section.score, 0);
    const maxScore = sectionScores.reduce((sum, section) => sum + section.maxScore, 0);
    
    return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  }

  /**
   * Calculate completeness percentage
   */
  private calculateCompletenessPercentage(sectionScores: SectionScore[]): number {
    const presentFields = sectionScores.reduce((sum, section) => 
      sum + section.fieldScores.filter(field => field.present).length, 0
    );
    const totalFields = sectionScores.reduce((sum, section) => 
      sum + section.fieldScores.length, 0
    );
    
    return totalFields > 0 ? (presentFields / totalFields) * 100 : 0;
  }

  /**
   * Identify missing fields
   */
  private identifyMissingFields(sectionScores: SectionScore[]): MissingField[] {
    const missingFields: MissingField[] = [];

    for (const section of sectionScores) {
      for (const fieldScore of section.fieldScores) {
        if (!fieldScore.present) {
          const checklistSection = this.dprChecklist.sections.find(s => s.id === section.sectionId);
          const checklistField = checklistSection?.fields.find(f => f.id === fieldScore.fieldId);
          
          if (checklistField) {
            missingFields.push({
              sectionId: section.sectionId,
              sectionName: section.sectionName,
              fieldId: fieldScore.fieldId,
              fieldName: fieldScore.fieldName,
              description: checklistField.description,
              weight: checklistField.weight,
              required: checklistField.required
            });
          }
        }
      }
    }

    return missingFields;
  }

  /**
   * Identify incomplete fields
   */
  private identifyIncompleteFields(sectionScores: SectionScore[]): IncompleteField[] {
    const incompleteFields: IncompleteField[] = [];

    for (const section of sectionScores) {
      for (const fieldScore of section.fieldScores) {
        if (fieldScore.present && (fieldScore.validationErrors.length > 0 || fieldScore.confidence < 0.7)) {
          incompleteFields.push({
            sectionId: section.sectionId,
            sectionName: section.sectionName,
            fieldId: fieldScore.fieldId,
            fieldName: fieldScore.fieldName,
            extractedValue: fieldScore.extractedValue || '',
            issues: fieldScore.validationErrors,
            confidence: fieldScore.confidence
          });
        }
      }
    }

    return incompleteFields;
  }

  /**
   * Generate recommendations for improvement
   */
  private generateRecommendations(
    sectionScores: SectionScore[],
    missingFields: MissingField[],
    incompleteFields: IncompleteField[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations for missing sections
    const missingSections = sectionScores.filter(s => !s.present);
    if (missingSections.length > 0) {
      recommendations.push(
        `Add missing sections: ${missingSections.map(s => s.sectionName).join(', ')}`
      );
    }

    // Recommendations for critical missing fields
    const criticalMissingFields = missingFields.filter(f => f.required);
    if (criticalMissingFields.length > 0) {
      recommendations.push(
        `Include critical missing information: ${criticalMissingFields.map(f => f.fieldName).join(', ')}`
      );
    }

    // Recommendations for incomplete fields
    if (incompleteFields.length > 0) {
      recommendations.push(
        `Improve quality of: ${incompleteFields.map(f => f.fieldName).join(', ')}`
      );
    }

    // Section-specific recommendations
    for (const section of sectionScores) {
      if (section.completenessPercentage < 50) {
        recommendations.push(
          `Enhance ${section.sectionName} section - currently ${section.completenessPercentage.toFixed(1)}% complete`
        );
      }
    }

    return recommendations;
  }

  /**
   * Create analysis summary
   */
  private createSummary(
    sectionScores: SectionScore[],
    missingFields: MissingField[],
    incompleteFields: IncompleteField[]
  ): GapAnalysisSummary {
    const totalSections = sectionScores.length;
    const presentSections = sectionScores.filter(s => s.present).length;
    const totalFields = sectionScores.reduce((sum, s) => sum + s.fieldScores.length, 0);
    const presentFields = sectionScores.reduce((sum, s) => 
      sum + s.fieldScores.filter(f => f.present).length, 0
    );
    const criticalIssues = missingFields.filter(f => f.required).length + 
                          incompleteFields.filter(f => f.confidence < 0.5).length;

    return {
      totalSections,
      presentSections,
      missingSections: totalSections - presentSections,
      totalFields,
      presentFields,
      missingFields: missingFields.length,
      incompleteFields: incompleteFields.length,
      criticalIssues
    };
  }

  /**
   * Get default DPR checklist template
   */
  private getDefaultDPRChecklist(): DPRChecklist {
    return {
      id: 'dpr-northeast-india-v1',
      name: 'Northeast India DPR Checklist',
      version: '1.0',
      totalWeight: 100,
      sections: [
        {
          id: 'executive-summary',
          name: 'Executive Summary',
          type: 'EXECUTIVE_SUMMARY',
          weight: 15,
          required: true,
          fields: [
            {
              id: 'project-title',
              name: 'Project Title',
              description: 'Clear and descriptive project title',
              type: 'TEXT',
              required: true,
              weight: 3,
              validationRules: [
                { type: 'MIN_LENGTH', value: 10, message: 'Project title should be descriptive' }
              ]
            },
            {
              id: 'project-objective',
              name: 'Project Objective',
              description: 'Clear statement of project objectives and goals',
              type: 'TEXT',
              required: true,
              weight: 4,
              validationRules: [
                { type: 'MIN_LENGTH', value: 50, message: 'Objective should be detailed' }
              ]
            },
            {
              id: 'total-cost',
              name: 'Total Project Cost',
              description: 'Overall project cost estimate',
              type: 'MONETARY',
              required: true,
              weight: 4
            },
            {
              id: 'project-duration',
              name: 'Project Duration',
              description: 'Expected project timeline',
              type: 'TEXT',
              required: true,
              weight: 2
            },
            {
              id: 'beneficiaries',
              name: 'Target Beneficiaries',
              description: 'Number and type of beneficiaries',
              type: 'TEXT',
              required: true,
              weight: 2
            }
          ]
        },
        {
          id: 'cost-estimate',
          name: 'Cost Estimate',
          type: 'COST_ESTIMATE',
          weight: 25,
          required: true,
          fields: [
            {
              id: 'detailed-cost-breakdown',
              name: 'Detailed Cost Breakdown',
              description: 'Item-wise cost breakdown with quantities',
              type: 'MONETARY',
              required: true,
              weight: 10,
              validationRules: [
                { type: 'REQUIRED_KEYWORDS', value: ['material', 'labor', 'equipment'], message: 'Should include major cost categories' }
              ]
            },
            {
              id: 'contingency-provision',
              name: 'Contingency Provision',
              description: 'Contingency amount and percentage',
              type: 'MONETARY',
              required: true,
              weight: 3
            },
            {
              id: 'price-escalation',
              name: 'Price Escalation',
              description: 'Provision for price escalation',
              type: 'PERCENTAGE',
              required: true,
              weight: 3
            },
            {
              id: 'funding-sources',
              name: 'Funding Sources',
              description: 'Sources of project funding',
              type: 'TEXT',
              required: true,
              weight: 5
            },
            {
              id: 'cost-comparison',
              name: 'Cost Comparison',
              description: 'Comparison with similar projects',
              type: 'TEXT',
              required: false,
              weight: 4
            }
          ]
        },
        {
          id: 'timeline',
          name: 'Project Timeline',
          type: 'TIMELINE',
          weight: 15,
          required: true,
          fields: [
            {
              id: 'start-date',
              name: 'Project Start Date',
              description: 'Proposed project commencement date',
              type: 'DATE',
              required: true,
              weight: 3
            },
            {
              id: 'completion-date',
              name: 'Project Completion Date',
              description: 'Expected project completion date',
              type: 'DATE',
              required: true,
              weight: 3
            },
            {
              id: 'milestone-schedule',
              name: 'Milestone Schedule',
              description: 'Key project milestones with dates',
              type: 'TEXT',
              required: true,
              weight: 5,
              validationRules: [
                { type: 'REQUIRED_KEYWORDS', value: ['milestone', 'phase'], message: 'Should include project phases' }
              ]
            },
            {
              id: 'critical-path',
              name: 'Critical Path Activities',
              description: 'Activities on the critical path',
              type: 'TEXT',
              required: false,
              weight: 4
            }
          ]
        },
        {
          id: 'resources',
          name: 'Resource Requirements',
          type: 'RESOURCES',
          weight: 20,
          required: true,
          fields: [
            {
              id: 'human-resources',
              name: 'Human Resources',
              description: 'Manpower requirements by category',
              type: 'RESOURCE',
              required: true,
              weight: 6
            },
            {
              id: 'material-resources',
              name: 'Material Resources',
              description: 'Major materials and quantities',
              type: 'RESOURCE',
              required: true,
              weight: 6
            },
            {
              id: 'equipment-machinery',
              name: 'Equipment and Machinery',
              description: 'Required equipment and machinery',
              type: 'RESOURCE',
              required: true,
              weight: 4
            },
            {
              id: 'infrastructure-facilities',
              name: 'Infrastructure Facilities',
              description: 'Required infrastructure and facilities',
              type: 'TEXT',
              required: true,
              weight: 4
            }
          ]
        },
        {
          id: 'technical-specs',
          name: 'Technical Specifications',
          type: 'TECHNICAL_SPECS',
          weight: 15,
          required: true,
          fields: [
            {
              id: 'technical-standards',
              name: 'Technical Standards',
              description: 'Applicable technical standards and codes',
              type: 'TEXT',
              required: true,
              weight: 4
            },
            {
              id: 'design-parameters',
              name: 'Design Parameters',
              description: 'Key design parameters and specifications',
              type: 'TEXT',
              required: true,
              weight: 5
            },
            {
              id: 'quality-specifications',
              name: 'Quality Specifications',
              description: 'Quality requirements and testing procedures',
              type: 'TEXT',
              required: true,
              weight: 3
            },
            {
              id: 'location-details',
              name: 'Location Details',
              description: 'Detailed project location with coordinates',
              type: 'LOCATION',
              required: true,
              weight: 3
            }
          ]
        },
        {
          id: 'environmental',
          name: 'Environmental Considerations',
          type: 'ENVIRONMENTAL',
          weight: 5,
          required: false,
          fields: [
            {
              id: 'environmental-clearance',
              name: 'Environmental Clearance',
              description: 'Environmental clearance requirements and status',
              type: 'TEXT',
              required: false,
              weight: 3
            },
            {
              id: 'mitigation-measures',
              name: 'Mitigation Measures',
              description: 'Environmental mitigation measures',
              type: 'TEXT',
              required: false,
              weight: 2
            }
          ]
        },
        {
          id: 'risk-assessment',
          name: 'Risk Assessment',
          type: 'RISK_ASSESSMENT',
          weight: 5,
          required: false,
          fields: [
            {
              id: 'identified-risks',
              name: 'Identified Risks',
              description: 'Major project risks and their assessment',
              type: 'TEXT',
              required: false,
              weight: 3
            },
            {
              id: 'mitigation-strategies',
              name: 'Risk Mitigation Strategies',
              description: 'Strategies to mitigate identified risks',
              type: 'TEXT',
              required: false,
              weight: 2
            }
          ]
        }
      ]
    };
  }

  /**
   * Update checklist template (for customization)
   */
  updateChecklist(checklist: DPRChecklist): void {
    this.dprChecklist = checklist;
  }

  /**
   * Get current checklist template
   */
  getChecklist(): DPRChecklist {
    return this.dprChecklist;
  }
}