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
  const lower = String(t).trim().toLowerCase();
  if (lower === "taquilla") return "taquilla";
  if (lower === "preventa") return "preventa";
  if (lower === "promocion" || lower === "promoción" || lower === "promo") return "promocion";
  if (lower === "otro") return "otro";
  return null;
}

function toCostosArray(event: any): EventCosto[] {
  const raw = (event?.costos ?? event?.events_parent?.costos ?? event) as any;

  // Algunos backends guardan JSON como string (a veces doble-serializado).
  const parseMaybeJson = (v: any) => {
    let cur = v;
    for (let i = 0; i < 2; i++) {
      if (typeof cur !== "string") break;
      const s = cur.trim();
      if (!s) break;
      // Solo intentar parsear si parece JSON.
      const looksJson = s.startsWith("[") || s.startsWith("{") || s.startsWith("\"[") || s.startsWith("\"{");
      if (!looksJson) break;
      try {
        cur = JSON.parse(s);
      } catch {
        break;
      }
    }
    return cur;
  };

  const parsed = parseMaybeJson(raw);
  const arr =
    Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as any)?.data)
        ? (parsed as any).data
        : [];

  return arr.filter((c: any) => c && (c.tipo || c.monto != null || c.precio != null));
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
  if (typeof n === "number") {
    return !Number.isNaN(n) && n >= 0 ? n : null;
  }
  if (typeof n === "string") {
    // Aceptar "150", "$150", "1,500" (es-MX) y variantes simples.
    const cleaned = n.trim().replace(/[^\d.,-]/g, "");
    if (!cleaned) return null;
    const normalized =
      cleaned.includes(".") && cleaned.includes(",")
        ? cleaned.replace(/,/g, "") // "1,500.00" -> "1500.00"
        : cleaned.includes(",")
          ? cleaned.replace(/,/g, ".") // "150,5" -> "150.5"
          : cleaned;
    const parsed = Number.parseFloat(normalized);
    return !Number.isNaN(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

/** Formatea monto para display (ej. "$150") */
export function formatCostoMonto(monto: number): string {
  return `$${monto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}
