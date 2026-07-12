export { LoxleyClient, type LoxleyClientOptions } from "./client.js";
export { Registry, type PublishModelInput } from "./registry.js";
export { Marketplace } from "./marketplace.js";
export { Sim } from "./sim.js";
export { Deploy } from "./deploy.js";
export { Royalties } from "./royalties.js";
export { Chain, type TxReceipt } from "./chain.js";
export {
  LoxleyError,
  ApiError,
  RpcError,
  InsufficientLoxError,
  TimeoutError,
} from "./errors.js";
export type * from "./types.js";

/** 1 LOX in micro-LOX. */
export const LOX = 1_000_000n;

/** Format micro-LOX as a human-readable $LOX string. */
export function formatLox(uLox: bigint, decimals = 2): string {
  const whole = uLox / LOX;
  const frac = ((uLox % LOX) * 10n ** BigInt(decimals)) / LOX;
  return `${whole}.${frac.toString().padStart(decimals, "0")} LOX`;
}

/** Parse a decimal $LOX string ("4.20") into micro-LOX. */
export function parseLox(lox: string): bigint {
  const [whole = "0", frac = ""] = lox.trim().split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  return BigInt(whole) * LOX + BigInt(fracPadded || "0");
}
