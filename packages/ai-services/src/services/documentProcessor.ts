import { createWorker } from 'tesseract.js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { DPRDocument, ExtractedContent } from '@dpr-system/shared';

export interface ProcessingResult {
  rawText: string;
  cleanedText: string;
  confidence: number;
  processingMethod: 'OCR' | 'PDF_PARSE' | 'DOCX_PARSE' | 'TEXT_READ';
}

export class DocumentProcessor {
  private ocrWorker: any = null;

  async initialize(): Promise<void> {
    // Initialize Tesseract worker for OCR
    this.ocrWorker = await createWorker();
    await this.ocrWorker.loadLanguage('eng+hin');
    await this.ocrWorker.initialize('eng+hin');
  }

  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  /**
   * Process document based on file type and extract text content
   */
  async processDocument(filePath: string, fileType: string): Promise<ProcessingResult> {
    try {
      switch (fileType.toUpperCase()) {
        case 'PDF':
          return await this.processPDF(filePath);
        case 'DOCX':
          return await this.processDOCX(filePath);
        case 'TXT':
          return await this.processTXT(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Process PDF files - attempt text extraction first, fallback to OCR if needed
   */
  private async processPDF(filePath: string): Promise<ProcessingResult> {
    const buffer = await fs.readFile(filePath);
    
    try {
      // First attempt: Direct text extraction
      const pdfData = await pdf(buffer);
      const extractedText = pdfData.text;
      
      // Check if extracted text is meaningful (not just whitespace/special chars)
      if (this.isTextMeaningful(extractedText)) {
        const cleanedText = this.cleanExtractedText(extractedText);
        return {
          rawText: extractedText,
          cleanedText,
          confidence: 0.95,
          processingMethod: 'PDF_PARSE'
        };
      }
    } catch (error) {
      console.warn('PDF text extraction failed, falling back to OCR:', error.message);
    }

    // Fallback: OCR processing for scanned PDFs
    return await this.performOCR(buffer, 'PDF');
  }

  /**
   * Process DOCX files using mammoth
   */
  private async processDOCX(filePath: string): Promise<ProcessingResult> {
    const buffer = await fs.readFile(filePath);
    
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value;
      const cleanedText = this.cleanExtractedText(rawText);
      
      return {
        rawText,
        cleanedText,
        confidence: 0.98,
        processingMethod: 'DOCX_PARSE'
      };
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  /**
   * Process plain text files
   */
  private async processTXT(filePath: string): Promise<ProcessingResult> {
    try {
      const rawText = await fs.readFile(filePath, 'utf-8');
      const cleanedText = this.cleanExtractedText(rawText);
      
      return {
        rawText,
        cleanedText,
        confidence: 1.0,
        processingMethod: 'TEXT_READ'
      };
    } catch (error) {
      throw new Error(`Text file processing failed: ${error.message}`);
    }
  }

  /**
   * Perform OCR on image-based content
   */
  private async performOCR(buffer: Buffer, fileType: string): Promise<ProcessingResult> {
    if (!this.ocrWorker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const { data: { text, confidence } } = await this.ocrWorker.recognize(buffer);
      const cleanedText = this.cleanExtractedText(text);
      
      return {
        rawText: text,
        cleanedText,
        confidence: confidence / 100, // Convert to 0-1 scale
        processingMethod: 'OCR'
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Check if extracted text contains meaningful content
   */
  private isTextMeaningful(text: string): boolean {
    if (!text || text.trim().length < 50) {
      return false;
    }

    // Check for reasonable ratio of alphanumeric characters
    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const totalLength = text.length;
    const ratio = alphanumericCount / totalLength;
    
    return ratio > 0.3; // At least 30% meaningful characters
  }

  /**
   * Clean extracted text by removing headers, footers, page numbers, and formatting artifacts
   */
  private cleanExtractedText(text: string): string {
    let cleaned = text;

    // Remove excessive whitespace and normalize line breaks
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

    // Remove common header/footer patterns
    cleaned = this.removeHeadersFooters(cleaned);
    
    // Remove page numbers (standalone numbers on their own lines)
    cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');
    
    // Remove common document artifacts
    cleaned = cleaned.replace(/\f/g, ''); // Form feed characters
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Control characters
    
    // Clean up spacing after removals
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Remove common header and footer patterns
   */
  private removeHeadersFooters(text: string): string {
    const lines = text.split('\n');
    const cleanedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip if line looks like a header/footer
      if (this.isHeaderFooterLine(line, i, lines.length)) {
        continue;
      }
      
      cleanedLines.push(lines[i]);
    }

    return cleanedLines.join('\n');
  }

  /**
   * Identify potential header/footer lines
   */
  private isHeaderFooterLine(line: string, lineIndex: number, totalLines: number): boolean {
    // Empty or very short lines
    if (line.length < 3) {
      return false;
    }

    // Common header/footer patterns
    const headerFooterPatterns = [
      /^page\s+\d+/i,
      /^\d+\s*$/,
      /^confidential/i,
      /^draft/i,
      /^internal\s+use/i,
      /^government\s+of/i,
      /^ministry\s+of/i,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
      /^printed\s+on/i,
      /^generated\s+on/i
    ];

    // Check if line matches header/footer patterns
    for (const pattern of headerFooterPatterns) {
      if (pattern.test(line)) {
        return true;
      }
    }

    // Lines that appear at the very top or bottom and are short
    const isAtEdge = lineIndex < 3 || lineIndex > totalLines - 4;
    const isShort = line.length < 50;
    
    if (isAtEdge && isShort) {
      // Check if it's likely a header/footer (contains dates, page refs, etc.)
      const suspiciousPatterns = [
        /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/,
        /page/i,
        /chapter/i,
        /section/i
      ];
      
      return suspiciousPatterns.some(pattern => pattern.test(line));
    }

    return false;
  }
}