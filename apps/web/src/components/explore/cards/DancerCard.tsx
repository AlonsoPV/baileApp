import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { useTags } from "../../../hooks/useTags";
import { supabase } from "../../../lib/supabase";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
import { normalizeAndOptimizeUrl, optimizeSupabaseImageUrl, logCardImage } from "../../../utils/imageOptimization";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";
// no se usa urls.userLive, pedimos navegar a /app/profile con query

type DancerItem = {
  id?: string;
  display_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  portada_url?: string | null;
  media?: Array<{ url?: string; path?: string; slot?: string } | string>;
  ritmos?: number[];
  ritmosSeleccionados?: string[]; // por catálogo
  zonas?: number[];
};

interface Props {
  item: DancerItem;
  to?: string; // ruta opcional; si no existe ruta pública, usa '#'
}

export default function DancerCard({ item, to }: Props) {
  const { data: allTags } = useTags() as any;

  // Convierte rutas tipo "bucket/path/to/file" a URL pública de Supabase y luego la optimiza
  const toSupabasePublicUrl = (maybePath?: string): string | undefined => {
    if (!maybePath) return undefined;
    const v = String(maybePath).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('/')) {
      // Si ya es una URL completa, optimizarla directamente
      return optimizeSupabaseImageUrl(v) || v;
    }
    const slash = v.indexOf('/');
    if (slash > 0) {
      const bucket = v.slice(0, slash);
      const path = v.slice(slash + 1);
      try {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = data.publicUrl || v;
        // Optimizar la URL pública
        return optimizeSupabaseImageUrl(publicUrl) || publicUrl;
      } catch {
        return v;
      }
    }
    return v;
  };

  // Resolver imagen de portada del usuario (prioriza banner/portada, luego avatar, luego media[0])
  const coverUrl: string | undefined = (() => {
    const direct = item.banner_url || item.portada_url || item.avatar_url;
    if (direct) return toSupabasePublicUrl(normalizeAndOptimizeUrl(direct as string) as string);
    const media = Array.isArray(item.media) ? item.media : [];
    if (media.length) {
      const bySlot: any = media.find((m: any) => m?.slot === 'cover' || m?.slot === 'p1' || m?.slot === 'avatar');
      if (bySlot?.url) return toSupabasePublicUrl(normalizeAndOptimizeUrl(bySlot.url as string) as string);
      if (bySlot?.path) return toSupabasePublicUrl(normalizeAndOptimizeUrl(bySlot.path as string) as string);
      const first = media[0] as any;
      return toSupabasePublicUrl(normalizeAndOptimizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined)) as string | undefined);
    }
    return undefined;
  })();

  // Cache-busting para la portada del usuario (dancer)
  const coverCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | undefined) ||
    (item.display_name as string | undefined) ||
    '';

  const coverUrlWithCacheBust = React.useMemo(() => {
    if (!coverUrl) return undefined;
    const separator = String(coverUrl).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(coverCacheKey ?? ''));
    return `${coverUrl}${separator}_t=${key}`;
  }, [coverUrl, coverCacheKey]);

  const [imageError, setImageError] = React.useState(false);
  const imageUrlFinal = coverUrlWithCacheBust || coverUrl;
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;
  const placeholderReason = !coverUrl ? 'URL vacía' : imageError ? 'Image load failed' : '';
  logCardImage('dancer', item.id, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? 'URL vacía' : undefined);

  const name = item.display_name || "Dancer";
  const bio = item.bio || "";

  // Tags de ritmos via ids numéricos o catálogo seleccionado
  const ritmoNames: string[] = React.useMemo(() => {
    try {
      const fromCatalog = (item.ritmosSeleccionados || []) as string[];
      if (Array.isArray(fromCatalog) && fromCatalog.length > 0) {
        const mapSlugToLabel = new Map<string, string>();
        RITMOS_CATALOG.forEach(group =>
          group.items.forEach(entry => mapSlugToLabel.set(entry.id, entry.label))
        );
        return fromCatalog
          .map((slug) => mapSlugToLabel.get(slug) || slug)
          .filter(Boolean) as string[];
      }
      const fromNums = (item.ritmos || []) as number[];
      if (Array.isArray(allTags) && fromNums.length > 0) {
        return fromNums
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  const zonaNames: string[] = React.useMemo(() => {
    try {
      const ids: number[] = (item.zonas || []) as number[];
      if (Array.isArray(allTags) && ids.length > 0) {
        return ids
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'zona'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  const href = to || (item.id ? `/u/${encodeURIComponent(String(item.id))}` : '#');

  return (
    <>
      <style>{EXPLORE_CARD_STYLES}</style>
      <LiveLink to={href} asCard={false}>
        <motion.article
          className="explore-card explore-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="explore-card-media"
            style={{
              '--img': imageUrlFinal && !imageError ? `url(${imageUrlFinal})` : undefined,
            } as React.CSSProperties}
          >
            {showPlaceholder && (
              <div className="explore-card-media-placeholder" data-reason={placeholderReason} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {imageUrlFinal && !imageError && (
              <img
                src={imageUrlFinal}
                alt={`Imagen de ${name}`}
                loading="lazy"
                decoding="async"
                onLoad={() => { logCardImage('dancer', item.id, imageUrlFinal, true, 'load'); setImageError(false); }}
                onError={(e) => {
                  const msg = (e.nativeEvent as unknown as { message?: string })?.message ?? 'Image load failed';
                  console.warn('[CardImageError] type=dancer id=', item.id, 'uri=', imageUrlFinal?.slice(0, 80), 'error=', msg);
                  setImageError(true);
                }}
              />
            )}

            <div className="explore-card-actions">
              <div className="explore-card-cta">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="explore-card-content">
            <h3 className="explore-card-title">{name}</h3>
            {bio && <p className="explore-card-subtitle">{bio}</p>}

            <div className="explore-card-meta">
              {zonaNames.slice(0, 1).map((z: string, i: number) => (
                <div key={`z-${i}`} className="explore-card-tag">📍 {z}</div>
              ))}
              {ritmoNames.slice(0, 1).map((r: string, i: number) => (
                <div key={`r-${i}`} className="explore-card-tag">🎵 {r}</div>
              ))}
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}


