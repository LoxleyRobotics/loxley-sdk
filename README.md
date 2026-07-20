<div align="center">

# @loxley/sdk

**Official TypeScript SDK for [Loxley](https://loxley.work) — open robotics on Robinhood Chain.**

Build, simulate, deploy and monetize robots — with every model, skill and dataset owned on-chain.

[![npm](https://img.shields.io/badge/npm-v0.4.2-4dff8f?logo=npm&labelColor=060907)](https://www.npmjs.com/package/@loxley/sdk)
[![types](https://img.shields.io/badge/types-included-4dff8f?logo=typescript&labelColor=060907)](#)
[![license](https://img.shields.io/badge/license-MIT-4dff8f?labelColor=060907)](./LICENSE)
[![chain](https://img.shields.io/badge/Robinhood_Chain-0.25s_blocks-4dff8f?labelColor=060907)](#)

</div>

---

```bash
npm install @loxley/sdk        # pnpm add @loxley/sdk · bun add @loxley/sdk
```

```ts
import { LoxleyClient, parseLox } from "@loxley/sdk";

const lox = new LoxleyClient({ apiKey: process.env.LOXLEY_API_KEY });

// publish a robot — manifest hash anchors on Robinhood Chain
const model = await lox.registry.publish({
  name: "wren-2-scout",
  category: "aerial-recon",
  version: "2.1.0",
  priceLox: parseLox("84"),
  components: [
    { ref: "wren_scout.chassis@2.1.0", kind: "chassis" },
    { ref: "lidar_v3@^1.4", kind: "sensor" },
    { ref: "nav_skill@^4", kind: "skill" },
  ],
});

// validate in the physics sim until provably safe
const run = await lox.sim.createRun({
  modelId: model.id,
  scenario: "warehouse-dense-v2",
  steps: 1_200_000,
});
await lox.sim.waitForRun(run.id);

// ship it over the air — signed, verified, staged in waves
const manifest = await lox.deploy.signManifest(model.id);
await lox.deploy.createRollout({ manifest, fleet: "warehouse-eu-1" });
```

## Modules

| Module | What it does |
| --- | --- |
| `lox.registry` | Publish, fork and version robot models. Fork lineage preserves royalty splits — creators always get paid. |
| `lox.marketplace` | Browse listings, license models. Payment settles on-chain, artifact URL comes back signed. |
| `lox.sim` | Physics validation runs with pass/fail gates (`waitForRun` polls to a terminal state). |
| `lox.deploy` | Sign build manifests, anchor on-chain, roll out OTA to fleets in staged waves. |
| `lox.royalties` | Read/set splits (basis points), claim payouts, `streamEvents()` for a live `for await` feed. |
| `lox.chain` | Low-level Robinhood Chain RPC: balances, transfers, receipts (`waitForTx` — blocks are 0.25s, it's quick). |

## Networks

| | REST | RPC |
| --- | --- | --- |
| `mainnet` (default) | `api.loxley.work` | `rpc.robinhood.exchange` |
| `testnet` | `api.testnet.loxley.work` | `rpc.testnet.robinhood.exchange` |

```ts
const lox = new LoxleyClient({ network: "testnet" });
```

## $LOX amounts

All amounts are **micro-LOX** (`bigint`, 1 LOX = 1 000 000 uLOX). Helpers included:

```ts
import { LOX, formatLox, parseLox } from "@loxley/sdk";

parseLox("4.20");        // 4200000n
formatLox(4200000n);     // "4.20 LOX"
```

## Errors

Everything thrown by the SDK extends `LoxleyError`:

- `ApiError` — non-2xx from the REST API (has `.status`, `.code`; 429/5xx are retried with backoff first)
- `RpcError` — JSON-RPC error from a chain node
- `InsufficientLoxError` — checked client-side before a transfer broadcasts
- `TimeoutError` — a `waitFor*` helper hit its deadline

## Examples

- [`examples/publish-and-earn.ts`](./examples/publish-and-earn.ts) — publish → simulate → stream royalties
- [`examples/deploy-fleet.ts`](./examples/deploy-fleet.ts) — sign a manifest, staged OTA rollout, abort on degraded

## Requirements

Node ≥ 18 (native `fetch`). Zero runtime dependencies.

---

<div align="center">

**Robotics for the many, not the few.**

[loxley.work](https://loxley.work) · [Discord](https://discord.gg/loxley) · [Litepaper](https://loxley.work/litepaper)

</div>
