import { RiskFactor, ProjectFeatures } from '@dpr-system/shared';

// Risk mitigation types
export interface MitigationStrategy {
  id: string;
  riskType: 'COST_OVERRUN' | 'DELAY' | 'ENVIRONMENTAL' | 'RESOURCE';
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH';
  strategyName: string;
  description: string;
  actionItems: ActionItem[];
  expectedImpact: number; // 0-100 percentage reduction in risk
  implementationCost: 'LOW' | 'MEDIUM' | 'HIGH';
  implementationTime: string; // e.g., "2-4 weeks"
  prerequisites: string[];
  successMetrics: string[];
  applicableProjectTypes: string[];
  effectiveness: number; // 0-1 based on historical data
  lastUpdated: Date;
}

export interface ActionItem {
  id: string;
  action: string;
  responsible: string;
  timeline: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  resources: string[];
  deliverables: string[];
}

export interface RiskMitigationRecommendation {
  riskFactor: RiskFactor;
  recommendedStrategies: MitigationStrategy[];
  prioritizedActions: ActionItem[];
  estimatedRiskReduction: number;
  totalImplementationCost: 'LOW' | 'MEDIUM' | 'HIGH';
  totalImplementationTime: string;
  successProbability: number;
}

export interface RiskMitigationPlan {
  dprId: string;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: RiskMitigationRecommendation[];
  prioritizedStrategies: MitigationStrategy[];
  quickWins: ActionItem[];
  longTermActions: ActionItem[];
  estimatedBudget: {
    low: number;
    medium: number;
    high: number;
  };
  implementationTimeline: string;
  expectedRiskReduction: number;
  generatedAt: Date;
}

/**
 * Risk Mitigation Recommendation Engine
 * Provides actionable risk reduction strategies based on identified risks
 */
export class RiskMitigationService {
  private mitigationDatabase: MitigationStrategy[] = [];

  constructor() {
    this.initializeMitigationDatabase();
  }

  /**
   * Initialize the mitigation strategy database
   */
  private initializeMitigationDatabase(): void {
    this.mitigationDatabase = [
      // Cost Overrun Mitigation Strategies
      {
        id: 'cost-001',
        riskType: 'COST_OVERRUN',
        riskSeverity: 'LOW',
        strategyName: 'Enhanced Cost Monitoring',
        description: 'Implement regular cost tracking and variance analysis to catch overruns early',
        actionItems: [
          {
            id: 'cost-001-a1',
            action: 'Set up weekly cost reporting system',
            responsible: 'Project Manager',
            timeline: '1 week',
            priority: 'HIGH',
            resources: ['Cost tracking software', 'Financial analyst'],
            deliverables: ['Weekly cost reports', 'Variance analysis dashboard']
          },
          {
            id: 'cost-001-a2',
            action: 'Establish cost variance thresholds and alerts',
            responsible: 'Finance Team',
            timeline: '2 weeks',
            priority: 'MEDIUM',
            resources: ['Alert system', 'Threshold definitions'],
            deliverables: ['Alert configuration', 'Escalation procedures']
          }
        ],
        expectedImpact: 15,
        implementationCost: 'LOW',
        implementationTime: '2-3 weeks',
        prerequisites: ['Project budget approved', 'Cost tracking system available'],
        successMetrics: ['Cost variance < 5%', 'Early detection of overruns'],
        applicableProjectTypes: ['Infrastructure', 'Construction', 'Development'],
        effectiveness: 0.75,
        lastUpdated: new Date()
      },
      {
        id: 'cost-002',
        riskType: 'COST_OVERRUN',
        riskSeverity: 'MEDIUM',
        strategyName: 'Value Engineering Implementation',
        description: 'Systematic approach to optimize project value while maintaining functionality',
        actionItems: [
          {
            id: 'cost-002-a1',
            action: 'Conduct value engineering workshop',
            responsible: 'Technical Team Lead',
            timeline: '1 week',
            priority: 'HIGH',
            resources: ['VE facilitator', 'Cross-functional team', 'Workshop venue'],
            deliverables: ['VE analysis report', 'Cost optimization recommendations']
          },
          {
            id: 'cost-002-a2',
            action: 'Implement approved cost optimization measures',
            responsible: 'Project Manager',
            timeline: '4-6 weeks',
            priority: 'HIGH',
            resources: ['Implementation team', 'Revised specifications'],
            deliverables: ['Updated project design', 'Cost savings report']
          }
        ],
        expectedImpact: 25,
        implementationCost: 'MEDIUM',
        implementationTime: '6-8 weeks',
        prerequisites: ['Design flexibility available', 'Stakeholder buy-in'],
        successMetrics: ['10-20% cost reduction', 'Maintained functionality'],
        applicableProjectTypes: ['Infrastructure', 'Construction'],
        effectiveness: 0.80,
        lastUpdated: new Date()
      },
      {
        id: 'cost-003',
        riskType: 'COST_OVERRUN',
        riskSeverity: 'HIGH',
        strategyName: 'Fixed-Price Contract with Penalties',
        description: 'Transfer cost overrun risk to contractors through fixed-price contracts',
        actionItems: [
          {
            id: 'cost-003-a1',
            action: 'Revise contract terms to fixed-price model',
            responsible: 'Legal Team',
            timeline: '2-3 weeks',
            priority: 'HIGH',
            resources: ['Legal counsel', 'Contract templates'],
            deliverables: ['Revised contract terms', 'Penalty clauses']
          },
          {
            id: 'cost-003-a2',
            action: 'Negotiate with existing contractors or re-tender',
            responsible: 'Procurement Team',
            timeline: '4-6 weeks',
            priority: 'HIGH',
            resources: ['Negotiation team', 'Market analysis'],
            deliverables: ['Signed fixed-price contracts', 'Risk transfer documentation']
          }
        ],
        expectedImpact: 40,
        implementationCost: 'HIGH',
        implementationTime: '8-12 weeks',
        prerequisites: ['Contract renegotiation possible', 'Market competition available'],
        successMetrics: ['Zero cost overrun liability', 'Contractor performance bonds'],
        applicableProjectTypes: ['Construction', 'Infrastructure'],
        effectiveness: 0.85,
        lastUpdated: new Date()
      },

      // Delay Mitigation Strategies
      {
        id: 'delay-001',
        riskType: 'DELAY',
        riskSeverity: 'LOW',
        strategyName: 'Schedule Buffer Implementation',
        description: 'Add appropriate time buffers to critical path activities',
        actionItems: [
          {
            id: 'delay-001-a1',
            action: 'Analyze critical path and identify buffer requirements',
            responsible: 'Project Scheduler',
            timeline: '1 week',
            priority: 'HIGH',
            resources: ['Scheduling software', 'Historical data'],
            deliverables: ['Critical path analysis', 'Buffer recommendations']
          },
          {
            id: 'delay-001-a2',
            action: 'Update project schedule with buffers',
            responsible: 'Project Manager',
            timeline: '1 week',
            priority: 'MEDIUM',
            resources: ['Updated schedule', 'Stakeholder approval'],
            deliverables: ['Revised project timeline', 'Buffer allocation plan']
          }
        ],
        expectedImpact: 20,
        implementationCost: 'LOW',
        implementationTime: '2 weeks',
        prerequisites: ['Schedule flexibility available', 'Stakeholder agreement'],
        successMetrics: ['On-time delivery', 'Buffer utilization < 50%'],
        applicableProjectTypes: ['All project types'],
        effectiveness: 0.70,
        lastUpdated: new Date()
      },
      {
        id: 'delay-002',
        riskType: 'DELAY',
        riskSeverity: 'MEDIUM',
        strategyName: 'Parallel Processing Implementation',
        description: 'Execute non-dependent activities in parallel to reduce overall timeline',
        actionItems: [
          {
            id: 'delay-002-a1',
            action: 'Identify activities suitable for parallel execution',
            responsible: 'Technical Lead',
            timeline: '1 week',
            priority: 'HIGH',
            resources: ['Project schedule', 'Dependency analysis'],
            deliverables: ['Parallel processing plan', 'Resource allocation matrix']
          },
          {
            id: 'delay-002-a2',
            action: 'Reorganize teams and resources for parallel work',
            responsible: 'Resource Manager',
            timeline: '2 weeks',
            priority: 'HIGH',
            resources: ['Additional resources', 'Team restructuring'],
            deliverables: ['Reorganized teams', 'Parallel work streams']
          }
        ],
        expectedImpact: 30,
        implementationCost: 'MEDIUM',
        implementationTime: '3-4 weeks',
        prerequisites: ['Resource availability', 'Independent work streams'],
        successMetrics: ['20-30% timeline reduction', 'No quality compromise'],
        applicableProjectTypes: ['Software', 'Construction', 'Infrastructure'],
        effectiveness: 0.75,
        lastUpdated: new Date()
      },
      {
        id: 'delay-003',
        riskType: 'DELAY',
        riskSeverity: 'HIGH',
        strategyName: 'Fast-Track Construction Methods',
        description: 'Implement accelerated construction techniques and methodologies',
        actionItems: [
          {
            id: 'delay-003-a1',
            action: 'Evaluate fast-track construction options',
            responsible: 'Construction Manager',
            timeline: '2 weeks',
            priority: 'HIGH',
            resources: ['Construction experts', 'Method analysis'],
            deliverables: ['Fast-track feasibility study', 'Method recommendations']
          },
          {
            id: 'delay-003-a2',
            action: 'Implement prefabrication and modular construction',
            responsible: 'Construction Team',
            timeline: '8-12 weeks',
            priority: 'HIGH',
            resources: ['Prefab facilities', 'Specialized equipment'],
            deliverables: ['Prefabricated components', 'Accelerated construction']
          }
        ],
        expectedImpact: 45,
        implementationCost: 'HIGH',
        implementationTime: '12-16 weeks',
        prerequisites: ['Design suitable for fast-track', 'Specialized contractors available'],
        successMetrics: ['30-50% timeline reduction', 'Quality standards maintained'],
        applicableProjectTypes: ['Construction', 'Infrastructure'],
        effectiveness: 0.80,
        lastUpdated: new Date()
      },

      // Environmental Risk Mitigation Strategies
      {
        id: 'env-001',
        riskType: 'ENVIRONMENTAL',
        riskSeverity: 'LOW',
        strategyName: 'Environmental Management Plan',
        description: 'Develop comprehensive environmental management and monitoring plan',
        actionItems: [
          {
            id: 'env-001-a1',
            action: 'Conduct detailed environmental impact assessment',
            responsible: 'Environmental Consultant',
            timeline: '4 weeks',
            priority: 'HIGH',
            resources: ['Environmental experts', 'Site surveys'],
            deliverables: ['EIA report', 'Impact mitigation measures']
          },
          {
            id: 'env-001-a2',
            action: 'Develop environmental monitoring protocols',
            responsible: 'Environmental Manager',
            timeline: '2 weeks',
            priority: 'MEDIUM',
            resources: ['Monitoring equipment', 'Protocol templates'],
            deliverables: ['Monitoring plan', 'Compliance procedures']
          }
        ],
        expectedImpact: 25,
        implementationCost: 'MEDIUM',
        implementationTime: '6 weeks',
        prerequisites: ['Environmental clearance pending', 'Expert availability'],
        successMetrics: ['Environmental compliance', 'No regulatory violations'],
        applicableProjectTypes: ['Infrastructure', 'Industrial', 'Construction'],
        effectiveness: 0.75,
        lastUpdated: new Date()
      },
      {
        id: 'env-002',
        riskType: 'ENVIRONMENTAL',
        riskSeverity: 'MEDIUM',
        strategyName: 'Biodiversity Offset Program',
        description: 'Implement biodiversity conservation and offset measures',
        actionItems: [
          {
            id: 'env-002-a1',
            action: 'Design biodiversity offset program',
            responsible: 'Conservation Specialist',
            timeline: '3 weeks',
            priority: 'HIGH',
            resources: ['Biodiversity experts', 'Offset site identification'],
            deliverables: ['Offset program design', 'Conservation plan']
          },
          {
            id: 'env-002-a2',
            action: 'Implement habitat restoration activities',
            responsible: 'Conservation Team',
            timeline: '12-24 weeks',
            priority: 'MEDIUM',
            resources: ['Restoration materials', 'Local communities'],
            deliverables: ['Restored habitats', 'Monitoring reports']
          }
        ],
        expectedImpact: 35,
        implementationCost: 'HIGH',
        implementationTime: '24-30 weeks',
        prerequisites: ['Offset sites available', 'Regulatory approval'],
        successMetrics: ['Net positive biodiversity impact', 'Regulatory compliance'],
        applicableProjectTypes: ['Infrastructure', 'Mining', 'Industrial'],
        effectiveness: 0.80,
        lastUpdated: new Date()
      },
      {
        id: 'env-003',
        riskType: 'ENVIRONMENTAL',
        riskSeverity: 'HIGH',
        strategyName: 'Alternative Site Selection',
        description: 'Evaluate and relocate to environmentally less sensitive sites',
        actionItems: [
          {
            id: 'env-003-a1',
            action: 'Conduct alternative site assessment',
            responsible: 'Site Selection Team',
            timeline: '6 weeks',
            priority: 'HIGH',
            resources: ['Site evaluation experts', 'Environmental data'],
            deliverables: ['Alternative site options', 'Comparative analysis']
          },
          {
            id: 'env-003-a2',
            action: 'Redesign project for alternative site',
            responsible: 'Design Team',
            timeline: '8-12 weeks',
            priority: 'HIGH',
            resources: ['Design resources', 'Site-specific data'],
            deliverables: ['Revised project design', 'Updated permits']
          }
        ],
        expectedImpact: 60,
        implementationCost: 'HIGH',
        implementationTime: '16-20 weeks',
        prerequisites: ['Alternative sites available', 'Design flexibility'],
        successMetrics: ['Reduced environmental impact', 'Faster approvals'],
        applicableProjectTypes: ['Infrastructure', 'Industrial'],
        effectiveness: 0.85,
        lastUpdated: new Date()
      },

      // Resource Risk Mitigation Strategies
      {
        id: 'resource-001',
        riskType: 'RESOURCE',
        riskSeverity: 'LOW',
        strategyName: 'Supplier Diversification',
        description: 'Establish relationships with multiple suppliers to reduce dependency',
        actionItems: [
          {
            id: 'resource-001-a1',
            action: 'Identify and qualify alternative suppliers',
            responsible: 'Procurement Manager',
            timeline: '3 weeks',
            priority: 'HIGH',
            resources: ['Supplier database', 'Qualification criteria'],
            deliverables: ['Qualified supplier list', 'Backup agreements']
          },
          {
            id: 'resource-001-a2',
            action: 'Establish framework agreements with multiple suppliers',
            responsible: 'Procurement Team',
            timeline: '4 weeks',
            priority: 'MEDIUM',
            resources: ['Legal support', 'Contract templates'],
            deliverables: ['Framework agreements', 'Supply chain redundancy']
          }
        ],
        expectedImpact: 20,
        implementationCost: 'LOW',
        implementationTime: '6-8 weeks',
        prerequisites: ['Multiple suppliers available', 'Procurement flexibility'],
        successMetrics: ['Supply chain resilience', 'No single-source dependencies'],
        applicableProjectTypes: ['All project types'],
        effectiveness: 0.70,
        lastUpdated: new Date()
      },
      {
        id: 'resource-002',
        riskType: 'RESOURCE',
        riskSeverity: 'MEDIUM',
        strategyName: 'Local Capacity Building',
        description: 'Develop local workforce and supplier capabilities',
        actionItems: [
          {
            id: 'resource-002-a1',
            action: 'Assess local capacity and skill gaps',
            responsible: 'HR Manager',
            timeline: '2 weeks',
            priority: 'HIGH',
            resources: ['Skills assessment tools', 'Local surveys'],
            deliverables: ['Capacity assessment report', 'Training needs analysis']
          },
          {
            id: 'resource-002-a2',
            action: 'Implement training and development programs',
            responsible: 'Training Coordinator',
            timeline: '8-12 weeks',
            priority: 'HIGH',
            resources: ['Training materials', 'Local trainers'],
            deliverables: ['Trained workforce', 'Certified suppliers']
          }
        ],
        expectedImpact: 30,
        implementationCost: 'MEDIUM',
        implementationTime: '12-16 weeks',
        prerequisites: ['Local willingness to participate', 'Training resources'],
        successMetrics: ['Increased local capacity', 'Reduced external dependency'],
        applicableProjectTypes: ['Infrastructure', 'Development', 'Construction'],
        effectiveness: 0.75,
        lastUpdated: new Date()
      },
      {
        id: 'resource-003',
        riskType: 'RESOURCE',
        riskSeverity: 'HIGH',
        strategyName: 'Strategic Resource Reserves',
        description: 'Establish strategic reserves of critical resources and materials',
        actionItems: [
          {
            id: 'resource-003-a1',
            action: 'Identify critical resources and calculate reserve requirements',
            responsible: 'Supply Chain Manager',
            timeline: '2 weeks',
            priority: 'HIGH',
            resources: ['Resource analysis', 'Demand forecasting'],
            deliverables: ['Critical resource list', 'Reserve requirements']
          },
          {
            id: 'resource-003-a2',
            action: 'Establish and maintain strategic reserves',
            responsible: 'Logistics Manager',
            timeline: '6-8 weeks',
            priority: 'HIGH',
            resources: ['Storage facilities', 'Inventory management'],
            deliverables: ['Resource reserves', 'Inventory management system']
          }
        ],
        expectedImpact: 40,
        implementationCost: 'HIGH',
        implementationTime: '8-12 weeks',
        prerequisites: ['Storage capacity available', 'Capital for reserves'],
        successMetrics: ['Resource availability guarantee', 'No resource-related delays'],
        applicableProjectTypes: ['Large infrastructure', 'Remote projects'],
        effectiveness: 0.80,
        lastUpdated: new Date()
      }
    ];
  }

  /**
   * Generate risk mitigation recommendations for identified risks
   */
  async generateMitigationPlan(
    dprId: string,
    riskFactors: RiskFactor[],
    projectFeatures: ProjectFeatures,
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): Promise<RiskMitigationPlan> {
    try {
      const recommendations: RiskMitigationRecommendation[] = [];
      
      // Generate recommendations for each risk factor
      for (const riskFactor of riskFactors) {
        const recommendation = await this.generateRiskRecommendation(riskFactor, projectFeatures);
        recommendations.push(recommendation);
      }

      // Prioritize strategies across all recommendations
      const allStrategies = recommendations.flatMap(r => r.recommendedStrategies);
      const prioritizedStrategies = this.prioritizeStrategies(allStrategies, overallRiskLevel);

      // Extract quick wins and long-term actions
      const allActions = recommendations.flatMap(r => r.prioritizedActions);
      const quickWins = allActions.filter(a => 
        a.priority === 'HIGH' && 
        this.isQuickWin(a.timeline)
      );
      const longTermActions = allActions.filter(a => 
        !this.isQuickWin(a.timeline)
      );

      // Estimate budget and timeline
      const estimatedBudget = this.estimateBudget(prioritizedStrategies);
      const implementationTimeline = this.estimateTimeline(prioritizedStrategies);
      const expectedRiskReduction = this.calculateExpectedRiskReduction(recommendations);

      return {
        dprId,
        overallRiskLevel,
        recommendations,
        prioritizedStrategies,
        quickWins,
        longTermActions,
        estimatedBudget,
        implementationTimeline,
        expectedRiskReduction,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating mitigation plan:', error);
      throw new Error(`Mitigation plan generation failed: ${error.message}`);
    }
  }

  /**
   * Generate recommendation for a specific risk factor
   */
  private async generateRiskRecommendation(
    riskFactor: RiskFactor,
    projectFeatures: ProjectFeatures
  ): Promise<RiskMitigationRecommendation> {
    // Map risk factor type to mitigation database categories
    const riskTypeMapping: Record<string, 'COST_OVERRUN' | 'DELAY' | 'ENVIRONMENTAL' | 'RESOURCE'> = {
      'FINANCIAL': 'COST_OVERRUN',
      'TIMELINE': 'DELAY',
      'ENVIRONMENTAL': 'ENVIRONMENTAL',
      'RESOURCE': 'RESOURCE',
      'COMPLEXITY': 'DELAY' // Complexity often leads to delays
    };

    const mitigationType = riskTypeMapping[riskFactor.type] || 'DELAY';
    
    // Find applicable strategies based on risk type and severity
    const applicableStrategies = this.mitigationDatabase.filter(strategy => 
      strategy.riskType === mitigationType &&
      this.isSeverityApplicable(strategy.riskSeverity, riskFactor.impact)
    );

    // Score and rank strategies based on project context
    const scoredStrategies = applicableStrategies.map(strategy => ({
      strategy,
      score: this.scoreStrategy(strategy, riskFactor, projectFeatures)
    })).sort((a, b) => b.score - a.score);

    // Select top strategies (max 3 per risk)
    const recommendedStrategies = scoredStrategies.slice(0, 3).map(s => s.strategy);

    // Extract and prioritize action items
    const allActions = recommendedStrategies.flatMap(s => s.actionItems);
    const prioritizedActions = this.prioritizeActions(allActions, riskFactor.impact);

    // Calculate expected risk reduction
    const estimatedRiskReduction = recommendedStrategies.reduce(
      (total, strategy) => total + (strategy.expectedImpact * strategy.effectiveness), 0
    ) / recommendedStrategies.length;

    // Determine implementation cost and time
    const costs = recommendedStrategies.map(s => s.implementationCost);
    const totalImplementationCost = this.aggregateCost(costs);
    
    const times = recommendedStrategies.map(s => s.implementationTime);
    const totalImplementationTime = this.aggregateTime(times);

    // Calculate success probability based on strategy effectiveness
    const successProbability = recommendedStrategies.reduce(
      (avg, strategy) => avg + strategy.effectiveness, 0
    ) / recommendedStrategies.length;

    return {
      riskFactor,
      recommendedStrategies,
      prioritizedActions,
      estimatedRiskReduction,
      totalImplementationCost,
      totalImplementationTime,
      successProbability
    };
  }

  /**
   * Check if strategy severity is applicable to risk impact
   */
  private isSeverityApplicable(strategySeverity: string, riskImpact: string): boolean {
    const severityOrder: Record<string, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    return (severityOrder[strategySeverity] || 2) <= (severityOrder[riskImpact] || 2);
  }

  /**
   * Score strategy based on project context and risk characteristics
   */
  private scoreStrategy(
    strategy: MitigationStrategy,
    _riskFactor: RiskFactor,
    _projectFeatures: ProjectFeatures
  ): number {
    let score = strategy.effectiveness * 100; // Base score from effectiveness

    // Adjust for expected impact
    score += strategy.expectedImpact * 0.5;

    // Adjust for implementation cost (prefer lower cost)
    const costPenalty = { 'LOW': 0, 'MEDIUM': -10, 'HIGH': -20 };
    score += costPenalty[strategy.implementationCost];

    // Adjust for project size (larger projects can handle higher cost strategies)
    if (_projectFeatures.totalCost > 100000000 && strategy.implementationCost === 'HIGH') {
      score += 15; // Large projects can afford high-cost strategies
    }

    // Adjust for project complexity
    if (_projectFeatures.technicalComplexityScore > 0.7 && strategy.strategyName.includes('Engineering')) {
      score += 10; // Complex projects benefit more from engineering solutions
    }

    // Adjust for location factors
    if (_projectFeatures.remotenessScore > 0.6 && strategy.strategyName.includes('Local')) {
      score += 15; // Remote projects benefit from local capacity building
    }

    return Math.max(0, score);
  }

  /**
   * Prioritize strategies based on overall risk level
   */
  private prioritizeStrategies(
    strategies: MitigationStrategy[],
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): MitigationStrategy[] {
    // Remove duplicates
    const uniqueStrategies = strategies.filter((strategy, index, self) => 
      index === self.findIndex(s => s.id === strategy.id)
    );

    // Sort by effectiveness and expected impact
    return uniqueStrategies.sort((a, b) => {
      // Prioritize high-impact strategies for high-risk projects
      if (overallRiskLevel === 'HIGH') {
        return (b.expectedImpact * b.effectiveness) - (a.expectedImpact * a.effectiveness);
      }
      
      // For lower risk, consider cost-effectiveness
      const aScore = a.expectedImpact * a.effectiveness / this.getCostWeight(a.implementationCost);
      const bScore = b.expectedImpact * b.effectiveness / this.getCostWeight(b.implementationCost);
      return bScore - aScore;
    });
  }

  /**
   * Prioritize action items based on impact and urgency
   */
  private prioritizeActions(actions: ActionItem[], riskImpact: string): ActionItem[] {
    return actions.sort((a, b) => {
      // Priority order: HIGH > MEDIUM > LOW
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, prefer shorter timeline for high-impact risks
      if (riskImpact === 'HIGH') {
        return this.parseTimelineWeeks(a.timeline) - this.parseTimelineWeeks(b.timeline);
      }
      
      return 0;
    });
  }

  /**
   * Check if an action is a quick win (can be completed in 2 weeks or less)
   */
  private isQuickWin(timeline: string): boolean {
    const weeks = this.parseTimelineWeeks(timeline);
    return weeks <= 2;
  }

  /**
   * Parse timeline string to extract weeks
   */
  private parseTimelineWeeks(timeline: string): number {
    const match = timeline.match(/(\d+)(?:-(\d+))?\s*weeks?/i);
    if (match) {
      return match[2] ? parseInt(match[2]) : parseInt(match[1]);
    }
    
    // Handle other formats
    if (timeline.includes('week')) {
      const weekMatch = timeline.match(/(\d+)/);
      return weekMatch ? parseInt(weekMatch[1]) : 4;
    }
    
    return 4; // Default to 4 weeks if can't parse
  }

  /**
   * Get cost weight for prioritization
   */
  private getCostWeight(cost: string): number {
    const weights: Record<string, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    return weights[cost] || 2;
  }

  /**
   * Aggregate implementation costs
   */
  private aggregateCost(costs: string[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const costValues: Record<string, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    const avgCost = costs.reduce((sum, cost) => sum + (costValues[cost] || 2), 0) / costs.length;
    
    if (avgCost <= 1.5) return 'LOW';
    if (avgCost <= 2.5) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Aggregate implementation times
   */
  private aggregateTime(times: string[]): string {
    const totalWeeks = times.reduce((sum, time) => {
      return sum + this.parseTimelineWeeks(time);
    }, 0);
    
    const avgWeeks = totalWeeks / times.length;
    
    if (avgWeeks <= 4) return `${Math.ceil(avgWeeks)} weeks`;
    if (avgWeeks <= 12) return `${Math.ceil(avgWeeks)} weeks`;
    return `${Math.ceil(avgWeeks / 4)} months`;
  }

  /**
   * Estimate budget for strategies
   */
  private estimateBudget(strategies: MitigationStrategy[]): {
    low: number;
    medium: number;
    high: number;
  } {
    const costMapping = {
      'LOW': { low: 10000, medium: 25000, high: 50000 },
      'MEDIUM': { low: 50000, medium: 100000, high: 200000 },
      'HIGH': { low: 200000, medium: 500000, high: 1000000 }
    };

    let totalLow = 0;
    let totalMedium = 0;
    let totalHigh = 0;

    strategies.forEach(strategy => {
      const costs = costMapping[strategy.implementationCost];
      totalLow += costs.low;
      totalMedium += costs.medium;
      totalHigh += costs.high;
    });

    return {
      low: totalLow,
      medium: totalMedium,
      high: totalHigh
    };
  }

  /**
   * Calculate expected risk reduction across all recommendations
   */
  private calculateExpectedRiskReduction(recommendations: RiskMitigationRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    const totalReduction = recommendations.reduce(
      (sum, rec) => sum + rec.estimatedRiskReduction, 0
    );
    
    return Math.min(100, totalReduction / recommendations.length);
  }

  /**
   * Estimate overall implementation timeline
   */
  private estimateTimeline(strategies: MitigationStrategy[]): string {
    if (strategies.length === 0) return '0 weeks';
    
    const maxWeeks = Math.max(...strategies.map(s => this.parseTimelineWeeks(s.implementationTime)));
    
    if (maxWeeks <= 4) return `${maxWeeks} weeks`;
    if (maxWeeks <= 12) return `${maxWeeks} weeks`;
    return `${Math.ceil(maxWeeks / 4)} months`;
  }

  /**
   * Get mitigation strategies by type and severity (public method for API)
   */
  public getMitigationStrategies(
    riskType?: 'COST_OVERRUN' | 'DELAY' | 'ENVIRONMENTAL' | 'RESOURCE',
    severity?: 'LOW' | 'MEDIUM' | 'HIGH'
  ): MitigationStrategy[] {
    let filteredStrategies = [...this.mitigationDatabase];

    if (riskType) {
      filteredStrategies = filteredStrategies.filter(s => s.riskType === riskType);
    }

    if (severity) {
      filteredStrategies = filteredStrategies.filter(s => s.riskSeverity === severity);
    }

    return filteredStrategies;
  }

  /**
   * Get specific mitigation strategy by ID
   */
  public getMitigationStrategy(strategyId: string): MitigationStrategy | null {
    return this.mitigationDatabase.find(s => s.id === strategyId) || null;
  }

  /**
   * Add new mitigation strategy to database
   */
  public addMitigationStrategy(strategy: MitigationStrategy): void {
    // Check for duplicate IDs
    if (this.mitigationDatabase.some(s => s.id === strategy.id)) {
      throw new Error(`Strategy with ID ${strategy.id} already exists`);
    }
    
    this.mitigationDatabase.push(strategy);
  }

  /**
   * Update existing mitigation strategy
   */
  public updateMitigationStrategy(strategyId: string, updates: Partial<MitigationStrategy>): boolean {
    const index = this.mitigationDatabase.findIndex(s => s.id === strategyId);
    
    if (index === -1) {
      return false;
    }
    
    this.mitigationDatabase[index] = {
      ...this.mitigationDatabase[index],
      ...updates,
      lastUpdated: new Date()
    };
    
    return true;
  }

  /**
   * Remove mitigation strategy from database
   */
  public removeMitigationStrategy(strategyId: string): boolean {
    const index = this.mitigationDatabase.findIndex(s => s.id === strategyId);
    
    if (index === -1) {
      return false;
    }
    
    this.mitigationDatabase.splice(index, 1);
    return true;
  }

  /**
   * Get database statistics
   */
  public getDatabaseStats(): {
    totalStrategies: number;
    strategiesByType: Record<string, number>;
    strategiesBySeverity: Record<string, number>;
    lastUpdated: Date;
  } {
    const strategiesByType = this.mitigationDatabase.reduce((acc, strategy) => {
      acc[strategy.riskType] = (acc[strategy.riskType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const strategiesBySeverity = this.mitigationDatabase.reduce((acc, strategy) => {
      acc[strategy.riskSeverity] = (acc[strategy.riskSeverity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lastUpdated = this.mitigationDatabase.reduce((latest, strategy) => {
      return strategy.lastUpdated > latest ? strategy.lastUpdated : latest;
    }, new Date(0));

    return {
      totalStrategies: this.mitigationDatabase.length,
      strategiesByType,
      strategiesBySeverity,
      lastUpdated
    };
  }

  /**
   * Calculate implementation cost estimates
   */
  private calculateCostEstimates(strategies: MitigationStrategy[]): { low: number; medium: number; high: number } {
    // Base cost estimates (in thousands)
    const baseCosts = { 'LOW': 50, 'MEDIUM': 200, 'HIGH': 500 };
    
    let low = 0, medium = 0, high = 0;
    
    strategies.forEach(strategy => {
      const baseCost = baseCosts[strategy.implementationCost];
      low += baseCost * 0.8;
      medium += baseCost;
      high += baseCost * 1.5;
    });
    
    return { low, medium, high };
  }
}