/**
 * Enlaces externos para la landing y la app.
 * Actualiza aquí App Store, Play Store, contacto y ciudad por defecto.
 */

function readEnv(name: string): string | undefined {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    const viteValue = viteEnv?.[name];
    if (typeof viteValue === "string" && viteValue.trim()) return viteValue;
  } catch {
    // ignore
  }

  try {
    const processValue = typeof process !== "undefined" ? process.env?.[name] : undefined;
    if (typeof processValue === "string" && processValue.trim()) return processValue;
  } catch {
    // ignore
  }

  return undefined;
}

export const APP_STORE_URL =
  readEnv("VITE_APP_STORE_URL") || "https://apps.apple.com/mx/app/donde-bailar-mx/id6756324774";

export const PLAY_STORE_URL =
  readEnv("VITE_PLAY_STORE_URL") || "https://play.google.com/store/apps/details?id=com.tuorg.dondebailarmx.app";

export const WHATSAPP_URL =
  readEnv("VITE_WHATSAPP_URL") || "https://wa.me/+525511981149";

/** URL de contacto genérico (email o página) si no usas WhatsApp como principal */
export const CONTACT_URL =
  readEnv("VITE_CONTACT_URL") || WHATSAPP_URL;

export const CITY_DEFAULT = readEnv("VITE_CITY_DEFAULT") || "CDMX";
