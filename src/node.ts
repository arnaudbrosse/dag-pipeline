import { RetryManager } from './retry-manager';

export type NodeContext = Map<string, any>;

export interface NodeOptions {
  timeoutMs?: number;
  retries?: { maxAttempts: number; baseDelayMs: number };
}

export interface NodeConfig {
  name: string;
  deps: string[];
  run: (ctx: NodeContext) => Promise<any>;
  options?: NodeOptions;
}

export class Node {
  name: string;
  deps: string[];
  runFn: (ctx: NodeContext) => Promise<any>;
  options: NodeOptions;

  constructor(config: NodeConfig) {
    this.name = config.name;
    this.deps = config.deps;
    this.runFn = config.run;
    this.options = config.options || {};
  }

  async run(ctx: NodeContext): Promise<any> {
    const task = () => this.runFn(ctx);
    const wrapped = this.options.retries
      ? () =>
          RetryManager.run(
            task,
            this.options.retries!.maxAttempts,
            this.options.retries!.baseDelayMs
          )
      : task;

    if (this.options.timeoutMs) {
      return Promise.race([
        wrapped(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.options.timeoutMs)
        )
      ]);
    } else {
      return wrapped();
    }
  }
}
