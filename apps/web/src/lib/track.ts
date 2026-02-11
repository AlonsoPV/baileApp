/**
 * Tracking interno para la landing.
 * Stub que registra eventos en consola (dev). Preparado para conectar
 * GA4, Meta Pixel u otros más adelante.
 *
 * Cómo conectar después:
 * - GA4: importar gtag y llamar gtag('event', eventName, payload) aquí.
 * - Meta Pixel: importar fbq y llamar fbq('track', eventName, payload).
 * - Mantener esta función como única entrada para no dispersar lógica.
 */

export type TrackPayload = Record<string, string | number | boolean | undefined>;

const isDev = import.meta.env.DEV;

export function track(eventName: string, payload?: TrackPayload): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log("[track]", eventName, payload ?? {});
  }

  // TODO: GA4 — descomentar y configurar cuando tengas Measurement ID
  // if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
  //   (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', eventName, payload);
  // }

  // TODO: Meta Pixel — descomentar cuando tengas Pixel ID
  // if (typeof window !== 'undefined' && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
  //   (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', eventName, payload);
  // }
}

/** Eventos que se disparan desde la landing */
export const LANDING_EVENTS = {
  CTA_DOWNLOAD: "cta_download",
  CTA_B2B: "cta_b2b",
  LEAD_SUBMIT: "lead_submit",
  FILTER_CHANGE: "filter_change",
} as const;
