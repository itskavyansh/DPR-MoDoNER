import { franc } from 'franc';
import translate from 'translate';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'language-service.log' })
  ]
});

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
  supportedLanguage: 'EN' | 'HI' | 'AS' | 'UNKNOWN';
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface LanguageProcessingOptions {
  targetLanguage?: 'EN' | 'HI' | 'AS';
  enableTranslation?: boolean;
  confidenceThreshold?: number;
  fallbackLanguage?: 'EN' | 'HI' | 'AS';
}

export class LanguageService {
  private isInitialized: boolean = false;
  
  // Language code mappings
  private readonly languageMap = {
    'eng': 'EN',
    'hin': 'HI',
    'asm': 'AS',
    'ben': 'HI', // Bengali - fallback to Hindi for similar script
    'nep': 'HI', // Nepali - fallback to Hindi for similar script
  };

  // Supported languages for the DPR system
  private readonly supportedLanguages = ['EN', 'HI', 'AS'];

  constructor() {
    // Configure translate service
    translate.engine = 'google'; // Can be configured to use different translation engines
  }

  /**
   * Initialize the language service
   */
  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      logger.info('Language service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize language service:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.isInitialized = false;
      logger.info('Language service cleaned up');
    } catch (error) {
      logger.error('Error during language service cleanup:', error);
    }
  }

  /**
   * Detect the language of the given text
   */
  detectLanguage(text: string): LanguageDetectionResult {
    if (!this.isInitialized) {
      throw new Error('Language service not initialized');
    }

    if (!text || text.trim().length < 10) {
      return {
        detectedLanguage: 'unknown',
        confidence: 0,
        supportedLanguage: 'UNKNOWN'
      };
    }

    try {
      // Use franc for language detection
      const detectedCode = franc(text);
      const confidence = this.calculateConfidence(text, detectedCode);
      
      // Map to our supported languages
      const supportedLanguage = this.mapToSupportedLanguage(detectedCode);
      
      logger.info(`Language detected: ${detectedCode} -> ${supportedLanguage}`, {
        confidence,
        textLength: text.length
      });

      return {
        detectedLanguage: detectedCode,
        confidence,
        supportedLanguage
      };

    } catch (error) {
      logger.error('Language detection failed:', error);
      return {
        detectedLanguage: 'unknown',
        confidence: 0,
        supportedLanguage: 'UNKNOWN'
      };
    }
  }

  /**
   * Translate text from source language to target language
   */
  async translateText(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string = 'EN'
  ): Promise<TranslationResult> {
    if (!this.isInitialized) {
      throw new Error('Language service not initialized');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for translation');
    }

    try {
      // Convert our language codes to translation service codes
      const sourceCode = this.convertToTranslationCode(sourceLanguage);
      const targetCode = this.convertToTranslationCode(targetLanguage);

      // Skip translation if source and target are the same
      if (sourceCode === targetCode) {
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage,
          targetLanguage,
          confidence: 1.0
        };
      }

      logger.info(`Translating text from ${sourceCode} to ${targetCode}`);

      // Perform translation
      const translatedText = await translate(text, {
        from: sourceCode,
        to: targetCode
      });

      const confidence = this.calculateTranslationConfidence(text, translatedText);

      return {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence
      };

    } catch (error) {
      logger.error('Translation failed:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Process text through the complete language pipeline
   */
  async processText(
    text: string, 
    options: LanguageProcessingOptions = {}
  ): Promise<{
    detection: LanguageDetectionResult;
    translation?: TranslationResult;
    processedText: string;
  }> {
    const {
      targetLanguage = 'EN',
      enableTranslation = true,
      confidenceThreshold = 0.7,
      fallbackLanguage = 'EN'
    } = options;

    // Step 1: Detect language
    const detection = this.detectLanguage(text);
    
    let translation: TranslationResult | undefined;
    let processedText = text;

    // Step 2: Translate if needed and enabled
    if (enableTranslation && detection.supportedLanguage !== 'UNKNOWN') {
      try {
        // Only translate if confidence is above threshold and language is different
        if (detection.confidence >= confidenceThreshold && 
            detection.supportedLanguage !== targetLanguage) {
          
          translation = await this.translateText(
            text, 
            detection.supportedLanguage, 
            targetLanguage
          );
          
          processedText = translation.translatedText;
          
        } else if (detection.confidence < confidenceThreshold) {
          // Low confidence - use fallback
          logger.warn(`Low confidence language detection (${detection.confidence}), using fallback`);
          
          if (detection.supportedLanguage !== fallbackLanguage) {
            translation = await this.translateText(
              text, 
              detection.supportedLanguage || fallbackLanguage, 
              targetLanguage
            );
            processedText = translation.translatedText;
          }
        }
      } catch (error) {
        logger.error('Translation in pipeline failed, using original text:', error);
        // Continue with original text if translation fails
      }
    }

    return {
      detection,
      translation,
      processedText
    };
  }

  /**
   * Map detected language code to supported language
   */
  private mapToSupportedLanguage(detectedCode: string): 'EN' | 'HI' | 'AS' | 'UNKNOWN' {
    const mapped = this.languageMap[detectedCode as keyof typeof this.languageMap];
    return mapped || 'UNKNOWN';
  }

  /**
   * Convert our language codes to translation service codes
   */
  private convertToTranslationCode(languageCode: string): string {
    const codeMap = {
      'EN': 'en',
      'HI': 'hi',
      'AS': 'as',
      'eng': 'en',
      'hin': 'hi',
      'asm': 'as'
    };
    
    return codeMap[languageCode as keyof typeof codeMap] || 'en';
  }

  /**
   * Calculate confidence score for language detection
   */
  private calculateConfidence(text: string, detectedCode: string): number {
    // Basic confidence calculation based on text length and detection result
    if (detectedCode === 'und' || !detectedCode) {
      return 0;
    }

    let confidence = 0.5; // Base confidence

    // Increase confidence based on text length
    if (text.length > 100) confidence += 0.2;
    if (text.length > 500) confidence += 0.2;
    if (text.length > 1000) confidence += 0.1;

    // Check for language-specific patterns
    if (this.hasLanguageSpecificPatterns(text, detectedCode)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence score for translation quality
   */
  private calculateTranslationConfidence(originalText: string, translatedText: string): number {
    // Basic translation confidence calculation
    let confidence = 0.7; // Base confidence for successful translation

    // Check if translation seems reasonable
    const originalLength = originalText.length;
    const translatedLength = translatedText.length;
    const lengthRatio = translatedLength / originalLength;

    // Reasonable length ratio indicates good translation
    if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
      confidence += 0.2;
    }

    // Check if translation is not just the original text
    if (originalText !== translatedText) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Check for language-specific patterns to improve confidence
   */
  private hasLanguageSpecificPatterns(text: string, detectedCode: string): boolean {
    switch (detectedCode) {
      case 'hin':
        // Check for Devanagari script characters
        return /[\u0900-\u097F]/.test(text);
      case 'asm':
        // Check for Assamese script characters (similar to Bengali)
        return /[\u0980-\u09FF]/.test(text);
      case 'eng':
        // Check for common English patterns
        return /\b(the|and|or|in|on|at|to|for|of|with|by)\b/i.test(text);
      default:
        return false;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): { status: string; initialized: boolean; timestamp: Date } {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      initialized: this.isInitialized,
      timestamp: new Date()
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }
}