/**
 * Logger utility with environment-aware logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return false;
    }
    return true;
  }

  info(message: string, options?: LogOptions): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, options));
      if (options?.data) {
        console.log(options.data);
      }
    }
  }

  warn(message: string, options?: LogOptions): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, options));
      if (options?.data) {
        console.warn(options.data);
      }
    }
  }

  error(message: string, error?: Error | any, options?: LogOptions): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, options));
      if (error) {
        if (error instanceof Error) {
          console.error(error.stack || error.message);
        } else {
          console.error(error);
        }
      }
      if (options?.data) {
        console.error(options.data);
      }
    }
  }

  debug(message: string, options?: LogOptions): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, options));
      if (options?.data) {
        console.debug(options.data);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logInfo = (message: string, options?: LogOptions) => logger.info(message, options);
export const logWarn = (message: string, options?: LogOptions) => logger.warn(message, options);
export const logError = (message: string, error?: Error | any, options?: LogOptions) => logger.error(message, error, options);
export const logDebug = (message: string, options?: LogOptions) => logger.debug(message, options);
