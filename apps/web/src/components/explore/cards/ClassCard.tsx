import React from 'react';
import { motion } from 'framer-motion';
import LiveLink from '../../LiveLink';
import { urls } from '../../../lib/urls';
import { useTags } from '../../../hooks/useTags';
import { RITMOS_CATALOG } from '../../../lib/ritmosCatalog';
import { normalizeAndOptimizeUrl } from '../../../utils/imageOptimization';

type ClaseItem = {
  titulo?: string;
  fecha?: string; // YYYY-MM-DD si específica
  diasSemana?: string[]; // si semanal
  diaSemana?: number; // día específico (0-6) para clases expandidas con múltiples días
  inicio?: string; // HH:MM
  fin?: string;    // HH:MM
  ubicacion?: string;
  ownerType?: 'academy' | 'teacher';
  ownerId?: number | string;
  ownerName?: string;
  ownerCoverUrl?: string;
  ritmos?: number[];
  ritmosSeleccionados?: string[];
  cronogramaIndex?: number; // Índice original en el cronograma
};

interface Props {
  item: ClaseItem;
  /** En sliders/grids, hace que el card llene la altura del item para igualar alturas con CTA cards */
  fillHeight?: boolean;
}

const cardBase: React.CSSProperties = {
  position: 'relative',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: 'clamp(18px, 4vw, 22px)',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.03)',
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
  cursor: 'pointer',
  color: '#EAF0FF',
  display: 'flex',
  flexDirection: 'column',
  // Evitar que el card se estire a la altura del row del grid (esto genera espacios enormes)
  // Queremos altura proporcional al contenido (poster + sheet + CTA)
  height: 'auto',
  alignSelf: 'start',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

const posterWrap: React.CSSProperties = {
  position: 'relative',
  padding: 0,
  background: 'radial-gradient(900px 400px at 50% 0%, rgba(255,79,123,.14), transparent 60%), radial-gradient(700px 380px at 60% 100%, rgba(249,115,22,.12), transparent 55%), rgba(255,255,255,.02)'
};

const badgeRow: React.CSSProperties = {
  position: 'absolute',
  top: 'clamp(10px, 2.5vw, 14px)',
  left: 'clamp(10px, 2.5vw, 14px)',
  display: 'flex',
  gap: 'clamp(6px, 1.5vw, 8px)',
  zIndex: 3
};

const badge: React.CSSProperties = {
  fontSize: 'clamp(10px, 2vw, 11px)',
  fontWeight: 800,
  padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 10px)',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(14,18,30,.55)',
  backdropFilter: 'blur(10px)',
  letterSpacing: '.2px',
  color: '#EAF0FF'
};

const posterFrame: React.CSSProperties = {
  borderRadius: '18px 18px 0 0',
  overflow: 'hidden',
  border: 'none',
  background: 'rgba(0,0,0,.22)',
  aspectRatio: '16 / 11',
  position: 'relative',
  flexShrink: 0
};

const sheet: React.CSSProperties = {
  padding: 'clamp(12px, 2.5vw, 14px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(8px, 2vw, 10px)',
  flex: 1,
  minHeight: 0
};

const topLine: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '10px'
};

const titleBox: React.CSSProperties = {
  minWidth: 0,
  flex: 1
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(14px, 2.5vw, 16px)',
  fontWeight: 900,
  letterSpacing: '.2px',
  lineHeight: 1.15,
  color: '#EAF0FF',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const subtitle: React.CSSProperties = {
  margin: 'clamp(4px, 1vw, 6px) 0 0',
  fontSize: 'clamp(11px, 2vw, 12px)',
  color: 'rgba(234,240,255,.65)',
  display: 'flex',
  gap: 'clamp(6px, 1.5vw, 8px)',
  alignItems: 'center',
  overflowWrap: 'break-word',
  lineHeight: 1.4
};

const metaRow: React.CSSProperties = {
  display: 'flex',
  gap: 'clamp(6px, 1.5vw, 8px)',
  flexWrap: 'wrap',
  alignItems: 'center'
};

const meta: React.CSSProperties = {
  fontSize: 'clamp(11px, 2vw, 12px)',
  color: 'rgba(234,240,255,.86)',
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.10)',
  padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 10px)',
  borderRadius: '999px',
  display: 'inline-flex',
  gap: 'clamp(6px, 1.5vw, 8px)',
  alignItems: 'center',
  whiteSpace: 'nowrap'
};

const actions: React.CSSProperties = {
  display: 'flex',
  gap: 'clamp(8px, 2vw, 10px)',
  alignItems: 'stretch',
  marginTop: 'auto',
  paddingTop: 'clamp(4px, 1vw, 6px)'
};

const cta: React.CSSProperties = {
  flex: 1,
  border: 'none',
  cursor: 'pointer',
  padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 14px)',
  borderRadius: 'clamp(14px, 3vw, 16px)',
  fontWeight: 900,
  color: '#111',
  background: 'linear-gradient(135deg, #FFD1DD, #FFC38F)',
  fontSize: 'clamp(13px, 2.5vw, 14px)',
  minHeight: '44px',
  touchAction: 'manipulation'
};

const iconBtn: React.CSSProperties = {
  width: 'clamp(42px, 8vw, 46px)',
  height: 'clamp(42px, 8vw, 46px)',
  minWidth: '44px',
  minHeight: '44px',
  borderRadius: 'clamp(14px, 3vw, 16px)',
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(255,255,255,.06)',
  color: '#EAF0FF',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  fontWeight: 900,
  fontSize: 'clamp(16px, 3.5vw, 18px)',
  touchAction: 'manipulation',
  flexShrink: 0,
  alignSelf: 'stretch'
};

const fmtDate = (s?: string) => {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
  } catch {
    return s;
  }
};

export default function ClassCard({ item, fillHeight = false }: Props) {
  const cardStyle = React.useMemo<React.CSSProperties>(() => {
    if (!fillHeight) return cardBase;
    return {
      ...cardBase,
      height: '100%',
      alignSelf: 'stretch',
    };
  }, [fillHeight]);
  const isSemanal = Array.isArray(item.diasSemana) && item.diasSemana.length > 0 && !item.fecha;
  // Construir la ruta correcta: /clase/:type/:id
  // Si hay ownerType y ownerId, usar la ruta con parámetros
  // Si no, usar query params como fallback
  const href = React.useMemo(() => {
    // Construir los query params
    const params = new URLSearchParams();
    
    if (item.cronogramaIndex !== null && item.cronogramaIndex !== undefined) {
      params.set('i', String(item.cronogramaIndex));
    }
    
    // Si hay diaSemana específico (para clases expandidas con múltiples días), incluirlo
    if (typeof item.diaSemana === 'number' && item.diaSemana >= 0 && item.diaSemana <= 6) {
      params.set('dia', String(item.diaSemana));
    }
    
    const queryString = params.toString();
    const queryParam = queryString ? `?${queryString}` : '';
    
    if (item.ownerType && item.ownerId) {
      // Asegurar que ownerId sea un string válido
      const ownerIdStr = String(item.ownerId);
      const route = `/clase/${item.ownerType}/${ownerIdStr}${queryParam}`;
      return route;
    }
    if (item.ownerId) {
      const ownerIdStr = String(item.ownerId);
      if (queryString) {
        params.set('type', item.ownerType || 'teacher');
        params.set('id', ownerIdStr);
        const route = `/clase?${params.toString()}`;
        return route;
      }
      const route = `/clase?type=${item.ownerType || 'teacher'}&id=${ownerIdStr}`;
      return route;
    }
    const route = `/clase?type=${item.ownerType || 'teacher'}`;
    return route;
  }, [item.ownerType, item.ownerId, item.cronogramaIndex, item.diaSemana]);
  const bg = normalizeAndOptimizeUrl(item.ownerCoverUrl as any);
  const { data: allTags } = useTags() as any;

  // Cache-busting para la portada de la clase (owner cover)
  const bgCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.ownerId as string | number | undefined) ||
    (item.titulo as string | undefined) ||
    '';

  const bgWithCacheBust = React.useMemo(() => {
    if (!bg) return undefined;
    const separator = String(bg).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(bgCacheKey ?? ''));
    return `${bg}${separator}_t=${key}`;
  }, [bg, bgCacheKey]);

  // Extraer solo el nombre del lugar (similar a EventCard que usa `lugar`)
  // Si ubicacion contiene información adicional (dirección, ciudad, etc.), extraer solo el nombre
  const lugarNombre = React.useMemo(() => {
    if (!item.ubicacion) return '';
    const ubicacion = String(item.ubicacion).trim();
    // Si contiene separadores comunes, tomar solo la primera parte (el nombre)
    // Ejemplos: "Lugar, Dirección" -> "Lugar", "Lugar · Ciudad" -> "Lugar"
    const separadores = [',', '·', '-', '|'];
    for (const sep of separadores) {
      if (ubicacion.includes(sep)) {
        return ubicacion.split(sep)[0].trim();
      }
    }
    // Si no tiene separadores, devolver tal cual (ya es solo el nombre)
    return ubicacion;
  }, [item.ubicacion]);

  const ritmoNames: string[] = React.useMemo(() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
      const catalogIds = (item.ritmosSeleccionados || []) as string[];
      if (Array.isArray(catalogIds) && catalogIds.length > 0) {
        return catalogIds.map(id => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      }
      const nums = (item.ritmos || []) as number[];
      if (Array.isArray(allTags) && nums.length > 0) {
        return nums
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  // Determinar si es hoy
  const isToday = React.useMemo(() => {
    if (!item.fecha) return false;
    try {
      const today = new Date();
      const eventDate = new Date(item.fecha);
      return today.toDateString() === eventDate.toDateString();
    } catch {
      return false;
    }
  }, [item.fecha]);

  // Formatear fecha para meta
  const formattedDate = React.useMemo(() => {
    if (isSemanal) {
      if (typeof item.diaSemana === 'number') {
        return ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][item.diaSemana] || '';
      }
      return item.diasSemana?.map(d => d.slice(0, 3).toLowerCase()).join(', ') || '';
    }
    if (item.fecha) {
      try {
        const d = new Date(item.fecha);
        const day = d.getDate();
        const month = d.toLocaleDateString('es-ES', { month: 'short' });
        return `${day} ${month}`;
      } catch {
        return fmtDate(item.fecha);
      }
    }
    return '';
  }, [item.fecha, item.diasSemana, item.diaSemana, isSemanal]);

  // Construir URL completa para compartir
  const shareUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${href}`;
  }, [href]);

  // Handler para compartir
  const handleShare = React.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const title = item.titulo || 'Clase';
      const text = `Mira esta clase: ${title}`;
      const navAny = navigator as any;
      
      // Intentar Web Share API (móvil)
      if (navAny?.share && typeof navAny.share === 'function') {
        try {
          await navAny.share({ 
            title, 
            text, 
            url: shareUrl 
          });
          return;
        } catch (shareError: any) {
          // Si el usuario cancela, no hacer nada
          if (shareError?.name === 'AbortError' || shareError?.message?.includes('cancel')) {
            return;
          }
        }
      }
      
      // Fallback: copiar al portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          // Mostrar feedback visual
          const btn = e.currentTarget as HTMLElement;
          const originalText = btn.textContent;
          if (btn) {
            btn.textContent = '✓';
            setTimeout(() => {
              if (btn) btn.textContent = originalText;
            }, 1000);
          }
        } catch (clipError) {
          console.error('Error al copiar:', clipError);
        }
      } else {
        // Fallback antiguo para navegadores sin Clipboard API
        try {
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            const btn = e.currentTarget as HTMLElement;
            const originalText = btn.textContent;
            if (btn) {
              btn.textContent = '✓';
              setTimeout(() => {
                if (btn) btn.textContent = originalText;
              }, 1000);
            }
          }
        } catch (fallbackError) {
          console.error('Error en fallback de copiar:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  }, [shareUrl, item.titulo]);

  return (
    <>
      <style>{`
        .class-card-poster-frame {
          position: relative;
        }
        .class-card-poster-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: ${bgWithCacheBust || bg ? `url(${bgWithCacheBust || bg})` : 'none'};
          background-size: cover;
          background-position: center;
          filter: blur(16px) saturate(1.1);
          transform: scale(1.1);
          opacity: 0.45;
          z-index: 1;
        }
        .class-card-poster-frame img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          /* Importante: evitar que reglas globales pongan cover en mobile */
          object-fit: contain !important;
          object-position: center;
          z-index: 2;
          filter: drop-shadow(0 16px 28px rgba(0,0,0,.50));
          padding: 12px;
        }
        .class-card-v2 {
          /* Evitar stretch vertical por grid; la altura la define el contenido */
          height: auto;
          display: flex;
          flex-direction: column;
          align-self: start;
        }
        
        /* Responsive: Tablet y Desktop */
        @media (min-width: 769px) {
          .class-card-v2 {
            max-width: 100%;
          }
          .class-card-poster-frame {
            aspect-ratio: 16 / 11;
          }
          .class-card-poster-frame img {
            padding: 12px;
          }
        }
        
        /* Responsive: Mobile (max-width: 768px) */
        @media (max-width: 768px) {
          .class-card-v2 {
            max-width: 100%;
            border-radius: clamp(16px, 4vw, 18px);
          }
          .class-card-poster-frame {
            aspect-ratio: 16 / 10;
            border-radius: clamp(14px, 3.5vw, 18px) clamp(14px, 3.5vw, 18px) 0 0;
          }
          .class-card-poster-frame img {
            padding: clamp(8px, 2vw, 10px);
          }
        }
        
        /* Responsive: Mobile pequeño (max-width: 480px) */
        @media (max-width: 480px) {
          .class-card-v2 {
            border-radius: clamp(14px, 3.5vw, 16px);
          }
          .class-card-poster-frame {
            aspect-ratio: 16 / 9;
            border-radius: clamp(12px, 3vw, 14px) clamp(12px, 3vw, 14px) 0 0;
          }
          .class-card-poster-frame img {
            padding: clamp(6px, 1.5vw, 8px);
          }
        }
        
        /* Responsive: Mobile muy pequeño (max-width: 430px) */
        @media (max-width: 430px) {
          .class-card-v2 {
            border-radius: clamp(12px, 3vw, 14px);
          }
          .class-card-poster-frame {
            aspect-ratio: 4 / 3;
            border-radius: clamp(10px, 2.5vw, 12px) clamp(10px, 2.5vw, 12px) 0 0;
          }
          .class-card-poster-frame img {
            padding: clamp(4px, 1vw, 6px);
          }
        }
        
        /* Asegurar que el sheet ocupe el espacio restante */
        .class-card-sheet {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        /* Mejorar distribución de elementos en mobile */
        @media (max-width: 768px) {
          .class-card-sheet {
            padding: clamp(10px, 2vw, 12px);
            gap: clamp(6px, 1.5vw, 8px);
          }
        }
        
        @media (max-width: 480px) {
          .class-card-sheet {
            padding: clamp(8px, 1.8vw, 10px);
            gap: clamp(5px, 1.2vw, 6px);
          }
        }
      `}</style>
      <LiveLink to={href} asCard={false}>
        <motion.article
          className="class-card-v2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={cardStyle}
        >
          {/* Poster Wrap */}
          <div style={posterWrap}>
            {/* Badge Row */}
            {isToday && (
              <div style={badgeRow}>
                <div style={{ ...badge, border: 'none', background: 'linear-gradient(135deg, #FF4F7B, #F97316)', color: '#111' }}>
                  HOY
                </div>
              </div>
            )}

            {/* Poster Frame */}
            <div className="class-card-poster-frame" style={posterFrame}>
              {(bgWithCacheBust || bg) && (
                <img 
                  src={bgWithCacheBust || bg || ''} 
                  alt={item.titulo || 'Clase'}
                />
              )}
            </div>
          </div>

          {/* Sheet - Info */}
          <div style={sheet} className="class-card-sheet">
            {/* Top Line */}
            <div style={topLine}>
              <div style={titleBox}>
                <h3 style={title}>
                  {item.titulo || 'Clase'}
                </h3>
                {lugarNombre && (
                  <p style={subtitle}>
                    📍 {lugarNombre}
                  </p>
                )}
              </div>
            </div>

            {/* Meta Row */}
            <div style={metaRow}>
              {formattedDate && (
                <div style={meta}>
                  🗓️ {formattedDate}
                </div>
              )}
              {(item.inicio || item.fin) && (
                <div style={meta}>
                  🕗 {item.inicio || '—'}{item.fin ? ` - ${item.fin}` : ''}
                </div>
              )}
              {ritmoNames.length > 0 && (
                <div style={meta}>
                  🎵 {ritmoNames.slice(0, 2).join(', ')}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={actions}>
              <button style={cta} onClick={(e) => {
                e.preventDefault();
                window.location.href = href;
              }}>
                Ver detalles
              </button>
              <button 
                style={iconBtn}
                onClick={handleShare}
                aria-label="Compartir"
                title="Compartir"
              >
                📤
              </button>
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}


