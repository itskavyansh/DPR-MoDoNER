// Dashboard-specific types
export interface DashboardSummary {
  totalDocuments: number;
  processingDocuments: number;
  completedAnalyses: number;
  averageCompletenessScore: number;
  averageFeasibilityScore: number;
  highRiskProjects: number;
}

export interface AnalysisResults {
  dprId: string;
  documentName: string;
  completenessScore: number;
  feasibilityRating: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priceDeviationPercentage: number;
  schemeMatches: number;
  analysisTimestamp: Date;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

export interface UserSession {
  userId: string;
  username: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  permissions: string[];
  lastActivity: Date;
  sessionToken: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  children?: NavigationItem[];
  permissions?: string[];
}