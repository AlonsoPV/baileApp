// apps/web/src/dev/perfCollector.ts
/* Dev-only: monkey-patch console.log para acumular muestras legacy (prefijo "[PERF]" + objeto) */

type PerfSample = {
  hook: string;
  step: string;
  duration_ms: number;
  rows?: number;
  payload_size?: number;
  has_error?: boolean;
  ts?: number;
};

declare global {
  interface Window {
    __perfSamples?: PerfSample[];
    perfReport?: () => void;
    perfExport?: () => Promise<void> | void;
  }
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function safeNum(n: unknown): number {
  const x = typeof n === "number" && isFinite(n) ? n : 0;
  return x;
}

(function installPerfCollector() {
  if (typeof window === "undefined") return;

  window.__perfSamples = window.__perfSamples ?? [];

  const originalLog = console.log.bind(console);

  console.log = (...args: any[]) => {
    try {
      if (args?.[0] === "[PERF]" && typeof args?.[1] === "object" && args?.[1]) {
        const s = args[1];
        const sample: PerfSample = {
          hook: String(s.hook ?? "unknown"),
          step: String(s.step ?? "unknown"),
          duration_ms: safeNum(s.duration_ms),
          rows: typeof s.rows === "number" ? s.rows : undefined,
          payload_size: typeof s.payload_size === "number" ? s.payload_size : undefined,
          has_error: !!s.has_error,
          ts: Date.now(),
        };
        window.__perfSamples!.push(sample);
      }
    } catch {
      // never block logs
    }
    originalLog(...args);
  };

  window.perfReport = () => {
    const samples = window.__perfSamples ?? [];
    const groups = new Map<string, PerfSample[]>();

    for (const s of samples) {
      const key = `${s.hook}::${s.step}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }

    const rows = Array.from(groups.entries()).map(([key, list]) => {
      const durs = list.map((x) => x.duration_ms);
      const rowsVals = list.map((x) => safeNum(x.rows));
      const payloadVals = list.map((x) => safeNum(x.payload_size));
      return {
        key,
        count: list.length,
        p50: Math.round(percentile(durs, 50)),
        p95: Math.round(percentile(durs, 95)),
        max: Math.round(Math.max(...durs)),
        avg: Math.round(avg(durs)),
        rows_avg: Math.round(avg(rowsVals)),
        payload_avg: Math.round(avg(payloadVals)),
      };
    });

    rows.sort((a, b) => b.p95 - a.p95);

    // Nice console table
    // eslint-disable-next-line no-console
    console.table(
      rows.map((r) => ({
        hook: r.key.split("::")[0],
        step: r.key.split("::")[1],
        count: r.count,
        p50_ms: r.p50,
        p95_ms: r.p95,
        max_ms: r.max,
        avg_ms: r.avg,
        rows_avg: r.rows_avg,
        payload_avg: r.payload_avg,
      }))
    );
  };

  window.perfExport = async () => {
    const samples = window.__perfSamples ?? [];
    const json = JSON.stringify(samples, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      console.log("[perfCollector] Export copied to clipboard. samples=", samples.length);
    } catch {
      console.log("[perfCollector] Clipboard blocked. Copy from console output below:");
      console.log(json);
    }
  };

  console.log("[perfCollector] installed (perfReport / perfExport en window)");
})();
