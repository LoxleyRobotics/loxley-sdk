/** Robinhood Chain account address (bech32, `lox1…`). */
export type Address = `lox1${string}`;

/** $LOX amounts are integer micro-LOX (1 LOX = 1_000_000 uLOX). */
export type LoxAmount = bigint;

/** ISO-8601 timestamp string. */
export type Timestamp = string;

/** 0x-prefixed transaction hash. */
export type TxHash = `0x${string}`;

export type Network = "mainnet" | "testnet";

/** Pagination envelope returned by every list endpoint. */
export interface Page<T> {
  items: T[];
  nextCursor?: string;
  total: number;
}

export interface ListOptions {
  cursor?: string;
  limit?: number;
}

/** A hardware or software building block referenced by a robot model. */
export interface ModelComponent {
  /** Registry ref, e.g. `wren_scout.chassis@2.1.0` or `nav_skill@^4`. */
  ref: string;
  kind: "chassis" | "actuator" | "sensor" | "skill" | "dataset" | "policy";
}

/** A published robot model in the on-chain registry. */
export interface RobotModel {
  id: string;
  name: string;
  owner: Address;
  version: string;
  category: string;
  components: ModelComponent[];
  /** Content hash of the compiled build manifest. */
  manifestHash: string;
  priceLox: LoxAmount;
  downloads: number;
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** A reusable skill (control policy, planner, perception module …). */
export interface Skill {
  id: string;
  name: string;
  owner: Address;
  version: string;
  targets: string[];
  priceLox: LoxAmount;
  createdAt: Timestamp;
}

/** Royalty split for a model — enforced by chain on every license event. */
export interface RoyaltySplit {
  recipient: Address;
  /** Basis points, 10_000 = 100%. All splits must sum to 10_000. */
  bps: number;
}

/** A single settled royalty payout. */
export interface RoyaltyEvent {
  txHash: TxHash;
  block: number;
  modelId: string;
  recipient: Address;
  amount: LoxAmount;
  settledAt: Timestamp;
}

export interface SimConfig {
  modelId: string;
  /** Physics scenario preset or a custom scene ref. */
  scenario: string;
  steps: number;
  seed?: number;
  /** Fail the run when collision rate exceeds this threshold. */
  maxCollisionRate?: number;
}

export type SimStatus = "queued" | "running" | "passed" | "failed" | "cancelled";

export interface SimRun {
  id: string;
  modelId: string;
  status: SimStatus;
  stepsCompleted: number;
  collisionRate?: number;
  reportUrl?: string;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
}

/** A build manifest signed by the model owner, anchored on-chain. */
export interface SignedManifest {
  modelId: string;
  manifestHash: string;
  signature: string;
  signer: Address;
  anchorTx: TxHash;
}

export type RolloutStatus =
  | "pending"
  | "rolling"
  | "healthy"
  | "degraded"
  | "aborted";

/** An over-the-air rollout of a signed build to a fleet. */
export interface Deployment {
  id: string;
  manifest: SignedManifest;
  fleet: string;
  unitsTotal: number;
  unitsHealthy: number;
  status: RolloutStatus;
  startedAt: Timestamp;
}

export interface Listing {
  model: RobotModel;
  /** Seller-set license terms. */
  license: "per-unit" | "site" | "unlimited";
  featured: boolean;
}

export interface LicenseReceipt {
  txHash: TxHash;
  modelId: string;
  licensee: Address;
  paidLox: LoxAmount;
  /** Signed URL for the build artifact, valid 15 minutes. */
  artifactUrl: string;
}
