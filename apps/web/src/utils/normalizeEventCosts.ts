export type EventCostoTipo = "taquilla" | "preventa" | "promocion" | "gratis" | "otro";

export type NormalizedCostPhase = {
  id: string;
  name: string;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
  isTaquilla?: boolean;
  description?: string;
  order: number;
  type?: EventCostoTipo | string;
};

export type NormalizedEventCost = {
  id: string;
  name: string;
  description?: string;
  phases: NormalizedCostPhase[];
  sourceFormat: "legacy" | "new";
  type?: EventCostoTipo | string;
};

type AnyObj = Record<string, any>;

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

export function normalizeCostType(t: string | undefined): EventCostoTipo | null {
  if (!t) return null;
  const lower = String(t).trim().toLowerCase();
  if (lower === "taquilla") return "taquilla";
  if (lower === "preventa") return "preventa";
  if (lower === "promocion" || lower === "promoción" || lower === "promo") return "promocion";
  if (lower === "gratis" || lower === "free") return "gratis";
  if (lower === "otro") return "otro";
  return null;
}

export function parseCostAmount(raw: any): number | null {
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

function pickRawCosts(rawInput: any): any[] {
  const raw = (rawInput?.costos ?? rawInput?.events_parent?.costos ?? rawInput) as any;
  const parsed = parseMaybeJson(raw);
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
}

function inferIsTaquilla(phase: AnyObj, cost: AnyObj): boolean {
  const phaseType = normalizeCostType(phase?.type ?? phase?.tipo);
  if (phaseType === "taquilla") return true;
  if (phaseType === "preventa" || phaseType === "promocion") return false;
  if (phase?.isFinal === true) return true;
  const costType = normalizeCostType(cost?.type ?? cost?.tipo);
  if (costType === "taquilla") return true;
  const phaseName = String(phase?.name || "").toLowerCase();
  return phaseName.includes("taquilla") || phaseName.includes("en puerta") || phaseName.includes("puerta");
}

function isNewFormatCost(item: any): boolean {
  if (!item || typeof item !== "object") return false;
  if (Array.isArray(item?.phases)) return true;
  return typeof item?.name === "string" && ("amount" in item || "currency" in item || "description" in item);
}

function normalizeLegacyCost(item: AnyObj, idx: number): NormalizedEventCost | null {
  const price = parseCostAmount(item?.monto ?? item?.precio);
  if (price === null) return null;
  const inferredType = normalizeCostType(item?.tipo) ?? (price <= 0 ? "gratis" : "otro");
  const phaseName =
    inferredType === "taquilla"
      ? "Taquilla"
      : inferredType === "preventa"
        ? "Preventa"
        : inferredType === "promocion"
          ? "Promocion"
          : inferredType === "gratis"
            ? "Gratis"
            : "Fase";

  return {
    id: String(item?.id || makeId("cost", idx)),
    name: String(item?.nombre || phaseName || `Costo ${idx + 1}`).trim(),
    description: (item?.descripcion ?? item?.regla ?? "").trim() || undefined,
    sourceFormat: "legacy",
    type: inferredType,
    phases: [
      {
        id: makeId("phase", idx),
        name: phaseName,
        price,
        description: (item?.descripcion ?? item?.regla ?? "").trim() || undefined,
        order: 1,
        isTaquilla: inferredType === "taquilla",
        type: inferredType,
      },
    ],
  };
}

function normalizeNewCost(item: AnyObj, idx: number): NormalizedEventCost | null {
  const baseType = normalizeCostType(item?.type ?? item?.tipo) || (item?.type ?? item?.tipo);
  const phasesRaw = Array.isArray(item?.phases) ? item.phases : [];

  const phases = phasesRaw
    .map((phase: AnyObj, pIdx: number) => {
      const price = parseCostAmount(phase?.price ?? phase?.monto);
      if (price === null) return null;
      const normalizedType = normalizeCostType(phase?.type ?? phase?.tipo) || baseType || undefined;
      return {
        id: String(phase?.id || makeId("phase", pIdx)),
        name: String(phase?.name || `Fase ${pIdx + 1}`),
        price,
        startDate: phase?.startDate ? String(phase.startDate) : null,
        endDate: phase?.endDate ? String(phase.endDate) : null,
        description: phase?.description ? String(phase.description) : (phase?.descripcion ? String(phase.descripcion) : undefined),
        order: Number.isFinite(Number(phase?.order)) ? Number(phase.order) : pIdx + 1,
        isTaquilla: inferIsTaquilla({ ...phase, type: normalizedType }, item),
        type: normalizedType,
      } as NormalizedCostPhase;
    })
    .filter(Boolean) as NormalizedCostPhase[];

  // Safety fallback for half-migrated rows with amount but no phases.
  if (!phases.length) {
    const amount = parseCostAmount(item?.amount ?? item?.monto ?? item?.precio);
    if (amount === null) return null;
    phases.push({
      id: makeId("phase", idx),
      name: normalizeCostType(String(baseType || "")) === "taquilla" ? "Taquilla" : "Fase 1",
      price: amount,
      order: 1,
      isTaquilla: normalizeCostType(String(baseType || "")) === "taquilla",
      type: baseType || undefined,
    });
  }

  return {
    id: String(item?.id || makeId("cost", idx)),
    name: String(item?.name || `Costo ${idx + 1}`),
    description: item?.description ? String(item.description) : undefined,
    sourceFormat: "new",
    type: baseType || undefined,
    phases: phases.sort((a, b) => a.order - b.order),
  };
}

export function normalizeEventCosts(rawInput: any): NormalizedEventCost[] {
  const rawCosts = pickRawCosts(rawInput);
  const normalized: NormalizedEventCost[] = [];

  rawCosts.forEach((item: AnyObj, idx: number) => {
    if (isNewFormatCost(item)) {
      const mapped = normalizeNewCost(item, idx);
      if (mapped) normalized.push(mapped);
      return;
    }
    const mappedLegacy = normalizeLegacyCost(item, idx);
    if (mappedLegacy) normalized.push(mappedLegacy);
  });

  return normalized;
}
