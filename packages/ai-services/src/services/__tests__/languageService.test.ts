import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { LanguageService } from '../languageService.js';

// Mock the external dependencies
vi.mock('franc', () => ({
  default: vi.fn((text: string) => {
    // Mock language detection based on text content
    if (text.includes('project') || text.includes('development') || text.includes('infrastructure')) {
      return 'eng';
    }
    if (text.includes('परियोजना') || text.includes('विकास')) {
      return 'hin';
    }
    if (text.includes('প্রকল্প') || text.includes('উন্নয়ন')) {
      return 'asm';
    }
    return 'eng'; // Default to English
  })
}));

vi.mock('translate', () => ({
  default: vi.fn((text: string, options: any) => {
    // Mock translation based on source and target languages
    const translations: Record<string, Record<string, string>> = {
      'hi': {
        'en': text.replace('परियोजना', 'project').replace('विकास', 'development'),
      },
      'as': {
        'en': text.replace('প্রকল্প', 'project').replace('উন্নয়ন', 'development'),
      },
      'en': {
        'hi': text.replace('project', 'परियोजना').replace('development', 'विकास'),
        'as': text.replace('project', 'প্রকল্প').replace('development', 'উন্নয়ন'),
      }
    };
    
    return Promise.resolve(
      translations[options.from]?.[options.to] || `Translated: ${text}`
    );
  }),
  engine: 'google'
}));

describe('LanguageService', () => {
  let service: LanguageService;

  beforeAll(async () => {
    service = new LanguageService();
    await service.initialize();
  });

  afterAll(async () => {
    await service.cleanup();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      const newService = new LanguageService();
      await expect(newService.initialize()).resolves.not.toThrow();
      await newService.cleanup();
    });

    it('should return healthy status when initialized', () => {
      const status = service.getHealthStatus();
      expect(status.status).toBe('healthy');
      expect(status.initialized).toBe(true);
      expect(status.timestamp).toBeInstanceOf(Date);
    });

    it('should return supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toEqual(['EN', 'HI', 'AS']);
    });
  });

  describe('Language Detection', () => {
    it('should detect English text correctly', () => {
      const text = 'This is an infrastructure development project for Northeast India.';
      const result = service.detectLanguage(text);
      
      expect(result.detectedLanguage).toBe('eng');
      expect(result.supportedLanguage).toBe('EN');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Hindi text correctly', () => {
      const text = 'यह पूर्वोत्तर भारत के लिए एक परियोजना विकास है।';
      const result = service.detectLanguage(text);
      
      expect(result.detectedLanguage).toBe('hin');
      expect(result.supportedLanguage).toBe('HI');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Assamese text correctly', () => {
      const text = 'এইটো উত্তৰ-পূৰ্ব ভাৰতৰ বাবে এটা প্রকল্প উন্নয়ন।';
      const result = service.detectLanguage(text);
      
      expect(result.detectedLanguage).toBe('asm');
      expect(result.supportedLanguage).toBe('AS');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty or very short text', () => {
      const result = service.detectLanguage('');
      
      expect(result.detectedLanguage).toBe('unknown');
      expect(result.supportedLanguage).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });

    it('should handle unknown languages', async () => {
      // Mock franc to return unknown language
      const francMock = vi.mocked(await import('franc')).default;
      francMock.mockReturnValueOnce('fra'); // French - not supported
      
      const result = service.detectLanguage('Ceci est un texte en français.');
      
      expect(result.supportedLanguage).toBe('UNKNOWN');
    });

    it('should throw error for uninitialized service', async () => {
      const uninitializedService = new LanguageService();
      
      expect(() => uninitializedService.detectLanguage('test text'))
        .toThrow('Language service not initialized');
    });
  });

  describe('Text Translation', () => {
    it('should translate Hindi to English', async () => {
      const text = 'यह एक परियोजना विकास है।';
      const result = await service.translateText(text, 'HI', 'EN');
      
      expect(result.originalText).toBe(text);
      expect(result.translatedText).toContain('project');
      expect(result.sourceLanguage).toBe('HI');
      expect(result.targetLanguage).toBe('EN');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should translate Assamese to English', async () => {
      const text = 'এইটো এটা প্রকল্প উন্নয়ন।';
      const result = await service.translateText(text, 'AS', 'EN');
      
      expect(result.originalText).toBe(text);
      expect(result.translatedText).toContain('project');
      expect(result.sourceLanguage).toBe('AS');
      expect(result.targetLanguage).toBe('EN');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should translate English to Hindi', async () => {
      const text = 'This is a project development.';
      const result = await service.translateText(text, 'EN', 'HI');
      
      expect(result.originalText).toBe(text);
      expect(result.translatedText).toContain('परियोजना');
      expect(result.sourceLanguage).toBe('EN');
      expect(result.targetLanguage).toBe('HI');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should skip translation when source and target are the same', async () => {
      const text = 'This is English text.';
      const result = await service.translateText(text, 'EN', 'EN');
      
      expect(result.originalText).toBe(text);
      expect(result.translatedText).toBe(text);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle empty text', async () => {
      await expect(service.translateText('', 'EN', 'HI'))
        .rejects.toThrow('Text cannot be empty for translation');
    });

    it('should throw error for uninitialized service', async () => {
      const uninitializedService = new LanguageService();
      
      await expect(uninitializedService.translateText('test', 'EN', 'HI'))
        .rejects.toThrow('Language service not initialized');
    });
  });

  describe('Language Processing Pipeline', () => {
    it('should process English text without translation', async () => {
      const text = 'This is an infrastructure development project.';
      const result = await service.processText(text, {
        targetLanguage: 'EN',
        enableTranslation: true
      });
      
      expect(result.detection.supportedLanguage).toBe('EN');
      expect(result.translation).toBeUndefined();
      expect(result.processedText).toBe(text);
    });

    it('should process and translate Hindi text to English', async () => {
      const text = 'यह एक परियोजना विकास है।';
      const result = await service.processText(text, {
        targetLanguage: 'EN',
        enableTranslation: true
      });
      
      expect(result.detection.supportedLanguage).toBe('HI');
      expect(result.translation).toBeDefined();
      expect(result.translation?.targetLanguage).toBe('EN');
      expect(result.processedText).not.toBe(text);
    });

    it('should process and translate Assamese text to English', async () => {
      const text = 'এইটো এটা প্রকল্প উন্নয়ন।';
      const result = await service.processText(text, {
        targetLanguage: 'EN',
        enableTranslation: true
      });
      
      expect(result.detection.supportedLanguage).toBe('AS');
      expect(result.translation).toBeDefined();
      expect(result.translation?.targetLanguage).toBe('EN');
      expect(result.processedText).not.toBe(text);
    });

    it('should handle translation disabled', async () => {
      const text = 'यह एक परियोजना विकास है।';
      const result = await service.processText(text, {
        targetLanguage: 'EN',
        enableTranslation: false
      });
      
      expect(result.detection.supportedLanguage).toBe('HI');
      expect(result.translation).toBeUndefined();
      expect(result.processedText).toBe(text);
    });

    it('should use fallback for low confidence detection', async () => {
      // Mock low confidence detection
      const francMock = vi.mocked(await import('franc')).default;
      francMock.mockReturnValueOnce('und'); // Unknown language
      
      const text = 'Some ambiguous text that is hard to detect.';
      const result = await service.processText(text, {
        targetLanguage: 'EN',
        enableTranslation: true,
        confidenceThreshold: 0.8,
        fallbackLanguage: 'EN'
      });
      
      expect(result.detection.confidence).toBe(0);
      expect(result.detection.supportedLanguage).toBe('UNKNOWN');
    });

    it('should handle translation errors gracefully', async () => {
      // Mock translation to throw error
      const translateMock = vi.mocked(await import('translate')).default;
      translateMock.mockRejectedValueOnce(new Error('Translation service unavailable'));
      
      const text = 'यह एक परियोजना विकास है।';
      const result = await service.processText(text, {
        targetLanguage: 'EN',
        enableTranslation: true
      });
      
      expect(result.detection.supportedLanguage).toBe('HI');
      expect(result.translation).toBeUndefined();
      expect(result.processedText).toBe(text); // Should fallback to original text
    });
  });

  describe('Service Cleanup', () => {
    it('should cleanup resources properly', async () => {
      const testService = new LanguageService();
      await testService.initialize();
      
      await expect(testService.cleanup()).resolves.not.toThrow();
      
      const status = testService.getHealthStatus();
      expect(status.initialized).toBe(false);
      expect(status.status).toBe('not_initialized');
    });
  });

  describe('Utility Methods', () => {
    it('should calculate confidence based on text length', () => {
      const shortText = 'Short text.';
      const longText = 'This is a much longer text that contains more information and should have higher confidence in language detection because it provides more context for the detection algorithm to work with.';
      
      const shortResult = service.detectLanguage(shortText);
      const longResult = service.detectLanguage(longText);
      
      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence);
    });

    it('should handle language-specific patterns', () => {
      const englishText = 'The project development is in progress and will be completed on time.';
      const result = service.detectLanguage(englishText);
      
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });
});