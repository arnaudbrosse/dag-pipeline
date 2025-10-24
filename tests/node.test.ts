import { describe, it, expect } from 'vitest';
import { Node } from '../src/node';

const ctx = new Map<string, any>();

describe('Node', () => {
  it('should run a simple node', async () => {
    const node = new Node({
      name: 'simple',
      deps: [],
      run: async () => 'value'
    });

    const result = await node.run(ctx);
    expect(result).toBe('value');
  });

  it('should respect retries', async () => {
    let attempts = 0;
    const node = new Node({
      name: 'retryNode',
      deps: [],
      run: async () => {
        attempts++;
        if (attempts < 2) throw new Error('fail');
        return 'ok';
      },
      options: { retries: { maxAttempts: 3, baseDelayMs: 10 } }
    });

    const result = await node.run(ctx);
    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('should timeout if execution exceeds limit', async () => {
    const node = new Node({
      name: 'timeoutNode',
      deps: [],
      run: async () => new Promise((res) => setTimeout(() => res('done'), 100)),
      options: { timeoutMs: 50 }
    });

    await expect(node.run(ctx)).rejects.toThrow('Timeout');
  });
});
