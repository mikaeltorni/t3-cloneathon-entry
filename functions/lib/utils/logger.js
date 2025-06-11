"use strict";
/**
 * logger.ts
 *
 * Logger utility for Firebase Functions with structured logging
 *
 * Functions:
 *   log, info, warn, error, debug
 *
 * Usage: import { functionLogger } from './utils/logger'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionLogger = void 0;
const firebase_functions_1 = require("firebase-functions");
class FunctionLogger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === "development";
    }
    /**
     * Formats a log message with context
     *
     * @param level - Log level
     * @param message - Log message
     * @param context - Additional context
     * @returns void
     */
    formatMessage(level, message, context) {
        if (!this.isDevelopment && level === "debug")
            return;
        const logData = Object.assign({ timestamp: new Date().toISOString(), level: level.toUpperCase(), message }, context);
        switch (level) {
            case "debug":
                firebase_functions_1.logger.debug(message, logData);
                break;
            case "info":
                firebase_functions_1.logger.info(message, logData);
                break;
            case "warn":
                firebase_functions_1.logger.warn(message, logData);
                break;
            case "error":
                firebase_functions_1.logger.error(message, logData);
                break;
        }
    }
    /**
     * Log debug message
     *
     * @param message - Debug message
     * @param context - Additional context
     * @returns void
     */
    debug(message, context) {
        this.formatMessage("debug", message, context);
    }
    /**
     * Log info message
     *
     * @param message - Info message
     * @param context - Additional context
     * @returns void
     */
    info(message, context) {
        this.formatMessage("info", message, context);
    }
    /**
     * Log warning message
     *
     * @param message - Warning message
     * @param context - Additional context
     * @returns void
     */
    warn(message, context) {
        this.formatMessage("warn", message, context);
    }
    /**
     * Log error message
     *
     * @param message - Error message
     * @param error - Error object
     * @param context - Additional context
     * @returns void
     */
    error(message, error, context) {
        const errorContext = Object.assign(Object.assign({}, context), { error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : undefined });
        this.formatMessage("error", message, errorContext);
    }
    /**
     * Create a child logger with additional context
     *
     * @param baseContext - Base context to include in all logs
     * @returns Child logger instance
     */
    child(baseContext) {
        const childLogger = new FunctionLogger();
        // Override methods to include base context
        const originalDebug = childLogger.debug.bind(childLogger);
        const originalInfo = childLogger.info.bind(childLogger);
        const originalWarn = childLogger.warn.bind(childLogger);
        const originalError = childLogger.error.bind(childLogger);
        childLogger.debug = (message, context) => {
            originalDebug(message, Object.assign(Object.assign({}, baseContext), context));
        };
        childLogger.info = (message, context) => {
            originalInfo(message, Object.assign(Object.assign({}, baseContext), context));
        };
        childLogger.warn = (message, context) => {
            originalWarn(message, Object.assign(Object.assign({}, baseContext), context));
        };
        childLogger.error = (message, error, context) => {
            originalError(message, error, Object.assign(Object.assign({}, baseContext), context));
        };
        return childLogger;
    }
}
exports.functionLogger = new FunctionLogger();
//# sourceMappingURL=logger.js.map