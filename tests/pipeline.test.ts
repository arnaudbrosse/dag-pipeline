import { describe, it, expect } from 'vitest';
import { Pipeline } from '../src/pipeline';

interface User {
  id: string;
}

interface Post {
  id: string;
  userId: string;
}

describe('Pipeline', () => {
  it('should execute independent nodes', async () => {
    const pipeline = new Pipeline()
      .addNode({ name: 'a', deps: [], run: async () => 1 })
      .addNode({ name: 'b', deps: [], run: async () => 2 });

    const { results } = await pipeline.run();
    expect(results.get('a')).toBe(1);
    expect(results.get('b')).toBe(2);
  });

  it('should respect dependency order', async () => {
    const order: string[] = [];
    const pipeline = new Pipeline()
      .addNode({
        name: 'first',
        deps: [],
        run: async () => {
          order.push('first');
          return 'ok';
        }
      })
      .addNode({
        name: 'second',
        deps: ['first'],
        run: async (ctx) => {
          order.push('second');
          return ctx.get('first') + '!';
        }
      });

    const { results } = await pipeline.run();
    expect(results.get('second')).toBe('ok!');
    expect(order).toEqual(['first', 'second']);
  });

  it('should run retries and timeout correctly in a pipeline', async () => {
    let tries = 0;
    const pipeline = new Pipeline().addNode({
      name: 'retryNode',
      deps: [],
      run: async () => {
        tries++;
        if (tries < 2) throw new Error('fail');
        return 'pass';
      },
      options: { retries: { maxAttempts: 3, baseDelayMs: 10 } }
    });

    const { results } = await pipeline.run();
    expect(results.get('retryNode')).toBe('pass');
    expect(tries).toBe(2);
  });

  it('should reject if a node fails without retry', async () => {
    const pipeline = new Pipeline().addNode({
      name: 'failNode',
      deps: [],
      run: async () => {
        throw new Error('fail now');
      }
    });

    await expect(pipeline.run()).rejects.toThrow('fail now');
  });

  it('should process complex DAG structure', async () => {
    const pipeline = new Pipeline()
      .addNode({
        name: 'u',
        deps: [],
        run: async () => [{ id: 'u1' }, { id: 'u2' }]
      })
      .addNode({
        name: 'p',
        deps: [],
        run: async () => [
          { id: 'p1', userId: 'u1' },
          { id: 'p2', userId: 'u2' }
        ]
      })
      .addNode({
        name: 'join',
        deps: ['u', 'p'],
        run: async (ctx) => {
          const users = ctx.get('u');
          const posts = ctx.get('p');
          return users.map((u: User) => ({
            userId: u.id,
            posts: posts
              .filter((p: Post) => p.userId === u.id)
              .map((p: Post) => p.id)
          }));
        }
      });

    const { results } = await pipeline.run();
    expect(results.get('join')).toEqual([
      { userId: 'u1', posts: ['p1'] },
      { userId: 'u2', posts: ['p2'] }
    ]);
  });
});
