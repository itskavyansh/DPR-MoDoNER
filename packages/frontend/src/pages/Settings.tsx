import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Configure system settings and preferences
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will provide options to configure language preferences,
            analysis parameters, and system settings.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;