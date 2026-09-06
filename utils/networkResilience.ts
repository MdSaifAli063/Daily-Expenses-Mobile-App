/**
 * Network Resilience & Retry Utility
 * Implements exponential backoff for transient failures and timeout protection.
 * Safe for production: Never retries 4xx client errors, validation errors, or auth rejections.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
  backoffFactor?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  initialDelayMs: 400,
  timeoutMs: 12000,
  backoffFactor: 2,
};

/**
 * Checks if an error is considered transient and safe to retry.
 */
function isTransientError(error: any): boolean {
  if (!error) return false;

  const msg = (error.message || '').toLowerCase();
  const status = error.status || error.statusCode || error.code;

  // Do NOT retry client errors (400 - 499)
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }

  // Do NOT retry known auth or validation errors
  if (
    msg.includes('invalid') ||
    msg.includes('password') ||
    msg.includes('not authenticated') ||
    msg.includes('permission denied') ||
    msg.includes('already exists') ||
    msg.includes('duplicate key') ||
    msg.includes('jwt')
  ) {
    return false;
  }

  // DO retry network, timeout, and connection aborts
  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('abort') ||
    msg.includes('econnreset') ||
    msg.includes('socket') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('502')
  ) {
    return true;
  }

  return false;
}

/**
 * Executes an async function with optional timeout and exponential backoff retry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  customOptions?: RetryOptions
): Promise<T> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  let attempt = 0;
  let delay = options.initialDelayMs;

  while (true) {
    attempt++;
    let timer: any;

    try {
      // Race between the target function and timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Request timed out after ${options.timeoutMs}ms`));
          }, options.timeoutMs);
        }),
      ]);

      clearTimeout(timer);
      return result;
    } catch (err: any) {
      clearTimeout(timer);

      const canRetry = attempt <= options.maxRetries && isTransientError(err);
      if (!canRetry) {
        throw err;
      }

      // Wait before next attempt with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= options.backoffFactor;
    }
  }
}
