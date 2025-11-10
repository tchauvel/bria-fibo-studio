export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

