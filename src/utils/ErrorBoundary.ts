/**
 * Error Boundaries
 * 
 * Error recovery and handling utilities for Phaser scenes.
 * Provides graceful degradation and recovery mechanisms.
 */

import Phaser from 'phaser';
import { Logger, StateLog } from './Logger';
import { GameError, ErrorCode, gameError } from './Result';

/**
 * Error recovery strategy.
 */
export type RecoveryStrategy = 
  | 'RETRY'        // Retry the operation
  | 'FALLBACK'     // Use fallback value/behavior
  | 'SKIP'         // Skip and continue
  | 'RESTART'      // Restart the scene
  | 'MAIN_MENU'    // Return to main menu
  | 'FATAL';       // Unrecoverable error

/**
 * Error handler result.
 */
export interface ErrorHandlerResult {
  strategy: RecoveryStrategy;
  message?: string;
  fallbackValue?: unknown;
}

/**
 * Error handler function type.
 */
export type ErrorHandler = (error: Error | GameError) => ErrorHandlerResult;

/**
 * Default error handlers for different error codes.
 */
const DEFAULT_HANDLERS: Record<string, ErrorHandler> = {
  [ErrorCode.CARD_NOT_FOUND]: () => ({
    strategy: 'SKIP',
    message: 'Card not found, skipping',
  }),
  
  [ErrorCode.ENEMY_NOT_FOUND]: () => ({
    strategy: 'FALLBACK',
    message: 'Enemy not found, using fallback',
  }),
  
  [ErrorCode.INSUFFICIENT_ENERGY]: () => ({
    strategy: 'SKIP',
    message: 'Not enough energy',
  }),
  
  [ErrorCode.INVALID_TARGET]: () => ({
    strategy: 'SKIP',
    message: 'Invalid target',
  }),
  
  [ErrorCode.SAVE_CORRUPTED]: () => ({
    strategy: 'MAIN_MENU',
    message: 'Save data corrupted',
  }),
  
  [ErrorCode.INVALID_STATE]: () => ({
    strategy: 'RESTART',
    message: 'Invalid game state detected',
  }),
};

/**
 * Global error boundary state.
 */
class ErrorBoundaryImpl {
  private handlers: Map<string, ErrorHandler> = new Map();
  private errorCount: number = 0;
  private lastError: Error | null = null;
  private errorThreshold: number = 5;
  private errorWindow: number = 60000; // 1 minute
  private errorTimestamps: number[] = [];

  constructor() {
    // Register default handlers
    Object.entries(DEFAULT_HANDLERS).forEach(([code, handler]) => {
      this.handlers.set(code, handler);
    });
  }

  /**
   * Register a custom error handler.
   */
  registerHandler(code: string, handler: ErrorHandler): void {
    this.handlers.set(code, handler);
  }

  /**
   * Remove an error handler.
   */
  removeHandler(code: string): void {
    this.handlers.delete(code);
  }

  /**
   * Handle an error and get recovery strategy.
   */
  handle(error: Error | GameError): ErrorHandlerResult {
    // Track error for rate limiting
    this.trackError(error);

    // Check for error storm
    if (this.isErrorStorm()) {
      Logger.error('ErrorBoundary', 'Error storm detected, forcing main menu', error);
      return {
        strategy: 'MAIN_MENU',
        message: 'Too many errors occurred, returning to main menu',
      };
    }

    // Get error code
    const code = error instanceof GameError ? error.code : ErrorCode.UNKNOWN;

    // Find handler
    const handler = this.handlers.get(code);
    if (handler) {
      const result = handler(error);
      Logger.warn('ErrorBoundary', `Handled error: ${code}`, {
        strategy: result.strategy,
        message: result.message,
      });
      return result;
    }

    // Default handling
    Logger.error('ErrorBoundary', 'Unhandled error', error);
    return {
      strategy: 'SKIP',
      message: error.message,
    };
  }

  /**
   * Wrap an operation with error handling.
   */
  wrap<T>(
    operation: () => T,
    fallback?: T,
    context?: string
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      const result = this.handle(error instanceof Error ? error : new Error(String(error)));
      
      if (context) {
        Logger.debug('ErrorBoundary', `Error in ${context}`, { error });
      }

      switch (result.strategy) {
        case 'FALLBACK':
          return fallback ?? (result.fallbackValue as T);
        case 'RETRY':
          // Simple retry (could add exponential backoff)
          try {
            return operation();
          } catch {
            return fallback;
          }
        default:
          return fallback;
      }
    }
  }

  /**
   * Wrap an async operation with error handling.
   */
  async wrapAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      const result = this.handle(error instanceof Error ? error : new Error(String(error)));
      
      if (context) {
        Logger.debug('ErrorBoundary', `Async error in ${context}`, { error });
      }

      switch (result.strategy) {
        case 'FALLBACK':
          return fallback ?? (result.fallbackValue as T);
        case 'RETRY':
          try {
            return await operation();
          } catch {
            return fallback;
          }
        default:
          return fallback;
      }
    }
  }

  /**
   * Track error for rate limiting.
   */
  private trackError(error: Error): void {
    this.errorCount++;
    this.lastError = error;
    this.errorTimestamps.push(Date.now());
    
    // Clean old timestamps
    const cutoff = Date.now() - this.errorWindow;
    this.errorTimestamps = this.errorTimestamps.filter(t => t > cutoff);
  }

  /**
   * Check if we're in an error storm.
   */
  private isErrorStorm(): boolean {
    return this.errorTimestamps.length >= this.errorThreshold;
  }

  /**
   * Get error statistics.
   */
  getStats(): {
    totalErrors: number;
    recentErrors: number;
    lastError: Error | null;
  } {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorTimestamps.length,
      lastError: this.lastError,
    };
  }

  /**
   * Reset error tracking.
   */
  reset(): void {
    this.errorCount = 0;
    this.lastError = null;
    this.errorTimestamps = [];
  }

  /**
   * Configure error threshold and window.
   */
  configure(options: { threshold?: number; window?: number }): void {
    if (options.threshold !== undefined) {
      this.errorThreshold = options.threshold;
    }
    if (options.window !== undefined) {
      this.errorWindow = options.window;
    }
  }
}

// Export singleton
export const ErrorBoundary = new ErrorBoundaryImpl();

/**
 * Base scene with error handling.
 * Extend this instead of Phaser.Scene for automatic error handling.
 */
export abstract class SafeScene extends Phaser.Scene {
  protected logger = Logger.scope(this.constructor.name);

  /**
   * Safe create - wraps create in error boundary.
   */
  create(data?: object): void {
    ErrorBoundary.wrap(
      () => this.safeCreate(data),
      undefined,
      `${this.constructor.name}.create`
    );
  }

  /**
   * Override this instead of create().
   */
  protected abstract safeCreate(data?: object): void;

  /**
   * Safe update - wraps update in error boundary.
   */
  update(time: number, delta: number): void {
    ErrorBoundary.wrap(
      () => this.safeUpdate(time, delta),
      undefined,
      `${this.constructor.name}.update`
    );
  }

  /**
   * Override this instead of update().
   */
  protected safeUpdate(time: number, delta: number): void {
    // Default empty implementation
  }

  /**
   * Transition to another scene with error handling.
   */
  protected safeTransition(sceneKey: string, data?: object): void {
    ErrorBoundary.wrap(
      () => {
        this.logger.info(`Transitioning to ${sceneKey}`);
        this.scene.start(sceneKey, data);
      },
      undefined,
      `${this.constructor.name}.transition`
    );
  }

  /**
   * Handle critical errors by returning to main menu.
   */
  protected handleCriticalError(error: Error, message: string): void {
    this.logger.error(message, error);
    
    // Show error message
    this.showErrorMessage(message);
    
    // Return to main menu after delay
    this.time.delayedCall(2000, () => {
      this.scene.start('MainMenuScene');
    });
  }

  /**
   * Show error message on screen.
   */
  protected showErrorMessage(message: string): void {
    const { width, height } = this.cameras.main;
    
    // Dim background
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    overlay.setDepth(9999);

    // Error text
    const errorText = this.add.text(
      width / 2,
      height / 2,
      `⚠️ Error\n\n${message}\n\nReturning to main menu...`,
      {
        fontSize: '24px',
        color: '#ff4444',
        align: 'center',
      }
    );
    errorText.setOrigin(0.5);
    errorText.setDepth(10000);
  }
}

/**
 * Decorator for safe method execution.
 * Usage: @safeMethod('methodName')
 */
export function safeMethod(context?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return ErrorBoundary.wrap(
        () => originalMethod.apply(this, args),
        undefined,
        context || `${target.constructor.name}.${propertyKey}`
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for safe async method execution.
 */
export function safeAsyncMethod(context?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return ErrorBoundary.wrapAsync(
        () => originalMethod.apply(this, args),
        undefined,
        context || `${target.constructor.name}.${propertyKey}`
      );
    };

    return descriptor;
  };
}
