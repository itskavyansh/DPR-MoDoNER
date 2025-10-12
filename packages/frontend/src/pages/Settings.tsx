import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Slider,
  FormGroup,
  RadioGroup,
  Radio,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Map as MapIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage, SupportedLanguage } from '../contexts/LanguageContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    analysisComplete: true,
    reportReady: true,
    systemUpdates: false,
    securityAlerts: true,
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    autoSave: true,
    defaultZoom: 7,
    showTutorials: true,
    compactView: false,
    animationsEnabled: true,
  });
  const [dataSettings, setDataSettings] = useState({
    cacheSize: 250, // MB
    autoBackup: true,
    retentionDays: 90,
    compressionLevel: 'medium',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [resetDialog, setResetDialog] = useState(false);

  const handleLanguageChange = (language: SupportedLanguage) => {
    changeLanguage(language);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNotificationChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({ ...prev, [key]: event.target.checked }));
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleDataSettingChange = (key: string, value: any) => {
    setDataSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for persistence
      localStorage.setItem('dpr-settings', JSON.stringify({
        notifications,
        preferences,
        dataSettings,
        language: currentLanguage,
      }));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResetSettings = () => {
    setNotifications({
      email: true,
      push: false,
      analysisComplete: true,
      reportReady: true,
      systemUpdates: false,
      securityAlerts: true,
    });
    setPreferences({
      theme: 'light',
      autoSave: true,
      defaultZoom: 7,
      showTutorials: true,
      compactView: false,
      animationsEnabled: true,
    });
    setDataSettings({
      cacheSize: 250,
      autoBackup: true,
      retentionDays: 90,
      compressionLevel: 'medium',
    });
    setResetDialog(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const exportSettings = () => {
    const settings = {
      notifications,
      preferences,
      dataSettings,
      language: currentLanguage,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpr-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('settings.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('settings.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportSettings}
          >
            {t('settings.exportSettings')}
          </Button>
          <Button
            variant="contained"
            startIcon={saveStatus === 'saving' ? <RefreshIcon className="animate-spin" /> : <SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? t('settings.saving') : t('settings.saveChanges')}
          </Button>
        </Box>
      </Box>

      {/* Save Status Alert */}
      {saveStatus === 'saved' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('settings.settingsSaved')}
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('settings.settingsError')}
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab icon={<AccountIcon />} label={t('settings.tabs.account')} />
          <Tab icon={<NotificationsIcon />} label={t('settings.tabs.notifications')} />
          <Tab icon={<PaletteIcon />} label={t('settings.tabs.appearance')} />
          <Tab icon={<MapIcon />} label={t('settings.tabs.geospatial')} />
          <Tab icon={<StorageIcon />} label={t('settings.tabs.dataStorage')} />
          <Tab icon={<SecurityIcon />} label={t('settings.tabs.security')} />
        </Tabs>

        {/* Account Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <LanguageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Language & Region
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Display Language</InputLabel>
                    <Select
                      value={currentLanguage}
                      label="Display Language"
                      onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                    >
                      {supportedLanguages.map((language) => (
                        <MenuItem key={language.code} value={language.code}>
                          <Box>
                            <Typography variant="body1">
                              {language.nativeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {language.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select value="dd/mm/yyyy" label="Date Format">
                      <MenuItem value="dd/mm/yyyy">DD/MM/YYYY (Indian)</MenuItem>
                      <MenuItem value="mm/dd/yyyy">MM/DD/YYYY (US)</MenuItem>
                      <MenuItem value="yyyy-mm-dd">YYYY-MM-DD (ISO)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AccountIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Profile Settings
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Display Name"
                    defaultValue="DPR Analyst"
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Department"
                    defaultValue="Ministry of DoNER"
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Role"
                    defaultValue="Senior Analyst"
                    sx={{ mb: 2 }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Time Zone</InputLabel>
                    <Select value="Asia/Kolkata" label="Time Zone">
                      <MenuItem value="Asia/Kolkata">India Standard Time (IST)</MenuItem>
                      <MenuItem value="UTC">Coordinated Universal Time (UTC)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Analysis Notifications
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.analysisComplete}
                          onChange={handleNotificationChange('analysisComplete')}
                        />
                      }
                      label="Analysis completion alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.reportReady}
                          onChange={handleNotificationChange('reportReady')}
                        />
                      }
                      label="Report generation notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.email}
                          onChange={handleNotificationChange('email')}
                        />
                      }
                      label="Email notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.push}
                          onChange={handleNotificationChange('push')}
                        />
                      }
                      label="Browser push notifications"
                    />
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    System Notifications
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.securityAlerts}
                          onChange={handleNotificationChange('securityAlerts')}
                        />
                      }
                      label="Security alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.systemUpdates}
                          onChange={handleNotificationChange('systemUpdates')}
                        />
                      }
                      label="System updates"
                    />
                  </FormGroup>

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Notification Frequency
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup defaultValue="immediate">
                      <FormControlLabel value="immediate" control={<Radio />} label="Immediate" />
                      <FormControlLabel value="hourly" control={<Radio />} label="Hourly digest" />
                      <FormControlLabel value="daily" control={<Radio />} label="Daily summary" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Theme & Display
                  </Typography>
                  
                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <FormLabel component="legend">Theme</FormLabel>
                    <RadioGroup
                      value={preferences.theme}
                      onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                    >
                      <FormControlLabel value="light" control={<Radio />} label="Light theme" />
                      <FormControlLabel value="dark" control={<Radio />} label="Dark theme" />
                      <FormControlLabel value="auto" control={<Radio />} label="Auto (system)" />
                    </RadioGroup>
                  </FormControl>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.compactView}
                          onChange={(e) => handlePreferenceChange('compactView', e.target.checked)}
                        />
                      }
                      label="Compact view mode"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.animationsEnabled}
                          onChange={(e) => handlePreferenceChange('animationsEnabled', e.target.checked)}
                        />
                      }
                      label="Enable animations"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.showTutorials}
                          onChange={(e) => handlePreferenceChange('showTutorials', e.target.checked)}
                        />
                      }
                      label="Show tutorial hints"
                    />
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Dashboard Preferences
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.autoSave}
                          onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                        />
                      }
                      label="Auto-save analysis progress"
                    />
                  </FormGroup>

                  <Box sx={{ mt: 3 }}>
                    <Typography gutterBottom>Default Chart Type</Typography>
                    <FormControl fullWidth>
                      <Select value="bar" label="Chart Type">
                        <MenuItem value="bar">Bar Charts</MenuItem>
                        <MenuItem value="line">Line Charts</MenuItem>
                        <MenuItem value="pie">Pie Charts</MenuItem>
                        <MenuItem value="radar">Radar Charts</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography gutterBottom>Items per page</Typography>
                    <Slider
                      value={25}
                      min={10}
                      max={100}
                      step={5}
                      marks={[
                        { value: 10, label: '10' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Geospatial Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Map Settings
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Default Zoom Level</Typography>
                    <Slider
                      value={preferences.defaultZoom}
                      onChange={(e, value) => handlePreferenceChange('defaultZoom', value)}
                      min={6}
                      max={15}
                      step={1}
                      marks={[
                        { value: 6, label: '6' },
                        { value: 9, label: '9' },
                        { value: 12, label: '12' },
                        { value: 15, label: '15' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Map Style</InputLabel>
                    <Select value="openstreetmap" label="Map Style">
                      <MenuItem value="openstreetmap">OpenStreetMap</MenuItem>
                      <MenuItem value="satellite">Satellite View</MenuItem>
                      <MenuItem value="terrain">Terrain</MenuItem>
                      <MenuItem value="hybrid">Hybrid</MenuItem>
                    </Select>
                  </FormControl>

                  <FormGroup>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Show forest areas"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Show landmarks"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Show rivers and roads"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Enable location tracking"
                    />
                  </FormGroup>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Regional Focus
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Map is currently focused on North Eastern states of India
                  </Alert>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Arunachal Pradesh" 
                        secondary="Coverage: Complete"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Assam" 
                        secondary="Coverage: Complete"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Manipur, Meghalaya, Mizoram" 
                        secondary="Coverage: Complete"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Nagaland, Sikkim, Tripura" 
                        secondary="Coverage: Complete"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Data & Storage Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Storage Management
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Cache Size Limit (MB)</Typography>
                    <Slider
                      value={dataSettings.cacheSize}
                      onChange={(e, value) => handleDataSettingChange('cacheSize', value)}
                      min={100}
                      max={1000}
                      step={50}
                      marks={[
                        { value: 100, label: '100MB' },
                        { value: 250, label: '250MB' },
                        { value: 500, label: '500MB' },
                        { value: 1000, label: '1GB' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={dataSettings.autoBackup}
                          onChange={(e) => handleDataSettingChange('autoBackup', e.target.checked)}
                        />
                      }
                      label="Automatic data backup"
                    />
                  </FormGroup>

                  <Box sx={{ mt: 3 }}>
                    <Typography gutterBottom>Data Retention (Days)</Typography>
                    <TextField
                      type="number"
                      value={dataSettings.retentionDays}
                      onChange={(e) => handleDataSettingChange('retentionDays', parseInt(e.target.value))}
                      inputProps={{ min: 30, max: 365 }}
                      fullWidth
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Export & Import
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Export Analysis Data
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Import Analysis Data
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      color="error"
                      fullWidth
                    >
                      Clear All Cache
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Storage Usage
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Analysis Data: 45.2 MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cache: 128.7 MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reports: 23.1 MB
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Total: 197.0 MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Security Settings
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Two-factor authentication"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Session timeout (30 minutes)"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Remember login on this device"
                    />
                  </FormGroup>

                  <Box sx={{ mt: 3 }}>
                    <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
                      Change Password
                    </Button>
                    <Button variant="outlined" fullWidth>
                      Download Activity Log
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Privacy & Compliance
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This system complies with Government of India data protection guidelines
                  </Alert>

                  <FormGroup>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Audit trail logging"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Data encryption at rest"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Anonymous usage analytics"
                    />
                  </FormGroup>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Last Security Scan
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      December 15, 2024 - No issues found
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Reset Settings Dialog */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
        <DialogTitle>Reset All Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetSettings} color="error" variant="contained">
            Reset Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer Actions */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={() => setResetDialog(true)}
        >
          Reset to Defaults
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={<InfoIcon />}
            label="Settings auto-saved"
            color="success"
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            Last saved: {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;