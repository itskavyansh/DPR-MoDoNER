import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  Settings,
  Tune
} from '@mui/icons-material';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  format: 'pdf' | 'excel' | 'both';
}

interface ReportGeneratorProps {
  documentId: string;
  documentName: string;
  onReportGenerated?: (reportUrl: string) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  documentId,
  documentName,
  onReportGenerated
}) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('detailed');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [includeDetailedBreakdown, setIncludeDetailedBreakdown] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  
  // Custom report options
  const [showCustom, setShowCustom] = useState(false);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [customTemplateName, setCustomTemplateName] = useState('');

  const availableSections = [
    { id: 'projectSummary', label: 'Project Summary', description: 'Basic project information and overview' },
    { id: 'keyMetrics', label: 'Key Metrics', description: 'Completeness, feasibility, and risk scores' },
    { id: 'gapAnalysis', label: 'Gap Analysis', description: 'Missing components and recommendations' },
    { id: 'priceAnalysis', label: 'Price Analysis', description: 'Cost comparison and flagged items' },
    { id: 'riskAnalysis', label: 'Risk Analysis', description: 'Risk factors and mitigation strategies' },
    { id: 'schemeAnalysis', label: 'Scheme Analysis', description: 'Government scheme matches and recommendations' },
    { id: 'feasibilityAnalysis', label: 'Feasibility Analysis', description: 'Completion probability and risk breakdown' },
    { id: 'recommendations', label: 'Recommendations', description: 'Action items and next steps' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/reports/templates');
      if (response.ok) {
        const templatesData = await response.json();
        setTemplates(templatesData);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let url: string;
      let options: any = {};

      if (showCustom && customSections.length > 0) {
        // Generate custom report
        options = {
          includeCharts,
          includeDetailedBreakdown,
          includeRawData
        };

        const response = await fetch(`/api/reports/${documentId}/custom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format,
            sections: customSections,
            options,
            templateName: customTemplateName || 'Custom Report'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate custom report');
        }

        const blob = await response.blob();
        url = window.URL.createObjectURL(blob);
      } else {
        // Generate standard report
        const params = new URLSearchParams({
          format,
          template: selectedTemplate,
          includeCharts: includeCharts.toString(),
          includeDetailedBreakdown: includeDetailedBreakdown.toString(),
          includeRawData: includeRawData.toString()
        });

        const response = await fetch(`/api/reports/${documentId}?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to generate report');
        }

        const blob = await response.blob();
        url = window.URL.createObjectURL(blob);
      }

      // Download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `dpr-analysis-${documentId}-${selectedTemplate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`${format.toUpperCase()} report generated successfully!`);
      onReportGenerated?.(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSectionToggle = (sectionId: string) => {
    setCustomSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Generate Report
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {documentName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Report Template</InputLabel>
              <Select
                value={selectedTemplate}
                label="Report Template"
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={showCustom}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTemplateData && !showCustom && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedTemplateData.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedTemplateData.sections.map((section) => {
                    const sectionInfo = availableSections.find(s => s.id === section);
                    return (
                      <Chip
                        key={section}
                        label={sectionInfo?.label || section}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e) => setFormat(e.target.value as 'pdf' | 'excel')}
              >
                <MenuItem value="pdf">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PictureAsPdf />
                    PDF Document
                  </Box>
                </MenuItem>
                <MenuItem value="excel">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableChart />
                    Excel Spreadsheet
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<Tune />}
            onClick={() => setShowCustom(!showCustom)}
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          >
            Custom Report
          </Button>
          <Button
            startIcon={<Settings />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outlined"
            size="small"
          >
            Advanced Options
          </Button>
        </Box>

        {showCustom && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Custom Report Configuration
            </Typography>
            
            <TextField
              fullWidth
              label="Report Name"
              value={customTemplateName}
              onChange={(e) => setCustomTemplateName(e.target.value)}
              placeholder="Enter custom report name"
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" gutterBottom>
              Select sections to include:
            </Typography>
            <FormGroup>
              {availableSections.map((section) => (
                <FormControlLabel
                  key={section.id}
                  control={
                    <Checkbox
                      checked={customSections.includes(section.id)}
                      onChange={() => handleCustomSectionToggle(section.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{section.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {section.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        )}

        {showAdvanced && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Advanced Options
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                  />
                }
                label="Include Charts and Visualizations"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeDetailedBreakdown}
                    onChange={(e) => setIncludeDetailedBreakdown(e.target.checked)}
                  />
                }
                label="Include Detailed Breakdown"
              />
              {format === 'excel' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeRawData}
                      onChange={(e) => setIncludeRawData(e.target.checked)}
                    />
                  }
                  label="Include Raw Data Sheet"
                />
              )}
            </FormGroup>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {showCustom && customSections.length === 0 
              ? 'Please select at least one section for custom report'
              : `Ready to generate ${format.toUpperCase()} report`
            }
          </Typography>
          
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Download />}
            onClick={handleGenerateReport}
            disabled={loading || (showCustom && customSections.length === 0)}
          >
            {loading ? 'Generating...' : `Generate ${format.toUpperCase()}`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;