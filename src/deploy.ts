import { TimeoutError } from "./errors.js";
import type { RequestFn } from "./http.js";
import type { Deployment, SignedManifest } from "./types.js";

const TERMINAL: ReadonlySet<Deployment["status"]> = new Set([
  "healthy",
  "degraded",
  "aborted",
]);

/** Over-the-air deployment of signed builds to real machines. */
export class Deploy {
  constructor(private readonly request: RequestFn) {}

  /**
   * Sign a model's build manifest with your account key and anchor the
   * signature on Robinhood Chain. Units verify this before flashing.
   */
  signManifest(modelId: string): Promise<SignedManifest> {
    return this.request("POST", `/v1/deploy/manifests/${modelId}/sign`);
  }

  /** Start a staged rollout of a signed manifest to a fleet. */
  createRollout(input: {
    manifest: SignedManifest;
    fleet: string;
    /** Fraction of units per wave, 0–1. Default 0.25. */
    waveSize?: number;
  }): Promise<Deployment> {
    return this.request("POST", "/v1/deploy/rollouts", input);
  }

  getRollout(rolloutId: string): Promise<Deployment> {
    return this.request("GET", `/v1/deploy/rollouts/${rolloutId}`);
  }

  abortRollout(rolloutId: string): Promise<Deployment> {
    return this.request("POST", `/v1/deploy/rollouts/${rolloutId}/abort`);
  }

  /** Poll until every wave lands (or the rollout degrades/aborts). */
  async waitForRollout(
    rolloutId: string,
    opts: {
      pollMs?: number;
      timeoutMs?: number;
      onProgress?: (d: Deployment) => void;
    } = {}
  ): Promise<Deployment> {
    const pollMs = opts.pollMs ?? 5_000;
    const timeoutMs = opts.timeoutMs ?? 60 * 60_000;
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const d = await this.getRollout(rolloutId);
      opts.onProgress?.(d);
      if (TERMINAL.has(d.status)) return d;
      if (Date.now() > deadline) {
        throw new TimeoutError(`rollout ${rolloutId}`, timeoutMs);
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}
