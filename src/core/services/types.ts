import type { ParsedQuestion } from '@/lib/ai/types';
import type { AnalysisMode, Language, Grade } from './constants';

/**
 * Base interface for all analysis requests
 */
export interface AnalysisRequestBase {
    /** Image data (supports Data URL format or raw base64) */
    image: string;
}

/**
 * Optional parameters for analysis
 */
export interface AnalysisOptions {
    /** MIME type (e.g., image/jpeg, image/png) */
    mimeType?: string;
    /** Analysis language */
    language?: Language;
    /** Analysis mode: academic or heritage */
    mode?: AnalysisMode;
    /** User's grade level (for precise tag recommendations) */
    grade?: Grade | null;
    /** Subject name (in Chinese, e.g., "数学", "物理") */
    subject?: string | null;
}

/**
 * Single image analysis request
 */
export interface SingleAnalysisRequest extends AnalysisRequestBase {
    /** Optional analysis parameters */
    options?: AnalysisOptions;
}

/**
 * Batch image analysis request
 */
export interface BatchAnalysisRequest {
    /** Image data (supports Data URL format or raw base64) */
    image: string;
    /** MIME type */
    mimeType?: string;
    /** Analysis language */
    language?: Language;
}

/**
 * Single image analysis response (reuses ParsedQuestion from AI layer)
 */
export type SingleAnalysisResponse = ParsedQuestion;

/**
 * Batch image analysis response
 */
export interface BatchAnalysisResponse {
    /** List of identified questions */
    items: ParsedQuestion[];
    /** Total count */
    totalCount: number;
}

/**
 * Parsed image data result
 */
export interface ParsedImageData {
    /** MIME type */
    mimeType: string;
    /** Pure base64 data (without Data URL prefix) */
    base64: string;
}

// Legacy type aliases for backward compatibility
/** @deprecated Use SingleAnalysisRequest instead */
export type LegacyAnalysisRequest = {
    imageBase64: string;
    mimeType?: string;
    language?: 'zh' | 'en';
    mode?: 'ACADEMIC' | 'HERITAGE';
    userGrade?: 7 | 8 | 9 | 10 | 11 | 12 | null;
    subjectName?: string | null;
};

/** @deprecated Use BatchAnalysisRequest instead */
export type LegacyBatchAnalysisRequest = {
    imageBase64: string;
    mimeType?: string;
    language?: 'zh' | 'en';
};
