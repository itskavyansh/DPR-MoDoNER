import React from 'react';
import { Typography, Box } from '@mui/material';
import DocumentUpload from '../components/Upload/DocumentUpload';

const Upload: React.FC = () => {
  const handleUploadComplete = (documents: any[]) => {
    console.log('Upload completed:', documents);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Upload Documents
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Upload DPR documents for quality assessment and risk analysis
      </Typography>
      
      <DocumentUpload onUploadComplete={handleUploadComplete} />
    </Box>
  );
};

export default Upload;