import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../src/circuit-breaker';

describe('CircuitBreaker', () => {
  it('should allow successful executions', async () => {
    const cb = new CircuitBreaker(3, 1000);
    const result = await cb.run(async () => 'ok');
    expect(result).toBe('ok');
  });

  it('should trip after threshold failures', async () => {
    const cb = new CircuitBreaker(2, 200);

    await expect(cb.run(() => Promise.reject('fail 1'))).rejects.toBe('fail 1');
    await expect(cb.run(() => Promise.reject('fail 2'))).rejects.toBe('fail 2');

    await expect(cb.run(() => Promise.resolve('ok'))).rejects.toThrow(
      'Circuit breaker open'
    );
  });

  it('should reset after timeout', async () => {
    const cb = new CircuitBreaker(1, 100);
    await expect(cb.run(() => Promise.reject('fail'))).rejects.toBe('fail');
    await expect(cb.run(() => Promise.resolve('ok'))).rejects.toThrow(
      'Circuit breaker open'
    );

    await new Promise((res) => setTimeout(res, 110));
    const result = await cb.run(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });
});
