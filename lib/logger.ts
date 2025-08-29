import { env, log } from '@/lib/env';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

class Logger {
  private context: Record<string, unknown> = {};

  // Set persistent context for all subsequent logs
  setContext(context: Record<string, unknown>) {
    this.context = { ...this.context, ...context };
  }

  // Clear context
  clearContext() {
    this.context = {};
  }

  // Core logging methods
  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  // Request logging
  logRequest(req: { method: string; url: string; ip?: string; userAgent?: string }, userId?: string) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.userAgent,
      userId,
    });
  }

  // Error logging with stack trace
  logError(error: Error, context?: Record<string, unknown>, userId?: string) {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
      userId,
    });
  }

  // Database operation logging
  logDatabase(operation: string, collection: string, duration?: number, context?: Record<string, unknown>) {
    this.info('Database Operation', {
      operation,
      collection,
      duration,
      ...context,
    });
  }

  // Authentication logging
  logAuth(action: 'login' | 'logout' | 'register' | 'password_reset', userId: string, success: boolean, context?: Record<string, unknown>) {
    this.info('Authentication', {
      action,
      userId,
      success,
      ...context,
    });
  }

  // Payment logging
  logPayment(action: 'initiated' | 'completed' | 'failed' | 'refunded', amount: number, currency: string, userId: string, context?: Record<string, unknown>) {
    this.info('Payment', {
      action,
      amount,
      currency,
      userId,
      ...context,
    });
  }

  private log(level: LogLevel, message: string, additionalContext?: Record<string, unknown>, error?: Error) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
      error,
    };

    // Use the environment logging function
    log(level, message, logEntry);

    // In development, also log to console with colors
    if (env.NODE_ENV === 'development') {
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';

      console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`, logEntry);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };
