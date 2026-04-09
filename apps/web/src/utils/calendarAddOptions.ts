import {
  detectAuthProviderPlatform,
  type AuthProviderPlatform,
} from "@/utils/authProviderAvailability";

export type CalendarAddClientPlatform = AuthProviderPlatform;

/** Claves i18n para la segunda opción (.ics), según plataforma */
export type CalendarIcsLabelKey = "iphone_calendar" | "calendar_download_ics";

/**
 * Reglas de visibilidad para "Añadir a calendario":
 * - Android: solo Google Calendar (sin .ics / Apple).
 * - iOS: Google + .ics con copy de Calendario de iPhone.
 * - Otros (desktop, etc.): Google + .ics genérico (descarga / Outlook, etc.).
 */
export function getCalendarAddMenuVisibility(
  platform: CalendarAddClientPlatform = detectAuthProviderPlatform()
): {
  platform: CalendarAddClientPlatform;
  showGoogleCalendar: boolean;
  showIcsOption: boolean;
  icsLabelKey: CalendarIcsLabelKey;
} {
  return {
    platform,
    showGoogleCalendar: true,
    showIcsOption: platform !== "android",
    icsLabelKey: platform === "ios" ? "iphone_calendar" : "calendar_download_ics",
  };
}
