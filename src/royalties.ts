import type { RequestFn } from "./http.js";
import type {
  Address,
  ListOptions,
  Page,
  RoyaltyEvent,
  RoyaltySplit,
} from "./types.js";

/** Royalty splits and payouts — settled instantly, enforced by chain. */
export class Royalties {
  constructor(private readonly request: RequestFn) {}

  getSplits(modelId: string): Promise<RoyaltySplit[]> {
    return this.request("GET", `/v1/royalties/${modelId}/splits`);
  }

  /**
   * Replace a model's royalty split. Splits must sum to exactly
   * 10_000 bps and take effect from the next license event.
   */
  setSplits(modelId: string, splits: RoyaltySplit[]): Promise<RoyaltySplit[]> {
    const total = splits.reduce((sum, s) => sum + s.bps, 0);
    if (total !== 10_000) {
      throw new RangeError(
        `royalty splits must sum to 10000 bps, got ${total}`
      );
    }
    return this.request("PUT", `/v1/royalties/${modelId}/splits`, { splits });
  }

  /** Historical payouts for an address. */
  listEvents(
    recipient: Address,
    opts: ListOptions = {}
  ): Promise<Page<RoyaltyEvent>> {
    return this.request("GET", "/v1/royalties/events", undefined, {
      recipient,
      cursor: opts.cursor,
      limit: opts.limit,
    });
  }

  /**
   * Live royalty feed as an async iterator — long-polls under the hood.
   *
   * ```ts
   * for await (const ev of lox.royalties.streamEvents(me)) {
   *   console.log(`+${ev.amount} uLOX from ${ev.modelId}`);
   * }
   * ```
   */
  async *streamEvents(
    recipient: Address,
    opts: { pollMs?: number; signal?: AbortSignal } = {}
  ): AsyncGenerator<RoyaltyEvent> {
    const pollMs = opts.pollMs ?? 5_000;
    let cursor: string | undefined;

    while (!opts.signal?.aborted) {
      const page: Page<RoyaltyEvent> = await this.request(
        "GET",
        "/v1/royalties/events",
        undefined,
        { recipient, cursor, live: 1 }
      );
      for (const ev of page.items) yield ev;
      cursor = page.nextCursor ?? cursor;
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}
