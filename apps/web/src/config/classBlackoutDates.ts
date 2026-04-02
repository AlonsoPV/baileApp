/**
 * Días en los que no se muestran clases en Explorar (lista principal).
 * Mantener en sync con `supabase/scripts/blackout_clases_2026_abril.sql` si usas la tabla en BD.
 */
const CLASS_BLACKOUT_YMD = new Set<string>([
  "2026-04-01",
  "2026-04-02",
  "2026-04-03",
  "2026-04-04",
  "2026-04-05",
]);

/** Nombres de día → 0=Dom … 6=Sáb (alineado con Explore / cronograma) */
const DAY_NAME_TO_NUM: Record<string, number> = {
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

export function isClassBlackoutYmd(ymd: string | null | undefined): boolean {
  if (!ymd) return false;
  const plain = String(ymd).split("T")[0];
  return CLASS_BLACKOUT_YMD.has(plain);
}

export function getClassBlackoutYmdList(): readonly string[] {
  return Array.from(CLASS_BLACKOUT_YMD).sort();
}

function getTodayYmdCDMX(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Día de la semana (0–6) del calendario gregoriano para YYYY-MM-DD (UTC mediodía). */
function weekdayFromYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

function parseItemWeekdaySet(item: {
  fecha?: string | null;
  diaSemana?: number | null;
  diasSemana?: unknown[] | null;
}): Set<number> {
  const targets = new Set<number>();
  if (typeof item.diaSemana === "number" && item.diaSemana >= 0 && item.diaSemana <= 6) {
    targets.add(item.diaSemana);
  }
  if (Array.isArray(item.diasSemana)) {
    for (const dn of item.diasSemana) {
      if (typeof dn === "number" && dn >= 0 && dn <= 6) {
        targets.add(dn);
        continue;
      }
      const k = String(dn ?? "")
        .toLowerCase()
        .trim();
      if (DAY_NAME_TO_NUM[k] !== undefined) targets.add(DAY_NAME_TO_NUM[k]);
    }
  }
  return targets;
}

/**
 * Próxima fecha calendario (zona CDMX “hoy” como inicio) en que ocurre la clase.
 * - Fecha fija: la misma `fecha` del ítem.
 * - Semanal: primer YMD ≥ hoy (CDMX) cuyo día de la semana coincide con la clase.
 */
export function getNextClassOccurrenceYmdCDMX(item: {
  fecha?: string | null;
  diaSemana?: number | null;
  diasSemana?: unknown[] | null;
}): string | null {
  const fixed = item.fecha ? String(item.fecha).split("T")[0] : "";
  if (fixed && /^\d{4}-\d{2}-\d{2}$/.test(fixed)) return fixed;

  const targets = parseItemWeekdaySet(item);
  if (targets.size === 0) return null;

  const start = getTodayYmdCDMX();
  for (let i = 0; i < 400; i++) {
    const ymd = addDaysYmd(start, i);
    if (targets.has(weekdayFromYmd(ymd))) return ymd;
  }
  return null;
}

/**
 * Ocultar en Explorar si la próxima ocurrencia visible cae en un día blackout.
 * Usa CDMX (no UTC) para el YMD, evitando desfases tipo “1 abr” → “31 mar” en `toISOString()`.
 */
export function shouldHideExploreClassForBlackout(item: any): boolean {
  const ymd = getNextClassOccurrenceYmdCDMX(item);
  if (!ymd) return false;
  return isClassBlackoutYmd(ymd);
}
