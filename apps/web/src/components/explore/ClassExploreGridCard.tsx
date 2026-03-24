import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LiveLink from "../LiveLink";
import { useTags } from "@/hooks/useTags";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { fmtDate } from "@/utils/format";
import { toDirectPublicStorageUrl, logCardImage } from "@/utils/imageOptimization";
import { withStableCacheBust } from "@/utils/cacheBuster";
import "./EventSocialGridCard.css";

export type ClassExploreGridItem = {
  titulo?: string;
  fecha?: string;
  diasSemana?: string[];
  diaSemana?: number;
  inicio?: string;
  fin?: string;
  ubicacion?: string;
  ownerType?: "academy" | "teacher";
  ownerId?: number | string;
  ownerName?: string;
  ownerCoverUrl?: string;
  ritmos?: number[];
  ritmosSeleccionados?: string[];
  cronogramaIndex?: number;
  updated_at?: string;
  created_at?: string;
};

export interface ClassExploreGridCardProps {
  item: ClassExploreGridItem;
  priority?: boolean;
}

function buildClaseHref(item: ClassExploreGridItem): string {
  const params = new URLSearchParams();
  if (item.cronogramaIndex != null) params.set("i", String(item.cronogramaIndex));
  if (typeof item.diaSemana === "number" && item.diaSemana >= 0 && item.diaSemana <= 6) {
    params.set("dia", String(item.diaSemana));
  }
  const qs = params.toString();
  const q = qs ? `?${qs}` : "";
  if (item.ownerType && item.ownerId) return `/clase/${item.ownerType}/${String(item.ownerId)}${q}`;
  if (item.ownerId) {
    if (qs) {
      params.set("type", item.ownerType || "teacher");
      params.set("id", String(item.ownerId));
      return `/clase?${params.toString()}`;
    }
    return `/clase?type=${item.ownerType || "teacher"}&id=${String(item.ownerId)}`;
  }
  return `/clase?type=${item.ownerType || "teacher"}`;
}

function formatHHMM(t?: string) {
  if (!t) return "";
  try {
    const s = String(t);
    if (s.includes(":")) {
      const [hh = "", mm = ""] = s.split(":");
      return `${hh.padStart(2, "0").slice(-2)}:${mm.padStart(2, "0").slice(-2)}`;
    }
    if (s.length === 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  } catch {
    /* ignore */
  }
  return String(t);
}

/** Misma estructura y clases CSS que `EventSocialGridCard` (vista cuadrícula / carrusel Explore). */
export default function ClassExploreGridCard({ item, priority = false }: ClassExploreGridCardProps) {
  const { t } = useTranslation();
  const { data: allTags } = useTags() as any;
  const href = React.useMemo(() => buildClaseHref(item), [item]);

  const bg = toDirectPublicStorageUrl(item.ownerCoverUrl as any) ?? undefined;
  const bgCacheKey =
    (item.updated_at as string | undefined) ||
    (item.created_at as string | undefined) ||
    item.ownerId ||
    item.titulo ||
    "";
  const imageUrlFinal = React.useMemo(
    () => withStableCacheBust(bg, bgCacheKey || null) || bg,
    [bg, bgCacheKey]
  );

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;

  const title = item.titulo || (item as any).nombre || t("explore_cartelera_class_badge");

  const isSemanal = Array.isArray(item.diasSemana) && item.diasSemana.length > 0 && !item.fecha;

  const dateLine = React.useMemo(() => {
    if (isSemanal) {
      if (typeof item.diaSemana === "number") {
        const dayNames = [
          t("sunday"),
          t("monday"),
          t("tuesday"),
          t("wednesday"),
          t("thursday"),
          t("friday"),
          t("saturday"),
        ];
        return dayNames[item.diaSemana]?.slice(0, 3).toLowerCase() || "";
      }
      if (Array.isArray(item.diasSemana) && item.diasSemana.length > 0) {
        const dayNames = [
          t("sunday"),
          t("monday"),
          t("tuesday"),
          t("wednesday"),
          t("thursday"),
          t("friday"),
          t("saturday"),
        ];
        const dayMap: Record<string, number> = {
          domingo: 0,
          lunes: 1,
          martes: 2,
          miércoles: 3,
          miercoles: 3,
          jueves: 4,
          viernes: 5,
          sábado: 6,
          sabado: 6,
        };
        return item.diasSemana
          .map((d: string) => {
            const normalized = String(d).toLowerCase().trim();
            const dayIndex = dayMap[normalized];
            if (dayIndex !== undefined) return dayNames[dayIndex].slice(0, 3).toLowerCase();
            return d.slice(0, 3).toLowerCase();
          })
          .join(", ");
      }
      return "";
    }
    if (item.fecha) {
      try {
        const plain = String(item.fecha).split("T")[0];
        return fmtDate(plain);
      } catch {
        return String(item.fecha);
      }
    }
    return "";
  }, [item.fecha, item.diasSemana, item.diaSemana, isSemanal, t]);

  const timePart = React.useMemo(() => {
    const a = item.inicio ? formatHHMM(item.inicio) : "";
    const b = item.fin ? formatHHMM(item.fin) : "";
    if (a && b) return `${a} · ${b}`;
    return a || b;
  }, [item.inicio, item.fin]);

  const lugarNombre = React.useMemo(() => {
    if (!item.ubicacion) return "";
    const ubicacion = String(item.ubicacion).trim();
    for (const sep of [",", "·", "-", "|"]) {
      if (ubicacion.includes(sep)) return ubicacion.split(sep)[0].trim();
    }
    return ubicacion;
  }, [item.ubicacion]);

  const ritmoNames = React.useMemo(() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => labelByCatalogId.set(i.id, i.label)));
      const catalogIds = (item.ritmosSeleccionados || []) as string[];
      if (catalogIds.length > 0) return catalogIds.map((id) => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      const nums = (item.ritmos || []) as number[];
      if (Array.isArray(allTags) && nums.length > 0) {
        return nums
          .map((id: number) => allTags.find((tag: any) => tag.id === id && tag.tipo === "ritmo"))
          .filter(Boolean)
          .map((tag: any) => tag.nombre as string);
      }
    } catch {
      /* ignore */
    }
    return [] as string[];
  }, [item, allTags]);

  const accentLine = ritmoNames[0] || item.ownerName || t("explore_cartelera_class_badge", "Clase");

  logCardImage("clase", item.ownerId ?? title, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

  return (
    <LiveLink to={href} asCard={false}>
      <motion.article
        className="event-social-grid-card"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="event-social-grid-card__media">
          {showPlaceholder ? (
            <div className="event-social-grid-card__placeholder" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <img
              src={imageUrlFinal}
              alt={title}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="event-social-grid-card__body">
          <h3 className="event-social-grid-card__title">{title}</h3>
          <div className="event-social-grid-card__line event-social-grid-card__line--meta">
            {dateLine && <span>{dateLine}</span>}
            {dateLine && timePart && <span className="event-social-grid-card__dot">·</span>}
            {timePart && <span>{timePart}</span>}
          </div>
          {lugarNombre ? (
            <div className="event-social-grid-card__line event-social-grid-card__line--place" title={lugarNombre}>
              📍 {lugarNombre}
            </div>
          ) : null}
          <div className="event-social-grid-card__price" aria-label={accentLine}>
            <span>{accentLine.length > 28 ? `${accentLine.slice(0, 28)}…` : accentLine}</span>
          </div>
        </div>
      </motion.article>
    </LiveLink>
  );
}
