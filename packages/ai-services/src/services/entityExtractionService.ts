import { ExtractedEntity } from '@dpr-system/shared';

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  metadata: EntityMetadata;
}

export interface EntityMetadata {
  totalEntitiesFound: number;
  processingTime: number;
  confidence: number;
}

export interface GeospatialEntity {
  type: 'GPS_COORDINATE' | 'ADDRESS' | 'LOCATION_NAME';
  value: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  position: number;
}

export interface MonetaryEntity {
  type: 'AMOUNT' | 'BUDGET_ITEM' | 'COST_ESTIMATE';
  value: string;
  numericValue: number;
  currency: string;
  confidence: number;
  position: number;
  context?: string;
}

export interface DateEntity {
  type: 'START_DATE' | 'END_DATE' | 'MILESTONE_DATE' | 'DEADLINE';
  value: string;
  parsedDate: Date;
  confidence: number;
  position: number;
  context?: string;
}

export interface ResourceEntity {
  type: 'HUMAN_RESOURCE' | 'MATERIAL' | 'EQUIPMENT' | 'INFRASTRUCTURE';
  value: string;
  quantity?: number;
  unit?: string;
  confidence: number;
  position: number;
  context?: string;
}

export class EntityExtractionService {
  private monetaryPatterns: RegExp[];
  private datePatterns: RegExp[];
  private coordinatePatterns: RegExp[];
  private resourcePatterns: RegExp[];

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize regex patterns for different entity types
   */
  private initializePatterns(): void {
    // Monetary patterns for Indian currency formats
    this.monetaryPatterns = [
      // Rupees with various formats
      /(?:Rs\.?\s*|INR\s*|₹\s*)(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)\s*(?:crore|cr\.?|lakh|lac|thousand|k)?/gi,
      // Lakhs and crores
      /(\d+(?:\.\d+)?)\s*(?:crore|cr\.?|lakh|lac)\s*(?:rupees?|rs\.?|₹)?/gi,
      // International formats
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Budget line items
      /(?:cost|amount|budget|estimate|price|value):\s*(?:Rs\.?\s*|INR\s*|₹\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/gi
    ];

    // Date patterns for various Indian and international formats
    this.datePatterns = [
      // DD/MM/YYYY, DD-MM-YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
      // DD/MM/YY, DD-MM-YY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/g,
      // Month DD, YYYY
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
      // DD Month YYYY
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
      // YYYY-MM-DD (ISO format)
      /(\d{4})-(\d{1,2})-(\d{1,2})/g,
      // Relative dates
      /(?:within|by|before|after|until)\s+(\d{1,2})\s+(days?|weeks?|months?|years?)/gi
    ];

    // GPS coordinate patterns
    this.coordinatePatterns = [
      // Decimal degrees
      /(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/g,
      // Degrees, minutes, seconds
      /(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NS]),?\s*(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([EW])/gi,
      // GPS coordinates with labels
      /(?:lat|latitude):\s*(-?\d{1,3}\.\d+).*?(?:lon|lng|longitude):\s*(-?\d{1,3}\.\d+)/gi
    ];

    // Resource patterns
    this.resourcePatterns = [
      // Human resources
      /(\d+)\s*(?:engineers?|workers?|laborers?|technicians?|supervisors?|managers?|contractors?)/gi,
      // Materials
      /(\d+(?:\.\d+)?)\s*(?:tons?|tonnes?|kg|quintals?|bags?|cubic\s*meters?|m³|liters?|gallons?)\s*(?:of\s+)?(\w+)/gi,
      // Equipment
      /(\d+)\s*(?:excavators?|bulldozers?|cranes?|trucks?|vehicles?|machines?|equipment)/gi,
      // Infrastructure
      /(\d+(?:\.\d+)?)\s*(?:km|kilometers?|miles?|meters?|feet|acres?|hectares?)\s*(?:of\s+)?(?:road|highway|pipeline|cable|fence)/gi
    ];
  }

  /**
   * Extract all entities from the given text
   */
  async extractEntities(text: string): Promise<EntityExtractionResult> {
    const startTime = Date.now();
    const entities: ExtractedEntity[] = [];

    try {
      // Extract different types of entities
      const monetaryEntities = this.extractMonetaryEntities(text);
      const dateEntities = this.extractDateEntities(text);
      const locationEntities = this.extractLocationEntities(text);
      const resourceEntities = this.extractResourceEntities(text);

      // Convert to common ExtractedEntity format
      entities.push(...this.convertMonetaryEntities(monetaryEntities));
      entities.push(...this.convertDateEntities(dateEntities));
      entities.push(...this.convertLocationEntities(locationEntities));
      entities.push(...this.convertResourceEntities(resourceEntities));

      // Sort entities by position in text
      entities.sort((a, b) => a.position - b.position);

      const processingTime = Date.now() - startTime;
      const averageConfidence = entities.length > 0 
        ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length 
        : 0;

      return {
        entities,
        metadata: {
          totalEntitiesFound: entities.length,
          processingTime,
          confidence: averageConfidence
        }
      };
    } catch (error) {
      throw new Error(`Entity extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract monetary values from text
   */
  private extractMonetaryEntities(text: string): MonetaryEntity[] {
    const entities: MonetaryEntity[] = [];

    for (const pattern of this.monetaryPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const numericPart = match[1];
        const position = match.index;
        
        // Parse numeric value
        const numericValue = this.parseMonetaryValue(fullMatch);
        
        // Determine currency
        const currency = this.detectCurrency(fullMatch);
        
        // Get context around the match
        const context = this.getContext(text, position, fullMatch.length);
        
        // Determine monetary type based on context
        const type = this.classifyMonetaryType(context);

        entities.push({
          type,
          value: fullMatch.trim(),
          numericValue,
          currency,
          confidence: this.calculateMonetaryConfidence(fullMatch, context),
          position,
          context
        });
      }
    }

    return this.deduplicateMonetaryEntities(entities);
  }

  /**
   * Extract date entities from text
   */
  private extractDateEntities(text: string): DateEntity[] {
    const entities: DateEntity[] = [];

    for (const pattern of this.datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const position = match.index;
        
        // Parse the date
        const parsedDate = this.parseDate(match);
        if (!parsedDate) continue;
        
        // Get context
        const context = this.getContext(text, position, fullMatch.length);
        
        // Classify date type
        const type = this.classifyDateType(context);

        entities.push({
          type,
          value: fullMatch.trim(),
          parsedDate,
          confidence: this.calculateDateConfidence(fullMatch, parsedDate),
          position,
          context
        });
      }
    }

    return this.deduplicateDateEntities(entities);
  }

  /**
   * Extract location and geospatial entities from text
   */
  private extractLocationEntities(text: string): GeospatialEntity[] {
    const entities: GeospatialEntity[] = [];

    // Extract GPS coordinates
    for (const pattern of this.coordinatePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const position = match.index;
        
        const coordinates = this.parseCoordinates(match);
        if (!coordinates) continue;

        entities.push({
          type: 'GPS_COORDINATE',
          value: fullMatch.trim(),
          coordinates,
          confidence: this.calculateCoordinateConfidence(coordinates),
          position
        });
      }
    }

    // Extract location names and addresses
    const locationEntities = this.extractLocationNames(text);
    entities.push(...locationEntities);

    return entities;
  }

  /**
   * Extract resource entities from text
   */
  private extractResourceEntities(text: string): ResourceEntity[] {
    const entities: ResourceEntity[] = [];

    for (const pattern of this.resourcePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const position = match.index;
        const quantity = parseFloat(match[1]);
        const resourceName = match[2] || '';
        
        // Get context
        const context = this.getContext(text, position, fullMatch.length);
        
        // Classify resource type
        const type = this.classifyResourceType(fullMatch, context);
        
        // Extract unit if present
        const unit = this.extractUnit(fullMatch);

        entities.push({
          type,
          value: fullMatch.trim(),
          quantity,
          unit,
          confidence: this.calculateResourceConfidence(fullMatch, context),
          position,
          context
        });
      }
    }

    return entities;
  }

  /**
   * Parse monetary value to numeric format
   */
  private parseMonetaryValue(text: string): number {
    // Remove currency symbols and clean text
    let cleaned = text.replace(/[₹$Rs\.INR]/gi, '').trim();
    
    // Handle Indian number formats (lakhs, crores)
    if (/crore|cr\.?/i.test(cleaned)) {
      const num = parseFloat(cleaned.replace(/[^\d.]/g, ''));
      return num * 10000000; // 1 crore = 10 million
    }
    
    if (/lakh|lac/i.test(cleaned)) {
      const num = parseFloat(cleaned.replace(/[^\d.]/g, ''));
      return num * 100000; // 1 lakh = 100 thousand
    }
    
    if (/thousand|k/i.test(cleaned)) {
      const num = parseFloat(cleaned.replace(/[^\d.]/g, ''));
      return num * 1000;
    }
    
    // Handle comma-separated numbers
    cleaned = cleaned.replace(/,/g, '');
    return parseFloat(cleaned.replace(/[^\d.]/g, '')) || 0;
  }

  /**
   * Detect currency from monetary text
   */
  private detectCurrency(text: string): string {
    if (/₹|Rs\.?|INR/i.test(text)) return 'INR';
    if (/\$/i.test(text)) return 'USD';
    return 'INR'; // Default to INR for Indian context
  }

  /**
   * Get context around a match
   */
  private getContext(text: string, position: number, matchLength: number): string {
    const start = Math.max(0, position - 50);
    const end = Math.min(text.length, position + matchLength + 50);
    return text.substring(start, end);
  }

  /**
   * Classify monetary entity type based on context
   */
  private classifyMonetaryType(context: string): MonetaryEntity['type'] {
    const lowerContext = context.toLowerCase();
    
    if (/budget|allocation|fund/i.test(lowerContext)) return 'BUDGET_ITEM';
    if (/estimate|cost|price|amount/i.test(lowerContext)) return 'COST_ESTIMATE';
    return 'AMOUNT';
  }

  /**
   * Parse date from regex match
   */
  private parseDate(match: RegExpExecArray): Date | null {
    try {
      const fullMatch = match[0];
      
      // Handle different date formats
      if (/\d{4}-\d{1,2}-\d{1,2}/.test(fullMatch)) {
        // ISO format
        return new Date(fullMatch);
      }
      
      if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(fullMatch)) {
        // DD/MM/YYYY or DD-MM-YYYY format
        const parts = fullMatch.split(/[\/\-]/);
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month, day);
      }
      
      // Try parsing with Date constructor
      return new Date(fullMatch);
    } catch {
      return null;
    }
  }

  /**
   * Classify date type based on context
   */
  private classifyDateType(context: string): DateEntity['type'] {
    const lowerContext = context.toLowerCase();
    
    if (/start|begin|commence/i.test(lowerContext)) return 'START_DATE';
    if (/end|complete|finish/i.test(lowerContext)) return 'END_DATE';
    if (/deadline|due|before/i.test(lowerContext)) return 'DEADLINE';
    if (/milestone|phase|stage/i.test(lowerContext)) return 'MILESTONE_DATE';
    return 'MILESTONE_DATE';
  }

  /**
   * Parse coordinates from regex match
   */
  private parseCoordinates(match: RegExpExecArray): { latitude: number; longitude: number } | null {
    try {
      if (match.length >= 3) {
        // Decimal degrees format
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        if (this.isValidCoordinate(lat, lng)) {
          return { latitude: lat, longitude: lng };
        }
      }
      
      // Handle DMS format if needed
      if (match.length >= 9) {
        // Degrees, minutes, seconds format
        const latDeg = parseInt(match[1]);
        const latMin = parseInt(match[2]);
        const latSec = parseFloat(match[3]);
        const latDir = match[4];
        
        const lngDeg = parseInt(match[5]);
        const lngMin = parseInt(match[6]);
        const lngSec = parseFloat(match[7]);
        const lngDir = match[8];
        
        let lat = latDeg + latMin/60 + latSec/3600;
        let lng = lngDeg + lngMin/60 + lngSec/3600;
        
        if (latDir === 'S') lat = -lat;
        if (lngDir === 'W') lng = -lng;
        
        if (this.isValidCoordinate(lat, lng)) {
          return { latitude: lat, longitude: lng };
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate coordinate values
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Extract location names from text
   */
  private extractLocationNames(text: string): GeospatialEntity[] {
    const entities: GeospatialEntity[] = [];
    
    // Common Indian location patterns
    const locationPatterns = [
      // State names
      /\b(Assam|Arunachal Pradesh|Manipur|Meghalaya|Mizoram|Nagaland|Tripura|Sikkim)\b/gi,
      // Major cities in Northeast India
      /\b(Guwahati|Shillong|Imphal|Aizawl|Kohima|Agartala|Itanagar|Gangtok)\b/gi,
      // District patterns
      /\b(\w+)\s+district\b/gi,
      // Address patterns
      /\b(?:village|town|city|block|tehsil|subdivision)\s+(\w+)/gi
    ];

    for (const pattern of locationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const position = match.index;
        
        entities.push({
          type: 'LOCATION_NAME',
          value: fullMatch.trim(),
          confidence: this.calculateLocationConfidence(fullMatch),
          position
        });
      }
    }

    return entities;
  }

  /**
   * Classify resource type
   */
  private classifyResourceType(text: string, context: string): ResourceEntity['type'] {
    const combined = (text + ' ' + context).toLowerCase();
    
    if (/engineer|worker|labor|technician|supervisor|manager|contractor|person|people/i.test(combined)) {
      return 'HUMAN_RESOURCE';
    }
    if (/excavator|bulldozer|crane|truck|vehicle|machine|equipment/i.test(combined)) {
      return 'EQUIPMENT';
    }
    if (/road|highway|pipeline|cable|fence|building|bridge/i.test(combined)) {
      return 'INFRASTRUCTURE';
    }
    return 'MATERIAL';
  }

  /**
   * Extract unit from resource text
   */
  private extractUnit(text: string): string | undefined {
    const unitMatch = text.match(/\b(tons?|tonnes?|kg|quintals?|bags?|cubic\s*meters?|m³|liters?|gallons?|km|kilometers?|miles?|meters?|feet|acres?|hectares?)\b/i);
    return unitMatch ? unitMatch[1] : undefined;
  }

  /**
   * Calculate confidence scores for different entity types
   */
  private calculateMonetaryConfidence(text: string, context: string): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence for clear currency indicators
    if (/₹|Rs\.?|INR/i.test(text)) confidence += 0.2;
    
    // Increase confidence for clear monetary context
    if (/cost|budget|amount|price|estimate|fund/i.test(context)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private calculateDateConfidence(text: string, parsedDate: Date): number {
    let confidence = 0.6; // Base confidence
    
    // Check if date is reasonable (not too far in past/future)
    const now = new Date();
    const yearDiff = Math.abs(parsedDate.getFullYear() - now.getFullYear());
    
    if (yearDiff <= 10) confidence += 0.2;
    if (yearDiff <= 5) confidence += 0.1;
    
    // Increase confidence for standard formats
    if (/\d{4}-\d{2}-\d{2}/.test(text)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private calculateCoordinateConfidence(coords: { latitude: number; longitude: number }): number {
    let confidence = 0.8; // Base confidence for valid coordinates
    
    // Check if coordinates are in Northeast India region
    const { latitude, longitude } = coords;
    
    // Northeast India approximate bounds
    if (latitude >= 22 && latitude <= 29 && longitude >= 88 && longitude <= 97) {
      confidence += 0.2; // Higher confidence for regional coordinates
    }
    
    return Math.min(confidence, 1.0);
  }

  private calculateLocationConfidence(text: string): number {
    let confidence = 0.6; // Base confidence
    
    // Known Northeast India locations get higher confidence
    const knownLocations = /Assam|Arunachal|Manipur|Meghalaya|Mizoram|Nagaland|Tripura|Sikkim|Guwahati|Shillong/i;
    if (knownLocations.test(text)) confidence += 0.3;
    
    return Math.min(confidence, 1.0);
  }

  private calculateResourceConfidence(text: string, context: string): number {
    let confidence = 0.7; // Base confidence
    
    // Clear quantity indicators increase confidence
    if (/\d+/.test(text)) confidence += 0.1;
    
    // Clear resource context increases confidence
    if (/resource|allocation|requirement|needed|required/i.test(context)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Remove duplicate entities
   */
  private deduplicateMonetaryEntities(entities: MonetaryEntity[]): MonetaryEntity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.position}-${entity.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateDateEntities(entities: DateEntity[]): DateEntity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.position}-${entity.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Convert specialized entity types to common ExtractedEntity format
   */
  private convertMonetaryEntities(entities: MonetaryEntity[]): ExtractedEntity[] {
    return entities.map(entity => ({
      type: 'MONETARY',
      value: entity.value,
      confidence: entity.confidence,
      position: entity.position
    }));
  }

  private convertDateEntities(entities: DateEntity[]): ExtractedEntity[] {
    return entities.map(entity => ({
      type: 'DATE',
      value: entity.value,
      confidence: entity.confidence,
      position: entity.position
    }));
  }

  private convertLocationEntities(entities: GeospatialEntity[]): ExtractedEntity[] {
    return entities.map(entity => ({
      type: 'LOCATION',
      value: entity.value,
      confidence: entity.confidence,
      position: entity.position
    }));
  }

  private convertResourceEntities(entities: ResourceEntity[]): ExtractedEntity[] {
    return entities.map(entity => ({
      type: 'RESOURCE',
      value: entity.value,
      confidence: entity.confidence,
      position: entity.position
    }));
  }

  /**
   * Generate searchable metadata from extracted entities
   */
  async generateMetadata(entities: ExtractedEntity[], text: string): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {
      totalCost: 0,
      locations: [],
      dates: [],
      resources: [],
      keywords: [],
      summary: {}
    };

    // Process monetary entities
    const monetaryEntities = entities.filter(e => e.type === 'MONETARY');
    if (monetaryEntities.length > 0) {
      // Calculate total estimated cost
      metadata.totalCost = monetaryEntities.reduce((sum, entity) => {
        const value = this.parseMonetaryValue(entity.value);
        return sum + value;
      }, 0);
      
      metadata.summary.monetaryEntitiesCount = monetaryEntities.length;
      metadata.summary.highestAmount = Math.max(...monetaryEntities.map(e => this.parseMonetaryValue(e.value)));
    }

    // Process location entities
    const locationEntities = entities.filter(e => e.type === 'LOCATION');
    metadata.locations = locationEntities.map(e => e.value);
    metadata.summary.locationsCount = locationEntities.length;

    // Process date entities
    const dateEntities = entities.filter(e => e.type === 'DATE');
    metadata.dates = dateEntities.map(e => e.value);
    metadata.summary.datesCount = dateEntities.length;

    // Process resource entities
    const resourceEntities = entities.filter(e => e.type === 'RESOURCE');
    metadata.resources = resourceEntities.map(e => e.value);
    metadata.summary.resourcesCount = resourceEntities.length;

    // Generate keywords for search indexing
    metadata.keywords = this.generateSearchKeywords(entities, text);

    return metadata;
  }

  /**
   * Generate keywords for search indexing
   */
  private generateSearchKeywords(entities: ExtractedEntity[], text: string): string[] {
    const keywords = new Set<string>();

    // Add entity values as keywords
    entities.forEach(entity => {
      const words = entity.value.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    });

    // Add important terms from text
    const importantTerms = [
      'project', 'development', 'construction', 'infrastructure', 'budget',
      'timeline', 'cost', 'estimate', 'resource', 'allocation', 'scheme',
      'government', 'ministry', 'northeast', 'assam', 'manipur', 'meghalaya'
    ];

    const textLower = text.toLowerCase();
    importantTerms.forEach(term => {
      if (textLower.includes(term)) {
        keywords.add(term);
      }
    });

    return Array.from(keywords).slice(0, 50); // Limit to 50 keywords
  }
}