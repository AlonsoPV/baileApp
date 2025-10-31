import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { useTags } from "../../../hooks/useTags";

type SocialItem = {
  id?: number | string;
  nombre?: string;
  descripcion?: string | null;
  portada_url?: string | null;
  avatar_url?: string | null;
  media?: Array<{ url?: string; slot?: string } | string>;
  ubicaciones?: Array<{ nombre?: string; direccion?: string; ciudad?: string; referencias?: string }>;
  estilos?: number[]; // ritmos ids (como en organizer)
  zonas?: number[];
};

export default function SocialCard({ item }: { item: SocialItem }) {
  const id = item?.id;
  const to = id ? `/social/${id}` : "#";
  const title = item?.nombre || "Social";
  const desc = item?.descripcion || "";
  const { data: allTags } = useTags() as any;

  // Priorizar avatar del social como fondo. Si no hay, usar portada/media del social. Último recurso: portada/media del organizador
  const organizer = (item as any)?.profiles_organizer;
  const avatarFromMedia = Array.isArray(item?.media)
    ? (item!.media!.find((m: any) => typeof m === 'object' && (m as any).slot === 'avatar') as any)
    : undefined;
  const firstSocialMedia = Array.isArray(item?.media)
    ? (((item!.media![0] as any)?.url) || (typeof item!.media![0] === 'string' ? (item!.media![0] as string) : undefined))
    : undefined;
  const organizerCover = (
    organizer?.portada_url
      || (Array.isArray(organizer?.media) && ((organizer.media[0] as any)?.url || (typeof organizer.media[0] === 'string' ? organizer.media[0] : undefined)))
      || organizer?.avatar_url
  ) as string | undefined;
  const cover = (
    (avatarFromMedia?.url as string | undefined)
      || (item?.avatar_url as string | undefined)
      || (item?.portada_url as string | undefined)
      || (firstSocialMedia as string | undefined)
      || organizerCover
  );

  const firstLocation = Array.isArray(item?.ubicaciones) && item!.ubicaciones!.length > 0
    ? item!.ubicaciones![0]
    : undefined;
  const locationLabel = [firstLocation?.nombre, firstLocation?.ciudad || firstLocation?.direccion]
    .filter(Boolean)
    .join(" • ");

  const ritmoNames: string[] = React.useMemo(() => {
    const ids: number[] = (item?.estilos || []) as number[];
    if (!Array.isArray(allTags)) return [] as string[];
    return ids
      .map((id) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
      .filter(Boolean)
      .map((t: any) => t.nombre as string);
  }, [allTags, item]);

  const zonaNames: string[] = React.useMemo(() => {
    const ids: number[] = (item?.zonas || []) as number[];
    if (!Array.isArray(allTags)) return [] as string[];
    return ids
      .map((id) => allTags.find((t: any) => t.id === id && t.tipo === 'zona'))
      .filter(Boolean)
      .map((t: any) => t.nombre as string);
  }, [allTags, item]);

  return (
    <LiveLink to={to} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: cover
            ? `url(${cover})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '280px',
          height: '350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        {/* Overlay siempre presente para legibilidad (como solicitado) */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />

        {/* Contenido similar a OrganizerCard: título con pill oscuro y chips */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
            background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', backgroundClip: 'text',
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
          }}>
            <span style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 14px rgba(0,0,0,0.55)',
              background: 'rgba(0,0,0,0.45)',
              padding: '4px 10px',
              borderRadius: 10,
              boxShadow: '0 2px 10px rgba(0,0,0,0.35)'
            }}>
              {title}
            </span>
          </div>

          {desc && (
            <div style={{ fontSize: 12, marginBottom: 10, color: 'rgba(255,255,255,0.78)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
              {desc}
            </div>
          )}

          {(ritmoNames.length > 0 || zonaNames.length > 0 || locationLabel) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {ritmoNames.slice(0, 3).map((name, i) => (
                <span key={`r-${i}`} style={{
                  border: '1px solid rgb(255 255 255 / 48%)',
                  background: 'rgb(25 25 25 / 89%)',
                  padding: 8,
                  borderRadius: 999,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.92)'
                }}>
                  🎵 {name}
                </span>
              ))}
              {zonaNames.slice(0, 3).map((name, i) => (
                <span key={`z-${i}`} style={{
                  border: '1px solid rgb(255 255 255 / 48%)',
                  background: 'rgb(25 25 25 / 89%)',
                  padding: 8,
                  borderRadius: 999,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.92)'
                }}>
                  📍 {name}
                </span>
              ))}
              {locationLabel && (
                <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 12, color: 'rgba(255,255,255,0.92)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📍 {locationLabel}
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'inline', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Descubre más del social</div>
            <div style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: 'rgba(240, 147, 251, 0.1)',
              color: '#fff',
              margin: '10px 0',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>Ver más →</div>
          </div>
        </div>

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}


