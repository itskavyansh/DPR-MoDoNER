import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Assessment as AnalysisIcon,
  Schedule as ProcessingIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';

interface DPRDocument {
  id: string;
  originalFileName: string;
  fileType: string;
  uploadTimestamp: Date;
  fileSize: number;
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface AnalysisResult {
  dprId: string;
  documentName: string;
  completenessScore: number;
  feasibilityRating: number;
  riskLevel: string;
  priceDeviationPercentage: number;
  schemeMatches: number;
  analysisTimestamp: Date;
  status: string;
}

const Analysis: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DPRDocument[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [documentsData, analysesData] = await Promise.all([
        dashboardApi.getDocuments().catch(() => []),
        dashboardApi.getAllAnalysisResults().catch(() => []),
      ]);

      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setAnalyses(Array.isArray(analysesData) ? analysesData : []);
      setError(null);
    } catch (err) {
      setError('Failed to load analysis data');
      console.error('Analysis loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisForDocument = (docId: string) => {
    return analyses.find(analysis => analysis.dprId === docId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CompletedIcon color="success" />;
      case 'PROCESSING':
        return <ProcessingIcon color="warning" />;
      case 'FAILED':
        return <ErrorIcon color="error" />;
      default:
        return <ProcessingIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewAnalysis = (docId: string) => {
    navigate(`/analysis/${docId}`);
  };

  const handleDownloadReport = async (docId: string) => {
    try {
      // This would generate and download a PDF report
      const analysis = getAnalysisForDocument(docId);
      if (analysis) {
        // For now, navigate to reports page
        navigate(`/reports/${docId}`);
      }
    } catch (err) {
      setError('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading DPR Analysis Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        DPR Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Detailed analysis results for each uploaded DPR document
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AnalysisIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No DPR Documents Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload DPR documents from the Dashboard to start analysis
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Documents
                </Typography>
                <Typography variant="h3" color="primary">
                  {documents.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completed Analysis
                </Typography>
                <Typography variant="h3" color="success.main">
                  {analyses.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {documents.filter(doc => doc.processingStatus === 'PROCESSING').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  High Risk
                </Typography>
                <Typography variant="h3" color="error.main">
                  {analyses.filter(analysis => analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Documents Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  DPR Documents & Analysis Results
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Name</TableCell>
                        <TableCell>File Info</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Completeness</TableCell>
                        <TableCell align="center">Feasibility</TableCell>
                        <TableCell align="center">Risk Level</TableCell>
                        <TableCell align="center">Price Deviation</TableCell>
                        <TableCell align="center">Upload Date</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents.map((document) => {
                        const analysis = getAnalysisForDocument(document.id);
                        return (
                          <TableRow key={document.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(document.processingStatus)}
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {document.originalFileName}
                                  </Typography>
                                  {document.processingStatus === 'PROCESSING' && (
                                    <LinearProgress size="small" sx={{ mt: 0.5, width: 200 }} />
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {document.fileType} • {formatFileSize(document.fileSize)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={document.processingStatus.replace('_', ' ')}
                                color={getStatusColor(document.processingStatus) as any}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {analysis ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: analysis.completenessScore >= 80 ? 'success.main' : 
                                           analysis.completenessScore >= 60 ? 'warning.main' : 'error.main'
                                  }}
                                >
                                  {Math.round(analysis.completenessScore)}%
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {analysis ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: analysis.feasibilityRating >= 70 ? 'success.main' : 
                                           analysis.feasibilityRating >= 50 ? 'warning.main' : 'error.main'
                                  }}
                                >
                                  {Math.round(analysis.feasibilityRating)}%
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {analysis ? (
                                <Chip
                                  label={analysis.riskLevel}
                                  color={getRiskColor(analysis.riskLevel) as any}
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {analysis ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: Math.abs(analysis.priceDeviationPercentage) > 20 ? 'error.main' : 
                                           Math.abs(analysis.priceDeviationPercentage) > 10 ? 'warning.main' : 'success.main'
                                  }}
                                >
                                  {analysis.priceDeviationPercentage > 0 ? '+' : ''}{analysis.priceDeviationPercentage.toFixed(1)}%
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(document.uploadTimestamp)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="View Detailed Analysis">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewAnalysis(document.id)}
                                    disabled={!analysis}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownloadReport(document.id)}
                                    disabled={!analysis}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analysis;