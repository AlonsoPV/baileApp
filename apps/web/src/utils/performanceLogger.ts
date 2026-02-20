/**
 * PerformanceLogger — instrumentación de tiempos de carga para web (y WebView en Android).
 *
 * - Usa performance.now() si existe, si no Date.now()
 * - Logs con prefijo [PERF] para poder filtrar en Android (adb logcat | grep PERF)
 * - Marca hitos: app_start, first_screen_mount, data_fetch_start/end, list_render_end, etc.
 */

const PERF_PREFIX = "[PERF]";
const hasPerfNow = typeof performance !== "undefined" && typeof performance.now === "function";

function now(): number {
  return hasPerfNow ? performance.now() : Date.now();
}

const startTime = now();
const marks: { name: string; time: number; relativeMs: number }[] = [];

function logWithPrefix(label: string, value?: string | number): void {
  const msg = value !== undefined ? `${PERF_PREFIX} ${label} ${value}` : `${PERF_PREFIX} ${label}`;
  if (typeof console !== "undefined") {
    console.log(msg);
  }
  if (typeof console.time === "function" && typeof console.timeEnd === "function") {
    // time/timeEnd are optional; we use our own marks for report
  }
}

/**
 * Registra un hito y opcionalmente imprime el tiempo relativo al arranque.
 */
export function mark(name: string, logToConsole = true): number {
  const t = now();
  const relativeMs = t - startTime;
  marks.push({ name, time: t, relativeMs });
  if (logToConsole) {
    logWithPrefix(`${name}`, `${relativeMs.toFixed(2)}ms`);
  }
  return relativeMs;
}

/**
 * Inicia un timer con nombre (para timeEnd).
 */
export function time(label: string): void {
  if (typeof console.time === "function") {
    console.time(`${PERF_PREFIX} ${label}`);
  }
  mark(`${label}_start`, false);
}

/**
 * Finaliza un timer y muestra la duración.
 */
export function timeEnd(label: string): void {
  if (typeof console.timeEnd === "function") {
    console.timeEnd(`${PERF_PREFIX} ${label}`);
  }
  const start = marks.find((m) => m.name === `${label}_start`);
  const rel = start ? now() - start.time : 0;
  mark(`${label}_end`, false);
  logWithPrefix(`${label} duration`, `${rel.toFixed(2)}ms`);
}

/**
 * Obtiene todos los hitos registrados.
 */
export function getMarks(): { name: string; time: number; relativeMs: number }[] {
  return [...marks];
}

/**
 * Obtiene el tiempo entre dos hitos por nombre.
 */
export function measure(startMark: string, endMark: string): number | null {
  const s = marks.find((m) => m.name === startMark);
  const e = marks.find((m) => m.name === endMark);
  if (!s || !e) return null;
  return e.relativeMs - s.relativeMs;
}

/**
 * Imprime un reporte resumido de fases (para validación en logs).
 */
export function logReport(): void {
  logWithPrefix("=== Performance report ===");
  logWithPrefix("app_start → now", `${(now() - startTime).toFixed(2)}ms`);
  marks.forEach((m) => {
    logWithPrefix(`  ${m.name}`, `${m.relativeMs.toFixed(2)}ms`);
  });
  logWithPrefix("=== End report ===");
}

/**
 * Para uso dentro de WebView: notifica al host nativo que la app web está "lista" (ej. primera pantalla pintada).
 * El host puede ocultar el skeleton cuando recibe este mensaje.
 */
export function notifyReady(): void {
  try {
    if (typeof window !== "undefined" && (window as any).ReactNativeWebView?.postMessage) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "READY" }));
    }
  } catch {
    // ignore
  }
  mark("web_ready", true);
}
