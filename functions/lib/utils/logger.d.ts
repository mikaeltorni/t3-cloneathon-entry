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
interface LogContext {
    userId?: string;
    requestId?: string;
    functionName?: string;
    [key: string]: any;
}
declare class FunctionLogger {
    private isDevelopment;
    /**
     * Formats a log message with context
     *
     * @param level - Log level
     * @param message - Log message
     * @param context - Additional context
     * @returns void
     */
    private formatMessage;
    /**
     * Log debug message
     *
     * @param message - Debug message
     * @param context - Additional context
     * @returns void
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log info message
     *
     * @param message - Info message
     * @param context - Additional context
     * @returns void
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log warning message
     *
     * @param message - Warning message
     * @param context - Additional context
     * @returns void
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log error message
     *
     * @param message - Error message
     * @param error - Error object
     * @param context - Additional context
     * @returns void
     */
    error(message: string, error?: Error, context?: LogContext): void;
    /**
     * Create a child logger with additional context
     *
     * @param baseContext - Base context to include in all logs
     * @returns Child logger instance
     */
    child(baseContext: LogContext): FunctionLogger;
}
export declare const functionLogger: FunctionLogger;
export {};
//# sourceMappingURL=logger.d.ts.map