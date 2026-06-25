/** Base class for every error thrown by the SDK. */
export class LoxleyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Non-2xx response from the Loxley API. */
export class ApiError extends LoxleyError {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(`[${status} ${code}] ${message}`);
  }
}

/** JSON-RPC error from a Robinhood Chain node. */
export class RpcError extends LoxleyError {
  constructor(
    public readonly rpcCode: number,
    message: string
  ) {
    super(`RPC ${rpcCode}: ${message}`);
  }
}

/** Wallet balance cannot cover the requested transfer or license. */
export class InsufficientLoxError extends LoxleyError {
  constructor(
    public readonly required: bigint,
    public readonly available: bigint
  ) {
    super(
      `insufficient $LOX: need ${required} uLOX, have ${available} uLOX`
    );
  }
}

/** waitFor* helper exceeded its timeout before reaching a terminal state. */
export class TimeoutError extends LoxleyError {
  constructor(what: string, ms: number) {
    super(`timed out after ${ms}ms waiting for ${what}`);
  }
}
