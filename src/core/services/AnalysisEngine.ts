import type { AIService } from '@/lib/ai/types';
import type {
    SingleAnalysisRequest,
    SingleAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    LegacyAnalysisRequest,
    LegacyBatchAnalysisRequest
} from './types';
import { processImage, validateBase64, getImageSize } from './ImageProcessor';
import { createLogger } from '@/lib/logger';
import { Language, AnalysisMode } from './constants';

const logger = createLogger('core:analysis-engine');

/**
 * Analysis Engine Core Class
 * 
 * Responsibilities:
 * 1. Encapsulate image processing logic (format conversion, validation)
 * 2. Encapsulate AI prompt building logic (integrate user context)
 * 3. Call AI service and return standardized results
 * 
 * Design Principles:
 * - Business logic completely decoupled from HTTP framework
 * - Dependency injection (receives AIService instance)
 * - Unified type interfaces ensure type safety
 */
export class AnalysisEngine {
    private readonly aiService: AIService;

    /**
     * Constructor
     * @param aiService - AI service instance (supports Gemini, OpenAI, Azure, etc.)
     */
    constructor(aiService: AIService) {
        this.aiService = aiService;
        logger.info('AnalysisEngine initialized');
    }

    /**
     * Analyze a single image containing a question
     * 
     * @param request - Analysis request parameters (new format)
     * @returns Parsed question data
     * @throws Error when image data is invalid or AI call fails
     */
    async analyzeSingleImage(
        request: SingleAnalysisRequest | LegacyAnalysisRequest
    ): Promise<SingleAnalysisResponse> {
        // Convert legacy format to new format
        const normalizedRequest = this.normalizeSingleRequest(request);
        const { image, options = {} } = normalizedRequest;

        logger.info({
            language: options.language || Language.ZH,
            mode: options.mode || AnalysisMode.ACADEMIC,
            grade: options.grade,
            subject: options.subject
        }, 'Starting single image analysis');

        // 1. Process image data
        const imageData = this.processImageData(image, options.mimeType);

        // 2. Set default values
        const language = options.language || Language.ZH;
        const mode = options.mode || AnalysisMode.ACADEMIC;

        // 3. Call AI service
        logger.debug('Calling AI service for image analysis');
        const result = await this.aiService.analyzeImage(
            imageData.base64,
            imageData.mimeType,
            language as 'zh' | 'en',
            options.grade || null,
            options.subject || null,
            mode as 'ACADEMIC' | 'HERITAGE'
        );

        logger.info({
            subject: result.subject,
            knowledgePointsCount: result.knowledgePoints?.length || 0,
            requiresImage: result.requiresImage
        }, 'Single image analysis completed successfully');

        return result;
    }

    /**
     * Batch analyze multiple questions in an image
     * 
     * @param request - Batch analysis request parameters
     * @returns List of all identified questions
     * @throws Error when image data is invalid or AI call fails
     */
    async analyzeBatchImage(
        request: BatchAnalysisRequest | LegacyBatchAnalysisRequest
    ): Promise<BatchAnalysisResponse> {
        // Convert legacy format to new format
        const normalizedRequest = this.normalizeBatchRequest(request);
        const { image, mimeType, language = Language.ZH } = normalizedRequest;

        logger.info({ language }, 'Starting batch image analysis');

        // 1. Process image data
        const imageData = this.processImageData(image, mimeType);

        // 2. Call AI service for batch analysis
        logger.debug('Calling AI service for batch analysis');
        const items = await this.aiService.batchAnalyzeImage(
            imageData.base64,
            imageData.mimeType,
            language as 'zh' | 'en'
        );

        logger.info({
            totalCount: items.length,
            subjects: [...new Set(items.map(item => item.subject))]
        }, 'Batch image analysis completed successfully');

        return {
            items,
            totalCount: items.length
        };
    }

    /**
     * Process image data (private method)
     * 
     * Responsibilities:
     * - Identify Data URL format and extract MIME type
     * - Validate image data
     * - Return standardized image data
     * 
     * @param imageData - Image data (Data URL or pure base64)
     * @param providedMimeType - User-provided MIME type (optional)
     * @returns Processed image data
     * @throws Error when image data is invalid
     */
    private processImageData(
        imageData: string,
        providedMimeType?: string
    ): { mimeType: string; base64: string } {
        logger.debug({
            imageLength: imageData?.length,
            providedMimeType
        }, 'Processing image data');

        // Validate image data exists
        if (!imageData) {
            logger.error('Missing image data');
            throw new Error('Image data is required');
        }

        // Process image data (auto-detect Data URL)
        const processed = processImage(imageData, providedMimeType);

        // Validate base64 data
        if (!validateBase64(processed.base64)) {
            logger.error('Invalid base64 image data');
            throw new Error('Invalid image data format');
        }

        // Log image information
        const imageSize = getImageSize(processed.base64);
        logger.debug({
            mimeType: processed.mimeType,
            base64Length: processed.base64.length,
            estimatedSize: `${(imageSize / 1024).toFixed(2)} KB`
        }, 'Image data processed successfully');

        return processed;
    }

    /**
     * Normalize single analysis request (handle legacy format)
     */
    private normalizeSingleRequest(
        request: SingleAnalysisRequest | LegacyAnalysisRequest
    ): SingleAnalysisRequest {
        // Check if it's legacy format
        if ('imageBase64' in request) {
            const legacy = request as LegacyAnalysisRequest;
            return {
                image: legacy.imageBase64,
                options: {
                    mimeType: legacy.mimeType,
                    language: legacy.language as Language,
                    mode: legacy.mode as AnalysisMode,
                    grade: legacy.userGrade || null,
                    subject: legacy.subjectName || null
                }
            };
        }
        return request as SingleAnalysisRequest;
    }

    /**
     * Normalize batch analysis request (handle legacy format)
     */
    private normalizeBatchRequest(
        request: BatchAnalysisRequest | LegacyBatchAnalysisRequest
    ): BatchAnalysisRequest {
        // Check if it's legacy format
        if ('imageBase64' in request) {
            const legacy = request as LegacyBatchAnalysisRequest;
            return {
                image: legacy.imageBase64,
                mimeType: legacy.mimeType,
                language: legacy.language as Language
            };
        }
        return request as BatchAnalysisRequest;
    }

    /**
     * Get current AI service instance
     * (for debugging or extending functionality)
     */
    getAIService(): AIService {
        return this.aiService;
    }
}
