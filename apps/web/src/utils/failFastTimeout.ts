import { withTimeout } from "./withTimeout";

/**
 * Fail-fast wrapper used for tests and network-hang protection patterns.
 * Converts timeouts/aborts into a user-friendly retryable error.
 *
 * NOTE: Do not pass secrets/PII in errors.
 */
export async function failFastTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  const t0 = Date.now();
  try {
    return await withTimeout(promise, timeoutMs, label);
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "");
    const isAbort =
      String(e?.name ?? "").toLowerCase().includes("abort") || msg.toLowerCase().includes("aborted");
    const isTimeout = msg.toLowerCase().includes("timed out") || msg.toLowerCase().includes("timeout");
    if (!isTimeout && !isAbort) throw e;

    const err2 = new Error("La conexión está tardando demasiado. Intenta de nuevo.");
    (err2 as any).code = "NETWORK_TIMEOUT";
    (err2 as any).elapsedMs = Date.now() - t0;
    throw err2;
  }
}

