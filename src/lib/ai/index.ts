import { AIService } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { AzureOpenAIProvider } from "./azure-provider";

export * from "./types";

import { getAppConfig, getActiveOpenAIConfig } from "../config";
import { createLogger } from "../logger";

const logger = createLogger('ai');

export function getAIService(): AIService {
    // Always get fresh config
    const config = getAppConfig();
    const provider = config.aiProvider;

    if (provider === "openai") {
        const activeConfig = getActiveOpenAIConfig();
        logger.info({ activeInstance: activeConfig?.name }, 'Using OpenAI Provider');
        return new OpenAIProvider(activeConfig);
    } else if (provider === "azure") {
        logger.info({ deployment: config.azure?.deploymentName }, 'Using Azure OpenAI Provider');
        return new AzureOpenAIProvider(config.azure);
    } else if (provider === "glm") {
        logger.info('Using GLM (ZhipuAI) Provider');
        // GLM is OpenAI compatible
        return new OpenAIProvider({
            apiKey: config.glm?.apiKey,
            baseUrl: config.glm?.baseUrl,
            model: config.glm?.model,
        });
    } else if (provider === "minimax") {
        logger.info('Using MiniMax Provider');
        // MiniMax is OpenAI compatible
        return new OpenAIProvider({
            apiKey: config.minimax?.apiKey,
            baseUrl: config.minimax?.baseUrl,
            model: config.minimax?.model,
        });
    } else if (provider === "qwen") {
        logger.info('Using Qwen (Alibaba) Provider');
        // Qwen is OpenAI compatible
        return new OpenAIProvider({
            apiKey: config.qwen?.apiKey,
            baseUrl: config.qwen?.baseUrl,
            model: config.qwen?.model,
        });
    } else {
        logger.info('Using Gemini Provider');
        return new GeminiProvider(config.gemini);
    }
}

