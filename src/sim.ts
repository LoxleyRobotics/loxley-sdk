import { TimeoutError } from "./errors.js";
import type { RequestFn } from "./http.js";
import type { SimConfig, SimRun } from "./types.js";

const TERMINAL: ReadonlySet<SimRun["status"]> = new Set([
  "passed",
  "failed",
  "cancelled",
]);

/** Physics simulation — validate behavior before anything ships. */
export class Sim {
  constructor(private readonly request: RequestFn) {}

  createRun(config: SimConfig): Promise<SimRun> {
    return this.request("POST", "/v1/sim/runs", config);
  }

  getRun(runId: string): Promise<SimRun> {
    return this.request("GET", `/v1/sim/runs/${runId}`);
  }

  cancelRun(runId: string): Promise<SimRun> {
    return this.request("POST", `/v1/sim/runs/${runId}/cancel`);
  }

  /**
   * Poll until the run reaches a terminal state.
   * @param onProgress called after every poll with the latest snapshot.
   */
  async waitForRun(
    runId: string,
    opts: {
      pollMs?: number;
      timeoutMs?: number;
      onProgress?: (run: SimRun) => void;
    } = {}
  ): Promise<SimRun> {
    const pollMs = opts.pollMs ?? 3_000;
    const timeoutMs = opts.timeoutMs ?? 30 * 60_000;
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const run = await this.getRun(runId);
      opts.onProgress?.(run);
      if (TERMINAL.has(run.status)) return run;
      if (Date.now() > deadline) {
        throw new TimeoutError(`sim run ${runId}`, timeoutMs);
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}
