import { InsufficientLoxError, RpcError, TimeoutError } from "./errors.js";
import type { Address, LoxAmount, TxHash } from "./types.js";

interface JsonRpcResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

export interface TxReceipt {
  hash: TxHash;
  block: number;
  status: "success" | "reverted";
  feeULox: LoxAmount;
}

/**
 * Thin JSON-RPC client for Robinhood Chain nodes.
 * Higher-level flows (licensing, royalties) live in the API modules;
 * use this for balances, transfers and receipt tracking.
 */
export class Chain {
  constructor(
    private readonly rpcUrl: string,
    private readonly apiKey?: string
  ) {}

  private async rpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const payload = (await res.json()) as JsonRpcResponse<T>;
    if (payload.error) {
      throw new RpcError(payload.error.code, payload.error.message);
    }
    return payload.result as T;
  }

  async blockHeight(): Promise<number> {
    return this.rpc<number>("lox_blockNumber");
  }

  /** Balance in micro-LOX. */
  async balance(address: Address): Promise<LoxAmount> {
    const hex = await this.rpc<string>("lox_getBalance", [address]);
    return BigInt(hex);
  }

  /**
   * Transfer $LOX. Amount is in micro-LOX; throws {@link InsufficientLoxError}
   * before broadcasting when the sender balance cannot cover amount + fee.
   */
  async transfer(
    from: Address,
    to: Address,
    amount: LoxAmount
  ): Promise<TxHash> {
    const available = await this.balance(from);
    if (available < amount) {
      throw new InsufficientLoxError(amount, available);
    }
    return this.rpc<TxHash>("lox_sendTransfer", [
      { from, to, amount: amount.toString() },
    ]);
  }

  async getReceipt(hash: TxHash): Promise<TxReceipt | null> {
    return this.rpc<TxReceipt | null>("lox_getTransactionReceipt", [hash]);
  }

  /** Poll until the transaction is included in a block. */
  async waitForTx(
    hash: TxHash,
    opts: { pollMs?: number; timeoutMs?: number } = {}
  ): Promise<TxReceipt> {
    const pollMs = opts.pollMs ?? 500; // 0.25s blocks — receipts land fast
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const receipt = await this.getReceipt(hash);
      if (receipt) return receipt;
      if (Date.now() > deadline) throw new TimeoutError(`tx ${hash}`, timeoutMs);
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}
