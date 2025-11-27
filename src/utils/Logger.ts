/**
 * Logger Utility
 * 
 * Centralized logging with levels, context, and formatting.
 * Supports debug, info, warn, error levels with optional context.
 */

/**
 * Log levels in order of severity.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Log entry structure.
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger configuration.
 */
export interface LoggerConfig {
  /** Minimum level to log (default: DEBUG in dev, WARN in prod) */
  minLevel: LogLevel;
  
  /** Whether to include timestamps (default: true) */
  showTimestamp: boolean;
  
  /** Whether to show log level (default: true) */
  showLevel: boolean;
  
  /** Whether to show category/source (default: true) */
  showCategory: boolean;
  
  /** Whether to log to console (default: true) */
  consoleOutput: boolean;
  
  /** Whether to store logs in memory (default: true in dev) */
  storeInMemory: boolean;
  
  /** Maximum logs to store in memory (default: 500) */
  maxStoredLogs: number;
  
  /** Custom log handler */
  customHandler?: (entry: LogEntry) => void;
}

/**
 * Default configuration.
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.DEBUG,
  showTimestamp: true,
  showLevel: true,
  showCategory: true,
  consoleOutput: true,
  storeInMemory: true,
  maxStoredLogs: 500,
};

/**
 * Level names for display.
 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
};

/**
 * Level colors for console.
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'color: #888',
  [LogLevel.INFO]: 'color: #4a9eff',
  [LogLevel.WARN]: 'color: #ffaa00',
  [LogLevel.ERROR]: 'color: #ff4444',
  [LogLevel.NONE]: '',
};

/**
 * Category colors for console.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Combat: 'color: #ff6b6b',
  Card: 'color: #4ecdc4',
  Relic: 'color: #ffe66d',
  Effect: 'color: #95e1d3',
  Save: 'color: #a8e6cf',
  Event: 'color: #dda0dd',
  UI: 'color: #87ceeb',
  State: 'color: #ffd93d',
  Data: 'color: #c9b1ff',
};

/**
 * Global logger state.
 */
class LoggerImpl {
  private config: LoggerConfig = { ...DEFAULT_CONFIG };
  private logs: LogEntry[] = [];
  private categoryFilters: Set<string> = new Set();

  /**
   * Configure the logger.
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  /**
   * Set minimum log level.
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Enable/disable specific categories.
   */
  filterCategories(categories: string[], enabled: boolean): void {
    if (enabled) {
      categories.forEach(c => this.categoryFilters.delete(c));
    } else {
      categories.forEach(c => this.categoryFilters.add(c));
    }
  }

  /**
   * Clear category filters.
   */
  clearFilters(): void {
    this.categoryFilters.clear();
  }

  /**
   * Get stored logs.
   */
  getLogs(options?: {
    level?: LogLevel;
    category?: string;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (options?.level !== undefined) {
      filtered = filtered.filter(log => log.level >= options.level!);
    }
    if (options?.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }
    if (options?.since) {
      filtered = filtered.filter(log => log.timestamp >= options.since!);
    }
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Clear stored logs.
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON.
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Core logging method.
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    // Check level
    if (level < this.config.minLevel) return;

    // Check category filter
    if (this.categoryFilters.has(category)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      context,
      error,
    };

    // Store in memory
    if (this.config.storeInMemory) {
      this.logs.push(entry);
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs.shift();
      }
    }

    // Console output
    if (this.config.consoleOutput) {
      this.consoleLog(entry);
    }

    // Custom handler
    if (this.config.customHandler) {
      this.config.customHandler(entry);
    }
  }

  /**
   * Format and output to console.
   */
  private consoleLog(entry: LogEntry): void {
    const parts: string[] = [];
    const styles: string[] = [];

    // Timestamp
    if (this.config.showTimestamp) {
      const time = entry.timestamp.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      parts.push(`%c${time}`);
      styles.push('color: #666');
    }

    // Level
    if (this.config.showLevel) {
      parts.push(`%c[${LEVEL_NAMES[entry.level]}]`);
      styles.push(LEVEL_COLORS[entry.level]);
    }

    // Category
    if (this.config.showCategory) {
      parts.push(`%c[${entry.category}]`);
      styles.push(CATEGORY_COLORS[entry.category] || 'color: #aaa');
    }

    // Message
    parts.push(`%c${entry.message}`);
    styles.push('color: inherit');

    // Build format string
    const formatString = parts.join(' ');

    // Log based on level
    const consoleFn = this.getConsoleFn(entry.level);

    if (entry.context || entry.error) {
      consoleFn(formatString, ...styles);
      if (entry.context) {
        consoleFn('  Context:', entry.context);
      }
      if (entry.error) {
        consoleFn('  Error:', entry.error);
      }
    } else {
      consoleFn(formatString, ...styles);
    }
  }

  /**
   * Get appropriate console function for level.
   */
  private getConsoleFn(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  // Public logging methods

  debug(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, category, message, context);
  }

  info(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, category, message, context);
  }

  warn(category: string, message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, category, message, context);
  }

  error(
    category: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, category, message, context, error);
  }

  /**
   * Create a scoped logger for a specific category.
   */
  scope(category: string): ScopedLogger {
    return new ScopedLogger(this, category);
  }

  /**
   * Time an operation.
   */
  time(category: string, label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(category, `${label} took ${duration.toFixed(2)}ms`);
    };
  }

  /**
   * Group logs together.
   */
  group(category: string, label: string, fn: () => void): void {
    console.group(`[${category}] ${label}`);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Assert a condition, logging error if false.
   */
  assert(
    condition: boolean,
    category: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!condition) {
      this.error(category, `Assertion failed: ${message}`, undefined, context);
    }
  }
}

/**
 * Scoped logger for a specific category.
 */
class ScopedLogger {
  constructor(
    private logger: LoggerImpl,
    private category: string
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(this.category, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(this.category, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(this.category, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logger.error(this.category, message, error, context);
  }

  time(label: string): () => void {
    return this.logger.time(this.category, label);
  }

  group(label: string, fn: () => void): void {
    this.logger.group(this.category, label, fn);
  }

  assert(condition: boolean, message: string, context?: Record<string, unknown>): void {
    this.logger.assert(condition, this.category, message, context);
  }
}

// Export singleton instance
export const Logger = new LoggerImpl();

// Export types
export type { ScopedLogger };

// Pre-configured scoped loggers for common categories
export const CombatLog = Logger.scope('Combat');
export const CardLog = Logger.scope('Card');
export const RelicLog = Logger.scope('Relic');
export const EffectLog = Logger.scope('Effect');
export const SaveLog = Logger.scope('Save');
export const EventLog = Logger.scope('Event');
export const UILog = Logger.scope('UI');
export const StateLog = Logger.scope('State');
export const DataLog = Logger.scope('Data');
