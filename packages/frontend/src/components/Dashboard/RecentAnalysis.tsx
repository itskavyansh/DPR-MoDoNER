import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { AnalysisResults } from '../../types/dashboard';

interface RecentAnalysisProps {
  analyses: AnalysisResults[];
  loading?: boolean;
  onViewDetails: (dprId: string) => void;
  onDownloadReport: (dprId: string) => void;
}

const RecentAnalysis: React.FC<RecentAnalysisProps> = ({
  analyses,
  loading = false,
  onViewDetails,
  onDownloadReport,
}) => {
  // Ensure analyses is always an array
  const safeAnalyses = Array.isArray(analyses) ? analyses : [];
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatScore = (score: number) => {
    return `${Math.round(score)}%`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Recent Analysis Results" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Completeness</TableCell>
                  <TableCell>Feasibility</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton width="150px" /></TableCell>
                    <TableCell><Skeleton width="60px" /></TableCell>
                    <TableCell><Skeleton width="60px" /></TableCell>
                    <TableCell><Skeleton width="80px" /></TableCell>
                    <TableCell><Skeleton width="100px" /></TableCell>
                    <TableCell><Skeleton width="80px" /></TableCell>
                    <TableCell><Skeleton width="80px" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  }

  if (safeAnalyses.length === 0) {
    return (
      <Card>
        <CardHeader title="Recent Analysis Results" />
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {loading ? 'Loading analysis results...' : 'No analysis results available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Please wait while we fetch the latest data' : 'Upload and analyze DPR documents to see results here'}
            </Typography>
            {loading && (
              <Box sx={{ mt: 2, width: '200px' }}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Recent Analysis Results"
        subheader={`${safeAnalyses.length} recent analyses`}
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document Name</TableCell>
                <TableCell align="center">Completeness</TableCell>
                <TableCell align="center">Feasibility</TableCell>
                <TableCell align="center">Risk Level</TableCell>
                <TableCell align="center">Price Deviation</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeAnalyses.map((analysis) => (
                <TableRow
                  key={analysis.dprId}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {analysis.documentName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: analysis.completenessScore >= 80 ? 'success.main' : 
                               analysis.completenessScore >= 60 ? 'warning.main' : 'error.main'
                      }}
                    >
                      {formatScore(analysis.completenessScore)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: analysis.feasibilityRating >= 70 ? 'success.main' : 
                               analysis.feasibilityRating >= 50 ? 'warning.main' : 'error.main'
                      }}
                    >
                      {formatScore(analysis.feasibilityRating)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={analysis.riskLevel}
                      color={getRiskLevelColor(analysis.riskLevel) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
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
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={analysis.status.replace('_', ' ')}
                      color={getStatusColor(analysis.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(analysis.analysisTimestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onViewDetails(analysis.dprId)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Report">
                        <IconButton
                          size="small"
                          onClick={() => onDownloadReport(analysis.dprId)}
                          disabled={analysis.status !== 'COMPLETED'}
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
  );
};

export default RecentAnalysis;