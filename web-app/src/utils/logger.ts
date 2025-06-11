/**
 * logger.ts
 * 
 * Logger utility for consistent logging across the application
 * 
 * Functions:
 *   log, info, warn, error, debug
 * 
 * Usage: import { logger } from './utils/logger'
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = import.meta.env.DEV;
  
  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.isDevelopment && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...args);
        break;
      case 'info':
        console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }
  
  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    const errorMessage = error ? `${message} - ${error.message}` : message;
    this.formatMessage('error', errorMessage, error, ...args);
  }
}

export const logger = new Logger(); 