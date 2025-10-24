export class RetryManager {
  static async run<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    baseDelayMs: number
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) throw err;
        await new Promise((res) =>
          setTimeout(res, baseDelayMs * 2 ** (attempt - 1))
        );
      }
    }
  }
}
