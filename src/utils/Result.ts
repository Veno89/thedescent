/**
 * Result Type
 * 
 * Functional error handling pattern that makes errors explicit in the type system.
 * Instead of throwing exceptions, functions return Result<T, E> which must be handled.
 */

/**
 * Represents a successful result containing a value.
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * Represents a failed result containing an error.
 */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * A Result is either Ok (success) or Err (failure).
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Create a successful result.
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Create a failed result.
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Check if a result is Ok.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/**
 * Check if a result is Err.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/**
 * Unwrap a result, throwing if it's an error.
 * Use sparingly - prefer pattern matching with isOk/isErr.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value if it's an error.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Unwrap a result with a lazy default if it's an error.
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error);
}

/**
 * Map over a successful result.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/**
 * Map over a failed result.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

/**
 * Chain results (flatMap).
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Try to recover from an error.
 */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  return result.ok ? result : fn(result.error);
}

/**
 * Wrap a function that might throw in a Result.
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Wrap an async function that might throw in a Result.
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Combine multiple results into one.
 * If all are Ok, returns Ok with array of values.
 * If any is Err, returns the first Err.
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}

/**
 * Match on a result, providing handlers for both cases.
 */
export function match<T, E, R>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => R;
    err: (error: E) => R;
  }
): R {
  return result.ok ? handlers.ok(result.value) : handlers.err(result.error);
}

// ============================================================================
// Game-Specific Error Types
// ============================================================================

/**
 * Base game error with code and context.
 */
export class GameError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameError';
  }

  toString(): string {
    const ctx = this.context ? ` ${JSON.stringify(this.context)}` : '';
    return `[${this.code}] ${this.message}${ctx}`;
  }
}

/**
 * Error codes for different game systems.
 */
export const ErrorCode = {
  // Combat errors
  INVALID_TARGET: 'COMBAT_INVALID_TARGET',
  INSUFFICIENT_ENERGY: 'COMBAT_INSUFFICIENT_ENERGY',
  CARD_NOT_PLAYABLE: 'COMBAT_CARD_NOT_PLAYABLE',
  COMBAT_NOT_ACTIVE: 'COMBAT_NOT_ACTIVE',
  
  // Data errors
  CARD_NOT_FOUND: 'DATA_CARD_NOT_FOUND',
  ENEMY_NOT_FOUND: 'DATA_ENEMY_NOT_FOUND',
  RELIC_NOT_FOUND: 'DATA_RELIC_NOT_FOUND',
  POTION_NOT_FOUND: 'DATA_POTION_NOT_FOUND',
  CHARACTER_NOT_FOUND: 'DATA_CHARACTER_NOT_FOUND',
  
  // Save errors
  SAVE_CORRUPTED: 'SAVE_CORRUPTED',
  SAVE_VERSION_MISMATCH: 'SAVE_VERSION_MISMATCH',
  SAVE_NOT_FOUND: 'SAVE_NOT_FOUND',
  
  // State errors
  INVALID_STATE: 'STATE_INVALID',
  INVALID_TRANSITION: 'STATE_INVALID_TRANSITION',
  
  // Effect errors
  EFFECT_HANDLER_NOT_FOUND: 'EFFECT_HANDLER_NOT_FOUND',
  EFFECT_EXECUTION_FAILED: 'EFFECT_EXECUTION_FAILED',
  
  // General errors
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Create a game error with code and optional context.
 */
export function gameError(
  code: ErrorCodeType,
  message: string,
  context?: Record<string, unknown>
): GameError {
  return new GameError(code, message, context);
}

/**
 * Create an Err result with a GameError.
 */
export function gameErr(
  code: ErrorCodeType,
  message: string,
  context?: Record<string, unknown>
): Err<GameError> {
  return err(gameError(code, message, context));
}
