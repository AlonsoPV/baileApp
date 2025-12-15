import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";

type Props = { item: any };

export default function BrandCard({ item }: Props) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  const nombre = item.nombre_publico || item.nombre || "Marca";
  const bio = item.bio || "";
  const cover = normalizeAndOptimizeUrl((item.portada_url)
    || (Array.isArray(item.media) ? ((item.media[0] as any)?.url || (item.media[0] as any)?.path || (item.media[0] as any)) : undefined)
    || item.avatar_url || undefined) as string | undefined;
  const ritmoNombres: string[] = (item.ritmos || [])
    .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
    .filter(Boolean);
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
              '--img': (coverWithCacheBust || cover) ? `url(${coverWithCacheBust || cover})` : undefined,
            } as React.CSSProperties}
          >
            {(coverWithCacheBust || cover) && (
              <img
                src={coverWithCacheBust || cover}
                alt={`Imagen de ${nombre}`}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          <div className="explore-card-content">
            <h3 className="explore-card-title">{nombre}</h3>
            {bio && <p className="explore-card-subtitle">{bio}</p>}

            <div className="explore-card-meta">
              <div className="explore-card-tag">🏷️ Marca</div>
              {zonaNombres.slice(0, 1).map((z: string, i: number) => (
                <div key={`z-${i}`} className="explore-card-tag">📍 {z}</div>
              ))}
              {ritmoNombres.slice(0, 1).map((r: string, i: number) => (
                <div key={`r-${i}`} className="explore-card-tag">🎵 {r}</div>
              ))}
            </div>

            <div className="explore-card-actions">
              <div className="explore-card-cta">Ver perfil</div>
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}


