/**
 * Debug overflow en landing (solo dev).
 * Detecta elementos con scrollWidth > clientWidth y los marca o loguea.
 * Uso: en Landing.tsx en dev, llamar useLandingOverflowDebug() para activar.
 * Opcional: añadir data-landing-debug="overflow" al body para outline rojo en todos los nodos.
 */
import { useEffect } from "react";

function getOverflowingElements(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (el: HTMLElement) => {
    if (el.scrollWidth > el.clientWidth) {
      out.push(el);
    }
    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i] as HTMLElement);
    }
  };
  walk(root);
  return out;
}

export function useLandingOverflowDebug(enabled = import.meta.env.DEV) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const run = () => {
      const landing = document.querySelector(".landing");
      if (!landing || !(landing instanceof HTMLElement)) return;

      const overflowing = getOverflowingElements(landing);
      if (overflowing.length > 0) {
        console.warn(
          "[Landing overflow] Elementos que se salen del viewport:",
          overflowing.length,
          overflowing
        );
        overflowing.forEach((el) => el.classList.add("landing-overflow-flagged"));
      } else {
        document.querySelectorAll(".landing-overflow-flagged").forEach((el) => {
          el.classList.remove("landing-overflow-flagged");
        });
      }
    };

    run();
    const observer = new ResizeObserver(run);
    observer.observe(document.documentElement);

    return () => observer.disconnect();
  }, [enabled]);
}
