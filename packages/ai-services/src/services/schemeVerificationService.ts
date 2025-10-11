import { 
  GovernmentScheme,
  SchemeGapAnalysis,
  SchemeVerificationRequest,
  SchemeVerificationResult,
  SchemeRecommendation
} from '../../../shared/src/types/index.js';

/**
 * Scheme Verification and Gap Analysis Service
 * Implements existing scheme reference validation
 * Builds missing scheme opportunity identification system
 * Creates scheme optimization recommendations
 */
export class SchemeVerificationService {
  private readonly VERIFICATION_CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_SUGGESTIONS = 10;

  /**
   * Verify existing scheme references in DPR documents
   * Implements existing scheme reference validation
   */
  async verifySchemeReferences(
    documentId: string,
    mentionedSchemes: string[],
    availableSchemes: GovernmentScheme[]
  ): Promise<{
    verifiedSchemes: GovernmentScheme[];
    unverifiedReferences: string[];
    suggestions: Array<{ reference: string; suggestedScheme: GovernmentScheme; confidence: number }>;
  }> {
    const verifiedSchemes: GovernmentScheme[] = [];
    const unverifiedReferences: string[] = [];
    const suggestions: Array<{ reference: string; suggestedScheme: GovernmentScheme; confidence: number }> = [];

    for (const mentionedScheme of mentionedSchemes) {
      const verificationResult = this.findMatchingScheme(mentionedScheme, availableSchemes);
      
      if (verificationResult.exactMatch) {
        verifiedSchemes.push(verificationResult.exactMatch);
      } else {
        unverifiedReferences.push(mentionedScheme);
        
        // Find potential matches for suggestions
        const potentialMatches = this.findPotentialMatches(mentionedScheme, availableSchemes);
        potentialMatches.forEach(match => {
          if (match.confidence >= this.VERIFICATION_CONFIDENCE_THRESHOLD) {
            suggestions.push({
              reference: mentionedScheme,
              suggestedScheme: match.scheme,
              confidence: match.confidence
            });
          }
        });
      }
    }

    return {
      verifiedSchemes,
      unverifiedReferences,
      suggestions: suggestions.slice(0, this.MAX_SUGGESTIONS)
    };
  }

  /**
   * Identify missing scheme opportunities
   * Builds missing scheme opportunity identification system
   */
  async identifyMissingOpportunities(
    documentId: string,
    projectDescription: string,
    projectSectors: string[],
    projectLocation: { state: string; district?: string },
    estimatedCost: number,
    existingSchemes: GovernmentScheme[],
    allAvailableSchemes: GovernmentScheme[]
  ): Promise<{
    missingOpportunities: GovernmentScheme[];
    opportunityAnalysis: Array<{
      scheme: GovernmentScheme;
      relevanceScore: number;
      potentialBenefit: string;
      implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
      timeToImplement: string;
    }>;
  }> {
    const existingSchemeIds = new Set(existingSchemes.map(s => s.id));
    
    // Filter out already identified schemes
    const candidateSchemes = allAvailableSchemes.filter(scheme => 
      !existingSchemeIds.has(scheme.id) && 
      scheme.status === 'ACTIVE'
    );

    // Analyze each candidate scheme for relevance
    const opportunityAnalysis = candidateSchemes.map(scheme => {
      const relevanceScore = this.calculateOpportunityRelevance(
        scheme,
        projectDescription,
        projectSectors,
        projectLocation,
        estimatedCost
      );

      return {
        scheme,
        relevanceScore,
        potentialBenefit: this.assessPotentialBenefit(scheme, estimatedCost),
        implementationComplexity: this.assessImplementationComplexity(scheme),
        timeToImplement: this.estimateImplementationTime(scheme)
      };
    })
    .filter(analysis => analysis.relevanceScore > 0.4) // Filter out low-relevance schemes
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const missingOpportunities = opportunityAnalysis
      .slice(0, 8) // Top 8 opportunities
      .map(analysis => analysis.scheme);

    return {
      missingOpportunities,
      opportunityAnalysis: opportunityAnalysis.slice(0, this.MAX_SUGGESTIONS)
    };
  }

  /**
   * Create comprehensive gap analysis
   */
  async performComprehensiveGapAnalysis(
    documentId: string,
    projectData: {
      description: string;
      sectors: string[];
      location: { state: string; district?: string };
      estimatedCost: number;
      targetBeneficiaries?: string[];
    },
    mentionedSchemes: string[],
    allAvailableSchemes: GovernmentScheme[]
  ): Promise<SchemeGapAnalysis> {
    // Verify existing scheme references
    const verificationResult = await this.verifySchemeReferences(
      documentId,
      mentionedSchemes,
      allAvailableSchemes
    );

    // Identify missing opportunities
    const opportunityResult = await this.identifyMissingOpportunities(
      documentId,
      projectData.description,
      projectData.sectors,
      projectData.location,
      projectData.estimatedCost,
      verificationResult.verifiedSchemes,
      allAvailableSchemes
    );

    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(
      verificationResult,
      opportunityResult,
      projectData
    );

    // Calculate completeness score
    const completenessScore = this.calculateGapCompleteness(
      mentionedSchemes.length,
      verificationResult.verifiedSchemes.length,
      opportunityResult.missingOpportunities.length,
      verificationResult.unverifiedReferences.length
    );

    // Determine gap severity
    const gapSeverity = this.determineGapSeverity(
      completenessScore,
      opportunityResult.missingOpportunities.length,
      verificationResult.unverifiedReferences.length
    );

    return {
      id: `gap_analysis_${documentId}_${Date.now()}`,
      documentId,
      existingSchemesMentioned: mentionedSchemes,
      verifiedSchemes: verificationResult.verifiedSchemes.map(s => s.schemeName),
      missingOpportunities: opportunityResult.missingOpportunities.map(s => s.schemeName),
      incorrectReferences: verificationResult.unverifiedReferences,
      optimizationSuggestions,
      completenessScore,
      gapSeverity,
      analysisTimestamp: new Date(),
      analysisVersion: '1.0',
      createdAt: new Date()
    };
  }

  /**
   * Generate scheme optimization recommendations
   * Creates scheme optimization recommendations
   */
  generateSchemeOptimizationRecommendations(
    gapAnalysis: SchemeGapAnalysis,
    projectData: {
      estimatedCost: number;
      sectors: string[];
      location: { state: string; district?: string };
    },
    availableSchemes: GovernmentScheme[]
  ): SchemeRecommendation[] {
    const recommendations: SchemeRecommendation[] = [];

    // Recommendations for incorrect references
    if (gapAnalysis.incorrectReferences.length > 0) {
      recommendations.push({
        type: 'SCHEME_VERIFICATION',
        priority: 'HIGH',
        recommendation: `Update or remove ${gapAnalysis.incorrectReferences.length} incorrect scheme references: ${gapAnalysis.incorrectReferences.slice(0, 3).join(', ')}${gapAnalysis.incorrectReferences.length > 3 ? '...' : ''}`,
        expectedBenefit: 'Prevents application delays and ensures accurate funding alignment',
        implementationSteps: [
          'Review each incorrect reference against current scheme databases',
          'Update DPR with correct scheme names and codes',
          'Verify current status and eligibility criteria',
          'Remove references to discontinued schemes'
        ],
        timeframe: '1-2 weeks'
      });
    }

    // Recommendations for missing opportunities
    if (gapAnalysis.missingOpportunities.length > 0) {
      const topMissingSchemes = availableSchemes
        .filter(scheme => gapAnalysis.missingOpportunities.includes(scheme.schemeName))
        .slice(0, 3);

      topMissingSchemes.forEach((scheme, index) => {
        const potentialFunding = this.estimatePotentialFunding(scheme, projectData.estimatedCost);
        
        recommendations.push({
          type: 'NEW_SCHEME',
          priority: index === 0 ? 'HIGH' : 'MEDIUM',
          scheme,
          recommendation: `Consider applying for ${scheme.schemeName} which aligns well with your project requirements`,
          expectedBenefit: potentialFunding 
            ? `Potential funding of ₹${potentialFunding.toLocaleString()}`
            : 'Additional funding support and implementation assistance',
          implementationSteps: [
            'Review scheme guidelines and eligibility criteria',
            'Prepare required documentation',
            'Submit application through appropriate channels',
            'Monitor application status'
          ],
          potentialFunding,
          timeframe: scheme.processingTimeDays 
            ? `${Math.ceil(scheme.processingTimeDays / 30)} months`
            : '3-6 months'
        });
      });
    }

    // Funding alignment recommendations
    const fundingGaps = this.identifyFundingGaps(gapAnalysis, projectData, availableSchemes);
    if (fundingGaps.totalGap > 0) {
      recommendations.push({
        type: 'FUNDING_ALIGNMENT',
        priority: 'MEDIUM',
        recommendation: `Address funding gap of ₹${fundingGaps.totalGap.toLocaleString()} through complementary schemes or project restructuring`,
        expectedBenefit: 'Ensures complete project funding and reduces financial risks',
        implementationSteps: [
          'Analyze project components for separate funding opportunities',
          'Explore state-level and private sector partnerships',
          'Consider phased implementation approach',
          'Review project scope for cost optimization'
        ],
        timeframe: '2-4 months'
      });
    }

    // General optimization recommendations
    if (gapAnalysis.completenessScore < 0.7) {
      recommendations.push({
        type: 'SCHEME_OPTIMIZATION',
        priority: 'MEDIUM',
        recommendation: 'Improve overall scheme alignment through comprehensive review and strategic planning',
        expectedBenefit: 'Enhanced funding success rate and reduced implementation risks',
        implementationSteps: [
          'Conduct detailed scheme mapping exercise',
          'Align project components with scheme objectives',
          'Strengthen project documentation and justification',
          'Establish monitoring and evaluation framework'
        ],
        timeframe: '3-4 weeks'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Private helper methods

  private findMatchingScheme(
    mentionedScheme: string,
    availableSchemes: GovernmentScheme[]
  ): { exactMatch?: GovernmentScheme; confidence: number } {
    const normalizedMention = mentionedScheme.toLowerCase().trim();

    // Try exact name match
    let exactMatch = availableSchemes.find(scheme => 
      scheme.schemeName.toLowerCase() === normalizedMention
    );

    if (exactMatch) {
      return { exactMatch, confidence: 1.0 };
    }

    // Try scheme code match
    exactMatch = availableSchemes.find(scheme => 
      scheme.schemeCode?.toLowerCase() === normalizedMention
    );

    if (exactMatch) {
      return { exactMatch, confidence: 1.0 };
    }

    // Try partial name match with high confidence
    exactMatch = availableSchemes.find(scheme => {
      const schemeName = scheme.schemeName.toLowerCase();
      return schemeName.includes(normalizedMention) || normalizedMention.includes(schemeName);
    });

    if (exactMatch) {
      const similarity = this.calculateStringSimilarity(normalizedMention, exactMatch.schemeName.toLowerCase());
      if (similarity > 0.8) {
        return { exactMatch, confidence: similarity };
      }
    }

    return { confidence: 0 };
  }

  private findPotentialMatches(
    mentionedScheme: string,
    availableSchemes: GovernmentScheme[]
  ): Array<{ scheme: GovernmentScheme; confidence: number }> {
    const normalizedMention = mentionedScheme.toLowerCase().trim();
    const potentialMatches: Array<{ scheme: GovernmentScheme; confidence: number }> = [];

    for (const scheme of availableSchemes) {
      const nameScore = this.calculateStringSimilarity(normalizedMention, scheme.schemeName.toLowerCase());
      const keywordScore = this.calculateKeywordOverlap(normalizedMention, scheme.keywords);
      const descriptionScore = this.calculateStringSimilarity(normalizedMention, scheme.description.toLowerCase()) * 0.5;

      const overallConfidence = Math.max(nameScore, keywordScore * 0.8, descriptionScore);

      if (overallConfidence > 0.3) {
        potentialMatches.push({ scheme, confidence: overallConfidence });
      }
    }

    return potentialMatches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private calculateOpportunityRelevance(
    scheme: GovernmentScheme,
    projectDescription: string,
    projectSectors: string[],
    projectLocation: { state: string; district?: string },
    estimatedCost: number
  ): number {
    let relevanceScore = 0;

    // Sector alignment (40% weight)
    const sectorAlignment = this.calculateSectorAlignment(projectSectors, scheme.applicableSectors);
    relevanceScore += sectorAlignment * 0.4;

    // Regional alignment (20% weight)
    const regionalAlignment = this.calculateRegionalAlignment(projectLocation, scheme.applicableRegions);
    relevanceScore += regionalAlignment * 0.2;

    // Funding alignment (20% weight)
    const fundingAlignment = this.calculateFundingAlignment(estimatedCost, scheme);
    relevanceScore += fundingAlignment * 0.2;

    // Description similarity (15% weight)
    const descriptionSimilarity = this.calculateDescriptionSimilarity(projectDescription, scheme);
    relevanceScore += descriptionSimilarity * 0.15;

    // Scheme status and verification (5% weight)
    const statusScore = scheme.status === 'ACTIVE' ? 1 : 0.5;
    const verificationScore = scheme.verificationStatus === 'VERIFIED' ? 1 : 0.8;
    relevanceScore += (statusScore * verificationScore) * 0.05;

    return Math.min(relevanceScore, 1);
  }

  private assessPotentialBenefit(scheme: GovernmentScheme, estimatedCost: number): string {
    const benefits: string[] = [];

    if (scheme.averageFundingAmount) {
      const percentage = Math.min((scheme.averageFundingAmount / estimatedCost) * 100, 100);
      benefits.push(`Up to ${percentage.toFixed(0)}% funding coverage`);
    } else if (scheme.fundingRangeMax) {
      const percentage = Math.min((scheme.fundingRangeMax / estimatedCost) * 100, 100);
      benefits.push(`Up to ${percentage.toFixed(0)}% funding coverage`);
    }

    if (scheme.successMetrics.length > 0) {
      benefits.push('Performance monitoring and evaluation support');
    }

    if (scheme.monitoringMechanism) {
      benefits.push('Implementation guidance and oversight');
    }

    return benefits.length > 0 ? benefits.join(', ') : 'Financial and implementation support';
  }

  private assessImplementationComplexity(scheme: GovernmentScheme): 'LOW' | 'MEDIUM' | 'HIGH' {
    let complexityScore = 0;

    // Documentation requirements
    if (scheme.requiredDocuments.length > 10) complexityScore += 2;
    else if (scheme.requiredDocuments.length > 5) complexityScore += 1;

    // Processing time
    if (scheme.processingTimeDays && scheme.processingTimeDays > 180) complexityScore += 2;
    else if (scheme.processingTimeDays && scheme.processingTimeDays > 90) complexityScore += 1;

    // Eligibility criteria complexity
    if (scheme.eligibilityCriteria.length > 8) complexityScore += 2;
    else if (scheme.eligibilityCriteria.length > 4) complexityScore += 1;

    // Application process complexity
    if (scheme.applicationProcess && scheme.applicationProcess.length > 500) complexityScore += 1;

    if (complexityScore >= 4) return 'HIGH';
    if (complexityScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private estimateImplementationTime(scheme: GovernmentScheme): string {
    if (scheme.processingTimeDays) {
      const months = Math.ceil(scheme.processingTimeDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }

    const complexity = this.assessImplementationComplexity(scheme);
    switch (complexity) {
      case 'LOW': return '2-3 months';
      case 'MEDIUM': return '4-6 months';
      case 'HIGH': return '6-12 months';
    }
  }

  private generateOptimizationSuggestions(
    verificationResult: any,
    opportunityResult: any,
    projectData: any
  ): string[] {
    const suggestions: string[] = [];

    if (verificationResult.unverifiedReferences.length > 0) {
      suggestions.push(`Update ${verificationResult.unverifiedReferences.length} incorrect scheme references to ensure accurate funding alignment`);
    }

    if (opportunityResult.missingOpportunities.length > 3) {
      suggestions.push(`Explore ${opportunityResult.missingOpportunities.length} additional funding opportunities to maximize project support`);
    }

    if (verificationResult.suggestions.length > 0) {
      suggestions.push('Consider suggested scheme alternatives for better alignment with project requirements');
    }

    const highValueOpportunities = opportunityResult.opportunityAnalysis.filter(
      (analysis: any) => analysis.relevanceScore > 0.7
    );
    if (highValueOpportunities.length > 0) {
      suggestions.push(`Prioritize ${highValueOpportunities.length} high-relevance schemes for immediate application`);
    }

    return suggestions;
  }

  private calculateGapCompleteness(
    mentionedCount: number,
    verifiedCount: number,
    missingCount: number,
    incorrectCount: number
  ): number {
    if (mentionedCount === 0) {
      return missingCount > 0 ? 0.2 : 0.8;
    }

    const accuracy = verifiedCount / mentionedCount;
    const coverage = verifiedCount / (verifiedCount + missingCount);
    const penalty = (incorrectCount / mentionedCount) * 0.3;

    return Math.max((accuracy * 0.6 + coverage * 0.4) - penalty, 0);
  }

  private determineGapSeverity(
    completenessScore: number,
    missingCount: number,
    incorrectCount: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (completenessScore > 0.8 && missingCount <= 2 && incorrectCount === 0) return 'LOW';
    if (completenessScore > 0.6 && missingCount <= 4 && incorrectCount <= 1) return 'MEDIUM';
    if (completenessScore > 0.3 && missingCount <= 6 && incorrectCount <= 3) return 'HIGH';
    return 'CRITICAL';
  }

  private identifyFundingGaps(
    gapAnalysis: SchemeGapAnalysis,
    projectData: { estimatedCost: number },
    availableSchemes: GovernmentScheme[]
  ): { totalGap: number; coveredAmount: number } {
    const verifiedSchemes = availableSchemes.filter(scheme => 
      gapAnalysis.verifiedSchemes.includes(scheme.schemeName)
    );

    const totalPotentialFunding = verifiedSchemes.reduce((sum, scheme) => {
      return sum + (scheme.averageFundingAmount || scheme.fundingRangeMax || 0);
    }, 0);

    const coveredAmount = Math.min(totalPotentialFunding, projectData.estimatedCost);
    const totalGap = Math.max(projectData.estimatedCost - coveredAmount, 0);

    return { totalGap, coveredAmount };
  }

  private estimatePotentialFunding(scheme: GovernmentScheme, estimatedCost: number): number | undefined {
    if (scheme.averageFundingAmount) {
      return Math.min(scheme.averageFundingAmount, estimatedCost);
    }
    
    if (scheme.fundingRangeMax) {
      return Math.min(scheme.fundingRangeMax, estimatedCost);
    }
    
    return undefined;
  }

  // Utility methods for similarity calculations

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateKeywordOverlap(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;
    
    const textWords = text.toLowerCase().split(/\s+/);
    const matchingKeywords = keywords.filter(keyword => 
      textWords.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))
    );
    
    return matchingKeywords.length / keywords.length;
  }

  private calculateSectorAlignment(projectSectors: string[], schemeSectors: string[]): number {
    if (projectSectors.length === 0 || schemeSectors.length === 0) return 0.5;
    
    const matches = projectSectors.filter(sector => 
      schemeSectors.some(schemeSector => 
        schemeSector.toLowerCase().includes(sector.toLowerCase()) ||
        sector.toLowerCase().includes(schemeSector.toLowerCase())
      )
    );
    
    return matches.length / Math.max(projectSectors.length, schemeSectors.length);
  }

  private calculateRegionalAlignment(
    projectLocation: { state: string; district?: string },
    schemeRegions: string[]
  ): number {
    if (schemeRegions.length === 0 || schemeRegions.includes('ALL_STATES')) return 1;
    
    if (schemeRegions.includes(projectLocation.state)) return 1;
    if (schemeRegions.includes('NORTHEAST') && this.isNortheastState(projectLocation.state)) return 1;
    
    return 0;
  }

  private calculateFundingAlignment(estimatedCost: number, scheme: GovernmentScheme): number {
    if (!scheme.fundingRangeMin && !scheme.fundingRangeMax) return 0.5;
    
    const min = scheme.fundingRangeMin || 0;
    const max = scheme.fundingRangeMax || Infinity;
    
    if (estimatedCost >= min && estimatedCost <= max) return 1;
    if (estimatedCost < min) return Math.max(0.3, estimatedCost / min);
    if (estimatedCost > max) return Math.max(0.3, max / estimatedCost);
    
    return 0.5;
  }

  private calculateDescriptionSimilarity(projectDescription: string, scheme: GovernmentScheme): number {
    const projectWords = this.extractKeywords(projectDescription);
    const schemeWords = this.extractKeywords(scheme.description + ' ' + scheme.objectives.join(' '));
    
    if (projectWords.length === 0 || schemeWords.length === 0) return 0;
    
    const intersection = projectWords.filter(word => schemeWords.includes(word));
    const union = [...new Set([...projectWords, ...schemeWords])];
    
    return intersection.length / union.length;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index);
  }

  private isNortheastState(state: string): boolean {
    const northeastStates = [
      'arunachal pradesh', 'assam', 'manipur', 'meghalaya', 
      'mizoram', 'nagaland', 'sikkim', 'tripura'
    ];
    return northeastStates.includes(state.toLowerCase());
  }
}