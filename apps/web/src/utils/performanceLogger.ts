/**
 * PerformanceLogger — instrumentación de tiempos de carga para web (y WebView en Android).
 *
 * - Usa performance.now() si existe, si no Date.now()
 * - Los hitos se guardan en memoria para `notifyReady` / postMessage al host nativo.
 * - Sin logs en consola (evita ruido); usar DevTools Performance / mensajes nativos si hace falta.
 */

const hasPerfNow = typeof performance !== "undefined" && typeof performance.now === "function";

function now(): number {
  return hasPerfNow ? performance.now() : Date.now();
}

const startTime = now();
const marks: { name: string; time: number; relativeMs: number }[] = [];

function logWithPrefix(_label: string, _value?: string | number): void {
  /* intentionally silent */
}

/**
 * Registra un hito (tiempo relativo al arranque). `logToConsole` se ignora; sin salida a consola.
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
  mark(`${label}_start`, false);
}

/**
 * Finaliza un timer (registra hito `_end`; sin consola).
 */
export function timeEnd(label: string): void {
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

function marksToMap() {
  const out: Record<string, number> = {};
  for (const m of marks) out[m.name] = Number(m.relativeMs.toFixed(2));
  return out;
}

function postBridgeMessage(type: "READY_SHELL" | "READY", extra: Record<string, unknown> = {}): void {
  try {
    if (typeof window !== "undefined" && (window as any).ReactNativeWebView?.postMessage) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type, t: now(), marks: marksToMap(), ...extra })
      );
    }
  } catch {
    // ignore
  }
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
 * Para uso dentro de WebView: notifica al host nativo que la shell visual ya pintó.
 * El host puede ocultar el splash nativo sin esperar a los datos iniciales.
 */
export function notifyReadyShell(): void {
  try {
    if (typeof performance !== "undefined" && typeof performance.mark === "function") {
      performance.mark("web_ready_shell");
    }
  } catch {}

  postBridgeMessage("READY_SHELL");
  mark("web_ready_shell", false);
}

/**
 * Para uso dentro de WebView: notifica al host nativo que la app web está "lista" (ej. primera pantalla pintada).
 * El host puede ocultar el skeleton cuando recibe este mensaje.
 */
export function notifyReady(): void {
  // Web Performance API (solo cliente): útil para inspección en DevTools
  try {
    if (typeof performance !== "undefined" && typeof performance.mark === "function") {
      performance.mark("web_ready");
    }
  } catch {}

  postBridgeMessage("READY");
  mark("web_ready", false);
}

export function notifyError(payload: Record<string, unknown>): void {
  try {
    if (typeof window !== "undefined" && (window as any).ReactNativeWebView?.postMessage) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: "ERROR", t: now(), marks: marksToMap(), ...payload })
      );
    }
  } catch {
    // ignore
  }
}
