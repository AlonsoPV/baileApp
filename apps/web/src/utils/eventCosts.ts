import {
  normalizeEventCosts as normalizeEventCostsUnified,
  normalizeCostType,
  parseCostAmount,
} from "./normalizeEventCosts";

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

export function normalizeEventCosts(input: any): EventCost[] {
  return normalizeEventCostsUnified(input).map((cost) => ({
    id: cost.id,
    name: cost.name,
    type: cost.type,
    amount: cost.phases[0]?.price ?? 0,
    description: cost.description,
    currency: "MXN",
    phases: cost.phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      type: phase.type,
      description: phase.description,
      price: phase.price,
      startDate: phase.startDate || undefined,
      endDate: phase.endDate || undefined,
      order: phase.order,
      isFinal: Boolean(phase.isTaquilla),
    })),
  }));
}

/** True if this phase counts as taquilla / door (not presale/promo). */
function phaseIsTaquilla(phase: CostPhase, cost: EventCost): boolean {
  const pt = normalizeCostType(phase.type as string | undefined);
  if (pt === "preventa" || pt === "promocion") return false;
  if (pt === "taquilla") return true;
  const ct = normalizeCostType(cost.type as string | undefined);
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
      const price = parseCostAmount(p.price);
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
  const normalizedType = normalizeCostType(chosen.cost.type as string | undefined);
  return {
    tipo: normalizedType || (chosen.phase.price <= 0 ? "gratis" : (chosen.phase.isFinal ? "taquilla" : "preventa")),
    nombre: chosen.cost.name,
    descripcion: chosen.phase.name,
    monto: chosen.phase.price,
  };
}

export function hasDiscount(event: any): boolean {
  const costs = normalizeEventCostsUnified(event);
  return costs.some((c) => {
    const normalizedType = normalizeCostType(c.type as string | undefined) as EventCostoTipo | null;
    if (normalizedType && DISCOUNT_TIPOS.includes(normalizedType)) return true;
    if (!c.phases.length) return false;
    if (normalizedType === "gratis") return false;
    if (c.phases.length > 1) return true;
    const p = c.phases[0];
    return !(p?.isTaquilla || p?.name?.toLowerCase().includes("taquilla"));
  });
}

export function getMonto(c: EventCosto | null): number | null {
  if (!c) return null;
  return parseCostAmount((c as any).monto ?? (c as any).precio ?? (c as any).amount ?? (c as any).price);
}

/** Mismo criterio que Explore cards: taquilla mínima → primary → primer costo crudo. `null` = sin precio (no es "Gratis"). */
export function resolveEventCardCostoMonto(event: any): number | null {
  let n = getLowestTaquillaMonto(event);
  if (n == null) {
    n = getMonto(getPrimaryCost(event));
  }
  if (n == null) {
    const raw = event?.costos?.[0] ?? event?.events_parent?.costos?.[0];
    n = getMonto(raw);
  }
  const hasNormalizedCosts = normalizeEventCosts(event).length > 0;
  if (!hasNormalizedCosts && (n == null || n === 0)) {
    return null;
  }
  return n;
}

export function formatCostoMonto(monto: number): string {
  return `$${monto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

/**
 * Price line for event chips / sliders: lowest taquilla, same logic as Explore cards (`normalizeEventsForCards`).
 * Returns "Gratis" when amount is 0; undefined when no price data.
 */
export function getEventDatePriceChipLabel(event: any, localeTag = "es-MX"): string | undefined {
  let n = resolveEventCardCostoMonto(event);
  if (n == null || Number.isNaN(n)) return undefined;
  // Solo "Gratis" con precio explícito 0; sin costo cargado → undefined (no confundir con gratis)
  if (n <= 0) return "Gratis";
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}
