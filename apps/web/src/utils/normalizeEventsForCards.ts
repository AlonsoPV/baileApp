/**
 * Normaliza eventos para cards de Explore: precomputa todo lo que EventCard necesita
 * en un solo paso por lista. Evita N hooks, N queries y N cálculos pesados por card.
 *
 * Uso: const normalized = normalizeEventsForCards(events, allTags);
 * EventCard recibe item con item.__ui ya poblado.
 */
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { getLowestTaquillaMonto, getPrimaryCost, hasDiscount, getMonto } from "./eventCosts";
import { resolveEventDateYmd } from "./eventDateDisplay";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "./imageOptimization";
import { getMediaBySlot, normalizeMediaArray } from "./mediaSlots";

export type EventCardUI = {
  fechaYmd: string | null;
  horaHm: string;
  lugarNombre: string;
  costoMonto: number | null;
  hasDiscount: boolean;
  ritmosNombres: string[];
  flyerUrl: string | undefined;
  sortKey: string;
};

function formatHHMM(t?: string): string {
  if (!t) return "";
  try {
    const s = String(t);
    if (s.includes(":")) {
      const [hh = "", mm = ""] = s.split(":");
      const h2 = hh.padStart(2, "0").slice(-2);
      const m2 = mm.padStart(2, "0").slice(-2);
      return `${h2}:${m2}`;
    }
    if (s.length === 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  } catch {}
  return String(t);
}

function extractLugarNombre(lugar?: string | null): string {
  if (!lugar || typeof lugar !== "string") return "";
  const s = String(lugar).trim();
  const separadores = [" · ", " ·", "· ", ",", " – ", " - "];
  for (const sep of separadores) {
    if (s.includes(sep)) return s.split(sep)[0].trim();
  }
  return s;
}

function resolveFlyerUrl(item: any): string | undefined {
  const toUrl = (u: string | null | undefined) =>
    u ? (toDirectPublicStorageUrl(ensureAbsoluteImageUrl(u) ?? u) ?? u) : undefined;
  if (item.flyer_url) return toUrl(item.flyer_url);
  const mediaList = normalizeMediaArray(item.media);
  const p1 = getMediaBySlot(mediaList, "p1") as any;
  const p1Url = p1?.url ?? p1?.path;
  if (p1Url) return toUrl(p1Url);
  const avatarSlot = mediaList.find((m: any) => m?.slot === "avatar");
  const avatarUrl = avatarSlot?.url ?? (avatarSlot as any)?.path;
  if (avatarUrl) return toUrl(avatarUrl);
  if (item.avatar_url) return toUrl(item.avatar_url);
  if (item.portada_url) return toUrl(item.portada_url);
  if (mediaList.length > 0) {
    const first = mediaList[0];
    const url = (first as any)?.url ?? (first as any)?.path ?? (typeof first === "string" ? first : "");
    if (url) return toUrl(url);
  }
  return undefined;
}

/** Map id -> label para ritmos del catálogo (construido una vez por batch) */
const labelByCatalogId = (() => {
  const m = new Map<string, string>();
  RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => m.set(i.id, i.label)));
  return m;
})();

export function normalizeEventsForCards(
  events: any[],
  allTags?: any[] | null
): any[] {
  const tagsById = new Map<number, { nombre: string }>();
  if (Array.isArray(allTags)) {
    allTags.forEach((t: any) => {
      if (t?.id != null && t?.nombre) tagsById.set(Number(t.id), { nombre: t.nombre });
    });
  }

  return (events ?? []).map((e: any) => {
    const fechaYmd = resolveEventDateYmd(e);
    const horaInicio = e.hora_inicio || e.evento_hora_inicio;
    const horaHm = formatHHMM(horaInicio) || "99:99";
    const lugar = e.lugar || e.evento_lugar;
    const lugarNombre = extractLugarNombre(lugar);

    let costoMonto = getLowestTaquillaMonto(e);
    if (costoMonto == null) {
      const primaryCost = getPrimaryCost(e);
      costoMonto = getMonto(primaryCost);
      if (costoMonto == null) {
        const raw = e?.costos?.[0] ?? e?.events_parent?.costos?.[0];
        costoMonto = getMonto(raw);
      }
    }
    if (costoMonto == null) costoMonto = 0;
    const hasDiscountVal = hasDiscount(e);

    const selectedCatalog: string[] =
      (Array.isArray(e?.ritmos_seleccionados) && e.ritmos_seleccionados) ||
      (Array.isArray(e?.events_parent?.ritmos_seleccionados) && e.events_parent?.ritmos_seleccionados) ||
      [];
    let ritmosNombres: string[] = [];
    if (selectedCatalog.length > 0) {
      ritmosNombres = selectedCatalog.map((id) => labelByCatalogId.get(id)!).filter(Boolean) as string[];
    } else {
      const estilosNums: number[] =
        (Array.isArray(e?.estilos) && e.estilos) ||
        (Array.isArray(e?.events_parent?.estilos) && e.events_parent?.estilos) ||
        [];
      if (estilosNums.length > 0) {
        ritmosNombres = estilosNums
          .map((id: number) => tagsById.get(id)?.nombre)
          .filter(Boolean) as string[];
      }
    }

    const flyerUrl = resolveFlyerUrl(e);
    const sortKey = `${fechaYmd ?? ""}|${horaHm}|${e.id ?? ""}`;

    return {
      ...e,
      __ui: {
        fechaYmd,
        horaHm,
        lugarNombre,
        costoMonto,
        hasDiscount: hasDiscountVal,
        ritmosNombres,
        flyerUrl,
        sortKey,
      } satisfies EventCardUI,
    };
  });
}
