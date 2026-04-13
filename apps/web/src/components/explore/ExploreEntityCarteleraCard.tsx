import React from "react";
import { useTranslation } from "react-i18next";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { useTags } from "@/hooks/useTags";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { useFmtDate } from "@/hooks/useFmtDate";
import { toDirectPublicStorageUrl } from "@/utils/imageOptimization";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import "./EventCarteleraCard.css";

export type ExploreEntityCarteleraVariant = "clase" | "academy" | "teacher" | "dancer" | "organizer";

export type ExploreEntityCarteleraCardProps = {
  variant: ExploreEntityCarteleraVariant;
  item: any;
  priority?: boolean;
};

function buildClaseHref(item: any): string {
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

function resolveTeacherImage(item: any): string | undefined {
  const toUrl = (u: string | undefined) => (u ? toDirectPublicStorageUrl(u) : undefined);
  const mediaList = Array.isArray(item?.media) ? item.media : [];
  const slotP1 = getMediaBySlot(mediaList as any, "p1");
  if (slotP1?.url) return toUrl(slotP1.url as string) ?? undefined;
  const direct = item?.avatar_url || item?.banner_url || item?.portada_url || item?.avatar || item?.portada || item?.banner;
  if (direct) return toUrl(direct as string) ?? undefined;
  if (mediaList.length) {
    const bySlot = mediaList.find((m: any) => m?.slot === "cover" || m?.slot === "avatar");
    if (bySlot?.url) return toUrl(bySlot.url as string) ?? undefined;
    if (bySlot?.path) return toUrl(bySlot.path as string) ?? undefined;
    const first = mediaList[0];
    return toUrl(first?.url || first?.path || (typeof first === "string" ? first : undefined)) ?? undefined;
  }
  return undefined;
}

function resolveAcademyImage(item: any): string | undefined {
  const mediaList = normalizeMediaArray(item?.media);
  const raw =
    getMediaBySlot(mediaList, "p1")?.url ||
    getMediaBySlot(mediaList, "cover")?.url ||
    item.avatar_url ||
    item.portada_url ||
    (mediaList[0] as any)?.url ||
    (mediaList[0] as any)?.path;
  return raw ? (toDirectPublicStorageUrl(raw) ?? undefined) : undefined;
}

function resolveOrganizerImage(item: any): string | undefined {
  const toUrl = (u: string | undefined) => (u ? toDirectPublicStorageUrl(u) : undefined);
  const mediaList = normalizeMediaArray(item?.media);
  return (
    toUrl(getMediaBySlot(mediaList, "p1")?.url) ??
    toUrl(getMediaBySlot(mediaList, "avatar")?.url) ??
    toUrl(item?.avatar_url) ??
    toUrl(item?.portada_url) ??
    toUrl(getMediaBySlot(mediaList, "cover")?.url) ??
    (mediaList.length > 0 ? toUrl((mediaList[0] as any)?.url || (mediaList[0] as any)?.path) : undefined)
  );
}

function resolveDancerImage(item: any): string | undefined {
  const toUrl = (u: string | undefined) => (u ? toDirectPublicStorageUrl(u) : undefined);
  const mediaList = normalizeMediaArray(item?.media);
  return (
    toUrl(item.banner_url) ??
    toUrl(item.portada_url) ??
    toUrl(item.avatar_url) ??
    toUrl(getMediaBySlot(mediaList, "p1")?.url) ??
    (mediaList.length > 0 ? toUrl((mediaList[0] as any)?.url || (mediaList[0] as any)?.path) : undefined)
  );
}

function ExploreEntityCarteleraCard({ variant, item, priority = false }: ExploreEntityCarteleraCardProps) {
  const fmtDateLocalized = useFmtDate();
  const { t } = useTranslation();
  const { data: allTags } = useTags() as any;

  const href = React.useMemo(() => {
    if (variant === "clase") return buildClaseHref(item);
    if (variant === "academy") return urls.academyLive(item.id);
    if (variant === "teacher") return urls.teacherLive(item.id);
    if (variant === "dancer") return urls.userLive(String(item.user_id ?? item.id));
    return urls.organizerLive(item.id);
  }, [item, variant]);

  const rawImg = React.useMemo(() => {
    if (variant === "clase") {
      return item.ownerCoverUrl != null && String(item.ownerCoverUrl).trim() !== ""
        ? String(item.ownerCoverUrl).trim()
        : undefined;
    }
    if (variant === "academy") return resolveAcademyImage(item);
    if (variant === "teacher") return resolveTeacherImage(item);
    if (variant === "dancer") return resolveDancerImage(item);
    return resolveOrganizerImage(item);
  }, [item, variant]);

  const cacheKey =
    (item?.updated_at as string | undefined) ||
    (item?.created_at as string | undefined) ||
    item.id ||
    item.user_id ||
    item.titulo ||
    "";

  const title = React.useMemo(() => {
    if (variant === "clase") return item.titulo || item.nombre || "Clase";
    if (variant === "academy") {
      return (
        item.nombre_publico ||
        item.academy_name ||
        item.display_name ||
        item.nombre_academia ||
        item.nombre ||
        item.name ||
        "Academia"
      );
    }
    if (variant === "teacher") return item.nombre_publico || item.teacher_name || item.nombre || item.name || "Maestr@";
    if (variant === "dancer") return item.display_name || item.nombre_publico || item.nombre || "Bailarín";
    return item.nombre_publico || item.nombre || "Organizador";
  }, [item, variant]);

  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((tag: any) => tag.id === zid && tag.tipo === "zona")?.nombre)
    .filter(Boolean);

  const isSemanal = variant === "clase" && Array.isArray(item.diasSemana) && item.diasSemana.length > 0 && !item.fecha;

  const formattedDate = React.useMemo(() => {
    if (variant !== "clase") return "";
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
  }, [variant, item.fecha, item.diasSemana, item.diaSemana, isSemanal, t, fmtDateLocalized]);

  const timePart =
    variant === "clase" && (item.inicio || item.fin)
      ? `${item.inicio || "—"}${item.fin ? ` – ${item.fin}` : ""}`
      : "";

  const lugarLine = React.useMemo(() => {
    if (variant !== "clase" || !item.ubicacion) return "";
    const ubicacion = String(item.ubicacion).trim();
    for (const sep of [",", "·", "-", "|"]) {
      if (ubicacion.includes(sep)) return ubicacion.split(sep)[0].trim();
    }
    return ubicacion;
  }, [variant, item.ubicacion]);

  const ritmoNames = React.useMemo(() => {
    if (variant !== "clase") return [] as string[];
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
    return [];
  }, [variant, item, allTags]);

  const bioSnippet = `${String(item.bio || "").replace(/\s+/g, " ").trim().slice(0, 72)}${String(item.bio || "").trim().length > 72 ? "…" : ""}`;
  const primaryProfileLine = zonaNombres[0] || ritmoNames[0] || bioSnippet || "";
  const secondaryProfileLine =
    zonaNombres[0] && ritmoNames[0]
      ? ritmoNames[0]
      : (zonaNombres[0] || ritmoNames[0]) && bioSnippet
        ? bioSnippet
        : "";

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [rawImg, cacheKey]);
  const showPlaceholder = !rawImg || imageError;

  return (
    <LiveLink to={href} asCard={false}>
      <article className="event-cartelera-card">
        <div className="event-cartelera-card__frame">
          {showPlaceholder ? (
            <div className="event-cartelera-card__placeholder" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <ExploreResponsiveImage
              rawUrl={rawImg}
              cacheVersion={cacheKey || null}
              preset="carteleraGrid"
              alt={title}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
          <div className="event-cartelera-card__overlay">
            <h3 className="event-cartelera-card__title">{title}</h3>
            {variant === "clase" ? (
              <>
                <div className="event-cartelera-card__meta">
                  {formattedDate && <span>{formattedDate}</span>}
                  {formattedDate && timePart && <span className="event-cartelera-card__dot">·</span>}
                  {timePart && <span>{timePart}</span>}
                </div>
                {lugarLine ? (
                  <div className="event-cartelera-card__place" title={lugarLine}>
                    {lugarLine}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {primaryProfileLine ? (
                  <div className="event-cartelera-card__meta">
                    <span title={primaryProfileLine}>{primaryProfileLine}</span>
                  </div>
                ) : null}
                {secondaryProfileLine ? (
                  <div className="event-cartelera-card__place" title={secondaryProfileLine}>
                    {secondaryProfileLine}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </article>
    </LiveLink>
  );
}

const MemoizedExploreEntityCarteleraCard = React.memo(ExploreEntityCarteleraCard);

export default MemoizedExploreEntityCarteleraCard;
