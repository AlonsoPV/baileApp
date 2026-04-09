import type { ShareEntityType } from "./shareUrls";

export interface OpenEntityPresentation {
  title: string;
  subtitle?: string;
  place?: string;
  seoTitle: string;
  seoDescription: string;
}

function formatDateLabel(raw: unknown, locale = "es-MX"): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const plain = raw.split("T")[0];
  const date = new Date(`${plain}T12:00:00`);
  if (Number.isNaN(date.getTime())) return plain;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTimeRange(start: unknown, end: unknown): string {
  const startText = typeof start === "string" ? start.trim() : "";
  const endText = typeof end === "string" ? end.trim() : "";
  if (!startText) return "";
  if (!endText || endText === startText) return startText;
  return `${startText} - ${endText}`;
}

function compactParts(parts: Array<unknown>): string {
  return parts
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => String(value).trim())
    .join(" · ");
}

export function buildOpenEventoPresentation(
  date: Record<string, unknown>,
  parent?: Record<string, unknown> | null,
  locale = "es-MX",
): OpenEntityPresentation {
  const title =
    String(date?.nombre || parent?.nombre || "Evento de baile");
  const dateStr = formatDateLabel(String(date?.fecha || date?.fecha_inicio || ""), locale);
  const timeStr = formatTimeRange(date?.hora_inicio, date?.hora_fin);
  const place =
    compactParts([date?.lugar, date?.ciudad]) ||
    (typeof parent?.sede_general === "string" ? parent.sede_general : "");

  return {
    title,
    subtitle: compactParts([dateStr, timeStr]) || undefined,
    place: place || undefined,
    seoTitle: title,
    seoDescription: compactParts([dateStr, timeStr, place]) || title,
  };
}

export function buildOpenClasePresentation(
  profile: Record<string, unknown>,
  classIndex?: number,
): OpenEntityPresentation {
  const cronograma = (profile?.cronograma || profile?.horarios || []) as Array<Record<string, unknown>>;
  const entry =
    Array.isArray(cronograma) && classIndex != null && cronograma[classIndex]
      ? cronograma[classIndex]
      : Array.isArray(cronograma)
        ? cronograma[0]
        : undefined;

  const title =
    String(
      entry?.nombre ||
      entry?.nombre_clase ||
      profile?.nombre_publico ||
      "Clase de baile",
    );

  const ubicaciones = Array.isArray(profile?.ubicaciones) ? (profile.ubicaciones as Array<Record<string, unknown>>) : [];
  const firstUbicacion = ubicaciones[0];
  const place =
    compactParts([
      firstUbicacion?.nombre,
      firstUbicacion?.ciudad,
    ]) ||
    (typeof profile?.ciudad === "string" ? profile.ciudad : "");

  const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const diaNum = typeof entry?.diaSemana === "number" ? entry.diaSemana : entry?.dia_semana;
  const dayLabel =
    typeof diaNum === "number" && diaNum >= 0 && diaNum <= 6
      ? dayNames[diaNum]
      : "";
  const subtitle =
    compactParts([dayLabel, entry?.hora]) ||
    (typeof profile?.nombre_publico === "string" ? "" : "Clase");

  return {
    title,
    subtitle: subtitle || (typeof profile?.nombre_publico === "string" ? String(profile.nombre_publico) : undefined),
    place: place || undefined,
    seoTitle: title,
    seoDescription: compactParts([subtitle, place]) || "Clase de baile",
  };
}

export function buildOpenProfilePresentation(
  profileType: ShareEntityType,
  profile: Record<string, unknown>,
): OpenEntityPresentation {
  const title = String(
    profile?.display_name ||
    profile?.nombre_publico ||
    profile?.nombre ||
    profile?.nombre_organizador ||
    profile?.full_name ||
    profile?.nombre_marca ||
    "Perfil",
  );

  const profileLabel =
    profileType === "academia"
      ? "Academia"
      : profileType === "maestro"
        ? "Maestro"
        : profileType === "organizer"
          ? "Organizador"
          : profileType === "marca"
            ? "Marca"
            : "Perfil";

  return {
    title,
    seoTitle: title,
    seoDescription: `${profileLabel} de ${title} en Donde Bailar`,
  };
}
