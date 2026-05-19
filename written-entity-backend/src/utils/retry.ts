interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  onRetry?: (attempt: number, err: Error) => Promise<void> | void;
  shouldRetry?: (err: Error) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      const isLast = attempt === options.maxAttempts;
      const retryAllowed = options.shouldRetry ? options.shouldRetry(error) : true;
      if (isLast || !retryAllowed) throw error;
      await options.onRetry?.(attempt, error);
      await new Promise((resolve) => setTimeout(resolve, options.baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
