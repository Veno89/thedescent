/**
 * Utils Module Index
 * 
 * Re-exports all utility functions and classes.
 */

// Data loading
export { DataLoader } from './DataLoader';

// Combat calculations
export {
  calculateOutgoingDamage,
  calculateIncomingDamage,
  calculateBlockValue,
  applyDamage,
  calculatePoisonTick,
  type DamageResult,
} from './CombatCalculations';

// Result type (functional error handling)
export {
  // Types
  type Result,
  type Ok,
  type Err,
  
  // Constructors
  ok,
  err,
  
  // Type guards
  isOk,
  isErr,
  
  // Unwrapping
  unwrap,
  unwrapOr,
  unwrapOrElse,
  
  // Transformations
  map,
  mapErr,
  andThen,
  orElse,
  
  // Utilities
  tryCatch,
  tryCatchAsync,
  all,
  match,
  
  // Game errors
  GameError,
  ErrorCode,
  type ErrorCodeType,
  gameError,
  gameErr,
} from './Result';

// Logger
export {
  Logger,
  LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ScopedLogger,
  
  // Pre-configured loggers
  CombatLog,
  CardLog,
  RelicLog,
  EffectLog,
  SaveLog,
  EventLog,
  UILog,
  StateLog,
  DataLog,
} from './Logger';

// Error boundaries
export {
  ErrorBoundary,
  SafeScene,
  safeMethod,
  safeAsyncMethod,
  type RecoveryStrategy,
  type ErrorHandlerResult,
  type ErrorHandler,
} from './ErrorBoundary';
