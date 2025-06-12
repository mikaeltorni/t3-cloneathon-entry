"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.successResponseWithMessage = successResponseWithMessage;
exports.errorResponse = errorResponse;
exports.validationErrorResponse = validationErrorResponse;
exports.notFoundResponse = notFoundResponse;
exports.unauthorizedResponse = unauthorizedResponse;
exports.rateLimitResponse = rateLimitResponse;
const logger_1 = require("./logger");
/**
 * Send a successful response
 *
 * @param response - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns void
 */
function successResponse(response, data, statusCode = 200) {
    const responseData = {
        data,
        meta: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        },
    };
    logger_1.functionLogger.info("Sending success response", {
        statusCode,
        hasData: !!data,
    });
    response.status(statusCode).json(responseData);
}
/**
 * Send a successful response with a message
 *
 * @param response - Express response object
 * @param message - Success message
 * @param data - Optional response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns void
 */
function successResponseWithMessage(response, message, data, statusCode = 200) {
    const responseData = {
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        },
    };
    logger_1.functionLogger.info("Sending success response with message", {
        message,
        statusCode,
        hasData: !!data,
    });
    response.status(statusCode).json(responseData);
}
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
function errorResponse(response, error, statusCode = 500, code, details) {
    const responseData = {
        error,
        code,
        details,
        timestamp: new Date().toISOString(),
    };
    logger_1.functionLogger.warn("Sending error response", {
        error,
        statusCode,
        code,
        hasDetails: !!details,
    });
    response.status(statusCode).json(responseData);
}
/**
 * Send a validation error response
 *
 * @param response - Express response object
 * @param message - Validation error message
 * @param validationErrors - Specific validation errors
 * @returns void
 */
function validationErrorResponse(response, message = "Validation failed", validationErrors) {
    const responseData = {
        error: "VALIDATION_ERROR",
        message,
        details: validationErrors,
        timestamp: new Date().toISOString(),
    };
    logger_1.functionLogger.warn("Sending validation error response", {
        message,
        hasValidationErrors: !!validationErrors,
    });
    response.status(400).json(responseData);
}
/**
 * Send a not found error response
 *
 * @param response - Express response object
 * @param resource - Resource that was not found
 * @returns void
 */
function notFoundResponse(response, resource = "Resource") {
    const responseData = {
        error: "NOT_FOUND",
        message: `${resource} not found`,
        timestamp: new Date().toISOString(),
    };
    logger_1.functionLogger.warn("Sending not found response", {
        resource,
    });
    response.status(404).json(responseData);
}
/**
 * Send an unauthorized error response
 *
 * @param response - Express response object
 * @param message - Unauthorized message
 * @returns void
 */
function unauthorizedResponse(response, message = "Unauthorized access") {
    const responseData = {
        error: "UNAUTHORIZED",
        message,
        timestamp: new Date().toISOString(),
    };
    logger_1.functionLogger.warn("Sending unauthorized response", {
        message,
    });
    response.status(401).json(responseData);
}
/**
 * Send a rate limit error response
 *
 * @param response - Express response object
 * @param retryAfter - Seconds until retry is allowed
 * @returns void
 */
function rateLimitResponse(response, retryAfter) {
    const responseData = {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
        details: retryAfter ? { retryAfterSeconds: retryAfter } : undefined,
        timestamp: new Date().toISOString(),
    };
    if (retryAfter) {
        response.set("Retry-After", retryAfter.toString());
    }
    logger_1.functionLogger.warn("Sending rate limit response", {
        retryAfter,
    });
    response.status(429).json(responseData);
}
//# sourceMappingURL=responseHelpers.js.map