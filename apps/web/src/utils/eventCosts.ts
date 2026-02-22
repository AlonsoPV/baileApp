/**
 * Utilidades para costos de eventos.
 * Modelo: costos: [{ tipo: "taquilla"|"preventa"|"promocion"|"otro", monto: number, descripcion?: string }]
 */

export type EventCostoTipo = "taquilla" | "preventa" | "promocion" | "otro";

export interface EventCosto {
  tipo: EventCostoTipo | string;
  monto?: number;
  precio?: number; // legacy
  descripcion?: string;
  regla?: string; // legacy
  nombre?: string;
}

/** Tipos que indican descuento o precio especial */
const DISCOUNT_TIPOS: EventCostoTipo[] = ["preventa", "promocion", "otro"];

function normalizeTipo(t: string | undefined): EventCostoTipo | null {
  if (!t) return null;
  const lower = String(t).toLowerCase();
  if (lower === "taquilla") return "taquilla";
  if (lower === "preventa") return "preventa";
  if (lower === "promocion" || lower === "promoción" || lower === "promo") return "promocion";
  if (lower === "otro") return "otro";
  return null;
}

function toCostosArray(event: any): EventCosto[] {
  const raw = (event?.costos ?? event) as any;
  if (!Array.isArray(raw)) return [];
  return raw.filter((c: any) => c && (c.tipo || c.monto != null || c.precio != null));
}

/**
 * Obtiene el costo principal a mostrar.
 * - Busca tipo "taquilla" primero.
 * - Si no existe, devuelve el primer costo disponible.
 * - Si no hay costos, devuelve null.
 */
export function getPrimaryCost(event: any): EventCosto | null {
  const costos = toCostosArray(event);
  if (costos.length === 0) return null;

  const taquilla = costos.find((c) => normalizeTipo(c.tipo) === "taquilla");
  if (taquilla) return taquilla;

  return costos[0];
}

/**
 * Indica si el evento tiene descuento o precio especial (preventa, promoción, otro).
 * false si solo tiene taquilla o no tiene costos.
 */
export function hasDiscount(event: any): boolean {
  const costos = toCostosArray(event);
  return costos.some((c) => DISCOUNT_TIPOS.includes(normalizeTipo(c.tipo) as EventCostoTipo));
}

/** Obtiene el monto numérico (soporta monto o precio legacy) */
export function getMonto(c: EventCosto | null): number | null {
  if (!c) return null;
  const n = c.monto ?? c.precio;
  return typeof n === "number" && !Number.isNaN(n) && n >= 0 ? n : null;
}

/** Formatea monto para display (ej. "$150") */
export function formatCostoMonto(monto: number): string {
  return `$${monto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}
