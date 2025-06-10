/**
 * Strategy Pattern for YJS ↔ Artifact Conversions
 *
 * This module implements the strategy pattern to support multiple artifact types
 * without modifying existing code (Open/Closed Principle).
 *
 * Currently supports:
 * - DRDFV2 (DevRev Document Format V2)
 */

import * as Y from 'yjs';

interface ArtifactConverter {
  toYjs(artifact: Record<string, unknown>): Y.Doc;
  fromYjs(yjsDoc: Y.Doc): Record<string, unknown>;
  getSupportedType(): string;
}

/**
 * DRDFV2 Converter Implementation
 */
class DRDFV2Converter implements ArtifactConverter {
  toYjs(artifact: Record<string, unknown>): Y.Doc {
    const yjsDoc = new Y.Doc();
    const rootMap = yjsDoc.getMap();

    // Convert artifact to YJS format using the same logic as the original converter
    this.convertObjectToYjsMap(artifact, rootMap);

    return yjsDoc;
  }

  fromYjs(yjsDoc: Y.Doc): Record<string, unknown> {
    const rootMap = yjsDoc.getMap();

    if (rootMap.size === 0) {
      throw new Error('Cannot convert empty YJS document');
    }

    // Convert the root map to a plain object using toJSON
    return rootMap.toJSON() as Record<string, unknown>;
  }

  getSupportedType(): string {
    return 'drdfv2';
  }

  /**
   * Convert plain JavaScript object to YJS Map
   * Recursively handles nested objects, arrays, and text fields
   */
  private convertObjectToYjsMap(obj: Record<string, unknown>, yjsMap: Y.Map<unknown>): void {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];

      if (Array.isArray(value)) {
        const yjsArray = new Y.Array();
        this.convertArrayToYjsArray(value, yjsArray);
        yjsMap.set(key, yjsArray);
      } else if (value && typeof value === 'object' && (value as Record<string, unknown>).type) {
        // Handle DRDFV2 nodes with type property
        const yjsSubMap = new Y.Map();
        this.convertObjectToYjsMap(value as Record<string, unknown>, yjsSubMap);
        yjsMap.set(key, yjsSubMap);
      } else if (key === 'text' && typeof value === 'string') {
        // Convert text fields to YJS Text for collaborative editing
        const ytext = new Y.Text(value);
        yjsMap.set(key, ytext);
      } else if (value && typeof value === 'object') {
        // Handle nested objects
        const yjsSubMap = new Y.Map();
        this.convertObjectToYjsMap(value as Record<string, unknown>, yjsSubMap);
        yjsMap.set(key, yjsSubMap);
      } else {
        // Handle primitive values
        yjsMap.set(key, value);
      }
    });
  }

  /**
   * Convert plain JavaScript array to YJS Array
   * Recursively handles nested objects, arrays, and primitives
   */
  private convertArrayToYjsArray(arr: unknown[], yjsArray: Y.Array<unknown>): void {
    arr.forEach((item) => {
      if (Array.isArray(item)) {
        const yjsSubArray = new Y.Array();
        this.convertArrayToYjsArray(item, yjsSubArray);
        yjsArray.push([yjsSubArray]);
      } else if (item && typeof item === 'object') {
        const yjsMap = new Y.Map();
        this.convertObjectToYjsMap(item as Record<string, unknown>, yjsMap);
        yjsArray.push([yjsMap]);
      } else {
        yjsArray.push([item]);
      }
    });
  }
}

/**
 * Registry for managing different converter strategies
 */
class YjsConverterRegistry {
  private converters: Map<string, ArtifactConverter> = new Map();

  constructor() {
    // Register available converters
    this.register(new DRDFV2Converter());
  }

  register(converter: ArtifactConverter): void {
    this.converters.set(converter.getSupportedType(), converter);
  }

  getConverter(documentType: string): ArtifactConverter {
    const converter = this.converters.get(documentType);
    if (!converter) {
      throw new Error(`No converter found for document type: ${documentType}`);
    }
    return converter;
  }

  getSupportedTypes(): string[] {
    return Array.from(this.converters.keys());
  }
}

// Global registry instance
export const yjsConverters = new YjsConverterRegistry();
