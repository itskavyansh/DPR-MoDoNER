import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';

interface ReportData {
  dprId: string;
  documentName: string;
  completenessScore: number;
  feasibilityRating: number;
  riskLevel: string;
  analysisTimestamp: Date;
  reportGenerated: boolean;
  reportSize?: string;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [selectedDpr, setSelectedDpr] = useState<string | null>(null);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const [documentsData, analysesData] = await Promise.all([
        dashboardApi.getDocuments().catch(() => []),
        dashboardApi.getAllAnalysisResults().catch(() => []),
      ]);

      const reportsData: ReportData[] = (Array.isArray(documentsData) ? documentsData : [])
        .map(doc => {
          const analysis = (Array.isArray(analysesData) ? analysesData : [])
            .find(a => a.dprId === doc.id);
          
          if (!analysis) return null;
          
          return {
            dprId: doc.id,
            documentName: doc.originalFileName,
            completenessScore: analysis.completenessScore,
            feasibilityRating: analysis.feasibilityRating,
            riskLevel: analysis.riskLevel,
            analysisTimestamp: analysis.analysisTimestamp,
            reportGenerated: true, // Simulate that reports can be generated
            reportSize: '2.4 MB'
          };
        })
        .filter(Boolean) as ReportData[];

      setReports(reportsData);
    } catch (err) {
      setError('Failed to load reports data');
      console.error('Reports loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedDpr) return;
    
    setGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real system, this would call the backend to generate the report
      const reportBlob = await generateMockReport(selectedDpr, reportFormat);
      
      // Download the report
      const url = window.URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DPR-Analysis-Report-${selectedDpr}.${reportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setGenerateDialog(false);
      setSelectedDpr(null);
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const generateMockReport = async (dprId: string, format: 'pdf' | 'excel'): Promise<Blob> => {
    // This is a mock function. In a real system, this would call the backend API
    const report = reports.find(r => r.dprId === dprId);
    
    if (format === 'pdf') {
      // Generate mock PDF content
      const pdfContent = `
        DPR ANALYSIS REPORT
        ===================
        
        Document: ${report?.documentName}
        Analysis Date: ${report?.analysisTimestamp}
        
        EXECUTIVE SUMMARY
        -----------------
        Completeness Score: ${report?.completenessScore}%
        Feasibility Rating: ${report?.feasibilityRating}%
        Risk Level: ${report?.riskLevel}
        
        DETAILED ANALYSIS
        -----------------
        This is a comprehensive analysis report for the uploaded DPR document.
        The analysis includes gap analysis, price comparison, risk assessment,
        feasibility evaluation, and government scheme matching.
        
        RECOMMENDATIONS
        ---------------
        Based on the analysis, the following recommendations are provided:
        1. Address missing components identified in gap analysis
        2. Review flagged price items for cost optimization
        3. Implement risk mitigation strategies
        4. Consider applicable government schemes for funding
        
        Generated by DPR Quality Assessment System
        Ministry of Development of North Eastern Region
      `;
      
      return new Blob([pdfContent], { type: 'application/pdf' });
    } else {
      // Generate mock Excel content
      const excelContent = `Document Name,Completeness Score,Feasibility Rating,Risk Level,Analysis Date
${report?.documentName},${report?.completenessScore},${report?.feasibilityRating},${report?.riskLevel},${report?.analysisTimestamp}`;
      
      return new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
  };

  const handleViewReport = (dprId: string) => {
    navigate(`/analysis/${dprId}`);
  };

  const handleDownloadReport = (dprId: string) => {
    setSelectedDpr(dprId);
    setGenerateDialog(true);
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Reports Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        DPR Analysis Reports
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Generate and download comprehensive analysis reports for your DPR documents
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Reports Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload and analyze DPR documents to generate reports
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
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Reports
                </Typography>
                <Typography variant="h3" color="primary">
                  {reports.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available for download
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  High Quality DPRs
                </Typography>
                <Typography variant="h3" color="success.main">
                  {reports.filter(r => r.completenessScore >= 80 && r.feasibilityRating >= 70).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ready for approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  High Risk Projects
                </Typography>
                <Typography variant="h3" color="error.main">
                  {reports.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Reports Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Reports
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Name</TableCell>
                        <TableCell align="center">Completeness</TableCell>
                        <TableCell align="center">Feasibility</TableCell>
                        <TableCell align="center">Risk Level</TableCell>
                        <TableCell align="center">Analysis Date</TableCell>
                        <TableCell align="center">Report Size</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.dprId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ReportIcon color="primary" />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {report.documentName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: report.completenessScore >= 80 ? 'success.main' : 
                                       report.completenessScore >= 60 ? 'warning.main' : 'error.main'
                              }}
                            >
                              {Math.round(report.completenessScore)}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: report.feasibilityRating >= 70 ? 'success.main' : 
                                       report.feasibilityRating >= 50 ? 'warning.main' : 'error.main'
                              }}
                            >
                              {Math.round(report.feasibilityRating)}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={report.riskLevel}
                              color={getRiskColor(report.riskLevel) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(report.analysisTimestamp)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {report.reportSize}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="View Analysis">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewReport(report.dprId)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Report">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadReport(report.dprId)}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Analysis Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the format for your comprehensive DPR analysis report
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Report Format</InputLabel>
            <Select
              value={reportFormat}
              label="Report Format"
              onChange={(e) => setReportFormat(e.target.value as 'pdf' | 'excel')}
            >
              <MenuItem value="pdf">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PdfIcon color="error" />
                  PDF Report (Comprehensive)
                </Box>
              </MenuItem>
              <MenuItem value="excel">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ExcelIcon color="success" />
                  Excel Report (Data Export)
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info">
            {reportFormat === 'pdf' 
              ? 'PDF report includes detailed analysis, charts, and recommendations'
              : 'Excel report includes structured data for further analysis'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            variant="contained"
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {generating ? 'Generating...' : 'Generate & Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;