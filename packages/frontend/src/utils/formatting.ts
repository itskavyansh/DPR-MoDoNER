import { SupportedLanguage } from '../contexts/LanguageContext';

/**
 * Format numbers according to language-specific conventions
 */
export const formatNumber = (
  value: number,
  language: SupportedLanguage,
  options?: Intl.NumberFormatOptions
): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    as: 'as-IN', // Assamese uses Indian number formatting
  };

  return new Intl.NumberFormat(localeMap[language], options).format(value);
};

/**
 * Format currency according to language-specific conventions
 */
export const formatCurrency = (
  value: number,
  language: SupportedLanguage,
  currency: string = 'INR'
): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN', // Use Indian English for INR formatting
    hi: 'hi-IN',
    as: 'as-IN',
  };

  return new Intl.NumberFormat(localeMap[language], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format dates according to language-specific conventions
 */
export const formatDate = (
  date: Date | string,
  language: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    as: 'as-IN',
  };

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(
    localeMap[language],
    { ...defaultOptions, ...options }
  ).format(dateObj);
};

/**
 * Format relative time (e.g., "2 days ago") according to language
 */
export const formatRelativeTime = (
  date: Date | string,
  language: SupportedLanguage
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    as: 'as-IN',
  };

  // Use Intl.RelativeTimeFormat for modern browsers
  if ('RelativeTimeFormat' in Intl) {
    const rtf = new Intl.RelativeTimeFormat(localeMap[language], { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }

  // Fallback for older browsers
  return formatDate(dateObj, language);
};

/**
 * Format percentage values according to language conventions
 */
export const formatPercentage = (
  value: number,
  language: SupportedLanguage,
  decimals: number = 1
): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    as: 'as-IN',
  };

  return new Intl.NumberFormat(localeMap[language], {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Get text direction for language
 */
export const getTextDirection = (_language: SupportedLanguage): 'ltr' | 'rtl' => {
  // All supported languages use left-to-right text direction
  return 'ltr';
};

/**
 * Get appropriate font family for language
 */
export const getFontFamily = (language: SupportedLanguage): string => {
  const fontMap: Record<SupportedLanguage, string> = {
    en: '"Roboto", "Helvetica", "Arial", sans-serif',
    hi: '"Noto Sans Devanagari", "Roboto", "Helvetica", "Arial", sans-serif',
    as: '"Noto Sans Bengali", "Roboto", "Helvetica", "Arial", sans-serif',
  };

  return fontMap[language];
};

/**
 * Truncate text appropriately for different languages
 */
export const truncateText = (
  text: string,
  maxLength: number,
  language: SupportedLanguage
): string => {
  if (text.length <= maxLength) {
    return text;
  }

  const ellipsis = language === 'en' ? '...' : '…';
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
};