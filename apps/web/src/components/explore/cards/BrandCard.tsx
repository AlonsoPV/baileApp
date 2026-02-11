import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { normalizeAndOptimizeUrl, logCardImage } from "../../../utils/imageOptimization";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";

type Props = { item: any };

export default function BrandCard({ item }: Props) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  const nombre = item.nombre_publico || item.nombre || "Marca";
  const bio = item.bio || "";
  const cover = normalizeAndOptimizeUrl((item.portada_url)
    || (Array.isArray(item.media) ? ((item.media[0] as any)?.url || (item.media[0] as any)?.path || (item.media[0] as any)) : undefined)
    || item.avatar_url || undefined) as string | undefined;
  // Mapear ritmos por catálogo (ritmos_seleccionados) o por ids numéricos (ritmos/estilos)
  const ritmoNombres: string[] = (() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => labelByCatalogId.set(i.id, i.label)));
      const selectedCatalog: string[] = Array.isArray(item?.ritmos_seleccionados) ? item.ritmos_seleccionados : [];
      if (selectedCatalog.length > 0) {
        return selectedCatalog.map((id: string) => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      }
      const ritmoIds: number[] = (item.ritmos && Array.isArray(item.ritmos) ? item.ritmos : (item.estilos && Array.isArray(item.estilos) ? item.estilos : []));
      return (ritmoIds || [])
        .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
        .filter(Boolean);
    } catch {
      return [];
    }
  })();
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);

  // Cache-busting para la portada de la marca
  const coverCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const coverWithCacheBust = React.useMemo(() => {
    if (!cover) return undefined;
    const separator = String(cover).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(coverCacheKey ?? ''));
    return `${cover}${separator}_t=${key}`;
  }, [cover, coverCacheKey]);

  const [imageError, setImageError] = React.useState(false);
  const imageUrlFinal = coverWithCacheBust || cover;
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;
  const placeholderReason = !cover ? 'URL vacía' : imageError ? 'Image load failed' : '';
  logCardImage('marca', id, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? 'URL vacía' : undefined);

  return (
    <>
      <style>{EXPLORE_CARD_STYLES}</style>
      <LiveLink to={urls.brandLive(id)} asCard={false}>
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
                alt={`Imagen de ${nombre}`}
                loading="lazy"
                decoding="async"
                onLoad={() => { logCardImage('marca', id, imageUrlFinal, true, 'load'); setImageError(false); }}
                onError={(e) => {
                  const msg = (e.nativeEvent as unknown as { message?: string })?.message ?? 'Image load failed';
                  console.warn('[CardImageError] type=marca id=', id, 'uri=', imageUrlFinal?.slice(0, 80), 'error=', msg);
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
            <h3 className="explore-card-title">{nombre}</h3>
            {bio && <p className="explore-card-subtitle">{bio}</p>}

            <div className="explore-card-meta">
              {zonaNombres.slice(0, 1).map((z: string, i: number) => (
                <div key={`z-${i}`} className="explore-card-tag">📍 {z}</div>
              ))}
              {ritmoNombres.slice(0, 1).map((r: string, i: number) => (
                <div key={`r-${i}`} className="explore-card-tag">🎵 {r}</div>
              ))}
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}


