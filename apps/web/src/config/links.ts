/**
 * Enlaces externos para la landing y la app.
 * Actualiza aquí App Store, Play Store, contacto y ciudad por defecto.
 */

export const APP_STORE_URL =
  (import.meta.env.VITE_APP_STORE_URL as string) || "https://apps.apple.com/app/donde-bailar-mx/id123456789";

export const PLAY_STORE_URL =
  (import.meta.env.VITE_PLAY_STORE_URL as string) || "https://play.google.com/store/apps/details?id=com.dondebailar.app";

export const WHATSAPP_URL =
  (import.meta.env.VITE_WHATSAPP_URL as string) || "https://wa.me/5215512345678";

/** URL de contacto genérico (email o página) si no usas WhatsApp como principal */
export const CONTACT_URL =
  (import.meta.env.VITE_CONTACT_URL as string) || WHATSAPP_URL;

export const CITY_DEFAULT = (import.meta.env.VITE_CITY_DEFAULT as string) || "CDMX";
