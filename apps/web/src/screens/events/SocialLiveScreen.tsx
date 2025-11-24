import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEventParent } from "../../hooks/useEventParent";
import { useEventDatesByParent } from "../../hooks/useEventDate";
import { useAuth } from '@/contexts/AuthProvider';
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ShareLink from '../../components/ShareLink';
import ImageWithFallback from "../../components/ImageWithFallback";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function SocialLiveScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socialId = parseInt(id || '0');
  
  const { data: social, isLoading } = useEventParent(socialId);
  const { data: dates } = useEventDatesByParent(socialId);
  const { data: allTags } = useTags();
  
  // Verificar si el usuario puede editar este social
  const canEdit = social?.organizer_id && user?.id && 
    social.organizer_id === parseInt(user.id);

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !social?.estilos) return [];
    return social.estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !social?.zonas) return [];
    return social.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!social) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Social no encontrado</h1>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            El social que buscas no existe o ha sido eliminado
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Volver al inicio
          </motion.button>
        </div>
      </div>
    );
  }

  // Slider responsivo de flyers de fechas
  const DateFlyerSlider: React.FC<{ items: any[]; onOpen: (href: string) => void }> = ({ items, onOpen }) => {
    const [idx, setIdx] = React.useState(0);
    if (!items?.length) return null;
    const ev = items[idx % items.length];
    return (
      <div style={{ display: 'grid', placeItems: 'center', gap: '0.75rem' }}>
        <style>{`
          @media (max-width: 640px) {
            .dfs-wrap { width: 100% !important; max-width: 100% !important; }
            .dfs-controls { width: 100% !important; }
          }
        `}</style>
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onOpen(ev.href)}
          style={{ position: 'relative', borderRadius: 16, cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
          className="dfs-wrap"
        >
          <div style={{ width: 360, maxWidth: '85vw' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'rgba(0,0,0,0.25)' }}>
              {ev.flyer && (
                <img src={ev.flyer} alt={ev.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px', background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)', color: '#fff' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 6, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{ev.nombre}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.85rem' }}>
                  {ev.date && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>📅 {ev.date}</span>}
                  {ev.time && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>🕒 {ev.time}</span>}
                  {ev.place && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>📍 {ev.place}</span>}
                  {ev.price && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>💰 {ev.price}</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {items.length > 1 && (
          <div className="dfs-controls" style={{ width: 360, maxWidth: '85vw', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>‹ Anterior</button>
            <button type="button" onClick={() => setIdx((p) => (p + 1) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>Siguiente ›</button>
          </div>
        )}
      </div>
    );
  };

  const dateItems = (dates || []).map((d: any) => {
    const hora = d.hora_inicio && d.hora_fin ? `${fmtTime(d.hora_inicio)} - ${fmtTime(d.hora_fin)}` : (d.hora_inicio ? fmtTime(d.hora_inicio) : undefined);
    const flyer = (d as any).flyer_url || (Array.isArray(d.media) && d.media.length > 0 ? ((d.media[0] as any)?.url || d.media[0]) : undefined);
    const price = (() => {
      const costos = (d as any)?.costos;
      if (Array.isArray(costos) && costos.length) {
        const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
        if (nums.length) { const min = Math.min(...(nums as number[])); return min >= 0 ? `$${min.toLocaleString()}` : undefined; }
      }
      return undefined;
    })();
    return { nombre: d.nombre || social.nombre, date: fmtDate(d.fecha), time: hora, place: d.lugar || d.ciudad || '', flyer, price, href: `/social/fecha/${d.id}` };
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      color: colors.light,
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            background: `linear-gradient(135deg, ${colors.coral}, ${colors.blue})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
          }}>
            {social.nombre}
          </h1>
          
          {social.descripcion && (
            <p style={{
              fontSize: '1.2rem',
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}>
              {social.descripcion}
            </p>
          )}

          {/* Botones de acción */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}>
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/social/${socialId}/edit`)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ✏️ Editar Social
              </motion.button>
            )}
            
            <ShareLink url={window.location.href} />
          </div>
        </motion.div>

        {/* Información del Social */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}
        >
          {/* Ritmos */}
          {getRitmoNombres().length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🎵 Ritmos
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getRitmoNombres().map((ritmo, index) => (
                  <Chip key={index} label={ritmo} />
                ))}
              </div>
            </div>
          )}

          {/* Zonas */}
          {getZonaNombres().length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                📍 Zonas
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getZonaNombres().map((zona, index) => (
                  <Chip key={index} label={zona} />
                ))}
              </div>
            </div>
          )}

          {/* Sede General */}
          {social.sede_general && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🏢 Sede General
              </h3>
              <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
                {social.sede_general}
              </p>
            </div>
          )}
        </motion.div>

        {/* FAQ */}
        {social.faq && Array.isArray(social.faq) && social.faq.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              ❓ Preguntas Frecuentes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {social.faq.map((faq: any, index: number) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: colors.light,
                  }}>
                    ❓ {faq.q}
                  </h4>
                  <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    lineHeight: 1.4,
                  }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Fechas del Social */}
        {dates && dates.length > 0 && (() => {
          // Filtrar fechas disponibles (desde hoy en adelante) y pasadas (del día anterior hacia atrás)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const parseLocalYmd = (value: string) => {
            const plain = String(value).split('T')[0];
            const [y, m, d] = plain.split('-').map((n) => parseInt(n, 10));
            if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
              const fallback = new Date(value);
              return Number.isNaN(fallback.getTime()) ? null : fallback;
            }
            return new Date(y, m - 1, d);
          };

          const availableDates = dates.filter((d: any) => {
            try {
              const dateObj = parseLocalYmd(d.fecha);
              if (!dateObj) return false;
              dateObj.setHours(0, 0, 0, 0);
              return dateObj >= today;
            } catch {
              return false;
            }
          });

          const pastDates = dates.filter((d: any) => {
            try {
              const dateObj = parseLocalYmd(d.fecha);
              if (!dateObj) return false;
              dateObj.setHours(0, 0, 0, 0);
              return dateObj < today;
            } catch {
              return false;
            }
          }).sort((a: any, b: any) => {
            // Ordenar fechas pasadas de más reciente a más antigua
            try {
              const dateA = parseLocalYmd(a.fecha);
              const dateB = parseLocalYmd(b.fecha);
              if (!dateA || !dateB) return 0;
              return dateB.getTime() - dateA.getTime();
            } catch {
              return 0;
            }
          });

          const availableDateItems = availableDates.map((d: any) => {
            const hora = d.hora_inicio && d.hora_fin ? `${fmtTime(d.hora_inicio)} - ${fmtTime(d.hora_fin)}` : (d.hora_inicio ? fmtTime(d.hora_inicio) : undefined);
            const flyer = (d as any).flyer_url || (Array.isArray(d.media) && d.media.length > 0 ? ((d.media[0] as any)?.url || d.media[0]) : undefined);
            const price = (() => {
              const costos = (d as any)?.costos;
              if (Array.isArray(costos) && costos.length) {
                const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
                if (nums.length) { const min = Math.min(...(nums as number[])); return min >= 0 ? `$${min.toLocaleString()}` : undefined; }
              }
              return undefined;
            })();
            return { nombre: d.nombre || social.nombre, date: fmtDate(d.fecha), time: hora, place: d.lugar || d.ciudad || '', flyer, price, href: `/social/fecha/${d.id}` };
          });

          const pastDateItems = pastDates.map((d: any) => {
            const hora = d.hora_inicio && d.hora_fin ? `${fmtTime(d.hora_inicio)} - ${fmtTime(d.hora_fin)}` : (d.hora_inicio ? fmtTime(d.hora_inicio) : undefined);
            const flyer = (d as any).flyer_url || (Array.isArray(d.media) && d.media.length > 0 ? ((d.media[0] as any)?.url || d.media[0]) : undefined);
            const price = (() => {
              const costos = (d as any)?.costos;
              if (Array.isArray(costos) && costos.length) {
                const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
                if (nums.length) { const min = Math.min(...(nums as number[])); return min >= 0 ? `$${min.toLocaleString()}` : undefined; }
              }
              return undefined;
            })();
            return { nombre: d.nombre || social.nombre, date: fmtDate(d.fecha), time: hora, place: d.lugar || d.ciudad || '', flyer, price, href: `/social/fecha/${d.id}` };
          });

          return (
            <>
              {/* Fechas Disponibles */}
              {availableDates.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                    📅 Fechas Disponibles
                  </h3>
                  <p style={{ marginBottom: '1.25rem', opacity: 0.7, fontSize: '0.9rem' }}>
                    {availableDates.length} {availableDates.length === 1 ? 'fecha' : 'fechas'} disponible{availableDates.length !== 1 ? 's' : ''}
                  </p>

                  <DateFlyerSlider items={availableDateItems} onOpen={(href: string) => navigate(href)} />
                </motion.section>
              )}

              {/* Fechas Pasadas */}
              {pastDates.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(100, 100, 100, 0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(150, 150, 150, 0.1)',
                    opacity: 0.85,
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700', opacity: 0.9 }}>
                    📜 Fechas Pasadas
                  </h3>
                  <p style={{ marginBottom: '1.25rem', opacity: 0.6, fontSize: '0.9rem' }}>
                    {pastDates.length} {pastDates.length === 1 ? 'fecha' : 'fechas'} pasada{pastDates.length !== 1 ? 's' : ''}
                  </p>

                  <DateFlyerSlider items={pastDateItems} onOpen={(href: string) => navigate(href)} />
                </motion.section>
              )}
            </>
          );
        })()}

        {/* Media */}
        {social.media && Array.isArray(social.media) && social.media.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📸 Galería
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {social.media.map((url: string, index: number) => (
                <ImageWithFallback
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
