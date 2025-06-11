/**
 * ModelsController.ts
 * 
 * Controller for AI model-related HTTP endpoints
 * Separates model management from chat operations
 * 
 * Controller:
 *   ModelsController
 * 
 * Features:
 *   - Model availability and configuration
 *   - Model information and capabilities
 *   - Health checks for AI providers
 *   - Future: Model usage analytics, user preferences
 *   - Database-ready for model usage tracking
 * 
 * Usage: app.use('/api/models', modelsController.getRoutes());
 */
import { Request, Response, NextFunction, Router } from 'express';
import { createAIService } from '../services/AIService';
import type { AvailableModelsResponse } from '../../shared/types';

/**
 * Controller for AI model operations
 * 
 * Handles all model-related HTTP endpoints and provides
 * information about available AI models and their capabilities.
 */
export class ModelsController {
  private aiService: ReturnType<typeof createAIService>;

  constructor(openRouterApiKey: string) {
    this.aiService = createAIService(openRouterApiKey);
  }

  /**
   * Get all available AI models
   * 
   * @route GET /api/models
   */
  getAvailableModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('[ModelsController] Fetching available AI models...');
      
      const models = this.aiService.getAvailableModels();
      const response: AvailableModelsResponse = { models };
      
      console.log(`[ModelsController] Successfully fetched ${Object.keys(models).length} available models`);
      res.json(response);
    } catch (error) {
      console.error('[ModelsController] Error getting models:', error);
      next(error);
    }
  };

  /**
   * Get specific model information
   * 
   * @route GET /api/models/:modelId
   */
  getModelInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modelId } = req.params;
      
      if (!modelId?.trim()) {
        res.status(400).json({ 
          error: 'Model ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ModelsController] Fetching model info: ${modelId}`);
      const modelInfo = this.aiService.getModelInfo(modelId as any);
      
      if (!modelInfo) {
        res.status(404).json({ 
          error: 'Model not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ModelsController] Successfully fetched model info: ${modelInfo.name}`);
      res.json({
        modelId,
        ...modelInfo
      });
    } catch (error) {
      console.error('[ModelsController] Error getting model info:', error);
      next(error);
    }
  };

  /**
   * Check if a model supports reasoning
   * 
   * @route GET /api/models/:modelId/reasoning
   */
  checkReasoningSupport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modelId } = req.params;
      
      if (!modelId?.trim()) {
        res.status(400).json({ 
          error: 'Model ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ModelsController] Checking reasoning support for: ${modelId}`);
      const supportsReasoning = this.aiService.supportsReasoning(modelId as any);
      
      console.log(`[ModelsController] Model ${modelId} reasoning support: ${supportsReasoning}`);
      res.json({
        modelId,
        supportsReasoning,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[ModelsController] Error checking reasoning support:', error);
      next(error);
    }
  };

  /**
   * Health check for AI models service
   * 
   * @route GET /api/models/health
   */
  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('[ModelsController] Performing AI models health check...');
      
      const aiHealthy = await this.aiService.healthCheck();
      const models = this.aiService.getAvailableModels();
      const modelCount = Object.keys(models).length;
      
      res.json({
        status: aiHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          aiProvider: aiHealthy ? 'healthy' : 'unhealthy',
          modelsAvailable: modelCount,
          modelsLoaded: modelCount > 0
        }
      });
    } catch (error) {
      console.error('[ModelsController] Models health check error:', error);
      next(error);
    }
  };

  /**
   * Get model statistics (placeholder for future analytics)
   * 
   * @route GET /api/models/stats
   */
  getModelStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('[ModelsController] Fetching model statistics...');
      
      const models = this.aiService.getAvailableModels();
      const modelIds = Object.keys(models);
      
      // Placeholder statistics - could be enhanced with database tracking
      const stats = {
        totalModels: modelIds.length,
        reasoningModels: modelIds.filter(id => this.aiService.supportsReasoning(id as any)).length,
        modelsByProvider: modelIds.reduce((acc, id) => {
          const provider = id.split('/')[0] || 'unknown';
          acc[provider] = (acc[provider] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        timestamp: new Date().toISOString()
      };
      
      console.log(`[ModelsController] Generated stats for ${stats.totalModels} models`);
      res.json(stats);
    } catch (error) {
      console.error('[ModelsController] Error getting model stats:', error);
      next(error);
    }
  };

  /**
   * Validate model configuration (useful for debugging)
   * 
   * @route POST /api/models/validate
   */
  validateModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modelId } = req.body;
      
      if (!modelId?.trim()) {
        res.status(400).json({ 
          error: 'Model ID is required in request body',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`[ModelsController] Validating model: ${modelId}`);
      
      const modelInfo = this.aiService.getModelInfo(modelId);
      const isValid = modelInfo !== null;
      const supportsReasoning = isValid ? this.aiService.supportsReasoning(modelId) : false;
      
      const validation = {
        modelId,
        isValid,
        available: isValid,
        supportsReasoning,
        modelInfo: isValid ? modelInfo : null,
        timestamp: new Date().toISOString()
      };
      
      console.log(`[ModelsController] Model validation result: ${isValid}`);
      res.json(validation);
    } catch (error) {
      console.error('[ModelsController] Error validating model:', error);
      next(error);
    }
  };

  /**
   * Get Express router with all model routes
   * 
   * @returns Express router
   */
  getRoutes(): Router {
    const router = Router();

    // Define routes
    router.get('/', this.getAvailableModels);
    router.get('/health', this.healthCheck);
    router.get('/stats', this.getModelStats);
    router.post('/validate', this.validateModel);
    router.get('/:modelId', this.getModelInfo);
    router.get('/:modelId/reasoning', this.checkReasoningSupport);

    return router;
  }
}

/**
 * Factory function to create models controller
 * 
 * @param openRouterApiKey - OpenRouter API key
 * @returns ModelsController instance
 */
export const createModelsController = (openRouterApiKey: string): ModelsController => {
  return new ModelsController(openRouterApiKey);
}; 