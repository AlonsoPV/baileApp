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
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      padding: '24px 0',
      color: colors.light,
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
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
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              📝 Información Básica
            </h3>
            <div className="org-editor-grid">
              <div>
                <label className="org-editor-field">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del evento"
                  className="org-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">
                  Biografía
                </label>
                <textarea
                  value={form.biografia}
                  onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                  placeholder="Describe el evento, su propósito, qué esperar..."
                  rows={4}
                  className="org-editor-textarea"
                />
              </div>
            </div>
          </div>

          {/* Ritmos */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              🎵 Ritmos de Baile
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
          </div>

          {/* Zonas */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              📍 Zonas de la Ciudad
            </h3>
            <ChipPicker
              tipo="zona"
              selected={form.zonas || []}
              onChange={(selected) => setForm({ ...form, zonas: selected as number[] })}
              label="Zonas de la Ciudad"
              placeholder="Selecciona las zonas donde se realizará"
              maxSelections={3}
            />
          </div>

          {/* Fecha y Hora */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              📅 Fecha y Hora
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="org-editor-field">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                  className="org-editor-input"
                  style={{ color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="org-editor-field">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="org-editor-input"
                  style={{ color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="org-editor-field">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="org-editor-input"
                  style={{ color: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>

          {/* Ubicación Específica */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              📍 Ubicación Específica
            </h3>
            <div className="org-editor-grid">
              <div>
                <label className="org-editor-field">
                  Lugar
                </label>
                <input
                  type="text"
                  value={form.lugar}
                  onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                  placeholder="Nombre del lugar"
                  className="org-editor-input"
                />
              </div>
              <div>
                <label className="org-editor-field">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  placeholder="Ciudad"
                  className="org-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Dirección completa"
                  className="org-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">
                  Referencias
                </label>
                <input
                  type="text"
                  value={form.referencias}
                  onChange={(e) => setForm({ ...form, referencias: e.target.value })}
                  placeholder="Puntos de referencia, cómo llegar..."
                  className="org-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">
                  Requisitos
                </label>
                <textarea
                  value={form.requisitos}
                  onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
                  placeholder="Requisitos para participar (edad, nivel, vestimenta, etc.)"
                  rows={3}
                  className="org-editor-textarea"
                />
              </div>
            </div>
          </div>

          {/* Cronograma */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              📅 Cronograma del Evento
            </h3>
            <ScheduleEditor
              schedule={form.cronograma || []}
              onChangeSchedule={(cronograma) => setForm({ ...form, cronograma })}
              costos={form.costos || []}
              onChangeCostos={(costos) => setForm({ ...form, costos })}
              ritmos={ritmoTags}
              zonas={zonaTags}
            />
          </div>

          {/* Flyer */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              🖼️ Flyer del Evento
            </h3>
            <DateFlyerUploader
              value={form.flyer_url || null}
              onChange={(url) => setForm({ ...form, flyer_url: url })}
              dateId={dateIdNum}
              parentId={(date as any).parent_id}
            />
          </div>

          {/* Estado de Publicación */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              🌐 Estado de Publicación
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
          </div>

          {/* Botones */}
          <div
            className="org-editor-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'transparent',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← Volver
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.9), rgba(255, 61, 87, 0.9))',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)'
              }}
            >
              💾 Guardar cambios
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
