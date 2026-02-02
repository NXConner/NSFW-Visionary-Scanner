export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  task: () => Promise<T>,
  { retries = 3, baseDelayMs = 250, maxDelayMs = 2000 }: RetryOptions = {},
): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= retries) throw error;
      const nextAttempt = attempt + 1;
      const delay = Math.min(baseDelayMs * Math.pow(2, nextAttempt - 1), maxDelayMs);
      await sleep(delay);
      attempt = nextAttempt;
    }
  }
  throw new Error("Retry failed");
}
