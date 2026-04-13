import { useMemo } from "react";
import { getEffectiveEventDate, getEffectiveEventDateYmd, normalizeDateOnly } from "@/utils/effectiveEventDate";
import { buildEventOccurrenceKey } from "@/utils/exploreEventOccurrence";

type UseFilteredFechasParams = {
  fechasData: any[];
  todayYmd: string;
  qDeferred: string;
  dateFrom?: string;
  dateTo?: string;
  datePreset?: string;
  selectedType: string;
};

export function useFilteredFechas({
  fechasData,
  todayYmd,
  qDeferred,
  dateFrom,
  dateTo,
  datePreset,
  selectedType,
}: UseFilteredFechasParams) {
  return useMemo(() => {
    const isValidDiaSemana = (value: any): value is number =>
      Number.isInteger(value) && value >= 0 && value <= 6;

    const todayOnly = normalizeDateOnly(todayYmd);
    const allFechas = fechasData.filter(
      (d: any) => !d?.estado_publicacion || d.estado_publicacion === "publicado",
    );
    const includePastEvents = !!qDeferred && qDeferred.trim().length > 0;
    const rangeFrom = dateFrom ? normalizeDateOnly(dateFrom) : null;
    const rangeTo = dateTo ? normalizeDateOnly(dateTo) : null;
    const hasDateRange = rangeFrom !== null || rangeTo !== null;

    const nextRecurringYmd = (dayValue: any) => {
      if (!todayOnly) return null;
      const day = Number(dayValue);
      if (!Number.isFinite(day) || day < 0 || day > 6) return null;
      const currentDay = todayOnly.getDay();
      let offset = day - currentDay;
      if (offset < 0) offset += 7;
      const next = new Date(
        todayOnly.getFullYear(),
        todayOnly.getMonth(),
        todayOnly.getDate() + offset,
      );
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, "0");
      const dayNum = String(next.getDate()).padStart(2, "0");
      return `${year}-${month}-${dayNum}`;
    };

    const upcoming = allFechas.filter((fecha: any) => {
      if (includePastEvents) return true;
      const hasDiaSemana = isValidDiaSemana(fecha?.dia_semana);
      let eventDateOnly = normalizeDateOnly(getEffectiveEventDate(fecha));

      if (hasDateRange) {
        if (!eventDateOnly && hasDiaSemana && fecha._recurrence_index === undefined) {
          try {
            const nextYmd = nextRecurringYmd(fecha.dia_semana);
            eventDateOnly = normalizeDateOnly(nextYmd);
          } catch {
            return true;
          }
        }
        if (!eventDateOnly) return false;
        if (rangeFrom && eventDateOnly < rangeFrom) return false;
        if (rangeTo && eventDateOnly > rangeTo) return false;
        return true;
      }

      if (!eventDateOnly && hasDiaSemana) {
        return true;
      }
      if (!eventDateOnly || !todayOnly) return false;
      return eventDateOnly >= todayOnly;
    });

    const deduped = (() => {
      const map = new Map<string, any>();
      for (const event of upcoming) {
        const key = buildEventOccurrenceKey(event);
        if (!map.has(key)) map.set(key, event);
      }
      return Array.from(map.values());
    })();

    const toSortableHora = (raw?: string | null) => {
      if (!raw) return "99:99";
      const value = String(raw).trim();
      if (!value) return "99:99";
      if (value.includes(":")) {
        const [hh = "99", mm = "99"] = value.split(":");
        return `${hh.padStart(2, "0").slice(-2)}:${mm.padStart(2, "0").slice(0, 2)}`;
      }
      if (value.length === 4) return `${value.slice(0, 2)}:${value.slice(2, 4)}`;
      return "99:99";
    };

    return [...deduped].sort((a: any, b: any) => {
      const ymdA = getEffectiveEventDateYmd(a);
      const ymdB = getEffectiveEventDateYmd(b);
      if (ymdA !== ymdB) return ymdA < ymdB ? -1 : 1;

      const horaA = toSortableHora(a?.hora_inicio ?? a?.evento_hora_inicio);
      const horaB = toSortableHora(b?.hora_inicio ?? b?.evento_hora_inicio);
      if (horaA !== horaB) return horaA < horaB ? -1 : 1;

      const nameA = String(a?.nombre || a?.events_parent?.nombre || "");
      const nameB = String(b?.nombre || b?.events_parent?.nombre || "");
      const byName = nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      if (byName !== 0) return byName;

      const idA = Number(a?.id ?? 0);
      const idB = Number(b?.id ?? 0);
      if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB;
      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
    });
  }, [fechasData, todayYmd, qDeferred, dateFrom, dateTo, datePreset, selectedType]);
}
