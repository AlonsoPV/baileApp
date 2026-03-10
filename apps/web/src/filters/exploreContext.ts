import type { ExploreType } from "@/state/exploreFilters";

export type ExploreContext =
  | "eventos"
  | "sociales"
  | "clases"
  | "academias"
  | "maestros"
  | "organizadores"
  | "bailarines"
  | "marcas";

export function mapExploreTypeToContext(type?: ExploreType | null): ExploreContext | null {
  switch (type) {
    case "sociales":
    case "fechas":
      return "eventos";
    case "clases":
      return "clases";
    case "academias":
      return "academias";
    case "maestros":
      return "maestros";
    case "organizadores":
      return "organizadores";
    case "usuarios":
      return "bailarines";
    case "marcas":
      return "marcas";
    default:
      return null;
  }
}

export type ZoneContext =
  | "eventos"
  | "clases"
  | "academias"
  | "maestros"
  | "organizadores"
  | "bailarines"
  | "marcas";

export function mapExploreTypeToZoneContext(type?: ExploreType | null): ZoneContext | null {
  const context = mapExploreTypeToContext(type);
  if (!context) return null;
  // Zonas usa "eventos" como contexto agregado para fechas/sociales.
  if (context === "sociales") return "eventos";
  return context as ZoneContext;
}
