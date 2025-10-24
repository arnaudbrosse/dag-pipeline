import { describe, it, expect } from 'vitest';
import { Semaphore } from '../src/semaphore';

describe('Semaphore', () => {
  it('should acquire and release permits', async () => {
    const sem = new Semaphore(2);
    await sem.acquire();
    await sem.acquire();

    let released = false;
    setTimeout(() => {
      sem.release();
      released = true;
    }, 50);

    const before = Date.now();
    await sem.acquire();
    const after = Date.now();

    expect(released).toBe(true);
    expect(after - before).toBeGreaterThanOrEqual(50);
  });
});
