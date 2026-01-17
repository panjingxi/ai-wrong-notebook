/**
 * Core Services Module
 * 
 * Provides business logic service layer, decoupled from HTTP framework
 */

// Main exports (new API)
export { AnalysisEngine } from './AnalysisEngine';
export {
    parseDataUrl,
    processImage,
    validateBase64,
    getImageSize
} from './ImageProcessor';

// Type exports
export type {
    SingleAnalysisRequest,
    SingleAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    ParsedImageData,
    AnalysisRequestBase,
    AnalysisOptions
} from './types';

// Constants exports
export {
    AnalysisMode,
    Language,
    DEFAULT_MIME_TYPE,
    BASE64_REGEX,
    DATA_URL_REGEX,
    SupportedMimeTypes
} from './constants';

export type {
    AnalysisMode as AnalysisModeType,
    Language as LanguageType,
    Grade,
    SupportedMimeType
} from './constants';

// Legacy exports for backward compatibility
/** @deprecated Use individual functions from ImageProcessor instead */
export { ImageProcessor } from './ImageProcessor';
