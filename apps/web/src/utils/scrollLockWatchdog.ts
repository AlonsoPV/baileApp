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
let bannerEl: HTMLDivElement | null = null;

function ensureBanner() {
  if (bannerEl) return bannerEl;
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.right = "0";
  el.style.zIndex = "2147483647";
  el.style.padding = "8px 10px";
  el.style.background = "rgba(220, 38, 38, 0.92)";
  el.style.color = "#fff";
  el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  el.style.fontSize = "12px";
  el.style.fontWeight = "700";
  el.style.pointerEvents = "none";
  el.style.display = "none";
  el.textContent = "Scroll bloqueado detectado (overflow:hidden) — revisa overlays/modales.";
  document.body.appendChild(el);
  bannerEl = el;
  return el;
}

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
        console.warn("[PERF] scroll_lock_watchdog overflow:hidden > 3s", { htmlOv, bodyOv });
        ensureBanner().style.display = "block";
      }
    } else {
      hiddenSince = null;
      if (bannerEl) bannerEl.style.display = "none";
    }
  };

  window.setInterval(tick, CHECK_EVERY_MS);
}

