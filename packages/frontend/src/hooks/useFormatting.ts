import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatPercentage,
  truncateText,
} from '../utils/formatting';

/**
 * Hook that provides language-aware formatting functions
 */
export const useFormatting = () => {
  const { currentLanguage } = useLanguage();

  const formatNum = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, currentLanguage, options),
    [currentLanguage]
  );

  const formatCurr = useCallback(
    (value: number, currency?: string) =>
      formatCurrency(value, currentLanguage, currency),
    [currentLanguage]
  );

  const formatDt = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, currentLanguage, options),
    [currentLanguage]
  );

  const formatRelDt = useCallback(
    (date: Date | string) => formatRelativeTime(date, currentLanguage),
    [currentLanguage]
  );

  const formatPct = useCallback(
    (value: number, decimals?: number) =>
      formatPercentage(value, currentLanguage, decimals),
    [currentLanguage]
  );

  const truncate = useCallback(
    (text: string, maxLength: number) =>
      truncateText(text, maxLength, currentLanguage),
    [currentLanguage]
  );

  return {
    formatNumber: formatNum,
    formatCurrency: formatCurr,
    formatDate: formatDt,
    formatRelativeTime: formatRelDt,
    formatPercentage: formatPct,
    truncateText: truncate,
    currentLanguage,
  };
};