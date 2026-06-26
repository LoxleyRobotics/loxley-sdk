import type { RequestFn } from "./http.js";
import type { LicenseReceipt, ListOptions, Listing, Page } from "./types.js";

/** Browse and license robot models from the marketplace. */
export class Marketplace {
  constructor(private readonly request: RequestFn) {}

  list(
    opts: ListOptions & {
      category?: string;
      query?: string;
      sort?: "downloads" | "rating" | "newest" | "price";
    } = {}
  ): Promise<Page<Listing>> {
    return this.request("GET", "/v1/marketplace/listings", undefined, {
      cursor: opts.cursor,
      limit: opts.limit,
      category: opts.category,
      q: opts.query,
      sort: opts.sort,
    });
  }

  get(modelId: string): Promise<Listing> {
    return this.request("GET", `/v1/marketplace/listings/${modelId}`);
  }

  /**
   * License a model. Settles the $LOX payment on-chain, routes royalties
   * through the model's split and returns a signed artifact URL.
   */
  license(
    modelId: string,
    opts: { units?: number } = {}
  ): Promise<LicenseReceipt> {
    return this.request("POST", `/v1/marketplace/listings/${modelId}/license`, {
      units: opts.units ?? 1,
    });
  }
}
