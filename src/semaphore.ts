export class Semaphore {
  private tasks: (() => void)[] = [];
  private counter: number;

  constructor(maxConcurrency: number) {
    this.counter = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.counter > 0) {
      this.counter--;
      return;
    }
    return new Promise((resolve) => this.tasks.push(resolve));
  }

  release(): void {
    this.counter++;
    if (this.tasks.length > 0 && this.counter > 0) {
      this.counter--;
      const next = this.tasks.shift();
      if (next) next();
    }
  }
}
