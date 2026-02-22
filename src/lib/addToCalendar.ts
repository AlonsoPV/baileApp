/**
 * Módulo nativo para añadir eventos al calendario del dispositivo.
 * Usa expo-calendar en iOS y Android, con fallbacks a ICS y Google Calendar URL.
 */

import { Platform, Linking } from "react-native";
import * as Calendar from "expo-calendar";

/** Payload enviado desde la web (via postMessage) o usado internamente */
export type AddToCalendarPayload = {
  title: string;
  start: string; // ISO string o Date en hora local
  end: string;
  location?: string;
  description?: string;
  eventLink?: string;
};

export type AddToCalendarResult =
  | { ok: true; eventId?: string; message: string }
  | { ok: false; code: "PERMISSION_DENIED" | "NO_WRITABLE_CALENDAR" | "CREATE_FAILED" | "FALLBACK"; message: string };

/** Cache del calendario writable para no recalcular en cada tap */
let cachedWritableCalendarId: string | null = null;

/**
 * Construye un Date en hora local a partir de componentes.
 * Evita UTC: no usa Date.parse("YYYY-MM-DDTHH:mm") que puede interpretarse distinto.
 */
export function buildLocalDateFromDateAndTime(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number = 20,
  minute: number = 0,
  second: number = 0
): Date {
  const monthIndex = month - 1;
  return new Date(year, monthIndex, day, hour, minute, second);
}

/**
 * Parsea un string ISO o Date y devuelve un Date en hora local.
 * Si el string tiene Z u offset, extrae componentes y reconstruye como local.
 */
function parseToLocalDate(input: string | Date): Date {
  if (input instanceof Date) {
    if (!isNaN(input.getTime())) return input;
    throw new Error("Invalid Date");
  }
  const str = String(input);
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{3})?/);
  if (isoMatch) {
    const [, y, m, d, h, min, s = "0"] = isoMatch;
    return buildLocalDateFromDateAndTime(
      parseInt(y!, 10),
      parseInt(m!, 10),
      parseInt(d!, 10),
      parseInt(h!, 10),
      parseInt(min!, 10),
      parseInt(s, 10)
    );
  }
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) throw new Error(`Invalid date format: ${str}`);
  if (str.includes("Z") || /[+-]\d{2}:\d{2}$/.test(str)) {
    return buildLocalDateFromDateAndTime(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate(),
      parsed.getHours(),
      parsed.getMinutes(),
      parsed.getSeconds()
    );
  }
  return parsed;
}

/**
 * Obtiene el ID de un calendario escribible.
 * Prioridad: isPrimary, allowsModifications, source.name (Default, Local, Google).
 */
export async function getWritableCalendarId(): Promise<string | null> {
  if (cachedWritableCalendarId) return cachedWritableCalendarId;
  try {
    const entityType = Platform.OS === "ios" ? Calendar.EntityTypes.EVENT : undefined;
    const calendars = await Calendar.getCalendarsAsync(entityType as any);
    const writable = calendars.filter((c: any) => c.allowsModifications === true);
    if (writable.length === 0) return null;

    // Preferir isPrimary (Android)
    const primary = writable.find((c: any) => c.isPrimary === true);
    if (primary) {
      cachedWritableCalendarId = primary.id;
      return primary.id;
    }

    // iOS: getDefaultCalendarAsync si existe
    if (Platform.OS === "ios") {
      try {
        const defaultCal = await Calendar.getDefaultCalendarAsync();
        if (defaultCal?.id && writable.some((c: any) => c.id === defaultCal.id)) {
          cachedWritableCalendarId = defaultCal.id;
          return defaultCal.id;
        }
      } catch {
        // ignore
      }
    }

    // Preferir source.name: Default, Local, Google
    const preferredNames = ["Default", "Local", "Google", "iCloud"];
    for (const name of preferredNames) {
      const match = writable.find(
        (c: any) =>
          c.source?.name?.includes?.(name) ||
          c.title?.includes?.(name)
      );
      if (match) {
        cachedWritableCalendarId = match.id;
        return match.id;
      }
    }

    cachedWritableCalendarId = writable[0].id;
    return writable[0].id;
  } catch (e) {
    console.warn("[addToCalendar] getWritableCalendarId error:", e);
    return null;
  }
}

/**
 * Genera contenido ICS para fallback (descargar/compartir).
 */
export function createIcsFallback(payload: AddToCalendarPayload): string {
  const start = parseToLocalDate(payload.start);
  const end = parseToLocalDate(payload.end);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}${m}${day}T${h}${min}${s}`;
  };

  const dtStart = fmt(start);
  const dtEnd = fmt(end);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const desc = (payload.description || "")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,");
  const loc = (payload.location || "").replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dónde Bailar//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${payload.title.replace(/,/g, "\\,")}`,
    desc ? `DESCRIPTION:${desc}` : "",
    loc ? `LOCATION:${loc}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Abre Google Calendar con un template prellenado.
 */
export function openGoogleCalendarTemplateFallback(payload: AddToCalendarPayload): void {
  const start = parseToLocalDate(payload.start);
  const end = parseToLocalDate(payload.end);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}${m}${day}T${h}${min}${s}`;
  };

  const dates = `${fmt(start)}/${fmt(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: payload.title,
    dates,
    details: payload.description || "",
    location: payload.location || "",
  });

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  Linking.openURL(url).catch((err) => {
    console.warn("[addToCalendar] No se pudo abrir Google Calendar:", err);
  });
}

/**
 * Función principal: añade evento al calendario nativo.
 * Flujo: permisos → calendario writable → createEventAsync → fallbacks si falla.
 */
export async function addToCalendar(payload: AddToCalendarPayload): Promise<AddToCalendarResult> {
  if (!payload?.title || !payload?.start) {
    return { ok: false, code: "CREATE_FAILED", message: "Faltan título o fecha de inicio." };
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      return {
        ok: false,
        code: "PERMISSION_DENIED",
        message: "Se necesita permiso para acceder al calendario.",
      };
    }

    const calendarId = await getWritableCalendarId();
    if (!calendarId) {
      return {
        ok: false,
        code: "NO_WRITABLE_CALENDAR",
        message: "No hay un calendario donde se puedan crear eventos.",
      };
    }

    const startDate = parseToLocalDate(payload.start);
    let endDate: Date;
    try {
      endDate = payload.end ? parseToLocalDate(payload.end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    } catch {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const notesParts: string[] = [];
    if (payload.description) notesParts.push(payload.description);
    if (payload.eventLink) notesParts.push(`Link: ${payload.eventLink}`);
    const notes = notesParts.join("\n\n");

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: payload.title,
      startDate,
      endDate,
      location: payload.location || undefined,
      notes: notes || undefined,
      timeZone,
      url: payload.eventLink || undefined,
    });

    return {
      ok: true,
      eventId: eventId ?? undefined,
      message: "Agregado al calendario",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[addToCalendar] createEventAsync error:", e);
    return {
      ok: false,
      code: "CREATE_FAILED",
      message: msg || "No se pudo crear el evento.",
    };
  }
}
