/**
 * Wrap a Promise with a timeout that rejects after `ms`.
 *
 * Note: this does NOT abort the underlying operation (e.g. fetch),
 * but it prevents the UI from waiting forever if something hangs
 * (common in WebViews / flaky networks).
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label: string = "Operation"
): Promise<T> {
  const setT = (globalThis.setTimeout ?? setTimeout).bind(globalThis) as typeof setTimeout;
  const clearT = (globalThis.clearTimeout ?? clearTimeout).bind(globalThis) as typeof clearTimeout;

  let t: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    t = setT(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  // `promise` can be a thenable (e.g. Supabase PostgrestFilterBuilder).
  // Normalize to a real Promise so TS/Promise.race behaves consistently.
  const normalized = Promise.resolve(promise);

  return Promise.race([normalized, timeout]).finally(() => {
    if (t) clearT(t);
  });
}

