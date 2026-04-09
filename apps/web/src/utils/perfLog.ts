/**
 * Hook histórico para trazas de queries; sin salida a consola (evita ruido y trabajo en cada fetch).
 */
export function perfLog(_opts: {
  hook: string;
  step: string;
  duration_ms: number;
  rows?: number;
  data?: unknown;
  error?: unknown;
  extra?: Record<string, unknown>;
}) {
  /* no-op */
}
