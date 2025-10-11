import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
} from '@mui/material';
import {
  Schedule as ProcessingIcon,
  CheckCircle as CompletedIcon,
  Assessment as AnalysisIcon,
} from '@mui/icons-material';
import { dashboardApi } from '../../services/api';

interface ProcessingStatusProps {
  onNewResults?: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ onNewResults }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${API_BASE_URL}/api/processing/status`);
        const data = await response.json();
        
        // Check if there are new completed analyses
        if (status && data.completed > status.completed && onNewResults) {
          onNewResults();
        }
        
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch processing status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [status, onNewResults]);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Processing Status" />
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading processing status...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!status || status.total === 0) {
    return (
      <Card>
        <CardHeader title="Processing Status" />
        <CardContent>
          <Alert severity="info">
            No documents uploaded yet. Upload some DPR documents to start analysis.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = status.total > 0 ? (status.completed / status.total) * 100 : 0;

  return (
    <Card>
      <CardHeader 
        title="Processing Status"
        subheader={`${status.completed}/${status.total} documents analyzed`}
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProcessingIcon color="warning" />
            <Typography variant="body2">
              {status.processing} Processing
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompletedIcon color="success" />
            <Typography variant="body2">
              {status.completed} Completed
            </Typography>
          </Box>
        </Box>

        {status.processing > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {status.processing} document{status.processing > 1 ? 's are' : ' is'} currently being analyzed. 
              Results will appear automatically when ready.
            </Typography>
          </Alert>
        )}

        {status.recentlyCompleted && status.recentlyCompleted.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Recently Completed
            </Typography>
            <List dense>
              {status.recentlyCompleted.map((result: any) => (
                <ListItem key={result.dprId} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <AnalysisIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={result.documentName}
                    secondary={
                      <React.Fragment>
                        <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={`${Math.round(result.completenessScore)}% Complete`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={result.riskLevel}
                            size="small"
                            color={result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL' ? 'error' : 
                                   result.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                            variant="outlined"
                          />
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;