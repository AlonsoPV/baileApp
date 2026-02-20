/**
 * PerformanceLogger (native) — logs con prefijo [PERF]
 *
 * API:
 * - mark(label)
 * - measure(name, startLabel, endLabel)
 * - flush()
 *
 * Usa performance.now() si existe; fallback a Date.now().
 */
type Mark = { label: string; t: number; relMs: number };
type Measure = { name: string; startLabel: string; endLabel: string; durationMs: number };

const PERF_PREFIX = "[PERF]";

function now(): number {
  // RN/Expo suele exponer performance.now(); si no, usar Date.now()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = typeof performance !== "undefined" ? (performance as any) : null;
  if (p && typeof p.now === "function") return p.now();
  return Date.now();
}

class Perf {
  private start = now();
  private marks: Mark[] = [];
  private measures: Measure[] = [];

  mark(label: string) {
    const t = now();
    const relMs = t - this.start;
    this.marks.push({ label, t, relMs });
    return relMs;
  }

  measure(name: string, startLabel: string, endLabel: string) {
    const s = this.marks.find((m) => m.label === startLabel);
    const e = this.marks.find((m) => m.label === endLabel);
    if (!s || !e) return null;
    const durationMs = e.relMs - s.relMs;
    const m: Measure = { name, startLabel, endLabel, durationMs };
    this.measures.push(m);
    return m;
  }

  flush() {
    // eslint-disable-next-line no-console
    console.log(`${PERF_PREFIX} ==============================`);
    // eslint-disable-next-line no-console
    console.log(`${PERF_PREFIX} marks:`);
    for (const m of this.marks) {
      // eslint-disable-next-line no-console
      console.log(`${PERF_PREFIX}   ${m.label}: ${m.relMs.toFixed(2)}ms`);
    }
    if (this.measures.length) {
      // eslint-disable-next-line no-console
      console.log(`${PERF_PREFIX} measures:`);
      for (const mm of this.measures) {
        // eslint-disable-next-line no-console
        console.log(
          `${PERF_PREFIX}   ${mm.name} (${mm.startLabel}→${mm.endLabel}): ${mm.durationMs.toFixed(2)}ms`
        );
      }
    }
    // eslint-disable-next-line no-console
    console.log(`${PERF_PREFIX} ==============================`);
  }

  snapshot() {
    return {
      marks: [...this.marks],
      measures: [...this.measures],
    };
  }

  reset() {
    this.start = now();
    this.marks = [];
    this.measures = [];
  }
}

export const PerformanceLogger = new Perf();

