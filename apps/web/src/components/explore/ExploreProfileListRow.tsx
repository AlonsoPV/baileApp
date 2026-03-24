import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { useTags } from "@/hooks/useTags";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { toDirectPublicStorageUrl, logCardImage } from "@/utils/imageOptimization";
import { withStableCacheBust } from "@/utils/cacheBuster";
import "@/components/explore/EventListRow.css";

export type ExploreProfileListVariant = "academy" | "teacher" | "dancer" | "organizer";

export type ExploreProfileListRowProps = {
  variant: ExploreProfileListVariant;
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

export default function ExploreProfileListRow({ variant, item, priority = false }: ExploreProfileListRowProps) {
  const { data: allTags } = useTags() as any;

  const title = React.useMemo(() => {
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
    if (variant === "teacher") {
      return item.nombre_publico || item.teacher_name || item.nombre || item.name || "Maestr@";
    }
    if (variant === "dancer") {
      return item.display_name || item.nombre_publico || item.nombre || "Bailarín";
    }
    return item.nombre_publico || item.nombre || "Organizador";
  }, [item, variant]);

  const href = React.useMemo(() => {
    if (variant === "academy") return urls.academyLive(item.id);
    if (variant === "teacher") return urls.teacherLive(item.id);
    if (variant === "dancer") {
      const uid = item.user_id ?? item.id;
      return urls.userLive(String(uid));
    }
    return urls.organizerLive(item.id);
  }, [item.id, item.user_id, variant]);

  const rawImg = React.useMemo(() => {
    if (variant === "academy") return resolveAcademyImage(item);
    if (variant === "teacher") return resolveTeacherImage(item);
    if (variant === "dancer") return resolveDancerImage(item);
    return resolveOrganizerImage(item);
  }, [item, variant]);

  const cacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.user_id as string | undefined) ||
    "";

  const imageUrlFinal = React.useMemo(
    () => withStableCacheBust(rawImg, cacheKey || null) || rawImg,
    [rawImg, cacheKey]
  );

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;

  const logKind =
    variant === "academy" ? "academia" : variant === "teacher" ? "maestro" : variant === "dancer" ? "usuario" : "organizador";
  logCardImage(logKind, item.id ?? item.user_id, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === "zona")?.nombre)
    .filter(Boolean);

  const bioSnippet = (item.bio || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return (
    <LiveLink to={href} asCard={false}>
      <motion.article
        className="event-list-row"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        whileTap={{ scale: 0.985 }}
      >
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
        <div className="event-list-row__main">
          <h3 className="event-list-row__title">{title}</h3>
          {bioSnippet ? (
            <div className="event-list-row__setlist" title={item.bio}>
              {bioSnippet}
              {(item.bio || "").length > 120 ? "…" : ""}
            </div>
          ) : null}
          {zonaNombres.length > 0 ? (
            <div className="event-list-row__meta">
              <span title={zonaNombres.join(", ")}>📍 {zonaNombres.slice(0, 3).join(", ")}</span>
            </div>
          ) : null}
        </div>
        <div className="event-list-row__chevron" aria-hidden>
          <ChevronRight strokeWidth={2} />
        </div>
      </motion.article>
    </LiveLink>
  );
}
