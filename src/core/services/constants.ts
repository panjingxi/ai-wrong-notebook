/**
 * Analysis Engine Constants
 * 
 * Centralized constant definitions to avoid magic values
 */

/**
 * Default MIME type for images
 */
export const DEFAULT_MIME_TYPE = 'image/jpeg' as const;

/**
 * Regular expression for validating base64 data
 */
export const BASE64_REGEX = /^[A-Za-z0-9+/=]+$/;

/**
 * Regular expression for parsing Data URL format
 */
export const DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/;

/**
 * Analysis modes
 */
export const AnalysisMode = {
    ACADEMIC: 'ACADEMIC',
    HERITAGE: 'HERITAGE'
} as const;

export type AnalysisMode = typeof AnalysisMode[keyof typeof AnalysisMode];

/**
 * Supported languages
 */
export const Language = {
    ZH: 'zh',
    EN: 'en'
} as const;

export type Language = typeof Language[keyof typeof Language];

/**
 * Valid grade levels
 */
export type Grade = 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Supported MIME types for images
 */
export const SupportedMimeTypes = {
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp'
} as const;

export type SupportedMimeType = typeof SupportedMimeTypes[keyof typeof SupportedMimeTypes];
