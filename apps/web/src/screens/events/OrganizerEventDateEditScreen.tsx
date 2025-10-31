import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEventDate, useUpdateEventDate } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import RitmosChips from "../../components/RitmosChips";
import ChipPicker from "../../components/common/ChipPicker";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OrganizerEventDateEditScreen() {
  const navigate = useNavigate();
  const { dateId } = useParams<{ dateId: string }>();
  const dateIdNum = dateId ? parseInt(dateId) : undefined;

  const { data: date, isLoading } = useEventDate(dateIdNum);
  const updateDate = useUpdateEventDate();
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter((t: any) => t.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter((t: any) => t.tipo === 'zona') || [];

  const { data: myOrg } = useMyOrganizer();
  const allowedCatalogIds = ((myOrg as any)?.ritmos_seleccionados || []) as string[];

  const [form, setForm] = useState({
    nombre: '',
    biografia: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    ciudad: '',
    direccion: '',
    referencias: '',
    requisitos: '',
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: 'borrador' as 'borrador' | 'publicado',
    ubicaciones: [] as any[],
  });

  useEffect(() => {
    if (date) {
      setForm({
        nombre: date.nombre || '',
        biografia: (date as any).biografia || '',
        fecha: date.fecha || '',
        hora_inicio: date.hora_inicio || '',
        hora_fin: date.hora_fin || '',
        lugar: (date as any).lugar || '',
        ciudad: (date as any).ciudad || '',
        direccion: (date as any).direccion || '',
        referencias: (date as any).referencias || '',
        requisitos: (date as any).requisitos || '',
        zona: (date as any).zona || null,
        estilos: (date as any).estilos || [],
        ritmos_seleccionados: ((date as any).ritmos_seleccionados || []) as string[],
        zonas: (date as any).zonas || [],
        cronograma: (date as any).cronograma || [],
        costos: (date as any).costos || [],
        flyer_url: (date as any).flyer_url || null,
        estado_publicacion: (date as any).estado_publicacion || 'borrador',
        ubicaciones: (date as any).ubicaciones || [],
      });
    }
  }, [date]);

  const handleSave = async () => {
    if (!dateIdNum) return;
    const patch = {
      nombre: form.nombre || null,
      biografia: form.biografia || null,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      lugar: form.lugar || null,
      direccion: form.direccion || null,
      ciudad: form.ciudad || null,
      zona: form.zona || null,
      referencias: form.referencias || null,
      requisitos: form.requisitos || null,
      ritmos_seleccionados: form.ritmos_seleccionados || [],
      estilos: form.estilos || [],
      zonas: form.zonas || [],
      cronograma: form.cronograma || [],
      costos: form.costos || [],
      flyer_url: form.flyer_url || null,
      estado_publicacion: form.estado_publicacion || 'borrador',
      ubicaciones: form.ubicaciones || [],
    } as any;

    const updated = await updateDate.mutateAsync({ id: dateIdNum, patch });
    navigate(`/social/fecha/${updated.id}`);
  };

  // Loading
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando fecha...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Fecha no encontrada</h2>
          <button
            onClick={() => navigate('/profile/organizer/edit')}
            style={{
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
            }}
          >
            ← Volver al Organizador
          </button>
        </div>
      </div>
    );
  }

  // ====== UI con la estructura/diseño solicitados ======
  return (
    <>
      <style>{`
        .date-editor-input {
          width: 100%;
          padding: 0.875rem 1.125rem;
          background: rgba(255, 255, 255, 0.12);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 400;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.05);
        }
        
        .date-editor-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
          opacity: 1;
        }
        
        .date-editor-input:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.08);
        }
        
        .date-editor-input:focus {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(30, 136, 229, 0.6);
          outline: none;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.2),
                      0 4px 16px rgba(30, 136, 229, 0.3),
                      inset 0 1px 2px rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        
        .date-editor-textarea {
          width: 100%;
          padding: 0.875rem 1.125rem;
          background: rgba(255, 255, 255, 0.12);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 400;
          resize: vertical;
          min-height: 100px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.05);
          font-family: inherit;
          line-height: 1.6;
        }
        
        .date-editor-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
          opacity: 1;
        }
        
        .date-editor-textarea:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.08);
        }
        
        .date-editor-textarea:focus {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(30, 136, 229, 0.6);
          outline: none;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.2),
                      0 4px 16px rgba(30, 136, 229, 0.3),
                      inset 0 1px 2px rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        
        .date-editor-field {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #FFFFFF;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
        }
        
        input[type="date"].date-editor-input,
        input[type="time"].date-editor-input {
          cursor: pointer;
        }
        
        input[type="date"].date-editor-input::-webkit-calendar-picker-indicator,
        input[type="time"].date-editor-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
          cursor: pointer;
        }
        
        input[type="date"].date-editor-input::-webkit-calendar-picker-indicator:hover,
        input[type="time"].date-editor-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        @media (max-width: 768px) {
          .date-editor-input,
          .date-editor-textarea {
            padding: 0.75rem 1rem;
            font-size: 0.95rem;
            border-radius: 10px;
          }
          
          .date-editor-field {
            font-size: 0.9rem;
            margin-bottom: 0.625rem;
          }
        }
        
        @media (max-width: 480px) {
          .date-editor-input,
          .date-editor-textarea {
            padding: 0.625rem 0.875rem;
            font-size: 0.9rem;
            border-radius: 8px;
          }
          
          .date-editor-field {
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark} 0%, #1a1a1a 50%, ${colors.dark} 100%)`,
        padding: '24px 0',
        color: colors.light,
        position: 'relative',
      }}>
        {/* Efecto de fondo decorativo */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(30, 136, 229, 0.05) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(255, 61, 87, 0.05) 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Header con título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ← Volver
            </motion.button>
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            📅 Editar Fecha de Evento
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}>
            Modifica la información de esta fecha del evento
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            marginBottom: '2rem',
            padding: 0,
            borderRadius: '16px',
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >

          {/* Información Básica */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Barra decorativa superior */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.blue}, ${colors.coral}, ${colors.yellow})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(30, 136, 229, 0.3))',
              }}>📝</span>
              Información Básica
            </h3>
            <div className="org-editor-grid">
              <div>
                <label className="date-editor-field">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del evento"
                  className="date-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="date-editor-field">
                  Biografía
                </label>
                <textarea
                  value={form.biografia}
                  onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                  placeholder="Describe el evento, su propósito, qué esperar..."
                  rows={4}
                  className="date-editor-textarea"
                />
              </div>
            </div>
          </motion.div>

          {/* Ritmos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.coral}, ${colors.orange}, ${colors.yellow})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(255, 61, 87, 0.3))',
              }}>🎵</span>
              Ritmos de Baile
            </h3>
            <div style={{ marginTop: 8 }}>
              <RitmosChips
                selected={form.ritmos_seleccionados || []}
                allowedIds={allowedCatalogIds}
                onChange={(ids) => {
                  setForm({ ...form, ritmos_seleccionados: ids });
                  // Mapear también a estilos (tag IDs) si es posible
                  try {
                    const labelByCatalogId = new Map<string, string>();
                    RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                    const nameToTagId = new Map<string, number>(
                      ritmoTags.map((t: any) => [t.nombre, t.id])
                    );
                    const mappedTagIds = ids
                      .map(cid => labelByCatalogId.get(cid))
                      .filter(Boolean)
                      .map((label: any) => nameToTagId.get(label as string))
                      .filter((n): n is number => typeof n === 'number');
                    setForm(prev => ({ ...prev, estilos: mappedTagIds }));
                  } catch {}
                }}
              />
            </div>
          </motion.div>

          {/* Zonas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.yellow}, ${colors.orange}, ${colors.coral})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(255, 209, 102, 0.3))',
              }}>📍</span>
              Zonas de la Ciudad
            </h3>
            <ChipPicker
              tipo="zona"
              selected={form.zonas || []}
              onChange={(selected) => setForm({ ...form, zonas: selected as number[] })}
              label="Zonas de la Ciudad"
              placeholder="Selecciona las zonas donde se realizará"
              maxSelections={3}
            />
          </motion.div>

          {/* Fecha y Hora */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.blue}, #00BCD4, ${colors.coral})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(30, 136, 229, 0.3))',
              }}>📅</span>
              Fecha y Hora
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="date-editor-field">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                  className="date-editor-input"
                />
              </div>
              <div>
                <label className="date-editor-field">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="date-editor-input"
                />
              </div>
              <div>
                <label className="date-editor-field">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="date-editor-input"
                />
              </div>
            </div>
          </motion.div>

          {/* Ubicación Específica */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.coral}, ${colors.orange}, ${colors.yellow})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(255, 61, 87, 0.3))',
              }}>📍</span>
              Ubicación Específica
            </h3>
            <div className="org-editor-grid">
              <div>
                <label className="date-editor-field">
                  Lugar
                </label>
                <input
                  type="text"
                  value={form.lugar}
                  onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                  placeholder="Nombre del lugar"
                  className="date-editor-input"
                />
              </div>
              <div>
                <label className="date-editor-field">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  placeholder="Ciudad"
                  className="date-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="date-editor-field">
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Dirección completa"
                  className="date-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="date-editor-field">
                  Referencias
                </label>
                <input
                  type="text"
                  value={form.referencias}
                  onChange={(e) => setForm({ ...form, referencias: e.target.value })}
                  placeholder="Puntos de referencia, cómo llegar..."
                  className="date-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="date-editor-field">
                  Requisitos
                </label>
                <textarea
                  value={form.requisitos}
                  onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
                  placeholder="Requisitos para participar (edad, nivel, vestimenta, etc.)"
                  rows={3}
                  className="date-editor-textarea"
                />
              </div>
            </div>
          </motion.div>

          {/* Cronograma */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.blue}, #00BCD4, ${colors.coral})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(30, 136, 229, 0.3))',
              }}>📅</span>
              Cronograma del Evento
            </h3>
            <ScheduleEditor
              schedule={form.cronograma || []}
              onChangeSchedule={(cronograma) => setForm({ ...form, cronograma })}
              costos={form.costos || []}
              onChangeCostos={(costos) => setForm({ ...form, costos })}
              ritmos={ritmoTags}
              zonas={zonaTags}
            />
          </motion.div>

          {/* Flyer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.coral}, ${colors.orange}, ${colors.yellow})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(255, 61, 87, 0.3))',
              }}>🖼️</span>
              Flyer del Evento
            </h3>
            <DateFlyerUploader
              value={form.flyer_url || null}
              onChange={(url) => setForm({ ...form, flyer_url: url })}
              dateId={dateIdNum}
              parentId={(date as any).parent_id}
            />
          </motion.div>

          {/* Estado de Publicación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="org-editor-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.blue}, ${colors.coral}, ${colors.yellow})`,
              borderRadius: '16px 16px 0 0',
            }} />
            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              marginTop: '0.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(30, 136, 229, 0.3))',
              }}>🌐</span>
              Estado de Publicación
            </h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="estado_publicacion"
                  value="borrador"
                  checked={form.estado_publicacion === 'borrador'}
                  onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                  📝 Borrador (solo tú puedes verlo)
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="estado_publicacion"
                  value="publicado"
                  checked={form.estado_publicacion === 'publicado'}
                  onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                  🌐 Público (visible para todos)
                </span>
              </label>
            </div>
          </motion.div>

          {/* Botones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="org-editor-card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              marginTop: '0.5rem',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
              }}
            >
              ← Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 8px 24px rgba(30, 136, 229, 0.4),
                            0 4px 12px rgba(255, 61, 87, 0.3)`,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>
                💾 Guardar Cambios
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
