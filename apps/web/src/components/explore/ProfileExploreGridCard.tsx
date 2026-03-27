import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { useTags } from "@/hooks/useTags";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { toDirectPublicStorageUrl, logCardImage } from "@/utils/imageOptimization";
import { withStableCacheBust } from "@/utils/cacheBuster";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import "./EventSocialGridCard.css";

export type ProfileExploreGridVariant = "academy" | "teacher" | "dancer" | "organizer";

export type ProfileExploreGridCardProps = {
  variant: ProfileExploreGridVariant;
  item: any;
  priority?: boolean;
};

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
  return raw ? toDirectPublicStorageUrl(raw) ?? undefined : undefined;
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

function profileHref(variant: ProfileExploreGridVariant, item: any): string {
  if (variant === "academy") return urls.academyLive(item.id);
  if (variant === "teacher") return urls.teacherLive(item.id);
  if (variant === "dancer") return urls.userLive(String(item.user_id ?? item.id));
  return urls.organizerLive(item.id);
}

function profileTitle(variant: ProfileExploreGridVariant, item: any): string {
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
}

function ritmoLabels(item: any, allTags: any[] | undefined): string[] {
  try {
    const labelByCatalogId = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => labelByCatalogId.set(i.id, i.label)));
    const catalogIds = (item.ritmosSeleccionados || item.ritmos_seleccionados || []) as string[];
    if (Array.isArray(catalogIds) && catalogIds.length > 0) {
      return catalogIds.map((id) => labelByCatalogId.get(id)!).filter(Boolean) as string[];
    }
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
}

/**
 * Misma estructura y clases CSS que `ClassExploreGridCard` / `EventSocialGridCard` (carrusel Explore).
 */
export default function ProfileExploreGridCard({ variant, item, priority = false }: ProfileExploreGridCardProps) {
  const { t } = useTranslation();
  const { data: allTags } = useTags() as any;
  const href = React.useMemo(() => profileHref(variant, item), [variant, item]);

  const rawImg = React.useMemo(() => {
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
    "";

  const imageUrlFinal = React.useMemo(
    () => withStableCacheBust(rawImg, cacheKey || null) || rawImg,
    [rawImg, cacheKey]
  );

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;

  const title = profileTitle(variant, item);
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((tag: any) => tag.id === zid && tag.tipo === "zona")?.nombre)
    .filter(Boolean);

  const ritmos = ritmoLabels(item, allTags);
  const ritmoMeta = ritmos.slice(0, 2).join(" · ");
  const zonaMeta = zonaNombres.slice(0, 2).join(" · ");
  const metaMain = ritmoMeta || zonaMeta;

  const bioRaw = String(item.bio || "")
    .replace(/\s+/g, " ")
    .trim();
  const bioLong = bioRaw.length > 72;
  const bioSnippet = bioRaw.slice(0, 72);

  let placeRow: { text: string; withPin: boolean } | null = null;
  if (ritmoMeta && zonaNombres[0]) placeRow = { text: zonaNombres[0], withPin: true };
  else if (!ritmoMeta && zonaMeta) {
    if (bioSnippet) placeRow = { text: `${bioSnippet}${bioLong ? "…" : ""}`, withPin: false };
  } else if (zonaNombres[0]) placeRow = { text: zonaNombres[0], withPin: true };
  else if (bioSnippet) placeRow = { text: `${bioSnippet}${bioLong ? "…" : ""}`, withPin: false };

  const accentLine =
    variant === "academy"
      ? t("explore_grid_badge_academy")
      : variant === "teacher"
        ? t("explore_grid_badge_teacher")
        : variant === "dancer"
          ? t("explore_grid_badge_dancer")
          : t("explore_grid_badge_organizer");

  const logKind =
    variant === "academy" ? "academia" : variant === "teacher" ? "maestro" : variant === "dancer" ? "usuario" : "organizador";
  logCardImage(logKind, item.id ?? item.user_id ?? title, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

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
          {metaMain ? (
            <div className="event-social-grid-card__line event-social-grid-card__line--meta">
              <span>{metaMain}</span>
            </div>
          ) : null}
          {placeRow ? (
            <div
              className="event-social-grid-card__line event-social-grid-card__line--place"
              title={placeRow.withPin ? placeRow.text : item.bio}
            >
              {placeRow.withPin ? `📍 ${placeRow.text}` : placeRow.text}
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
