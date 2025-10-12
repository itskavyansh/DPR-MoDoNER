import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  Assessment,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { ReportGenerator } from '../components/Reports';
import { dashboardApi } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AnalysisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      loadAnalysisDetails(id);
    }
  }, [id]);

  const loadAnalysisDetails = async (dprId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analysis/${dprId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
      } else {
        throw new Error('Failed to load analysis details');
      }
    } catch (err) {
      setError('Failed to load analysis details. Please try again.');
      console.error('Analysis details loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toUpperCase()) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analysisData) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Analysis data not found'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          sx={{ textDecoration: 'none' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary">Analysis Details</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Analysis Details
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {analysisData.documentName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analysis completed on {new Date(analysisData.analysisTimestamp).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: getScoreColor(analysisData.completenessScore), fontWeight: 'bold' }}>
                {analysisData.completenessScore?.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completeness Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: getScoreColor(analysisData.feasibilityRating), fontWeight: 'bold' }}>
                {analysisData.feasibilityRating?.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Feasibility Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Chip
                label={analysisData.riskLevel}
                color={getRiskColor(analysisData.riskLevel) as any}
                sx={{ fontSize: '1rem', fontWeight: 'bold', minWidth: '80px' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Risk Level
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: Math.abs(analysisData.priceDeviationPercentage) > 15 ? 'error.main' : 
                         Math.abs(analysisData.priceDeviationPercentage) > 5 ? 'warning.main' : 'success.main',
                  fontWeight: 'bold' 
                }}
              >
                {analysisData.priceDeviationPercentage > 0 ? '+' : ''}{analysisData.priceDeviationPercentage?.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price Deviation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {analysisData.schemeMatches}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scheme Matches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed analysis */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analysis details tabs">
          <Tab label="Project Summary" />
          <Tab label="Gap Analysis" />
          <Tab label="Price Analysis" />
          <Tab label="Risk Analysis" />
          <Tab label="Scheme Analysis" />
          <Tab label="Feasibility Analysis" />
          <Tab label="Generate Reports" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {analysisData.projectSummary && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Project Information</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Project Type:</Typography>
                        <Typography variant="body2">{analysisData.projectSummary.projectType}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Location:</Typography>
                        <Typography variant="body2">{analysisData.projectSummary.location}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Department:</Typography>
                        <Typography variant="body2">{analysisData.projectSummary.department}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                        <Typography variant="body2">{analysisData.projectSummary.duration}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Estimated Cost:</Typography>
                        <Typography variant="body2">
                          ₹{(analysisData.projectSummary.estimatedCost / 10000000).toFixed(2)} Cr
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Strategic Importance</Typography>
                    <Typography variant="body2">
                      {analysisData.projectSummary.strategicImportance}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {analysisData.projectSummary.objectives && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Project Objectives</Typography>
                      <ul>
                        {analysisData.projectSummary.objectives.map((objective: string, index: number) => (
                          <li key={index}>
                            <Typography variant="body2">{objective}</Typography>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {analysisData.gapAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      ✅ Completed Sections
                    </Typography>
                    {analysisData.gapAnalysis.completedSections?.map((section: string, index: number) => (
                      <Chip
                        key={index}
                        label={section}
                        color="success"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error.main">
                      ❌ Missing Components
                    </Typography>
                    {analysisData.gapAnalysis.missingComponents?.map((component: string, index: number) => (
                      <Chip
                        key={index}
                        label={component}
                        color="error"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              {analysisData.gapAnalysis.recommendations && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>📋 Recommendations</Typography>
                      <ul>
                        {analysisData.gapAnalysis.recommendations.map((rec: string, index: number) => (
                          <li key={index}>
                            <Typography variant="body2">{rec}</Typography>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {analysisData.priceAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Price Comparison Overview</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" color="primary.main">
                            ₹{(analysisData.priceAnalysis.totalEstimate / 10000000).toFixed(2)} Cr
                          </Typography>
                          <Typography variant="body2" color="text.secondary">DPR Estimate</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" color="text.secondary">
                            ₹{(analysisData.priceAnalysis.regionalAverage / 10000000).toFixed(2)} Cr
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Regional Average</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant="h5" 
                            color={Math.abs(analysisData.priceDeviationPercentage) > 15 ? 'error.main' : 
                                   Math.abs(analysisData.priceDeviationPercentage) > 5 ? 'warning.main' : 'success.main'}
                          >
                            {analysisData.priceDeviationPercentage > 0 ? '+' : ''}{analysisData.priceDeviationPercentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Deviation</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {analysisData.riskAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Risk Factors</Typography>
                    {analysisData.riskAnalysis.riskFactors?.map((risk: any, index: number) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {risk.type}
                            </Typography>
                            <Chip
                              label={`${risk.impact} Impact`}
                              color={getRiskColor(risk.impact) as any}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {risk.description}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {analysisData.schemeAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Applicable Government Schemes ({analysisData.schemeAnalysis.applicableSchemes?.length || 0})
                    </Typography>
                    {analysisData.schemeAnalysis.applicableSchemes?.map((scheme: any, index: number) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {scheme.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip label={`${scheme.relevance}% Match`} color="primary" size="small" />
                              <Chip 
                                label={scheme.eligibility} 
                                color={scheme.eligibility === 'Fully Eligible' ? 'success' : 
                                       scheme.eligibility === 'Conditionally Eligible' ? 'warning' : 'error'} 
                                size="small" 
                              />
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Funding Range: {scheme.fundingRange}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          {analysisData.feasibilityAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.main" gutterBottom>
                      {analysisData.feasibilityAnalysis.completionProbability?.toFixed(1) || analysisData.feasibilityRating?.toFixed(1)}%
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Completion Probability
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Risk Breakdown</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Timeline Risk:</Typography>
                        <Chip 
                          label={analysisData.feasibilityAnalysis.timelineRisk || 'MEDIUM'} 
                          color={getRiskColor(analysisData.feasibilityAnalysis.timelineRisk || 'MEDIUM') as any} 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Resource Risk:</Typography>
                        <Chip 
                          label={analysisData.feasibilityAnalysis.resourceRisk || 'MEDIUM'} 
                          color={getRiskColor(analysisData.feasibilityAnalysis.resourceRisk || 'MEDIUM') as any} 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Technical Risk:</Typography>
                        <Chip 
                          label={analysisData.feasibilityAnalysis.technicalRisk || 'LOW'} 
                          color={getRiskColor(analysisData.feasibilityAnalysis.technicalRisk || 'LOW') as any} 
                          size="small" 
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <ReportGenerator
            documentId={analysisData.dprId}
            documentName={analysisData.documentName}
            onReportGenerated={(url) => {
              console.log('Report generated:', url);
            }}
          />
        </TabPanel>
      </Paper>

      {/* Recommendations */}
      {analysisData.recommendations && analysisData.recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Key Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analysisData.recommendations.map((recommendation: string, index: number) => (
                <Alert key={index} severity="info" variant="outlined">
                  {recommendation}
                </Alert>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AnalysisDetails;