export type EventCostoTipo = "taquilla" | "preventa" | "promocion" | "gratis" | "otro";

export interface CostPhase {
  id: string;
  name: string;
  type?: EventCostoTipo | string;
  description?: string;
  price: number;
  startDate?: string;
  endDate?: string;
  order: number;
  isFinal?: boolean;
}

export interface EventCost {
  id: string;
  name: string;
  type?: EventCostoTipo | string;
  amount?: number;
  description?: string;
  currency: "MXN";
  phases: CostPhase[];
}

export interface EventCosto {
  tipo: EventCostoTipo | string;
  monto?: number;
  precio?: number; // legacy
  descripcion?: string;
  regla?: string; // legacy
  nombre?: string;
}

const DISCOUNT_TIPOS: EventCostoTipo[] = ["preventa", "promocion", "otro"];

const makeId = (prefix: string, i: number) => `${prefix}_${i}_${Math.random().toString(16).slice(2, 8)}`;

function parseMaybeJson(v: any) {
  let cur = v;
  for (let i = 0; i < 2; i++) {
    if (typeof cur !== "string") break;
    const s = cur.trim();
    if (!s) break;
    const looksJson = s.startsWith("[") || s.startsWith("{") || s.startsWith("\"[") || s.startsWith("\"{");
    if (!looksJson) break;
    try {
      cur = JSON.parse(s);
    } catch {
      break;
    }
  }
  return cur;
}

function parsePrice(raw: any): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? raw : null;
  if (typeof raw === "string") {
    const cleaned = raw.trim().replace(/[^\d.,-]/g, "");
    if (!cleaned) return null;
    const normalized =
      cleaned.includes(".") && cleaned.includes(",")
        ? cleaned.replace(/,/g, "")
        : cleaned.includes(",")
          ? cleaned.replace(/,/g, ".")
          : cleaned;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

function normalizeTipo(t: string | undefined): EventCostoTipo | null {
  if (!t) return null;
  const lower = String(t).trim().toLowerCase();
  if (lower === "taquilla") return "taquilla";
  if (lower === "preventa") return "preventa";
  if (lower === "promocion" || lower === "promoción" || lower === "promo") return "promocion";
  if (lower === "gratis" || lower === "free") return "gratis";
  if (lower === "otro") return "otro";
  return null;
}

function looksLikePhasedCost(v: any): v is EventCost {
  return Boolean(v && typeof v === "object" && Array.isArray(v.phases) && typeof v.name === "string");
}

function toCostosArray(rawInput: any): any[] {
  const raw = (rawInput?.costos ?? rawInput?.events_parent?.costos ?? rawInput) as any;
  const parsed = parseMaybeJson(raw);
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
}

function legacyToPhased(c: EventCosto, i: number): EventCost | null {
  const price = parsePrice(c.monto ?? c.precio);
  if (price === null) return null;
  const inferredTipo = normalizeTipo(c.tipo) ?? (price <= 0 ? "gratis" : "otro");
  const phaseName =
    inferredTipo === "taquilla"
      ? "Taquilla"
      : inferredTipo === "preventa"
        ? "Preventa"
        : inferredTipo === "promocion"
          ? "Promoción"
          : inferredTipo === "gratis"
            ? "Gratis"
            : "Fase";
  return {
    id: makeId("cost", i),
    name: (c.nombre || phaseName || `Costo ${i + 1}`).trim(),
    type: inferredTipo,
    amount: price,
    description: (c.descripcion ?? c.regla ?? "").trim() || undefined,
    currency: "MXN",
    phases: [
      {
        id: makeId("phase", i),
        name: phaseName,
        type: inferredTipo,
        description: (c.descripcion ?? c.regla ?? "").trim() || undefined,
        price,
        order: 1,
        isFinal: inferredTipo === "taquilla",
      },
    ],
  };
}

export function normalizeEventCosts(input: any): EventCost[] {
  const arr = toCostosArray(input);
  const out: EventCost[] = [];
  arr.forEach((item: any, i: number) => {
    if (looksLikePhasedCost(item)) {
      const phases = (item.phases || [])
        .map((p: any, pIdx: number) => {
          const price = parsePrice(p?.price ?? p?.monto);
          if (price === null) return null;
          const phaseType = normalizeTipo(p?.type ?? p?.tipo) || normalizeTipo(item?.type ?? item?.tipo) || undefined;
          return {
            id: String(p?.id || makeId("phase", pIdx)),
            name: String(p?.name || `Fase ${pIdx + 1}`),
            type: phaseType,
            description: p?.description ? String(p.description) : (p?.descripcion ? String(p.descripcion) : undefined),
            price,
            startDate: p?.startDate ? String(p.startDate) : undefined,
            endDate: p?.endDate ? String(p.endDate) : undefined,
            order: Number.isFinite(Number(p?.order)) ? Number(p.order) : pIdx + 1,
            isFinal: Boolean(p?.isFinal),
          } as CostPhase;
        })
        .filter(Boolean) as CostPhase[];
      out.push({
        id: String(item.id || makeId("cost", i)),
        name: String(item.name || `Costo ${i + 1}`),
        type: (normalizeTipo(item.type ?? item.tipo) || (item.type || item.tipo ? String(item.type ?? item.tipo) : undefined)) as any,
        amount: parsePrice(item.amount ?? item.monto) ?? phases[0]?.price ?? 0,
        description: item.description ? String(item.description) : undefined,
        currency: "MXN",
        phases: phases.sort((a, b) => a.order - b.order),
      });
      return;
    }
    const legacy = legacyToPhased(item as EventCosto, i);
    if (legacy) out.push(legacy);
  });
  return out;
}

/** True if this phase counts as taquilla / door (not presale/promo). */
function phaseIsTaquilla(phase: CostPhase, cost: EventCost): boolean {
  const pt = normalizeTipo(phase.type as string | undefined);
  if (pt === "preventa" || pt === "promocion") return false;
  if (pt === "taquilla") return true;
  const ct = normalizeTipo(cost.type as string | undefined);
  if (ct === "taquilla") return true;
  if (phase.isFinal === true) return true;
  const nm = (phase.name || "").toLowerCase();
  if (nm.includes("taquilla") || nm.includes("en puerta") || nm.includes("puerta")) return true;
  return false;
}

/**
 * Minimum price among all taquilla/door phases (across cost boards).
 * Returns null if there is no taquilla phase (caller may fall back to getPrimaryCost).
 */
export function getLowestTaquillaMonto(event: any): number | null {
  const phased = normalizeEventCosts(event);
  if (!phased.length) return null;
  const candidates: number[] = [];
  for (const c of phased) {
    for (const p of c.phases) {
      if (!phaseIsTaquilla(p, c)) continue;
      const price = parsePrice(p.price);
      if (price !== null && Number.isFinite(price)) candidates.push(price);
    }
  }
  if (!candidates.length) return null;
  return Math.min(...candidates);
}

export function getPrimaryCost(event: any): EventCosto | null {
  const phased = normalizeEventCosts(event);
  if (!phased.length) return null;
  const all = phased.flatMap((c) => c.phases.map((p) => ({ cost: c, phase: p })));
  const taquilla = all.find((x) => x.phase.isFinal || x.phase.name.toLowerCase().includes("taquilla"));
  const chosen = taquilla || all.sort((a, b) => a.phase.price - b.phase.price)[0];
  if (!chosen) return null;
  const normalizedType = normalizeTipo(chosen.cost.type as string | undefined);
  return {
    tipo: normalizedType || (chosen.phase.price <= 0 ? "gratis" : (chosen.phase.isFinal ? "taquilla" : "preventa")),
    nombre: chosen.cost.name,
    descripcion: chosen.phase.name,
    monto: chosen.phase.price,
  };
}

export function hasDiscount(event: any): boolean {
  const arr = toCostosArray(event);
  const hasLegacyDiscount = arr.some((c: any) => DISCOUNT_TIPOS.includes(normalizeTipo(c?.tipo) as EventCostoTipo));
  if (hasLegacyDiscount) return true;
  const phased = normalizeEventCosts(event);
  return phased.some((c) => {
    if (!c.phases.length) return false;
    if (normalizeTipo(c.type as string | undefined) === "gratis") return false;
    if (c.phases.length > 1) return true;
    const p = c.phases[0];
    return !(p?.isFinal || p?.name?.toLowerCase().includes("taquilla"));
  });
}

export function getMonto(c: EventCosto | null): number | null {
  if (!c) return null;
  return parsePrice(c.monto ?? c.precio);
}

export function formatCostoMonto(monto: number): string {
  return `$${monto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}
