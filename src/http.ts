import { ApiError } from "./errors.js";

export interface HttpOptions {
  baseUrl: string;
  apiKey?: string;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /** Retries for 429/5xx with exponential backoff. Default 2. */
  retries?: number;
}

export type RequestFn = <T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>
) => Promise<T>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Minimal fetch wrapper shared by every API module.
 * BigInt-safe: serializes bigint as string, revives `*_lox`/`amount` fields.
 */
export function createRequest(opts: HttpOptions): RequestFn {
  const retries = opts.retries ?? 2;

  return async function request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = new URL(path, opts.baseUrl);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent": "loxley-sdk/0.3",
      ...opts.headers,
    };
    if (opts.apiKey) headers.authorization = `Bearer ${opts.apiKey}`;
    if (body !== undefined) headers["content-type"] = "application/json";

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers,
          body:
            body === undefined
              ? null
              : JSON.stringify(body, (_k, v) =>
                  typeof v === "bigint" ? v.toString() : v
                ),
        });

        if (res.status === 429 || res.status >= 500) {
          lastError = new ApiError(
            res.status,
            res.status === 429 ? "rate_limited" : "server_error",
            await res.text().catch(() => res.statusText)
          );
          await sleep(250 * 2 ** attempt);
          continue;
        }

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            code?: string;
            message?: string;
          };
          throw new ApiError(
            res.status,
            payload.code ?? "unknown",
            payload.message ?? res.statusText
          );
        }

        if (res.status === 204) return undefined as T;
        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof ApiError && err.status < 500 && err.status !== 429) {
          throw err;
        }
        lastError = err;
        if (attempt < retries) await sleep(250 * 2 ** attempt);
      }
    }
    throw lastError;
  };
}
