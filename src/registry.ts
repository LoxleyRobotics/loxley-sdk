import type { RequestFn } from "./http.js";
import type {
  ListOptions,
  ModelComponent,
  Page,
  RobotModel,
} from "./types.js";

export interface PublishModelInput {
  name: string;
  category: string;
  version: string;
  components: ModelComponent[];
  priceLox: bigint;
  /** Markdown description shown on the marketplace page. */
  readme?: string;
}

/** On-chain registry of robot models, skills and datasets. */
export class Registry {
  constructor(private readonly request: RequestFn) {}

  /**
   * Publish a new model version. Compiles the component graph server-side,
   * anchors the manifest hash on Robinhood Chain and returns the record.
   */
  publish(input: PublishModelInput): Promise<RobotModel> {
    return this.request("POST", "/v1/registry/models", input);
  }

  get(modelId: string): Promise<RobotModel> {
    return this.request("GET", `/v1/registry/models/${modelId}`);
  }

  list(
    opts: ListOptions & { owner?: string; category?: string } = {}
  ): Promise<Page<RobotModel>> {
    return this.request("GET", "/v1/registry/models", undefined, {
      cursor: opts.cursor,
      limit: opts.limit,
      owner: opts.owner,
      category: opts.category,
    });
  }

  /**
   * Fork an existing model into your namespace. The upstream's royalty
   * split is preserved on the fork lineage — creators always get paid.
   */
  fork(modelId: string, newName: string): Promise<RobotModel> {
    return this.request("POST", `/v1/registry/models/${modelId}/fork`, {
      name: newName,
    });
  }

  /** Yank a version from discovery. Existing licenses keep working. */
  deprecate(modelId: string, version: string): Promise<void> {
    return this.request(
      "POST",
      `/v1/registry/models/${modelId}/deprecate`,
      { version }
    );
  }
}
