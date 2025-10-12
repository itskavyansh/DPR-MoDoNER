import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

const Geospatial: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Geospatial View
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Interactive map visualization of project locations and site analysis
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Interactive Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will display an interactive map showing project locations, 
            site accessibility analysis, and geospatial verification results.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Geospatial;