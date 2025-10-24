export class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(failureThreshold: number, resetTimeoutMs: number) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (now < this.openUntil) throw new Error('Circuit breaker open');

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        this.openUntil = now + this.resetTimeoutMs;
      }
      throw err;
    }
  }
}
