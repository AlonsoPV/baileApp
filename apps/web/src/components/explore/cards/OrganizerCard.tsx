import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";

interface OrganizerCardProps {
  item: any;
}

export default function OrganizerCard({ item }: OrganizerCardProps) {
  const bannerUrl: string | undefined = (item.portada_url)
    || (Array.isArray(item.media) ? (item.media[0]?.url || item.media[0]) : undefined)
    || (item.avatar_url);
  const { data: allTags } = useTags();

  const ritmoNames = React.useMemo(() => {
    const ids: number[] = (item?.estilos || item?.ritmos || []) as number[];
    if (!Array.isArray(allTags)) return [] as string[];
    return ids
      .map(id => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
      .filter(Boolean)
      .map((t: any) => t.nombre as string);
  }, [allTags, item]);

  const zonaNames = React.useMemo(() => {
    const ids: number[] = (item?.zonas || []) as number[];
    if (!Array.isArray(allTags)) return [] as string[];
    return ids
      .map(id => allTags.find((t: any) => t.id === id && t.tipo === 'zona'))
      .filter(Boolean)
      .map((t: any) => t.nombre as string);
  }, [allTags, item]);

  return (
    <LiveLink to={urls.organizerLive(item.id)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{
          scale: 1.03,
          y: -8,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: bannerUrl
            ? `url(${bannerUrl})`
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
        {/* Top gradient bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
          opacity: 0.9
        }} />
        {/* Overlay global solo si NO hay banner */}
        {!bannerUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}

        {/* Contenido sobre el fondo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Título con alta legibilidad (igual a EventCard) */}
          <div style={{
            fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
            background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
          }}>
            <span style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {item.nombre_publico}
            </span>
       {/*      {item?.estado_aprobacion === 'aprobado' && (
              <span style={{
                marginLeft: 8,
                border: '1px solid rgb(255 255 255 / 40%)',
                background: 'rgb(25 25 25 / 70%)',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                color: '#9be7a1',
                whiteSpace: 'nowrap'
              }}>
                ✅ Verificado
              </span>
            )} */}
          </div>

          {(ritmoNames.length > 0 || zonaNames.length > 0) && (
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
            </div>
          )}
        </div>
        
        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}

