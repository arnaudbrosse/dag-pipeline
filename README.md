# DAG Pipeline

A lightweight, high-performance TypeScript library for building and running concurrent DAG (Directed Acyclic Graph) pipelines with built-in support for:

-  Concurrent task execution
-  Automatic retries with exponential backoff
-  Circuit breakers for fault isolation
-  Task timeouts
-  Concurrency control via semaphores

---

##  Features

* **Concurrency control**: Executes independent nodes in parallel
* **Timeouts**: Aborts nodes exceeding specified duration
* **Retries**: Retries failed nodes with exponential backoff
* **Circuit Breakers**: Prevents repeated failure from cascading
* **Deterministic execution**: Runs each node only once

---

## Installation

```bash
npm install dag-pipeline
````

---

## Usage

```ts
import { Pipeline } from "dag-pipeline";

const pipeline = new Pipeline()
  .addNode({
    name: "fetchUsers",
    deps: [],
    run: async () => [{ id: "u1" }, { id: "u2" }],
    options: { timeoutMs: 5000 },
  })
  .addNode({
    name: "fetchPosts",
    deps: [],
    run: async () => [
      { id: "p1", userId: "u1" },
      { id: "p2", userId: "u2" },
    ],
  })
  .addNode({
    name: "join",
    deps: ["fetchUsers", "fetchPosts"],
    run: async (ctx) => {
      const users = ctx.get("fetchUsers");
      const posts = ctx.get("fetchPosts");
      return users.map((u) => ({
        userId: u.id,
        posts: posts.filter((p) => p.userId === u.id).map((p) => p.id),
      }));
    },
    options: {
      retries: { maxAttempts: 2, baseDelayMs: 100 },
    },
  });

const { results } = await pipeline.run();
console.log(results.get("join"));
```

---

## API

### `new Pipeline()`

Creates a new pipeline instance.

---

### `.addNode(config: NodeConfig): this`

Adds a node to the DAG.

**NodeConfig**:

* `name: string` – unique identifier
* `deps: string[]` – names of dependent nodes
* `run: (ctx: Map<string, any>) => Promise<any>` – async function with access to dependencies' results
* `options?: { timeoutMs?: number, retries?: { maxAttempts: number, baseDelayMs: number } }`

---

### `.run(): Promise<{ results: Map<string, any> }>`

Executes the pipeline and resolves with all results. Automatically resolves dependencies and handles concurrency.

