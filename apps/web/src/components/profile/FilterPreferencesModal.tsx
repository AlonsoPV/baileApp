import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserFilterPreferences, DateRange } from "@/hooks/useUserFilterPreferences";
import { useTags } from "@/hooks/useTags";
import RitmosChips from "@/components/RitmosChips";
import { Chip } from "./Chip";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";

type FilterPreferencesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function FilterPreferencesModal({ isOpen, onClose }: FilterPreferencesModalProps) {
  const { preferences, loading, savePreferences, isSaving, refetch } = useUserFilterPreferences();
  const { data: allTags } = useTags();
  const [ritmos, setRitmos] = useState<string[]>([]);
  const [zonas, setZonas] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('none');
  const [customDays, setCustomDays] = useState<number>(7);
  const [saved, setSaved] = useState(false);

  // Cargar preferencias cuando se abre el modal
  useEffect(() => {
    if (isOpen && preferences) {
      // Convertir ritmos de IDs numéricos a slugs del catálogo
      const labelByTagId = new Map<number, string>();
      (allTags || [])
        .filter((t: any) => t.tipo === 'ritmo')
        .forEach((t: any) => labelByTagId.set(t.id, t.nombre));

      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));

      // Mapear IDs de ritmos a slugs del catálogo
      const ritmosSlugs: string[] = [];
      preferences.ritmos.forEach((ritmoId: number) => {
        const tagNombre = labelByTagId.get(ritmoId);
        if (tagNombre) {
          // Buscar el slug del catálogo que corresponde a este nombre
          for (const [slug, label] of labelByCatalogId.entries()) {
            if (label === tagNombre) {
              ritmosSlugs.push(slug);
              break;
            }
          }
        }
      });

      setRitmos(ritmosSlugs);
      setZonas(preferences.zonas || []);
      setDateRange(preferences.date_range || 'none');
      setCustomDays(preferences.custom_days || 7);
    }
  }, [isOpen, preferences, allTags]);

  const handleSave = async () => {
    try {
      // Convertir slugs de ritmos a IDs de tags
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));

      const nameToTagId = new Map<string, number>(
        (allTags || [])
          .filter((t: any) => t.tipo === 'ritmo')
          .map((t: any) => [t.nombre, t.id])
      );

      const ritmoIds = ritmos
        .map(slug => labelByCatalogId.get(slug))
        .filter(Boolean)
        .map((label: any) => nameToTagId.get(label as string))
        .filter((id): id is number => typeof id === 'number');

      await savePreferences({
        ritmos: ritmoIds,
        zonas,
        date_range: dateRange,
        custom_days: dateRange === 'custom' ? customDays : null,
      });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("[FilterPreferencesModal] Error guardando preferencias:", error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const zonaTags = (allTags || []).filter((tag: any) => tag.tipo === 'zona');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, rgba(19,21,27,0.95), rgba(16,18,24,0.95))',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              zIndex: 1001,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '2rem 2rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'linear-gradient(135deg, rgba(240,147,251,0.1), rgba(245,87,108,0.1))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                    ⭐ Preferencias de Filtros
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>
                    Configura tus filtros favoritos para aplicarlos automáticamente al explorar
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                  <p>Cargando preferencias...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {/* Ritmos favoritos */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      🎵 Ritmos Favoritos
                    </label>
                    <RitmosChips selected={ritmos} onChange={setRitmos} />
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      Selecciona los ritmos que más te interesan
                    </p>
                  </div>

                  {/* Zonas favoritas */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      🗺️ Zonas Favoritas
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {zonaTags.map((tag: any) => (
                        <Chip
                          key={tag.id}
                          label={tag.nombre}
                          active={zonas.includes(tag.id)}
                          onClick={() => {
                            setZonas(prev =>
                              prev.includes(tag.id)
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                          variant="zona"
                          style={{
                            background: zonas.includes(tag.id)
                              ? 'rgba(25,118,210,0.2)'
                              : 'rgba(255,255,255,0.04)',
                            border: zonas.includes(tag.id)
                              ? '1px solid #1976D2'
                              : '1px solid rgba(255,255,255,0.15)',
                            color: zonas.includes(tag.id)
                              ? '#90CAF9'
                              : 'rgba(255,255,255,0.9)',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      Selecciona las zonas donde prefieres buscar eventos y clases
                    </p>
                  </div>

                  {/* Rango de fecha favorito */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      📅 Rango de Fecha Favorito
                    </label>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {(['hoy', 'semana', 'mes', 'custom', 'none'] as DateRange[]).map((range) => (
                        <label
                          key={range}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            background: dateRange === range
                              ? 'rgba(240,147,251,0.15)'
                              : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${dateRange === range ? 'rgba(240,147,251,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (dateRange !== range) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (dateRange !== range) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }
                          }}
                        >
                          <input
                            type="radio"
                            checked={dateRange === range}
                            onChange={() => setDateRange(range)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#fff', fontWeight: dateRange === range ? 700 : 500 }}>
                            {range === 'hoy' && '📆 Hoy'}
                            {range === 'semana' && '📆 Esta semana'}
                            {range === 'mes' && '📆 Este mes'}
                            {range === 'custom' && '📆 Personalizado'}
                            {range === 'none' && '🚫 Sin filtros de fecha'}
                          </span>
                        </label>
                      ))}

                      {dateRange === 'custom' && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.95rem' }}>
                            Número de días:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={customDays}
                            onChange={(e) => setCustomDays(Number(e.target.value) || 7)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#fff',
                              fontSize: '1rem',
                            }}
                          />
                          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                            Mostrar eventos y clases de los próximos {customDays} días
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1.5rem 2rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
              }}
            >
              <button
                onClick={onClose}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: saved
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, rgba(240,147,251,0.8), rgba(245,87,108,0.8))',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: isSaving || loading ? 'not-allowed' : 'pointer',
                  opacity: isSaving || loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: saved ? '0 4px 12px rgba(16,185,129,0.3)' : '0 4px 12px rgba(240,147,251,0.2)',
                }}
              >
                {saved ? '✅ Guardado' : isSaving ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

