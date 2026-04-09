/**
 * Watchdog (DEV): detecta scroll bloqueado por overflow hidden sin modales abiertos.
 *
 * - Si `html` o `body` tienen overflow hidden > 3s y no hay [role="dialog"], loggea warning.
 * - Opcional: muestra un banner no-interactivo arriba.
 */

const WARN_AFTER_MS = 3000;
const CHECK_EVERY_MS = 500;
let started = false;
let hiddenSince: number | null = null;
export function startScrollLockWatchdog() {
  if (started) return;
  started = true;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const tick = () => {
    const html = document.documentElement;
    const body = document.body;
    const htmlOv = (html && getComputedStyle(html).overflowY) || "";
    const bodyOv = (body && getComputedStyle(body).overflowY) || "";
    const hasDialog = !!document.querySelector('[role="dialog"]');
    const isHidden = (htmlOv === "hidden" || bodyOv === "hidden") && !hasDialog;

    const now = Date.now();
    if (isHidden) {
      if (hiddenSince === null) hiddenSince = now;
      const elapsed = now - hiddenSince;
      if (elapsed >= WARN_AFTER_MS) {
        console.warn("[scrollLockWatchdog] overflow:hidden > 3s", { htmlOv, bodyOv });
      }
    } else {
      hiddenSince = null;
    }
  };

  window.setInterval(tick, CHECK_EVERY_MS);
}

