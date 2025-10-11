import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage, SupportedLanguage } from '../../contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'icon' | 'button' | 'menu';
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'icon',
  showLabel = false 
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (language: SupportedLanguage) => {
    changeLanguage(language);
    handleClose();
  };

  const currentLanguageInfo = supportedLanguages.find(lang => lang.code === currentLanguage);

  if (variant === 'menu') {
    return (
      <Box>
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language.code}
            selected={currentLanguage === language.code}
            onClick={() => handleLanguageChange(language.code)}
          >
            <ListItemIcon>
              {currentLanguage === language.code && <CheckIcon />}
            </ListItemIcon>
            <ListItemText>
              <Box>
                <Typography variant="body2" fontWeight={currentLanguage === language.code ? 600 : 400}>
                  {language.nativeName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {language.name}
                </Typography>
              </Box>
            </ListItemText>
          </MenuItem>
        ))}
      </Box>
    );
  }

  return (
    <>
      <Tooltip title={t('settings.selectLanguage')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          aria-label={t('settings.selectLanguage')}
        >
          <LanguageIcon />
          {showLabel && currentLanguageInfo && (
            <Typography variant="body2" sx={{ ml: 1, textTransform: 'uppercase' }}>
              {currentLanguageInfo.code}
            </Typography>
          )}
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
          },
        }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language.code}
            selected={currentLanguage === language.code}
            onClick={() => handleLanguageChange(language.code)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon>
              {currentLanguage === language.code && (
                <CheckIcon 
                  sx={{ 
                    color: currentLanguage === language.code ? 'primary.contrastText' : 'inherit' 
                  }} 
                />
              )}
            </ListItemIcon>
            <ListItemText>
              <Box>
                <Typography 
                  variant="body2" 
                  fontWeight={currentLanguage === language.code ? 600 : 400}
                  sx={{ 
                    color: currentLanguage === language.code ? 'primary.contrastText' : 'inherit' 
                  }}
                >
                  {language.nativeName}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: currentLanguage === language.code 
                      ? 'rgba(255, 255, 255, 0.7)' 
                      : 'text.secondary' 
                  }}
                >
                  {language.name}
                </Typography>
              </Box>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;