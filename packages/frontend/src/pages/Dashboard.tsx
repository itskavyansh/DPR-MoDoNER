import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import SummaryCard from '../components/Dashboard/SummaryCard';
import RecentAnalysis from '../components/Dashboard/RecentAnalysis';
import ProcessingStatus from '../components/Dashboard/ProcessingStatus';
import DocumentUpload from '../components/Upload/DocumentUpload';
import { DashboardSummary, AnalysisResults } from '../types/dashboard';
import { dashboardApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previousAnalysesCount, setPreviousAnalysesCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard summary and recent analyses
      const [summaryData, analysesData] = await Promise.all([
        dashboardApi.getSummary().catch(() => ({
          totalDocuments: 5,
          processingDocuments: 1,
          completedAnalyses: 4,
          averageCompletenessScore: 78,
          averageFeasibilityScore: 72,
          highRiskProjects: 1,
        })),
        dashboardApi.getAllAnalysisResults().catch((error) => {
          console.error('Failed to load analysis results:', error);
          // Return mock data when API is not available
          return [
            {
              dprId: '1',
              documentName: 'Highway Project DPR.pdf',
              completenessScore: 85,
              feasibilityRating: 78,
              riskLevel: 'MEDIUM' as const,
              priceDeviationPercentage: 12.5,
              schemeMatches: 3,
              analysisTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              status: 'COMPLETED' as const,
            },
            {
              dprId: '2',
              documentName: 'Water Supply Project.pdf',
              completenessScore: 92,
              feasibilityRating: 88,
              riskLevel: 'LOW' as const,
              priceDeviationPercentage: -5.2,
              schemeMatches: 5,
              analysisTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              status: 'COMPLETED' as const,
            },
            {
              dprId: '3',
              documentName: 'School Building DPR.pdf',
              completenessScore: 67,
              feasibilityRating: 54,
              riskLevel: 'HIGH' as const,
              priceDeviationPercentage: 28.3,
              schemeMatches: 2,
              analysisTimestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              status: 'COMPLETED' as const,
            },
          ];
        }),
      ]);

      setSummary(summaryData);
      console.log('Analysis data received:', analysesData, 'Type:', typeof analysesData, 'Is Array:', Array.isArray(analysesData));
      
      const validAnalysesData = Array.isArray(analysesData) ? analysesData : [];
      const recentAnalysesData = validAnalysesData.slice(0, 10); // Show only recent 10
      
      // Check for new analysis results
      if (validAnalysesData.length > previousAnalysesCount && previousAnalysesCount > 0) {
        const newCount = validAnalysesData.length - previousAnalysesCount;
        setSuccessMessage(`${newCount} new analysis result${newCount > 1 ? 's' : ''} available!`);
      }
      
      setRecentAnalyses(recentAnalysesData);
      setPreviousAnalysesCount(validAnalysesData.length);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (dprId: string) => {
    navigate(`/analysis/${dprId}`);
  };

  const handleDownloadReport = async (dprId: string) => {
    try {
      const blob = await dashboardApi.generateReport(dprId, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dpr-analysis-${dprId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('Report downloaded successfully');
    } catch (err) {
      setError('Failed to download report. Please try again.');
    }
  };

  const handleUploadComplete = (documents: any[]) => {
    setSuccessMessage(`${documents.length} document(s) uploaded successfully and analysis started`);
    // Immediate refresh, then the polling will handle updates
    loadDashboardData();
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('dashboard.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        {t('dashboard.welcome')}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title={t('dashboard.totalDocuments')}
            value={summary?.totalDocuments || 0}
            subtitle={t('upload.uploaded')}
            icon={<UploadIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title={t('dashboard.completedAnalysis')}
            value={summary?.completedAnalyses || 0}
            subtitle={t('upload.completed')}
            icon={<CheckCircleIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title={t('upload.processing')}
            value={summary?.processingDocuments || 0}
            subtitle={(summary?.processingDocuments ?? 0) > 0 ? t('upload.processing') + "..." : t('upload.uploadProgress')}
            icon={<AssessmentIcon />}
            color={(summary?.processingDocuments ?? 0) > 0 ? "warning" : "info"}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title={t('dashboard.averageScore')}
            value={summary ? `${Math.round(summary.averageCompletenessScore)}%` : '0%'}
            subtitle={t('analysis.completenessScore')}
            icon={<DashboardIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title={t('analysis.feasibilityRating')}
            value={summary ? `${Math.round(summary.averageFeasibilityScore)}%` : '0%'}
            subtitle={t('analysis.feasibilityRating')}
            icon={<TrendingUpIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title={t('dashboard.pendingReviews')}
            value={summary?.highRiskProjects || 0}
            subtitle={t('analysis.riskLevel')}
            icon={<WarningIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Document Upload Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProcessingStatus onNewResults={loadDashboardData} />
        </Grid>
      </Grid>

      {/* Recent Analysis Results */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RecentAnalysis
            analyses={recentAnalyses}
            loading={loading}
            onViewDetails={handleViewDetails}
            onDownloadReport={handleDownloadReport}
          />
        </Grid>
      </Grid>

      {/* Error and Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;