/**
 * Estandariza logs [PERF] para recolección de métricas.
 * Usado por hooks críticos; el perfCollector (dev) intercepta y agrupa.
 */
export function perfLog(opts: {
  hook: string;
  step: string;
  duration_ms: number;
  rows?: number;
  data?: unknown;
  error?: unknown;
  /** Campos extra para contexto (no se usan en agregación) */
  extra?: Record<string, unknown>;
}) {
  const rows = typeof opts.rows === "number" ? opts.rows : 0;
  const payload_size =
    opts.data != null ? JSON.stringify(opts.data ?? {}).length : 0;
  const has_error = !!opts.error;

  const logObj: Record<string, unknown> = {
    hook: opts.hook,
    step: opts.step,
    duration_ms: Math.round(opts.duration_ms),
    rows,
    payload_size,
    has_error,
  };

  if (opts.extra && Object.keys(opts.extra).length > 0) {
    Object.assign(logObj, opts.extra);
  }

  console.log("[PERF]", logObj);
}
