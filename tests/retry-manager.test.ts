import { describe, it, expect } from 'vitest';
import { RetryManager } from '../src/retry-manager';

describe('RetryManager', () => {
  it('should retry failed function and eventually succeed', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    };

    const result = await RetryManager.run(fn, 5, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max attempts', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('fail');
    };

    await expect(RetryManager.run(fn, 3, 10)).rejects.toThrow('fail');
    expect(attempts).toBe(3);
  });
});
