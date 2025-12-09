import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
import { getMediaBySlot } from "../../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../../utils/mediaSlots";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";

interface AcademyCardProps {
  item: any;
}

export default function AcademyCard({ item }: AcademyCardProps) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  // Nombre robusto: aceptar múltiples campos antes de caer en el fallback
  const nombre =
    item.nombre_publico ||
    item.academy_name ||
    item.display_name ||
    item.nombre_academia ||
    item.nombre ||
    item.name ||
    "Academia";
  const bio = item.bio || "";
  const mediaList = Array.isArray(item?.media) ? (item.media as MediaSlotItem[]) : [];
  const primaryAvatar =
    normalizeAndOptimizeUrl(
      getMediaBySlot(mediaList, 'p1')?.url ||
      getMediaBySlot(mediaList, 'cover')?.url ||
      item.avatar_url ||
      item.portada_url ||
      (mediaList[0] as any)?.url ||
      (mediaList[0] as any)?.path
    ) || null;

  // Cache-busting para la portada de la academia
  const avatarCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const primaryAvatarWithCacheBust = React.useMemo(() => {
    if (!primaryAvatar) return null;
    const separator = String(primaryAvatar).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(avatarCacheKey ?? ''));
    return `${primaryAvatar}${separator}_t=${key}`;
  }, [primaryAvatar, avatarCacheKey]);

  // Mapear ritmos por catálogo (ritmos_seleccionados) o por ids numéricos (ritmos/estilos)
  const ritmoNombres: string[] = (() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
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
      <style>{`
        .academy-card-mobile {
          width: 100%;
        }
        @media (max-width: 768px) {
          .academy-card-mobile {
            aspect-ratio: 9 / 16 !important;
            height: auto !important;
            min-height: auto !important;
            max-width: calc((9 / 16) * 100vh);
            margin: 0 auto;
          }
          .academy-card-mobile[style*="background"] {
            background-size: contain !important;
            background-position: center center !important;
          }
        }
      `}</style>
      <LiveLink to={urls.academyLive(id)} asCard={false}>
        <motion.div
          className="academy-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: (primaryAvatarWithCacheBust || primaryAvatar)
            ? `url(${primaryAvatarWithCacheBust || primaryAvatar})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '350px',
          height: '350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />

        {/* Overlay global solo si NO hay banner */}
        {!primaryAvatar && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}

        {/* Overlay para mejorar legibilidad del nombre cuando hay imagen */}
        {primaryAvatar && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
            
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
          }}>
            <span style={{
              flex: 1,
              color: 'white',
              textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px',
              wordBreak: 'break-word',
              lineHeight: 1.3
            }}>
              {nombre}
            </span>
          </div>
        </div>

        {zonaNombres.length > 0 && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {zonaNombres.slice(0, 2).map((name: string, i: number) => (
              <span key={`z-${i}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>📍 {name}</span>
            ))}
          </div>
        )}
        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
      </LiveLink>
    </>
  );
}
