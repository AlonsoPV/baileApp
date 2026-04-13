import React from "react";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { useTags } from "@/hooks/useTags";
import { toDirectPublicStorageUrl } from "@/utils/imageOptimization";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { ritmoLabelsFromMap, zonaNamesFromMap, type ExploreTagMaps } from "@/utils/exploreTagMaps";
import "./EventSocialGridCard.css";

export type ProfileExploreGridVariant = "academy" | "teacher" | "dancer" | "organizer";

export type ProfileExploreGridCardProps = {
  variant: ProfileExploreGridVariant;
  item: any;
  priority?: boolean;
  tagMaps?: ExploreTagMaps;
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
  return [];
}

/**
 * Misma estructura y clases CSS que `ClassExploreGridCard` / `EventSocialGridCard` (carrusel Explore).
 */
function ProfileExploreGridCard({ variant, item, priority = false, tagMaps }: ProfileExploreGridCardProps) {
  const { data: allTags } = useTags(undefined, { enabled: !tagMaps }) as any;
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

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [rawImg, cacheKey]);
  const showPlaceholder = !rawImg || imageError;

  const title = profileTitle(variant, item);
  const zonaNombres = React.useMemo(
    () =>
      tagMaps
        ? zonaNamesFromMap(item.zonas, tagMaps.zonaById)
        : ((item.zonas || [])
            .map((zid: number) => allTags?.find((tag: any) => tag.id === zid && tag.tipo === "zona")?.nombre)
            .filter(Boolean) as string[]),
    [allTags, item.zonas, tagMaps],
  );

  const ritmos = React.useMemo(
    () => (tagMaps ? ritmoLabelsFromMap(item, tagMaps.ritmoById) : ritmoLabels(item, allTags)),
    [allTags, item, tagMaps],
  );
  const primaryZone = zonaNombres[0] || "";
  const primaryRhythm = ritmos[0] || "";

  const bioRaw = String(item.bio || "")
    .replace(/\s+/g, " ")
    .trim();
  const bioSnippet = bioRaw.slice(0, 72);
  const primaryLine = primaryZone || primaryRhythm || (bioSnippet ? `${bioSnippet}${bioRaw.length > 72 ? "…" : ""}` : "");
  const secondaryLine =
    primaryZone && primaryRhythm
      ? primaryRhythm
      : primaryZone || primaryRhythm
        ? bioSnippet
          ? `${bioSnippet}${bioRaw.length > 72 ? "…" : ""}`
          : ""
        : "";

  return (
    <LiveLink to={href} asCard={false}>
      <article className="event-social-grid-card">
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
            <ExploreResponsiveImage
              rawUrl={rawImg}
              cacheVersion={cacheKey || null}
              preset="carouselCard"
              alt={title}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="event-social-grid-card__body">
          <h3 className="event-social-grid-card__title">{title}</h3>
          {primaryLine ? (
            <div className="event-social-grid-card__line event-social-grid-card__line--meta">
              <span>{primaryLine}</span>
            </div>
          ) : null}
          {secondaryLine ? (
            <div
              className="event-social-grid-card__line event-social-grid-card__line--place"
              title={secondaryLine}
            >
              {secondaryLine}
            </div>
          ) : null}
        </div>
      </article>
    </LiveLink>
  );
}

const MemoizedProfileExploreGridCard = React.memo(ProfileExploreGridCard);

export default MemoizedProfileExploreGridCard;
