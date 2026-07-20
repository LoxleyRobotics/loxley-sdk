import { Chain } from "./chain.js";
import { createRequest, type RequestFn } from "./http.js";
import { Deploy } from "./deploy.js";
import { Marketplace } from "./marketplace.js";
import { Registry } from "./registry.js";
import { Royalties } from "./royalties.js";
import { Sim } from "./sim.js";
import type { Network } from "./types.js";

export interface LoxleyClientOptions {
  /** API key from https://loxley.work/settings/keys */
  apiKey?: string;
  network?: Network;
  /** Override the REST endpoint (self-hosted gateways). */
  baseUrl?: string;
  /** Override the Robinhood Chain RPC endpoint. */
  rpcUrl?: string;
}

const API_URLS: Record<Network, string> = {
  mainnet: "https://api.loxley.work",
  testnet: "https://api.testnet.loxley.work",
};

const RPC_URLS: Record<Network, string> = {
  mainnet: "https://rpc.robinhood.exchange",
  testnet: "https://rpc.testnet.robinhood.exchange",
};

/**
 * Entry point for the Loxley platform.
 *
 * ```ts
 * import { LoxleyClient } from "@loxley/sdk";
 *
 * const lox = new LoxleyClient({ apiKey: process.env.LOXLEY_API_KEY });
 * const scout = await lox.registry.get("wren-2-scout");
 * ```
 */
export class LoxleyClient {
  readonly network: Network;
  readonly registry: Registry;
  readonly marketplace: Marketplace;
  readonly sim: Sim;
  readonly deploy: Deploy;
  readonly royalties: Royalties;
  readonly chain: Chain;

  private readonly request: RequestFn;

  constructor(opts: LoxleyClientOptions = {}) {
    this.network = opts.network ?? "mainnet";

    this.request = createRequest({
      baseUrl: opts.baseUrl ?? API_URLS[this.network],
      ...(opts.apiKey !== undefined ? { apiKey: opts.apiKey } : {}),
    });

    this.registry = new Registry(this.request);
    this.marketplace = new Marketplace(this.request);
    this.sim = new Sim(this.request);
    this.deploy = new Deploy(this.request);
    this.royalties = new Royalties(this.request);
    this.chain = new Chain(opts.rpcUrl ?? RPC_URLS[this.network], opts.apiKey);
  }
}
