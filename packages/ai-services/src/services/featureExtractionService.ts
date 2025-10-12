import { DPRSection, ExtractedEntity } from '@dpr-system/shared';
import { EntityExtractionService, EntityExtractionResult } from './entityExtractionService.js';
import { GapAnalysisService, GapAnalysisResult } from './gapAnalysisService.js';

export interface FeatureExtractionResult {
  entities: EntityExtractionResult;
  gapAnalysis: GapAnalysisResult;
  metadata: FeatureMetadata;
  searchableContent: SearchableContent;
}

export interface FeatureMetadata {
  processingTime: number;
  confidence: number;
  extractedFeatures: {
    totalEntities: number;
    monetaryEntities: number;
    dateEntities: number;
    locationEntities: number;
    resourceEntities: number;
  };
  completenessMetrics: {
    overallScore: number;
    completenessPercentage: number;
    criticalIssues: number;
    missingRequiredFields: number;
  };
}

export interface SearchableContent {
  keywords: string[];
  tags: string[];
  summary: string;
  indexableFields: IndexableField[];
}

export interface IndexableField {
  name: string;
  value: string;
  type: 'TEXT' | 'MONETARY' | 'DATE' | 'LOCATION' | 'RESOURCE';
  confidence: number;
  searchWeight: number;
}

/**
 * Comprehensive feature extraction service that combines entity extraction
 * and gap analysis to provide complete DPR assessment
 */
export class FeatureExtractionService {
  private entityExtractionService: EntityExtractionService;
  private gapAnalysisService: GapAnalysisService;

  constructor() {
    this.entityExtractionService = new EntityExtractionService();
    this.gapAnalysisService = new GapAnalysisService();
  }

  /**
   * Perform comprehensive feature extraction and analysis
   */
  async extractFeatures(
    sections: DPRSection[],
    rawText: string
  ): Promise<FeatureExtractionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Extract entities from the raw text
      const entityResult = await this.entityExtractionService.extractEntities(rawText);

      // Step 2: Perform gap analysis using sections and extracted entities
      const gapAnalysisResult = await this.gapAnalysisService.performGapAnalysis(
        sections,
        entityResult.entities,
        rawText
      );

      // Step 3: Generate comprehensive metadata
      const metadata = await this.generateFeatureMetadata(
        entityResult,
        gapAnalysisResult,
        Date.now() - startTime
      );

      // Step 4: Create searchable content
      const searchableContent = await this.generateSearchableContent(
        sections,
        entityResult.entities,
        gapAnalysisResult,
        rawText
      );

      return {
        entities: entityResult,
        gapAnalysis: gapAnalysisResult,
        metadata,
        searchableContent
      };
    } catch (error) {
      throw new Error(`Feature extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract features from specific sections only
   */
  async extractFeaturesFromSections(
    sections: DPRSection[],
    sectionTypes: DPRSection['type'][]
  ): Promise<FeatureExtractionResult> {
    // Filter sections to only include specified types
    const filteredSections = sections.filter(section => 
      sectionTypes.includes(section.type)
    );

    // Combine content from filtered sections
    const combinedText = filteredSections.map(s => s.content).join('\n\n');

    return this.extractFeatures(filteredSections, combinedText);
  }

  /**
   * Generate enhanced metadata from extraction results
   */
  private async generateFeatureMetadata(
    entityResult: EntityExtractionResult,
    gapAnalysisResult: GapAnalysisResult,
    processingTime: number
  ): Promise<FeatureMetadata> {
    const entities = entityResult.entities;
    
    // Count entities by type
    const monetaryEntities = entities.filter(e => e.type === 'MONETARY').length;
    const dateEntities = entities.filter(e => e.type === 'DATE').length;
    const locationEntities = entities.filter(e => e.type === 'LOCATION').length;
    const resourceEntities = entities.filter(e => e.type === 'RESOURCE').length;

    // Calculate overall confidence
    const overallConfidence = entities.length > 0 
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length 
      : 0;

    // Count missing required fields
    const missingRequiredFields = gapAnalysisResult.missingFields.filter(f => f.required).length;

    return {
      processingTime,
      confidence: (overallConfidence + gapAnalysisResult.overallScore / 100) / 2,
      extractedFeatures: {
        totalEntities: entities.length,
        monetaryEntities,
        dateEntities,
        locationEntities,
        resourceEntities
      },
      completenessMetrics: {
        overallScore: gapAnalysisResult.overallScore,
        completenessPercentage: gapAnalysisResult.completenessPercentage,
        criticalIssues: gapAnalysisResult.summary.criticalIssues,
        missingRequiredFields
      }
    };
  }

  /**
   * Generate searchable content for indexing
   */
  private async generateSearchableContent(
    sections: DPRSection[],
    entities: ExtractedEntity[],
    gapAnalysisResult: GapAnalysisResult,
    rawText: string
  ): Promise<SearchableContent> {
    // Generate keywords from entities and content
    const keywords = await this.generateSearchKeywords(entities, rawText, sections);
    
    // Generate tags based on analysis results
    const tags = this.generateContentTags(gapAnalysisResult, entities);
    
    // Create summary
    const summary = this.generateContentSummary(sections, gapAnalysisResult);
    
    // Create indexable fields
    const indexableFields = this.createIndexableFields(entities, sections);

    return {
      keywords,
      tags,
      summary,
      indexableFields
    };
  }

  /**
   * Generate comprehensive search keywords
   */
  private async generateSearchKeywords(
    entities: ExtractedEntity[],
    rawText: string,
    sections: DPRSection[]
  ): Promise<string[]> {
    const keywords = new Set<string>();

    // Add entity values as keywords
    entities.forEach(entity => {
      const words = entity.value.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2 && !this.isStopWord(word)) {
          keywords.add(word);
        }
      });
    });

    // Add section-specific keywords
    sections.forEach(section => {
      const sectionKeywords = this.extractSectionKeywords(section);
      sectionKeywords.forEach(keyword => keywords.add(keyword));
    });

    // Add domain-specific keywords
    const domainKeywords = this.extractDomainKeywords(rawText);
    domainKeywords.forEach(keyword => keywords.add(keyword));

    return Array.from(keywords).slice(0, 100); // Limit to 100 keywords
  }

  /**
   * Extract keywords from a section
   */
  private extractSectionKeywords(section: DPRSection): string[] {
    const keywords: string[] = [];
    const content = section.content.toLowerCase();

    // Section type specific keywords
    switch (section.type) {
      case 'EXECUTIVE_SUMMARY':
        keywords.push('project', 'objective', 'summary', 'overview');
        break;
      case 'COST_ESTIMATE':
        keywords.push('cost', 'budget', 'estimate', 'financial', 'funding');
        break;
      case 'TIMELINE':
        keywords.push('timeline', 'schedule', 'duration', 'milestone', 'phase');
        break;
      case 'RESOURCES':
        keywords.push('resource', 'manpower', 'material', 'equipment', 'infrastructure');
        break;
      case 'TECHNICAL_SPECS':
        keywords.push('technical', 'specification', 'design', 'standard', 'quality');
        break;
    }

    // Extract important nouns and phrases
    const importantPatterns = [
      /\b(project|development|construction|infrastructure|highway|road|bridge|building)\b/gi,
      /\b(government|ministry|department|authority|agency)\b/gi,
      /\b(northeast|assam|manipur|meghalaya|mizoram|nagaland|tripura|sikkim)\b/gi,
      /\b(rural|urban|district|state|region|area|zone)\b/gi
    ];

    importantPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.push(match.toLowerCase()));
      }
    });

    return keywords;
  }

  /**
   * Extract domain-specific keywords
   */
  private extractDomainKeywords(text: string): string[] {
    const keywords: string[] = [];
    const textLower = text.toLowerCase();

    // Infrastructure and development keywords
    const infrastructureTerms = [
      'infrastructure', 'development', 'construction', 'engineering',
      'highway', 'road', 'bridge', 'building', 'facility', 'structure'
    ];

    // Government and policy keywords
    const governmentTerms = [
      'government', 'ministry', 'policy', 'scheme', 'program', 'initiative',
      'funding', 'allocation', 'budget', 'grant', 'subsidy'
    ];

    // Regional keywords
    const regionalTerms = [
      'northeast', 'northeastern', 'assam', 'manipur', 'meghalaya', 'mizoram',
      'nagaland', 'tripura', 'sikkim', 'guwahati', 'shillong', 'imphal'
    ];

    // Technical keywords
    const technicalTerms = [
      'specification', 'standard', 'quality', 'design', 'technical',
      'engineering', 'construction', 'material', 'equipment', 'machinery'
    ];

    [infrastructureTerms, governmentTerms, regionalTerms, technicalTerms].forEach(termList => {
      termList.forEach(term => {
        if (textLower.includes(term)) {
          keywords.push(term);
        }
      });
    });

    return keywords;
  }

  /**
   * Generate content tags based on analysis
   */
  private generateContentTags(gapAnalysisResult: GapAnalysisResult, entities: ExtractedEntity[]): string[] {
    const tags: string[] = [];

    // Completeness tags
    if (gapAnalysisResult.completenessPercentage >= 80) {
      tags.push('complete');
    } else if (gapAnalysisResult.completenessPercentage >= 60) {
      tags.push('mostly-complete');
    } else if (gapAnalysisResult.completenessPercentage >= 40) {
      tags.push('partially-complete');
    } else {
      tags.push('incomplete');
    }

    // Quality tags
    if (gapAnalysisResult.overallScore >= 80) {
      tags.push('high-quality');
    } else if (gapAnalysisResult.overallScore >= 60) {
      tags.push('good-quality');
    } else {
      tags.push('needs-improvement');
    }

    // Content type tags
    const monetaryEntities = entities.filter(e => e.type === 'MONETARY').length;
    const locationEntities = entities.filter(e => e.type === 'LOCATION').length;
    const dateEntities = entities.filter(e => e.type === 'DATE').length;

    if (monetaryEntities > 0) tags.push('has-cost-info');
    if (locationEntities > 0) tags.push('has-location-info');
    if (dateEntities > 0) tags.push('has-timeline-info');

    // Issue tags
    if (gapAnalysisResult.summary.criticalIssues > 0) {
      tags.push('has-critical-issues');
    }
    if (gapAnalysisResult.missingFields.length > 0) {
      tags.push('has-missing-fields');
    }

    // Section presence tags
    const presentSections = gapAnalysisResult.sectionScores.filter(s => s.present);
    presentSections.forEach(section => {
      tags.push(`has-${section.sectionId}`);
    });

    return tags;
  }

  /**
   * Generate content summary
   */
  private generateContentSummary(sections: DPRSection[], gapAnalysisResult: GapAnalysisResult): string {
    const summaryParts: string[] = [];

    // Basic info
    summaryParts.push(`DPR with ${sections.length} sections`);
    summaryParts.push(`${gapAnalysisResult.completenessPercentage.toFixed(1)}% complete`);
    summaryParts.push(`Overall score: ${gapAnalysisResult.overallScore.toFixed(1)}/100`);

    // Issues summary
    if (gapAnalysisResult.summary.criticalIssues > 0) {
      summaryParts.push(`${gapAnalysisResult.summary.criticalIssues} critical issues`);
    }
    if (gapAnalysisResult.missingFields.length > 0) {
      summaryParts.push(`${gapAnalysisResult.missingFields.length} missing fields`);
    }

    // Present sections
    const presentSections = gapAnalysisResult.sectionScores
      .filter(s => s.present)
      .map(s => s.sectionName);
    
    if (presentSections.length > 0) {
      summaryParts.push(`Includes: ${presentSections.join(', ')}`);
    }

    return summaryParts.join('. ');
  }

  /**
   * Create indexable fields for search
   */
  private createIndexableFields(entities: ExtractedEntity[], sections: DPRSection[]): IndexableField[] {
    const indexableFields: IndexableField[] = [];

    // Add entity-based fields
    entities.forEach(entity => {
      indexableFields.push({
        name: `${entity.type.toLowerCase()}_entity`,
        value: entity.value,
        type: entity.type as any,
        confidence: entity.confidence,
        searchWeight: this.calculateSearchWeight(entity.type, entity.confidence)
      });
    });

    // Add section-based fields
    sections.forEach(section => {
      indexableFields.push({
        name: `${section.type.toLowerCase()}_content`,
        value: section.content.substring(0, 500), // Limit content length
        type: 'TEXT',
        confidence: section.confidence,
        searchWeight: this.calculateSectionSearchWeight(section.type, section.confidence)
      });
    });

    return indexableFields;
  }

  /**
   * Calculate search weight for entities
   */
  private calculateSearchWeight(entityType: string, confidence: number): number {
    const baseWeights = {
      'MONETARY': 0.9,
      'DATE': 0.8,
      'LOCATION': 0.85,
      'RESOURCE': 0.7
    };

    const baseWeight = (baseWeights as Record<string, number>)[entityType] || 0.5;
    return baseWeight * confidence;
  }

  /**
   * Calculate search weight for sections
   */
  private calculateSectionSearchWeight(sectionType: string, confidence: number): number {
    const baseWeights = {
      'EXECUTIVE_SUMMARY': 1.0,
      'COST_ESTIMATE': 0.9,
      'TIMELINE': 0.8,
      'RESOURCES': 0.7,
      'TECHNICAL_SPECS': 0.8
    };

    const baseWeight = (baseWeights as Record<string, number>)[sectionType] || 0.6;
    return baseWeight * confidence;
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return stopWords.has(word.toLowerCase());
  }

  /**
   * Get entity extraction service for direct access
   */
  getEntityExtractionService(): EntityExtractionService {
    return this.entityExtractionService;
  }

  /**
   * Get gap analysis service for direct access
   */
  getGapAnalysisService(): GapAnalysisService {
    return this.gapAnalysisService;
  }
}