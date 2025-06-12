"use strict";
/**
 * index.ts
 *
 * Main Firebase Cloud Functions entry point
 *
 * Functions:
 *   helloWorld - Sample HTTP function
 *   scheduledFunction - Sample scheduled function
 *   healthCheck - Health check endpoint
 *
 * Usage: Deploy with `npm run deploy` or test locally with `npm run serve`
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironment = exports.processData = exports.scheduledFunction = exports.healthCheck = exports.helloWorld = void 0;
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
// Set global options for all functions
(0, v2_1.setGlobalOptions)({
    maxInstances: 10,
    region: "us-central1",
});
/**
 * Sample HTTP Cloud Function
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
exports.helloWorld = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 60,
}, (request, response) => {
    firebase_functions_1.logger.info("Hello logs!", { structuredData: true });
    const name = request.query.name || request.body.name || "World";
    response.json({
        message: `Hello ${name} from Firebase Functions!`,
        timestamp: new Date().toISOString(),
        method: request.method,
        userAgent: request.get("user-agent"),
    });
});
/**
 * Health check endpoint for monitoring
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
exports.healthCheck = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 30,
}, (request, response) => {
    firebase_functions_1.logger.info("Health check requested");
    response.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
    });
});
/**
 * Sample scheduled function that runs every hour
 *
 * @param event - Scheduled event object
 * @returns Promise<void>
 */
exports.scheduledFunction = (0, scheduler_1.onSchedule)({
    schedule: "0 * * * *", // Every hour
    timeZone: "America/New_York",
    timeoutSeconds: 300,
}, async (event) => {
    firebase_functions_1.logger.info("Scheduled function executed", {
        timestamp: event.scheduleTime,
        jobName: event.jobName,
    });
    try {
        // Perform scheduled tasks here
        // For example: cleanup, notifications, data processing
        const currentTime = new Date().toISOString();
        firebase_functions_1.logger.info("Scheduled task completed successfully", {
            completedAt: currentTime,
            duration: Date.now() - new Date(event.scheduleTime).getTime(),
        });
    }
    catch (error) {
        firebase_functions_1.logger.error("Scheduled function failed:", error);
        throw error;
    }
});
/**
 * API endpoint for processing data without database
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
exports.processData = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 120,
}, (request, response) => {
    firebase_functions_1.logger.info("Data processing requested", {
        method: request.method,
        contentType: request.get("content-type"),
    });
    // Only allow POST requests
    if (request.method !== "POST") {
        response.status(405).json({
            error: "Method not allowed. Only POST requests are supported.",
            timestamp: new Date().toISOString(),
        });
        return;
    }
    try {
        const { data, operation } = request.body;
        if (!data || !operation) {
            response.status(400).json({
                error: "Missing required fields: data and operation",
                timestamp: new Date().toISOString(),
            });
            return;
        }
        // Process data based on operation type
        let result;
        switch (operation) {
            case "uppercase":
                result = typeof data === "string" ? data.toUpperCase() : data;
                break;
            case "lowercase":
                result = typeof data === "string" ? data.toLowerCase() : data;
                break;
            case "reverse":
                result = typeof data === "string" ? data.split("").reverse().join("") : data;
                break;
            case "count":
                result = Array.isArray(data) ? data.length : typeof data === "string" ? data.length : 0;
                break;
            default:
                response.status(400).json({
                    error: "Unsupported operation. Supported: uppercase, lowercase, reverse, count",
                    timestamp: new Date().toISOString(),
                });
                return;
        }
        response.json({
            success: true,
            operation,
            originalData: data,
            result,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        firebase_functions_1.logger.error("Data processing failed:", error);
        response.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * Function to get environment information
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
exports.getEnvironment = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 30,
}, (request, response) => {
    firebase_functions_1.logger.info("Environment info requested");
    response.json({
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=index.js.map