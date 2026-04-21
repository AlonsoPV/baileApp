/**
 * Premio o logro para perfiles de academia / maestro.
 * Listo para persistir en JSON/Supabase sin lógica de guardado aquí.
 */
export type AwardItem = {
  id: string;
  title: string;
  category?: string;
  achievementType?: string;
  organization?: string;
  year?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  isHighlighted?: boolean;
};

export const AWARD_CATEGORY_OPTIONS = [
  "Mundial",
  "Nacional",
  "Regional",
  "Local",
  "Certificación",
  "Reconocimiento",
  "Otro",
] as const;

export const AWARD_ACHIEVEMENT_TYPE_OPTIONS = [
  "Primer lugar individual",
  "Primer lugar grupal",
  "Segundo lugar",
  "Tercer lugar",
  "Finalista",
  "Participación destacada",
  "Campeón/a",
  "Subcampeón/a",
  "Otro",
] as const;

export type AwardCategoryOption = (typeof AWARD_CATEGORY_OPTIONS)[number];
export type AwardAchievementTypeOption = (typeof AWARD_ACHIEVEMENT_TYPE_OPTIONS)[number];

export function createAwardId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `award-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyAward(partial?: Partial<AwardItem>): AwardItem {
  return {
    id: createAwardId(),
    title: "",
    category: "",
    achievementType: "",
    organization: "",
    year: "",
    location: "",
    description: "",
    imageUrl: "",
    isHighlighted: false,
    ...partial,
  };
}

/** Orden visual: destacados primero, luego por año descendente si es numérico. */
/** Datos de ejemplo para previews o Storybook (sin persistencia). */
export const SAMPLE_AWARDS: AwardItem[] = [
  {
    id: "sample-1",
    title: "Campeona mundial de Bachata",
    category: "Mundial",
    achievementType: "Campeón/a",
    organization: "World Bachata Championship",
    year: "2023",
    location: "Roma, Italia",
    description: "Categoría profesional · parejas.",
    isHighlighted: true,
  },
  {
    id: "sample-2",
    title: "Primer lugar grupal",
    category: "Nacional",
    achievementType: "Primer lugar grupal",
    organization: "México Salsa Open",
    year: "2022",
    location: "CDMX",
    description: "Formación de academia.",
    imageUrl: "",
  },
  {
    id: "sample-3",
    title: "Certificación de instructores",
    category: "Certificación",
    achievementType: "Otro",
    organization: "Latin Dance Academy Intl.",
    year: "2021",
    description: "Módulos avanzados de pedagogía y técnica.",
    isHighlighted: false,
  },
];

export function sortAwardsForDisplay(items: AwardItem[]): AwardItem[] {
  return [...items].sort((a, b) => {
    const ha = a.isHighlighted ? 1 : 0;
    const hb = b.isHighlighted ? 1 : 0;
    if (ha !== hb) return hb - ha;
    const ya = parseInt(String(a.year || "").replace(/\D/g, ""), 10);
    const yb = parseInt(String(b.year || "").replace(/\D/g, ""), 10);
    const na = Number.isFinite(ya) ? ya : -1;
    const nb = Number.isFinite(yb) ? yb : -1;
    if (na !== nb) return nb - na;
    return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
  });
}
