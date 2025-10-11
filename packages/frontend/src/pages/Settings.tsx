import React from 'react';
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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLanguage, SupportedLanguage } from '../contexts/LanguageContext';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();

  const handleLanguageChange = (language: SupportedLanguage) => {
    changeLanguage(language);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('settings.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        {t('settings.preferences')}
      </Typography>

      <Grid container spacing={3}>
        {/* Language Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.language')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.selectLanguage')}
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel id="language-select-label">
                  {t('settings.language')}
                </InputLabel>
                <Select
                  labelId="language-select-label"
                  value={currentLanguage}
                  label={t('settings.language')}
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
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.system')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settings.notifications')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {t('settings.account')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;