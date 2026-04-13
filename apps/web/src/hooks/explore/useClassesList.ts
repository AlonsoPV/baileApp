import { useMemo } from "react";
import { shouldHideExploreClassForBlackout } from "@/config/classBlackoutDates";

type UseClassesListParams = {
  academiasData: any[];
  maestrosData: any[];
  allTags?: any[];
  ritmos: number[];
  zonas: number[];
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  qDeferred: string;
  todayYmd: string;
  t: (key: string) => string;
  language: string;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export function useClassesList({
  academiasData,
  maestrosData,
  allTags,
  ritmos,
  zonas,
  datePreset,
  dateFrom,
  dateTo,
  qDeferred,
  todayYmd,
  t,
  language,
}: UseClassesListParams) {
  return useMemo(() => {
    const dayNames = [
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
    ];
    const allA = academiasData;
    const allM = maestrosData;
    const selectedRitmoSet = new Set<number>(ritmos || []);
    const selectedZonaSet = new Set<number>(zonas || []);
    const ritmoIdBySlugLocal = new Map<string, number>();

    for (const tag of (allTags || []) as any[]) {
      if (tag?.tipo === "ritmo" && typeof tag?.id === "number" && typeof tag?.slug === "string") {
        ritmoIdBySlugLocal.set(String(tag.slug).trim().toLowerCase(), tag.id);
      }
    }

    const parseYmdToDate = (value?: string | null) => {
      if (!value) return null;
      const plain = String(value).split("T")[0];
      const [year, month, day] = plain.split("-").map((part) => parseInt(part, 10));
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const rangeFrom = parseYmdToDate(dateFrom);
    const rangeTo = parseYmdToDate(dateTo);
    const todayBase = parseYmdToDate(todayYmd);
    const weekEnd = todayBase ? addDays(todayBase, 6) : null;

    const resolveOwnerCover = (owner: any) => {
      const direct =
        owner?.avatar_url ||
        owner?.portada_url ||
        owner?.banner_url ||
        owner?.avatar ||
        owner?.portada ||
        owner?.banner;
      if (direct) return String(direct);
      const media = Array.isArray(owner?.media) ? owner.media : [];
      if (media.length) {
        const bySlot = media.find((m: any) => m?.slot === "cover" || m?.slot === "p1" || m?.slot === "avatar");
        if (bySlot?.url) return String(bySlot.url);
        if (bySlot?.path) return String(bySlot.path);
        const first = media[0];
        return String(first?.url || first?.path || (typeof first === "string" ? first : ""));
      }
      return undefined as string | undefined;
    };

    const dayNameToNumber = (dayName: string | number): number | null => {
      if (typeof dayName === "number" && dayName >= 0 && dayName <= 6) {
        return dayName;
      }
      const normalized = String(dayName).toLowerCase().trim();
      const map: Record<string, number> = {
        domingo: 0,
        dom: 0,
        lunes: 1,
        lun: 1,
        martes: 2,
        mar: 2,
        miércoles: 3,
        miercoles: 3,
        mié: 3,
        mie: 3,
        jueves: 4,
        jue: 4,
        viernes: 5,
        vie: 5,
        sábado: 6,
        sabado: 6,
        sáb: 6,
        sab: 6,
      };
      return map[normalized] ?? null;
    };

    const mapClase = (owner: any, clase: any, ownerType: "academy" | "teacher", cronogramaIndex: number) => {
      const baseClase = {
        titulo: clase?.titulo,
        fecha: clase?.fecha,
        diasSemana:
          clase?.diasSemana || (typeof clase?.diaSemana === "number" ? [dayNames[clase.diaSemana] || ""] : undefined),
        inicio: clase?.inicio,
        fin: clase?.fin,
        ritmos: clase?.ritmos ?? [],
        ritmoId: clase?.ritmoId,
        ritmoIds: clase?.ritmoIds ?? [],
        estilos: clase?.estilos ?? [],
        ritmos_seleccionados: clase?.ritmosSeleccionados ?? clase?.ritmos_seleccionados ?? [],
        zonas: clase?.zonas ?? owner?.zonas ?? [],
        ubicacion: clase?.ubicacion || owner?.ubicaciones?.[0]?.nombre || owner?.ciudad || owner?.direccion || "",
        ownerType,
        ownerId: owner?.id,
        ownerName: owner?.nombre_publico,
        ownerCoverUrl: resolveOwnerCover(owner),
        cronogramaIndex,
      };

      if (baseClase.diasSemana && Array.isArray(baseClase.diasSemana) && baseClase.diasSemana.length > 1) {
        const expanded: any[] = [];
        for (const dayStr of baseClase.diasSemana) {
          const dayNum = dayNameToNumber(dayStr);
          if (dayNum !== null) {
            expanded.push({
              ...baseClase,
              diaSemana: dayNum,
              diasSemana: [dayStr],
            });
          }
        }
        return expanded.length > 0 ? expanded : [baseClase];
      }

      return [baseClase];
    };

    const fromAcademies = allA.flatMap((academy: any) => {
      const cronogramaData = academy?.cronograma || academy?.horarios || [];
      return Array.isArray(cronogramaData)
        ? cronogramaData.flatMap((clase: any, idx: number) => mapClase(academy, clase, "academy", idx))
        : [];
    });

    const fromTeachers = allM.flatMap((teacher: any) => {
      const cronogramaData = teacher?.cronograma || teacher?.horarios || [];
      return Array.isArray(cronogramaData)
        ? cronogramaData.flatMap((clase: any, idx: number) => mapClase(teacher, clase, "teacher", idx))
        : [];
    });

    const merged = [...fromAcademies, ...fromTeachers].filter(
      (item) => item && (item.titulo || item.fecha || (item.diasSemana && item.diasSemana[0])),
    );

    const classMatchesSelectedFilters = (item: any) => {
      if (selectedRitmoSet.size > 0) {
        const itemRitmoIds = new Set<number>();
        const addNum = (value: any) => {
          const id = Number(value);
          if (Number.isFinite(id) && id > 0) itemRitmoIds.add(Math.trunc(id));
        };
        const addArr = (arr: any) => {
          if (!Array.isArray(arr)) return;
          arr.forEach(addNum);
        };
        addNum(item?.ritmoId);
        addArr(item?.ritmoIds);
        addArr(item?.ritmos);
        addArr(item?.estilos);
        const slugs = [
          ...(Array.isArray(item?.ritmos_seleccionados) ? item.ritmos_seleccionados : []),
          ...(Array.isArray(item?.ritmosSeleccionados) ? item.ritmosSeleccionados : []),
        ];
        for (const raw of slugs) {
          const key = String(raw ?? "").trim().toLowerCase();
          if (!key) continue;
          const mapped = ritmoIdBySlugLocal.get(key);
          if (typeof mapped === "number") itemRitmoIds.add(mapped);
        }
        let hit = false;
        itemRitmoIds.forEach((id) => {
          if (selectedRitmoSet.has(id)) hit = true;
        });
        if (!hit) return false;
      }

      if (selectedZonaSet.size > 0) {
        const itemZonaIds = new Set<number>();
        const addZona = (value: any) => {
          const id = Number(value);
          if (Number.isFinite(id) && id > 0) itemZonaIds.add(Math.trunc(id));
        };
        addZona(item?.zonaId);
        addZona(item?.zona);
        if (Array.isArray(item?.zonas)) item.zonas.forEach(addZona);
        if (Array.isArray(item?.zonaIds)) item.zonaIds.forEach(addZona);
        let hit = false;
        itemZonaIds.forEach((id) => {
          if (selectedZonaSet.has(id)) hit = true;
        });
        if (!hit) return false;
      }

      return true;
    };

    const mergedByRhythmAndZone = merged.filter(classMatchesSelectedFilters);
    const weekdayIndex = (name: string) =>
      dayNames.findIndex((dayName) => dayName.toLowerCase() === String(name).toLowerCase());

    const nextOccurrence = (item: any): Date | null => {
      try {
        if (item.fecha) {
          return parseYmdToDate(item.fecha);
        }
        const days: string[] = Array.isArray(item.diasSemana) ? item.diasSemana : [];
        if (!days.length) return null;
        const today = new Date();
        const todayIdx = today.getDay();
        let minDelta: number | null = null;
        for (const dayName of days) {
          const idx = weekdayIndex(dayName);
          if (idx < 0) continue;
          const delta = idx >= todayIdx ? idx - todayIdx : (idx - todayIdx + 7) % 7;
          if (minDelta === null || delta < minDelta) minDelta = delta;
        }
        if (minDelta === null) return null;
        const upcoming = addDays(today, minDelta);
        return new Date(
          Date.UTC(upcoming.getUTCFullYear(), upcoming.getUTCMonth(), upcoming.getUTCDate(), 12, 0, 0),
        );
      } catch {
        return null;
      }
    };

    const preset = datePreset || "todos";
    const includePastClasses = !!qDeferred && qDeferred.trim().length > 0;

    const matchesPresetAndRange = (item: any) => {
      const occurrence = nextOccurrence(item);
      if (occurrence && todayBase && !includePastClasses) {
        const occurrenceDate = new Date(
          Date.UTC(occurrence.getUTCFullYear(), occurrence.getUTCMonth(), occurrence.getUTCDate(), 0, 0, 0),
        );
        const todayDate = new Date(
          Date.UTC(todayBase.getUTCFullYear(), todayBase.getUTCMonth(), todayBase.getUTCDate(), 0, 0, 0),
        );
        if (occurrenceDate < todayDate) return false;
      }
      if (rangeFrom && occurrence && occurrence < rangeFrom) return false;
      if (rangeTo && occurrence && occurrence > rangeTo) return false;
      if (preset === "todos") return true;
      if (!occurrence) return true;
      if (preset === "hoy") {
        return occurrence.toISOString().slice(0, 10) === todayYmd;
      }
      if (preset === "semana") {
        if (!todayBase || !weekEnd) return true;
        return occurrence >= todayBase && occurrence <= weekEnd;
      }
      if (preset === "siguientes") {
        if (!weekEnd) return true;
        return occurrence > weekEnd;
      }
      return true;
    };

    const filtered = mergedByRhythmAndZone
      .filter(matchesPresetAndRange)
      .filter((item: any) => !shouldHideExploreClassForBlackout(item));

    const timeToMinutes = (timeStr?: string | null): number | null => {
      if (!timeStr) return null;
      const parts = String(timeStr).trim().split(":");
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (Number.isFinite(hours) && Number.isFinite(minutes)) {
          return hours * 60 + minutes;
        }
      }
      return null;
    };

    return [...filtered].sort((a, b) => {
      const dateA = nextOccurrence(a);
      const dateB = nextOccurrence(b);
      if (!dateA && !dateB) {
        const timeA = timeToMinutes(a.inicio);
        const timeB = timeToMinutes(b.inicio);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        return timeA - timeB;
      }
      if (!dateA) return 1;
      if (!dateB) return -1;

      const dateDiff = dateA.getTime() - dateB.getTime();
      if (dateDiff === 0) {
        const timeA = timeToMinutes(a.inicio);
        const timeB = timeToMinutes(b.inicio);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        return timeA - timeB;
      }

      return dateDiff;
    });
  }, [
    academiasData,
    maestrosData,
    allTags,
    ritmos,
    zonas,
    datePreset,
    dateFrom,
    dateTo,
    qDeferred,
    todayYmd,
    t,
    language,
  ]);
}
