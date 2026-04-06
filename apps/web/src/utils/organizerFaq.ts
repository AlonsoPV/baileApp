import type { OrganizerFaqItem } from "../types/organizerFaq";

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `faq_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Normaliza datos desde BD o borrador (acepta q/a o question/answer). */
export function parseOrganizerFaqFromDb(raw: unknown): OrganizerFaqItem[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parseOrganizerFaqFromDb(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];

  const out: OrganizerFaqItem[] = raw.map((item: any, idx: number) => {
    const q = String(item?.q ?? item?.question ?? "").trim();
    const a = String(item?.a ?? item?.answer ?? "").trim();
    const id = String(item?.id ?? "").trim() || makeId();
    const sort_order = Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : idx;
    return { id, q, a, sort_order };
  });

  return out
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((row, i) => ({ ...row, sort_order: i }));
}

/** Lista para persistir: solo entradas con q y a no vacíos; orden reindexado. */
export function sanitizeOrganizerFaqForSave(items: OrganizerFaqItem[]): OrganizerFaqItem[] {
  return items
    .filter((x) => x.q.trim() && x.a.trim())
    .map((x, i) => ({ ...x, q: x.q.trim(), a: x.a.trim(), sort_order: i }));
}

/** Validación antes de guardar: filas incompletas (solo una de las dos). */
export function findInvalidOrganizerFaq(items: OrganizerFaqItem[]): boolean {
  for (const x of items) {
    const q = x.q.trim();
    const a = x.a.trim();
    if ((q && !a) || (!q && a)) return true;
  }
  return false;
}

export function createEmptyOrganizerFaqItem(): OrganizerFaqItem {
  return { id: makeId(), q: "", a: "", sort_order: 0 };
}

export { makeId as makeOrganizerFaqId };
