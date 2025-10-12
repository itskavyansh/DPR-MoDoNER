import { 
  SchemeMatchingRequest, 
  SchemeMatchingResult, 
  SchemeMatchWithDetails, 
  GovernmentScheme,
  SchemeMatch,
  SchemeGapAnalysisResult,
  SchemeRecommendation
} from '../../../shared/src/types/index.js';

/**
 * NLP-based Scheme Matching Engine
 * Implements semantic similarity models for project-scheme matching
 * Creates relevance scoring algorithms for scheme applicability
 * Builds scheme recommendation system with confidence scores
 */
export class SchemeMatchingService {
  private readonly SIMILARITY_THRESHOLD = 0.3;
  private readonly MAX_RESULTS_DEFAULT = 10;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.4;

  /**
   * Main method to match schemes with DPR projects
   * Implements semantic similarity models for project-scheme matching
   */
  async matchSchemes(
    request: SchemeMatchingRequest,
    availableSchemes: GovernmentScheme[]
  ): Promise<SchemeMatchingResult> {
    const startTime = Date.now();
    
    // Filter schemes based on basic criteria
    const eligibleSchemes = this.filterEligibleSchemes(request, availableSchemes);
    
    // Calculate semantic similarity scores
    const schemeMatches = await this.calculateSemanticMatches(request, eligibleSchemes);
    
    // Apply relevance scoring algorithms
    const scoredMatches = this.applyRelevanceScoring(request, schemeMatches);
    
    // Filter and sort by confidence scores
    const finalMatches = this.filterAndSortByConfidence(scoredMatches, request.matchingOptions);
    
    // Perform gap analysis
    const gapAnalysis = this.performGapAnalysis(request, finalMatches, availableSchemes);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(request, finalMatches, gapAnalysis);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      documentId: request.documentId,
      totalSchemesAnalyzed: eligibleSchemes.length,
      matchedSchemes: finalMatches,
      gapAnalysis,
      recommendations,
      analysisTimestamp: new Date(),
      processingTimeMs
    };
  }

  /**
   * Filter schemes based on basic eligibility criteria
   */
  private filterEligibleSchemes(
    request: SchemeMatchingRequest,
    schemes: GovernmentScheme[]
  ): GovernmentScheme[] {
    return schemes.filter(scheme => {
      // Status filter
      if (!request.matchingOptions?.includeInactive && scheme.status !== 'ACTIVE') {
        return false;
      }
      
      // Regional applicability
      if (request.location?.state) {
        const isRegionallyApplicable = scheme.applicableRegions.length === 0 || 
          scheme.applicableRegions.includes(request.location.state) ||
          scheme.applicableRegions.includes('ALL_STATES') ||
          scheme.applicableRegions.includes('NORTHEAST') ||
          (this.isNortheastState(request.location.state) && scheme.applicableRegions.includes('NORTHEAST'));
        
        if (!isRegionallyApplicable) {
          return false;
        }
      }
      
      // Funding range filter - be more lenient, allow schemes with broader ranges
      if (request.estimatedCost && scheme.fundingRangeMin && scheme.fundingRangeMax) {
        // Allow schemes if the project cost is within 50% of the range bounds
        const lowerBound = scheme.fundingRangeMin * 0.5;
        const upperBound = scheme.fundingRangeMax * 1.5;
        if (request.estimatedCost < lowerBound || request.estimatedCost > upperBound) {
          return false;
        }
      }
      
      // Scheme type preference
      if (request.matchingOptions?.preferredSchemeTypes?.length) {
        if (!request.matchingOptions.preferredSchemeTypes.includes(scheme.schemeType)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Calculate semantic similarity between project description and schemes
   * Uses multiple NLP techniques for comprehensive matching
   */
  private async calculateSemanticMatches(
    request: SchemeMatchingRequest,
    schemes: GovernmentScheme[]
  ): Promise<Array<{ scheme: GovernmentScheme; similarity: number; matchingKeywords: string[] }>> {
    const projectText = this.prepareProjectText(request);
    const projectKeywords = this.extractKeywords(projectText);
    
    return schemes.map(scheme => {
      const schemeText = this.prepareSchemeText(scheme);
      const schemeKeywords = this.extractKeywords(schemeText);
      
      // Calculate multiple similarity scores
      const keywordSimilarity = this.calculateKeywordSimilarity(projectKeywords, schemeKeywords);
      const textSimilarity = this.calculateTextSimilarity(projectText, schemeText);
      const sectorSimilarity = this.calculateSectorSimilarity(request.sectors, scheme.applicableSectors);
      const beneficiarySimilarity = this.calculateBeneficiarySimilarity(
        request.targetBeneficiaries || [], 
        scheme.targetBeneficiaries
      );
      
      // Weighted combination of similarity scores
      const overallSimilarity = (
        keywordSimilarity * 0.3 +
        textSimilarity * 0.4 +
        sectorSimilarity * 0.2 +
        beneficiarySimilarity * 0.1
      );
      
      const matchingKeywords = this.findMatchingKeywords(projectKeywords, schemeKeywords);
      
      return {
        scheme,
        similarity: overallSimilarity,
        matchingKeywords
      };
    });
  }

  /**
   * Apply relevance scoring algorithms for scheme applicability
   */
  private applyRelevanceScoring(
    request: SchemeMatchingRequest,
    matches: Array<{ scheme: GovernmentScheme; similarity: number; matchingKeywords: string[] }>
  ): SchemeMatchWithDetails[] {
    return matches.map(match => {
      const { scheme, similarity, matchingKeywords } = match;
      
      // Calculate eligibility compliance
      const eligibilityAnalysis = this.analyzeEligibility(request, scheme);
      
      // Calculate confidence score based on multiple factors
      const confidenceScore = this.calculateConfidenceScore(
        similarity,
        eligibilityAnalysis,
        scheme,
        matchingKeywords.length
      );
      
      // Determine matching criteria
      const matchingCriteria = this.identifyMatchingCriteria(request, scheme, matchingKeywords);
      
      // Create scheme match object
      const schemeMatch: Omit<SchemeMatch, 'id' | 'createdAt' | 'updatedAt'> = {
        documentId: request.documentId,
        schemeId: scheme.id,
        matchType: this.determineMatchType(similarity, matchingKeywords.length),
        relevanceScore: similarity,
        confidenceScore,
        matchingKeywords,
        matchingCriteria,
        recommendationReason: this.generateRecommendationReason(scheme, similarity, eligibilityAnalysis),
        matchStatus: 'SUGGESTED',
        reviewedBy: undefined,
        reviewTimestamp: undefined,
        reviewNotes: undefined
      };
      
      return {
        scheme,
        match: schemeMatch,
        applicabilityAnalysis: eligibilityAnalysis
      };
    });
  }

  /**
   * Filter matches by confidence threshold and sort by relevance
   */
  private filterAndSortByConfidence(
    matches: SchemeMatchWithDetails[],
    options?: SchemeMatchingRequest['matchingOptions']
  ): SchemeMatchWithDetails[] {
    const minScore = options?.minRelevanceScore || this.SIMILARITY_THRESHOLD;
    const maxResults = options?.maxResults || this.MAX_RESULTS_DEFAULT;
    
    return matches
      .filter(match => 
        match.match.relevanceScore >= minScore && 
        match.match.confidenceScore >= this.MIN_CONFIDENCE_THRESHOLD
      )
      .sort((a, b) => {
        // Primary sort by confidence score
        if (b.match.confidenceScore !== a.match.confidenceScore) {
          return b.match.confidenceScore - a.match.confidenceScore;
        }
        // Secondary sort by relevance score
        return b.match.relevanceScore - a.match.relevanceScore;
      })
      .slice(0, maxResults);
  }

  /**
   * Perform gap analysis to identify missing scheme opportunities
   */
  private performGapAnalysis(
    request: SchemeMatchingRequest,
    matches: SchemeMatchWithDetails[],
    allSchemes: GovernmentScheme[]
  ): SchemeGapAnalysisResult {
    const existingSchemes = request.existingSchemes || [];
    const matchedSchemeIds = matches.map(m => m.scheme.id);
    
    // Verify existing scheme references
    const verifiedSchemes = allSchemes.filter(scheme => 
      existingSchemes.some(existing => 
        scheme.schemeName.toLowerCase().includes(existing.toLowerCase()) ||
        scheme.schemeCode === existing
      )
    );
    
    // Find missing opportunities (high-relevance schemes not in existing list)
    const missingOpportunities = matches
      .filter(match => 
        match.match.relevanceScore > 0.6 && 
        !existingSchemes.some(existing => 
          match.scheme.schemeName.toLowerCase().includes(existing.toLowerCase())
        )
      )
      .map(match => match.scheme)
      .slice(0, 5); // Top 5 missing opportunities
    
    // Identify incorrect references
    const incorrectReferences = existingSchemes.filter(existing => {
      if (!existing || typeof existing !== 'string' || existing.trim() === '') {
        return true; // Invalid references are incorrect
      }
      return !verifiedSchemes.some(verified => 
        verified.schemeName.toLowerCase().includes(existing.toLowerCase()) ||
        verified.schemeCode === existing
      );
    });
    
    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(
      request,
      matches,
      missingOpportunities
    );
    
    // Calculate completeness score
    const completenessScore = this.calculateCompletenessScore(
      existingSchemes.length,
      verifiedSchemes.length,
      missingOpportunities.length,
      incorrectReferences.length
    );
    
    return {
      completenessScore,
      gapSeverity: this.determineGapSeverity(completenessScore, missingOpportunities.length),
      existingSchemesMentioned: existingSchemes,
      verifiedSchemes,
      missingOpportunities,
      incorrectReferences,
      optimizationSuggestions
    };
  }

  /**
   * Generate scheme recommendations with confidence scores
   */
  private generateRecommendations(
    request: SchemeMatchingRequest,
    matches: SchemeMatchWithDetails[],
    gapAnalysis: SchemeGapAnalysisResult
  ): SchemeRecommendation[] {
    const recommendations: SchemeRecommendation[] = [];
    
    // Recommend new high-confidence schemes
    const topMatches = matches.slice(0, 3).filter(match => match.match.confidenceScore > 0.7);
    topMatches.forEach(match => {
      recommendations.push({
        type: 'NEW_SCHEME',
        priority: match.match.confidenceScore > 0.8 ? 'HIGH' : 'MEDIUM',
        scheme: match.scheme,
        recommendation: `Consider applying for ${match.scheme.schemeName} which shows ${Math.round(match.match.confidenceScore * 100)}% compatibility with your project.`,
        expectedBenefit: this.calculateExpectedBenefit(match.scheme, request.estimatedCost),
        implementationSteps: this.generateImplementationSteps(match.scheme),
        potentialFunding: this.estimatePotentialFunding(match.scheme, request.estimatedCost),
        timeframe: this.estimateTimeframe(match.scheme)
      });
    });
    
    // Recommend scheme verification for existing references
    if (gapAnalysis.incorrectReferences.length > 0) {
      recommendations.push({
        type: 'SCHEME_VERIFICATION',
        priority: 'HIGH',
        recommendation: `Verify the following scheme references: ${gapAnalysis.incorrectReferences.join(', ')}. These may be outdated or incorrectly named.`,
        expectedBenefit: 'Ensures accurate scheme alignment and prevents application delays',
        implementationSteps: [
          'Review current scheme names and codes',
          'Update DPR with correct scheme references',
          'Verify eligibility criteria for updated schemes'
        ]
      });
    }
    
    // Recommend funding alignment optimization
    const fundingMisalignments = matches.filter(match => 
      match.applicabilityAnalysis.fundingAlignment === 'OVER' || 
      match.applicabilityAnalysis.fundingAlignment === 'UNDER'
    );
    
    if (fundingMisalignments.length > 0) {
      recommendations.push({
        type: 'FUNDING_ALIGNMENT',
        priority: 'MEDIUM',
        recommendation: 'Consider adjusting project scope or exploring additional funding sources to better align with available schemes.',
        expectedBenefit: 'Improves funding approval chances and reduces financial gaps',
        implementationSteps: [
          'Review project scope and cost breakdown',
          'Identify components that can be funded separately',
          'Explore complementary schemes for comprehensive coverage'
        ]
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods for text processing and similarity calculation
  
  private prepareProjectText(request: SchemeMatchingRequest): string {
    return [
      request.projectDescription,
      request.projectType || '',
      request.sectors.join(' '),
      request.targetBeneficiaries?.join(' ') || '',
      request.location?.state || '',
      request.location?.district || ''
    ].filter(Boolean).join(' ').toLowerCase();
  }
  
  private prepareSchemeText(scheme: GovernmentScheme): string {
    return [
      scheme.schemeName,
      scheme.description,
      scheme.objectives.join(' '),
      scheme.keywords.join(' '),
      scheme.applicableSectors.join(' '),
      scheme.targetBeneficiaries.join(' ')
    ].join(' ').toLowerCase();
  }
  
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must'
    ]);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  }
  
  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }
  
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple cosine similarity based on word frequency
    const words1 = this.extractKeywords(text1);
    const words2 = this.extractKeywords(text2);
    
    const allWords = [...new Set([...words1, ...words2])];
    
    const vector1 = allWords.map(word => words1.filter(w => w === word).length);
    const vector2 = allWords.map(word => words2.filter(w => w === word).length);
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  private calculateSectorSimilarity(projectSectors: string[], schemeSectors: string[]): number {
    if (projectSectors.length === 0 || schemeSectors.length === 0) return 0;
    
    const matches = projectSectors.filter(sector => 
      schemeSectors.some(schemeSector => 
        schemeSector.toLowerCase().includes(sector.toLowerCase()) ||
        sector.toLowerCase().includes(schemeSector.toLowerCase())
      )
    );
    
    return matches.length / Math.max(projectSectors.length, schemeSectors.length);
  }
  
  private calculateBeneficiarySimilarity(projectBeneficiaries: string[], schemeBeneficiaries: string[]): number {
    if (projectBeneficiaries.length === 0 || schemeBeneficiaries.length === 0) return 0.5; // Neutral if not specified
    
    const matches = projectBeneficiaries.filter(beneficiary => 
      schemeBeneficiaries.some(schemeBeneficiary => 
        schemeBeneficiary.toLowerCase().includes(beneficiary.toLowerCase()) ||
        beneficiary.toLowerCase().includes(schemeBeneficiary.toLowerCase())
      )
    );
    
    return matches.length / Math.max(projectBeneficiaries.length, schemeBeneficiaries.length);
  }
  
  private findMatchingKeywords(keywords1: string[], keywords2: string[]): string[] {
    return keywords1.filter(keyword => keywords2.includes(keyword));
  }
  
  private analyzeEligibility(request: SchemeMatchingRequest, scheme: GovernmentScheme) {
    const eligibilityMet = true; // Simplified - would need more complex logic
    const missingCriteria: string[] = [];
    
    // Analyze funding alignment
    let fundingAlignment: 'UNDER' | 'WITHIN' | 'OVER' | 'UNKNOWN' = 'UNKNOWN';
    if (request.estimatedCost && scheme.fundingRangeMin && scheme.fundingRangeMax) {
      if (request.estimatedCost < scheme.fundingRangeMin) {
        fundingAlignment = 'UNDER';
      } else if (request.estimatedCost > scheme.fundingRangeMax) {
        fundingAlignment = 'OVER';
      } else {
        fundingAlignment = 'WITHIN';
      }
    }
    
    // Check regional applicability
    const regionalApplicability = !request.location?.state || 
      scheme.applicableRegions.length === 0 ||
      scheme.applicableRegions.includes(request.location.state) ||
      scheme.applicableRegions.includes('ALL_STATES') ||
      scheme.applicableRegions.includes('NORTHEAST');
    
    // Check sector alignment
    const sectorAlignment = request.sectors.length === 0 ||
      scheme.applicableSectors.length === 0 ||
      request.sectors.some(sector => 
        scheme.applicableSectors.some(schemeSector => 
          schemeSector.toLowerCase().includes(sector.toLowerCase())
        )
      );
    
    return {
      eligibilityMet,
      missingCriteria,
      fundingAlignment,
      regionalApplicability,
      sectorAlignment
    };
  }
  
  private calculateConfidenceScore(
    similarity: number,
    eligibilityAnalysis: any,
    scheme: GovernmentScheme,
    matchingKeywordsCount: number
  ): number {
    let confidence = similarity;
    
    // Boost confidence for verified schemes
    if (scheme.verificationStatus === 'VERIFIED') {
      confidence += 0.1;
    }
    
    // Boost confidence for active schemes
    if (scheme.status === 'ACTIVE') {
      confidence += 0.05;
    }
    
    // Boost confidence for good funding alignment
    if (eligibilityAnalysis.fundingAlignment === 'WITHIN') {
      confidence += 0.1;
    } else if (eligibilityAnalysis.fundingAlignment === 'OVER' || eligibilityAnalysis.fundingAlignment === 'UNDER') {
      confidence -= 0.05;
    }
    
    // Boost confidence for regional and sector alignment
    if (eligibilityAnalysis.regionalApplicability) {
      confidence += 0.05;
    }
    if (eligibilityAnalysis.sectorAlignment) {
      confidence += 0.05;
    }
    
    // Boost confidence for keyword matches
    confidence += Math.min(matchingKeywordsCount * 0.02, 0.1);
    
    return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
  }
  
  private identifyMatchingCriteria(
    request: SchemeMatchingRequest,
    scheme: GovernmentScheme,
    matchingKeywords: string[]
  ): string[] {
    const criteria: string[] = [];
    
    if (matchingKeywords.length > 0) {
      criteria.push(`Keyword matches: ${matchingKeywords.slice(0, 5).join(', ')}`);
    }
    
    if (request.location?.state && scheme.applicableRegions.includes(request.location.state)) {
      criteria.push(`Regional alignment: ${request.location.state}`);
    }
    
    const sectorMatches = request.sectors.filter(sector => 
      scheme.applicableSectors.some(schemeSector => 
        schemeSector.toLowerCase().includes(sector.toLowerCase())
      )
    );
    if (sectorMatches.length > 0) {
      criteria.push(`Sector alignment: ${sectorMatches.join(', ')}`);
    }
    
    if (request.estimatedCost && scheme.fundingRangeMin && scheme.fundingRangeMax &&
        request.estimatedCost >= scheme.fundingRangeMin && request.estimatedCost <= scheme.fundingRangeMax) {
      criteria.push('Funding range compatibility');
    }
    
    return criteria;
  }
  
  private determineMatchType(similarity: number, keywordMatches: number): 'SEMANTIC' | 'KEYWORD' | 'CATEGORY' | 'MANUAL' {
    if (keywordMatches > 3) return 'KEYWORD';
    if (similarity > 0.6) return 'SEMANTIC';
    return 'CATEGORY';
  }
  
  private generateRecommendationReason(
    scheme: GovernmentScheme,
    similarity: number,
    eligibilityAnalysis: any
  ): string {
    const reasons: string[] = [];
    
    if (similarity > 0.7) {
      reasons.push('High semantic similarity with project description');
    }
    
    if (eligibilityAnalysis.fundingAlignment === 'WITHIN') {
      reasons.push('Project cost aligns with scheme funding range');
    }
    
    if (eligibilityAnalysis.sectorAlignment) {
      reasons.push('Project sector matches scheme applicability');
    }
    
    if (eligibilityAnalysis.regionalApplicability) {
      reasons.push('Scheme applicable to project location');
    }
    
    if (scheme.status === 'ACTIVE' && scheme.verificationStatus === 'VERIFIED') {
      reasons.push('Scheme is currently active and verified');
    }
    
    return reasons.length > 0 ? reasons.join('; ') : 'General compatibility with project requirements';
  }
  
  private generateOptimizationSuggestions(
    request: SchemeMatchingRequest,
    matches: SchemeMatchWithDetails[],
    missingOpportunities: GovernmentScheme[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (missingOpportunities.length > 0) {
      suggestions.push(`Consider exploring ${missingOpportunities.length} additional high-relevance schemes that could benefit your project`);
    }
    
    const lowConfidenceMatches = matches.filter(m => m.match.confidenceScore < 0.6);
    if (lowConfidenceMatches.length > 0) {
      suggestions.push('Review project description to better align with scheme requirements for improved matching');
    }
    
    const fundingMismatches = matches.filter(m => 
      m.applicabilityAnalysis.fundingAlignment === 'OVER' || 
      m.applicabilityAnalysis.fundingAlignment === 'UNDER'
    );
    if (fundingMismatches.length > 0) {
      suggestions.push('Consider adjusting project scope or exploring complementary funding sources');
    }
    
    return suggestions;
  }
  
  private calculateCompletenessScore(
    existingCount: number,
    verifiedCount: number,
    missingCount: number,
    incorrectCount: number
  ): number {
    if (existingCount === 0) return missingCount > 0 ? 0.3 : 0.8; // No schemes mentioned
    
    const accuracy = verifiedCount / existingCount;
    const coverage = Math.min(verifiedCount / Math.max(verifiedCount + missingCount, 1), 1);
    const penalty = incorrectCount * 0.1;
    
    return Math.max((accuracy * 0.6 + coverage * 0.4) - penalty, 0);
  }
  
  private determineGapSeverity(completenessScore: number, missingCount: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (completenessScore > 0.8 && missingCount <= 1) return 'LOW';
    if (completenessScore > 0.6 && missingCount <= 3) return 'MEDIUM';
    if (completenessScore > 0.3 && missingCount <= 5) return 'HIGH';
    return 'CRITICAL';
  }
  
  private calculateExpectedBenefit(scheme: GovernmentScheme, estimatedCost?: number): string {
    if (scheme.averageFundingAmount && estimatedCost) {
      const percentage = Math.min((scheme.averageFundingAmount / estimatedCost) * 100, 100);
      return `Potential funding coverage of up to ${percentage.toFixed(0)}% of project cost`;
    }
    
    if (scheme.fundingRangeMin && scheme.fundingRangeMax) {
      return `Funding range: ₹${scheme.fundingRangeMin.toLocaleString()} - ₹${scheme.fundingRangeMax.toLocaleString()}`;
    }
    
    return 'Financial support and implementation assistance';
  }
  
  private generateImplementationSteps(scheme: GovernmentScheme): string[] {
    const steps = [
      'Review detailed scheme guidelines and eligibility criteria',
      'Prepare required documentation and project proposals'
    ];
    
    if (scheme.applicationProcess) {
      steps.push('Follow the specified application process');
    } else {
      steps.push('Contact scheme authorities for application procedures');
    }
    
    if (scheme.processingTimeDays) {
      steps.push(`Allow ${scheme.processingTimeDays} days for application processing`);
    }
    
    steps.push('Monitor application status and respond to queries promptly');
    
    return steps;
  }
  
  private estimatePotentialFunding(scheme: GovernmentScheme, estimatedCost?: number): number | undefined {
    if (scheme.averageFundingAmount) {
      return scheme.averageFundingAmount;
    }
    
    if (estimatedCost && scheme.fundingRangeMin && scheme.fundingRangeMax) {
      return Math.min(estimatedCost, scheme.fundingRangeMax);
    }
    
    return scheme.fundingRangeMax;
  }
  
  private estimateTimeframe(scheme: GovernmentScheme): string {
    if (scheme.processingTimeDays) {
      const months = Math.ceil(scheme.processingTimeDays / 30);
      return `${months} month${months > 1 ? 's' : ''} for approval process`;
    }
    
    return '3-6 months (typical processing time)';
  }

  private isNortheastState(state: string): boolean {
    const northeastStates = [
      'arunachal pradesh', 'assam', 'manipur', 'meghalaya', 
      'mizoram', 'nagaland', 'sikkim', 'tripura'
    ];
    return northeastStates.includes(state.toLowerCase());
  }
}