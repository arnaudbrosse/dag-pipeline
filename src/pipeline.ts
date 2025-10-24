import { CircuitBreaker } from './circuit-breaker';
import { type NodeConfig, type NodeContext, Node } from './node';
import { Semaphore } from './semaphore';

export class Pipeline {
  private nodes = new Map<string, Node>();
  private semaphore = new Semaphore(10);
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private executions = new Map<string, Promise<void>>();

  addNode(config: NodeConfig): this {
    if (this.nodes.has(config.name))
      throw new Error(`Node ${config.name} already exists`);
    this.nodes.set(config.name, new Node(config));
    return this;
  }

  async run(): Promise<{ results: NodeContext }> {
    const ctx: NodeContext = new Map();
    const pending = new Set(this.nodes.keys());

    const execute = async (nodeName: string): Promise<void> => {
      if (this.executions.has(nodeName)) {
        return this.executions.get(nodeName)!;
      }

      const node = this.nodes.get(nodeName)!;

      const execution = (async () => {
        for (const dep of node.deps) {
          await execute(dep);
        }

        if (ctx.has(nodeName)) return;

        await this.semaphore.acquire();
        try {
          const circuit =
            this.circuitBreakers.get(nodeName) ?? new CircuitBreaker(3, 10_000);
          this.circuitBreakers.set(nodeName, circuit);

          const result = await circuit.run(() => node.run(ctx));
          ctx.set(nodeName, result);
        } finally {
          this.semaphore.release();
        }
      })();

      this.executions.set(nodeName, execution);
      return execution;
    };

    await Promise.all(Array.from(pending).map((name) => execute(name)));

    return { results: ctx };
  }
}
