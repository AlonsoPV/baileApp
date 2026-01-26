import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { getMediaBySlot } from "../../../utils/mediaSlots";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";

export default function TeacherCard({ item }: { item: any }) {
  const { data: allTags } = useTags() as any;

  // Nombre robusto: aceptar múltiples campos antes de caer en el fallback
  const displayName =
    item.nombre_publico ||
    item.teacher_name ||
    item.nombre ||
    item.name ||
    "Maestr@";

  // Resolver una URL de imagen robusta (avatar/banner/primer media o por slot)
  const bannerUrl: string | undefined = (() => {
    
    const mediaList = Array.isArray(item?.media) ? item.media : [];
    const slotP1 = getMediaBySlot(mediaList as any, 'p1');
    if (slotP1?.url) {
      return normalizeAndOptimizeUrl(slotP1.url as string) as string;
    }
    // Intentar múltiples claves comunes
    const direct = item?.avatar_url || item?.banner_url || item?.portada_url || item?.avatar || item?.portada || item?.banner;
    
    if (direct) {
      return normalizeAndOptimizeUrl(direct as string) as string;
    }
   
    if (mediaList.length) {
      // Buscar por slot común
      const bySlot = mediaList.find((m: any) => m?.slot === 'cover' || m?.slot === 'avatar');
      
      if (bySlot?.url) {
        return normalizeAndOptimizeUrl(bySlot.url as string) as string;
      }
      if (bySlot?.path) {
        return normalizeAndOptimizeUrl(bySlot.path as string) as string;
      }
      const first = mediaList[0];
      return normalizeAndOptimizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined)) as string | undefined;
    }
    
    return undefined;
  })();

  // Cache-busting para la portada del maestro
  const bannerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const bannerUrlWithCacheBust = React.useMemo(() => {
    if (!bannerUrl) return undefined;
    const separator = String(bannerUrl).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(bannerCacheKey ?? ''));
    return `${bannerUrl}${separator}_t=${key}`;
  }, [bannerUrl, bannerCacheKey]);

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
  return (
    <>
      <style>{EXPLORE_CARD_STYLES}</style>
      <LiveLink to={urls.teacherLive(item.id)} asCard={false}>
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
              '--img': (bannerUrlWithCacheBust || bannerUrl) ? `url(${bannerUrlWithCacheBust || bannerUrl})` : undefined,
            } as React.CSSProperties}
          >
            {(bannerUrlWithCacheBust || bannerUrl) && (
              <img
                src={bannerUrlWithCacheBust || bannerUrl}
                alt={`Imagen de ${displayName}`}
                loading="lazy"
                decoding="async"
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
            <h3 className="explore-card-title">{displayName}</h3>
            {item.bio && <p className="explore-card-subtitle">{item.bio}</p>}

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

