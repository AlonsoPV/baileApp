import React from "react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import LiveLink from "../LiveLink";
import { useTags } from "@/hooks/useTags";
import { useFmtDate } from "@/hooks/useFmtDate";
import { toDirectPublicStorageUrl } from "@/utils/imageOptimization";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { ritmoLabelsFromMap, type ExploreTagMaps } from "@/utils/exploreTagMaps";
import "@/components/explore/EventListRow.css";

export type ClaseListRowProps = {
  item: any;
  priority?: boolean;
  tagMaps?: ExploreTagMaps;
};

function buildClaseHref(item: any): string {
  const params = new URLSearchParams();
  if (item.cronogramaIndex !== null && item.cronogramaIndex !== undefined) {
    params.set("i", String(item.cronogramaIndex));
  }
  if (typeof item.diaSemana === "number" && item.diaSemana >= 0 && item.diaSemana <= 6) {
    params.set("dia", String(item.diaSemana));
  }
  const queryString = params.toString();
  const queryParam = queryString ? `?${queryString}` : "";
  if (item.ownerType && item.ownerId) {
    return `/clase/${item.ownerType}/${String(item.ownerId)}${queryParam}`;
  }
  if (item.ownerId) {
    if (queryString) {
      params.set("type", item.ownerType || "teacher");
      params.set("id", String(item.ownerId));
      return `/clase?${params.toString()}`;
    }
    return `/clase?type=${item.ownerType || "teacher"}&id=${String(item.ownerId)}`;
  }
  return `/clase?type=${item.ownerType || "teacher"}`;
}

function ClaseListRow({ item, priority = false, tagMaps }: ClaseListRowProps) {
  const fmtDateLocalized = useFmtDate();
  const { t } = useTranslation();
  const { data: allTags } = useTags(undefined, { enabled: !tagMaps }) as any;
  const href = React.useMemo(() => buildClaseHref(item), [item]);

  const bg = toDirectPublicStorageUrl(item.ownerCoverUrl as any) ?? undefined;
  const bgCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.ownerId as string | number | undefined) ||
    (item.titulo as string | undefined) ||
    "";
  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [bg, bgCacheKey]);
  const showPlaceholder = !bg || imageError;

  const titulo = item.titulo || item.nombre || "Clase";

  const lugarNombre = React.useMemo(() => {
    if (!item.ubicacion) return "";
    const ubicacion = String(item.ubicacion).trim();
    const separadores = [",", "·", "-", "|"];
    for (const sep of separadores) {
      if (ubicacion.includes(sep)) return ubicacion.split(sep)[0].trim();
    }
    return ubicacion;
  }, [item.ubicacion]);

  const isSemanal = Array.isArray(item.diasSemana) && item.diasSemana.length > 0 && !item.fecha;

  const formattedDate = React.useMemo(() => {
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
        return fmtDateLocalized(plain);
      } catch {
        return String(item.fecha);
      }
    }
    return "";
  }, [item.fecha, item.diasSemana, item.diaSemana, isSemanal, t, fmtDateLocalized]);

  const ritmoNames = React.useMemo(() => {
    try {
      if (tagMaps) return ritmoLabelsFromMap(item, tagMaps.ritmoById);
      const ritmoById = new Map<number, string>();
      (allTags || []).forEach((tag: any) => {
        if (tag?.tipo === "ritmo" && typeof tag?.id === "number") {
          ritmoById.set(tag.id, String(tag.nombre || ""));
        }
      });
      return ritmoLabelsFromMap(item, ritmoById);
    } catch {
      /* ignore */
    }
    return [] as string[];
  }, [item, allTags, tagMaps]);

  const timeLine =
    item.inicio || item.fin
      ? `${item.inicio || "—"}${item.fin ? ` – ${item.fin}` : ""}`
      : "";
  const secondaryLine = lugarNombre || ritmoNames[0] || "";

  return (
    <LiveLink to={href} asCard={false}>
      <article className="event-list-row">
        <div className="event-list-row__thumb" aria-hidden={showPlaceholder}>
          {showPlaceholder ? (
            <div className="event-list-row__thumb-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <ExploreResponsiveImage
              rawUrl={bg}
              cacheVersion={bgCacheKey || null}
              preset="listThumb"
              alt={titulo}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="event-list-row__main">
          <h3 className="event-list-row__title">{titulo}</h3>
          {item.ownerName ? (
            <div className="event-list-row__owner">
              por <strong>{item.ownerName}</strong>
            </div>
          ) : null}
          {secondaryLine ? <div className="event-list-row__secondary" title={secondaryLine}>{secondaryLine}</div> : null}
          <div className="event-list-row__meta">
            {formattedDate ? <span>{formattedDate}</span> : null}
            {formattedDate && timeLine ? <span className="event-list-row__dot">·</span> : null}
            {timeLine ? <span>{timeLine}</span> : null}
          </div>
        </div>
        <div className="event-list-row__chevron" aria-hidden>
          <ChevronRight strokeWidth={2} />
        </div>
      </article>
    </LiveLink>
  );
}

const MemoizedClaseListRow = React.memo(ClaseListRow);

export default MemoizedClaseListRow;
