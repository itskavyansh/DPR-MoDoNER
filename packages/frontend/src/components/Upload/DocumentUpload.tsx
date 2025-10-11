import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
// Constants - will be replaced with proper shared package import
const FILE_LIMITS = {
  PDF_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  DOCX_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  TXT_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_BATCH_SIZE: 10,
} as const;

const SUPPORTED_FILE_TYPES = ['PDF', 'DOCX', 'TXT'] as const;
import { dashboardApi } from '../../services/api';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: (documents: any[]) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    const fileType = file.name.split('.').pop()?.toUpperCase() as keyof typeof FILE_LIMITS;
    
    if (!SUPPORTED_FILE_TYPES.includes(fileType as any)) {
      return `Unsupported file type. Supported formats: ${SUPPORTED_FILE_TYPES.join(', ')}`;
    }

    const maxSize = FILE_LIMITS[`${fileType}_MAX_SIZE` as keyof typeof FILE_LIMITS];
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size exceeds ${maxSizeMB}MB limit for ${fileType} files`;
    }

    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}`,
      progress: 0,
      status: 'pending',
    }));

    // Validate files
    const validatedFiles = newFiles.map((uploadFile) => {
      const error = validateFile(uploadFile.file);
      if (error) {
        return { ...uploadFile, status: 'error' as const, error };
      }
      return uploadFile;
    });

    setFiles((prev) => [...prev, ...validatedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: FILE_LIMITS.MAX_BATCH_SIZE,
    disabled: isUploading,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = pendingFiles.map(async (uploadFile) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
          )
        );

        try {
          const result = await dashboardApi.uploadDocument(
            uploadFile.file,
            (progress) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress } : f
                )
              );
            }
          );

          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'completed', progress: 100 }
                : f
            )
          );

          return result;
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successful = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<any>).value);

      if (successful.length > 0 && onUploadComplete) {
        onUploadComplete(successful);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <FileIcon color={extension === 'pdf' ? 'error' : extension === 'docx' ? 'primary' : 'action'} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = files.filter((f) => f.status === 'pending');
  const completedFiles = files.filter((f) => f.status === 'completed');
  const errorFiles = files.filter((f) => f.status === 'error');

  return (
    <Card>
      <CardHeader
        title="Upload DPR Documents"
        subheader="Upload PDF, DOCX, or TXT files for analysis"
      />
      <CardContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50',
            },
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to select files
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {SUPPORTED_FILE_TYPES.map((type) => (
              <Chip key={type} label={type} size="small" variant="outlined" />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Max file sizes: PDF (50MB), DOCX (20MB), TXT (5MB) • Max {FILE_LIMITS.MAX_BATCH_SIZE} files
          </Typography>
        </Box>

        {files.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Files ({files.length})
              </Typography>
              {pendingFiles.length > 0 && (
                <Button
                  variant="contained"
                  onClick={uploadFiles}
                  disabled={isUploading}
                  startIcon={<UploadIcon />}
                >
                  Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
                </Button>
              )}
            </Box>

            <List>
              {files.map((uploadFile) => (
                <ListItem
                  key={uploadFile.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getFileIcon(uploadFile.file.name)}
                  </ListItemIcon>
                  <ListItemText
                    primary={uploadFile.file.name}
                    secondary={
                      <React.Fragment>
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          {formatFileSize(uploadFile.file.size)}
                        </Typography>
                        {uploadFile.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={uploadFile.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        {uploadFile.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {uploadFile.error}
                          </Alert>
                        )}
                      </React.Fragment>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(uploadFile.status)}
                    <IconButton
                      edge="end"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={uploadFile.status === 'uploading'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>

            {completedFiles.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {completedFiles.length} file{completedFiles.length > 1 ? 's' : ''} uploaded successfully!
              </Alert>
            )}

            {errorFiles.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorFiles.length} file{errorFiles.length > 1 ? 's' : ''} failed to upload. Please check the errors above.
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;