import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assessment as AnalysisIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';

interface DetailedAnalysis {
  dprId: string;
  documentName: string;
  completenessScore: number;
  feasibilityRating: number;
  riskLevel: string;
  priceDeviationPercentage: number;
  schemeMatches: number;
  analysisTimestamp: Date;
  status: string;
  // Extended analysis data from backend
  documentInfo?: {
    originalFileName: string;
    fileType: string;
    fileSize: number;
    uploadTimestamp: Date;
    processingStatus: string;
  };
  projectSummary?: {
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
  };
  gapAnalysis?: {
    missingComponents: string[];
    completedSections: string[];
    recommendations: string[];
  };
  priceAnalysis?: {
    totalEstimate: number;
    regionalAverage: number;
    flaggedItems: Array<{
      item: string;
      dprCost: number;
      benchmarkCost: number;
      deviation: number;
    }>;
  };
  riskAnalysis?: {
    riskFactors: Array<{
      type: string;
      description: string;
      impact: string;
      mitigation: string;
    }>;
  };
  schemeAnalysis?: {
    applicableSchemes: Array<{
      name: string;
      relevance: number;
      fundingRange: string;
      eligibility: string;
    }>;
  };
  feasibilityAnalysis?: {
    completionProbability: number;
    timelineRisk: string;
    resourceRisk: string;
    technicalRisk: string;
  };
  recommendations?: string[];
}

const AnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDetailedAnalysis(id);
    }
  }, [id]);

  const loadDetailedAnalysis = async (dprId: string) => {
    try {
      setLoading(true);
      
      // Get basic analysis data
      const basicAnalysis = await dashboardApi.getAnalysisResults(dprId).catch(() => null);
      
      if (!basicAnalysis) {
        setError('Analysis not found for this document');
        return;
      }

      // Ensure all required fields have default values
      const safeAnalysis = {
        ...basicAnalysis,
        completenessScore: basicAnalysis.completenessScore || 0,
        feasibilityRating: basicAnalysis.feasibilityRating || 0,
        priceDeviationPercentage: basicAnalysis.priceDeviationPercentage || 0,
        riskLevel: basicAnalysis.riskLevel || 'UNKNOWN',
        schemeMatches: basicAnalysis.schemeMatches || 0
      };

      // Get detailed analysis data from backend (now uses real data)
      const detailedAnalysis: DetailedAnalysis = safeAnalysis;

      setAnalysis(detailedAnalysis);
    } catch (err) {
      setError('Failed to load detailed analysis');
      console.error('Detailed analysis loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Detailed Analysis...
        </Typography>
      </Box>
    );
  }

  if (error || !analysis) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/analysis')} sx={{ mb: 2 }}>
          Back to Analysis
        </Button>
        <Alert severity="error">
          {error || 'Analysis not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/analysis')} sx={{ mb: 2 }}>
          Back to Analysis
        </Button>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Detailed DPR Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {analysis.documentName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`${Math.round(analysis.completenessScore)}% Complete`} color="primary" />
          <Chip label={`${Math.round(analysis.feasibilityRating)}% Feasible`} color="success" />
          <Chip label={analysis.riskLevel} color={getRiskColor(analysis.riskLevel) as any} />
          <Chip label={`${(analysis.priceDeviationPercentage || 0) > 0 ? '+' : ''}${(analysis.priceDeviationPercentage || 0).toFixed(1)}% Price Deviation`} 
                color={Math.abs(analysis.priceDeviationPercentage || 0) > 15 ? 'error' : 'warning'} />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {Math.round(analysis.completenessScore)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completeness Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main">
                {Math.round(analysis.feasibilityRating)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Feasibility Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: getRiskColor(analysis.riskLevel) + '.main', mb: 1 }} />
              <Typography variant="h4" color={getRiskColor(analysis.riskLevel) + '.main'}>
                {analysis.riskLevel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Risk Level
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {(analysis.priceDeviationPercentage || 0) > 0 ? '+' : ''}{(analysis.priceDeviationPercentage || 0).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price Deviation
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Summary */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Project Summary" 
              avatar={<DocumentIcon color="primary" />}
            />
            <CardContent>
              {analysis.projectSummary ? (
                <Grid container spacing={3}>
                  {/* Basic Project Info */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {analysis.projectSummary.projectTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={analysis.projectSummary.projectType} size="small" color="primary" />
                        <Chip label={analysis.projectSummary.department} size="small" color="secondary" />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        Location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {analysis.projectSummary.location}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon fontSize="small" color="action" />
                        Estimated Cost
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(analysis.projectSummary.estimatedCost)}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="action" />
                        Duration & Beneficiaries
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {analysis.projectSummary.duration} • {analysis.projectSummary.beneficiaries}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Project Details */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Strategic Importance
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {analysis.projectSummary.strategicImportance}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Objectives
                      </Typography>
                      <List dense>
                        {analysis.projectSummary.objectives.map((objective, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <CheckIcon fontSize="small" color="success" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={objective} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>

                  {/* Key Components & Expected Outcomes */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Key Project Components
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {analysis.projectSummary.keyComponents.map((component, index) => (
                            <Chip 
                              key={index} 
                              label={component} 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                            />
                          ))}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Expected Outcomes
                        </Typography>
                        <List dense>
                          {analysis.projectSummary.expectedOutcomes.map((outcome, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 20 }}>
                                <TrendingUpIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={outcome} 
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  Project summary is being extracted from the DPR document...
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gap Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Gap Analysis" />
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Missing Components ({analysis.gapAnalysis?.missingComponents?.length || 0})
              </Typography>
              <List dense>
                {(analysis.gapAnalysis?.missingComponents || []).map((component, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary={component} />
                  </ListItem>
                ))}
                {(!analysis.gapAnalysis?.missingComponents || analysis.gapAnalysis.missingComponents.length === 0) && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="All required components are present" />
                  </ListItem>
                )}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Completed Sections ({analysis.gapAnalysis?.completedSections?.length || 0})
              </Typography>
              <List dense>
                {(analysis.gapAnalysis?.completedSections || []).slice(0, 3).map((section, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={section} />
                  </ListItem>
                ))}
                {(analysis.gapAnalysis?.completedSections?.length || 0) > 3 && (
                  <ListItem>
                    <ListItemText 
                      primary={`+${(analysis.gapAnalysis?.completedSections?.length || 0) - 3} more sections`}
                      sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
                {(!analysis.gapAnalysis?.completedSections || analysis.gapAnalysis.completedSections.length === 0) && (
                  <ListItem>
                    <ListItemText 
                      primary="Section analysis in progress..."
                      sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Price Analysis" />
            <CardContent>
              {analysis.priceAnalysis ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Estimate: <strong>{formatCurrency(analysis.priceAnalysis.totalEstimate)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Regional Average: <strong>{formatCurrency(analysis.priceAnalysis.regionalAverage)}</strong>
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Flagged Items ({analysis.priceAnalysis.flaggedItems?.length || 0})
                  </Typography>
                  {analysis.priceAnalysis.flaggedItems && analysis.priceAnalysis.flaggedItems.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">DPR Cost</TableCell>
                            <TableCell align="right">Benchmark</TableCell>
                            <TableCell align="right">Deviation</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analysis.priceAnalysis.flaggedItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.item}</TableCell>
                              <TableCell align="right">{formatCurrency(item.dprCost)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.benchmarkCost)}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  color={Math.abs(item.deviation) > 15 ? 'error.main' : 'warning.main'}
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="success">
                      No significant price deviations detected
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  Price analysis data is being generated...
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Risk Analysis" />
            <CardContent>
              <Grid container spacing={2}>
                {analysis.riskAnalysis.riskFactors.map((risk, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WarningIcon color={getRiskColor(risk.impact) as any} sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">
                          {risk.type}
                        </Typography>
                        <Chip 
                          label={risk.impact} 
                          size="small" 
                          color={getRiskColor(risk.impact) as any}
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {risk.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheme Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Applicable Government Schemes" />
            <CardContent>
              {analysis.schemeAnalysis.applicableSchemes.map((scheme, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {scheme.name}
                    </Typography>
                    <Chip 
                      label={`${scheme.relevance}% Match`} 
                      size="small" 
                      color={scheme.relevance > 80 ? 'success' : scheme.relevance > 60 ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Funding: {scheme.fundingRange}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {scheme.eligibility}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={scheme.relevance} 
                    sx={{ mt: 1 }}
                    color={scheme.relevance > 80 ? 'success' : scheme.relevance > 60 ? 'warning' : 'primary'}
                  />
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Feasibility Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Feasibility Analysis" />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Completion Probability
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={analysis.feasibilityAnalysis.completionProbability} 
                    sx={{ flexGrow: 1, height: 8 }}
                    color={analysis.feasibilityAnalysis.completionProbability > 70 ? 'success' : 'warning'}
                  />
                  <Typography variant="h6" color="primary">
                    {Math.round(analysis.feasibilityAnalysis.completionProbability)}%
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TimeIcon color={getRiskColor(analysis.feasibilityAnalysis.timelineRisk) as any} />
                    <Typography variant="caption" display="block">
                      Timeline Risk
                    </Typography>
                    <Chip 
                      label={analysis.feasibilityAnalysis.timelineRisk} 
                      size="small" 
                      color={getRiskColor(analysis.feasibilityAnalysis.timelineRisk) as any}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <MoneyIcon color={getRiskColor(analysis.feasibilityAnalysis.resourceRisk) as any} />
                    <Typography variant="caption" display="block">
                      Resource Risk
                    </Typography>
                    <Chip 
                      label={analysis.feasibilityAnalysis.resourceRisk} 
                      size="small" 
                      color={getRiskColor(analysis.feasibilityAnalysis.resourceRisk) as any}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AnalysisIcon color={getRiskColor(analysis.feasibilityAnalysis.technicalRisk) as any} />
                    <Typography variant="caption" display="block">
                      Technical Risk
                    </Typography>
                    <Chip 
                      label={analysis.feasibilityAnalysis.technicalRisk} 
                      size="small" 
                      color={getRiskColor(analysis.feasibilityAnalysis.technicalRisk) as any}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate(`/reports/${analysis.dprId}`)}
            >
              Generate Detailed Report
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/analysis')}
            >
              Back to Analysis List
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisDetail;