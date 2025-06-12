/**
 * responseHelpers.ts
 *
 * Utility functions for consistent API responses in Firebase Functions
 *
 * Functions:
 *   successResponse, errorResponse, validationErrorResponse
 *
 * Usage: import { successResponse, errorResponse } from './utils/responseHelpers'
 */
import { Response } from "express";
/**
 * Send a successful response
 *
 * @param response - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns void
 */
export declare function successResponse(response: Response, data?: any, statusCode?: number): void;
/**
 * Send a successful response with a message
 *
 * @param response - Express response object
 * @param message - Success message
 * @param data - Optional response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns void
 */
export declare function successResponseWithMessage(response: Response, message: string, data?: any, statusCode?: number): void;
/**
 * Send an error response
 *
 * @param response - Express response object
 * @param error - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param code - Error code
 * @param details - Additional error details
 * @returns void
 */
export declare function errorResponse(response: Response, error: string, statusCode?: number, code?: string, details?: any): void;
/**
 * Send a validation error response
 *
 * @param response - Express response object
 * @param message - Validation error message
 * @param validationErrors - Specific validation errors
 * @returns void
 */
export declare function validationErrorResponse(response: Response, message?: string, validationErrors?: any): void;
/**
 * Send a not found error response
 *
 * @param response - Express response object
 * @param resource - Resource that was not found
 * @returns void
 */
export declare function notFoundResponse(response: Response, resource?: string): void;
/**
 * Send an unauthorized error response
 *
 * @param response - Express response object
 * @param message - Unauthorized message
 * @returns void
 */
export declare function unauthorizedResponse(response: Response, message?: string): void;
/**
 * Send a rate limit error response
 *
 * @param response - Express response object
 * @param retryAfter - Seconds until retry is allowed
 * @returns void
 */
export declare function rateLimitResponse(response: Response, retryAfter?: number): void;
//# sourceMappingURL=responseHelpers.d.ts.map