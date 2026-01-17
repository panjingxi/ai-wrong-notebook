import type { ParsedImageData } from './types';
import { createLogger } from '@/lib/logger';
import { BASE64_REGEX, DATA_URL_REGEX, DEFAULT_MIME_TYPE } from './constants';

const logger = createLogger('core:image-processor');

/**
 * Parse Data URL format image data
 * @param dataUrl - Data URL format string (e.g., "data:image/jpeg;base64,...")
 * @returns Parsed MIME type and pure base64 data
 * @throws Error if Data URL format is invalid
 */
export function parseDataUrl(dataUrl: string): ParsedImageData {
    logger.debug({ dataUrlLength: dataUrl.length }, 'Parsing Data URL');

    const matches = dataUrl.match(DATA_URL_REGEX);

    if (!matches) {
        logger.warn('Invalid Data URL format');
        throw new Error('Invalid Data URL format');
    }

    const [, mimeType, base64] = matches;

    logger.debug({ mimeType, base64Length: base64.length }, 'Parsed Data URL successfully');

    return {
        mimeType,
        base64
    };
}

/**
 * Process image data (auto-detect Data URL format)
 * @param rawImageData - Image data (may be Data URL or pure base64)
 * @param defaultMimeType - Default MIME type
 * @returns Processed image data
 */
export function processImage(
    rawImageData: string,
    defaultMimeType: string = DEFAULT_MIME_TYPE
): ParsedImageData {
    // If it's Data URL format, parse it
    if (rawImageData.startsWith('data:')) {
        return parseDataUrl(rawImageData);
    }

    // Otherwise assume it's pure base64 data
    logger.debug({ base64Length: rawImageData.length }, 'Using raw base64 data');
    return {
        mimeType: defaultMimeType,
        base64: rawImageData
    };
}

/**
 * Validate base64 data (basic check)
 * @param base64Data - base64 string
 * @returns Whether the data is valid
 */
export function validateBase64(base64Data: string): boolean {
    if (!base64Data || base64Data.length === 0) {
        logger.warn('Empty base64 data');
        return false;
    }

    const isValid = BASE64_REGEX.test(base64Data);

    if (!isValid) {
        logger.warn('Invalid base64 characters detected');
    }

    return isValid;
}

/**
 * Get image data size in bytes
 * @param base64Data - base64 string
 * @returns Estimated byte count
 */
export function getImageSize(base64Data: string): number {
    // Base64 encoded size is approximately 4/3 of original data
    // Remove possible padding characters '='
    const paddingCount = (base64Data.match(/=/g) || []).length;
    return Math.floor((base64Data.length * 3) / 4) - paddingCount;
}

// Legacy class-based API for backward compatibility
/** @deprecated Use individual functions instead */
export class ImageProcessor {
    /** @deprecated Use parseDataUrl function instead */
    static parseDataUrl = parseDataUrl;
    /** @deprecated Use processImage function instead */
    static processImageData = processImage;
    /** @deprecated Use validateBase64 function instead */
    static validateImageData = validateBase64;
    /** @deprecated Use getImageSize function instead */
    static getImageSize = getImageSize;
}
