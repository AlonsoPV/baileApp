import React from "react";
import { useExploreFilters, ExploreType } from "../../state/exploreFilters";
import { useTags } from "../../hooks/useTags";
import { useTranslation } from "react-i18next";

const TYPES: { key: ExploreType; label: string }[] = [
  { key: "eventos", label: "events" },
  { key: "organizadores", label: "organizers" },
  { key: "maestros", label: "teachers" },
  { key: "academias", label: "academies" },
  { key: "marcas", label: "brands" },
  { key: "usuarios", label: "users" },
];

export default function FilterChips() {
  const { t } = useTranslation();
  const { filters, set, reset } = useExploreFilters();
  const { ritmos } = useTags("ritmo");
  const { zonas }  = useTags("zona");

  function toggle(arr: number[], id: number) {
    return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
  }

  return (
    <div style={{
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(23, 23, 23, 0.5)',
      padding: '0.75rem'
    }}>
      {/* Tipo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => set({ type: t.key })}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              border: filters.type === t.key 
                ? '2px solid rgb(236, 72, 153)' 
                : '1px solid rgb(115, 115, 115)',
              background: filters.type === t.key 
                ? 'rgba(219, 39, 119, 0.7)' 
                : 'rgb(38, 38, 38)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t(t.label)}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          style={{
            flex: 1,
            background: 'rgb(38, 38, 38)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '0.9rem',
            outline: 'none'
          }}
          placeholder={t('search_placeholder_filters')}
          defaultValue={filters.q}
          onBlur={(e) => set({ q: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && set({ q: e.currentTarget.value })}
        />
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: 'rgb(38, 38, 38)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          {t('clear')}
        </button>
      </div>

      {/* Ritmos */}
      {ritmos.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.8 }}>
            {t('rhythms')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ritmos.map(r => (
              <button
                key={r.id}
                onClick={() => set({ ritmos: toggle(filters.ritmos, r.id) })}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: filters.ritmos.includes(r.id)
                    ? '2px solid rgb(59, 130, 246)'
                    : '1px solid rgb(115, 115, 115)',
                  background: filters.ritmos.includes(r.id)
                    ? 'rgba(59, 130, 246, 0.7)'
                    : 'rgb(38, 38, 38)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {r.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zonas */}
      {zonas.length > 0 && (
        <div>
          <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.8 }}>
            {t('zones')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {zonas.map(z => (
              <button
                key={z.id}
                onClick={() => set({ zonas: toggle(filters.zonas, z.id) })}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: filters.zonas.includes(z.id)
                    ? '2px solid rgb(255, 214, 102)'
                    : '1px solid rgb(115, 115, 115)',
                  background: filters.zonas.includes(z.id)
                    ? 'rgba(255, 214, 102, 0.7)'
                    : 'rgb(38, 38, 38)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {z.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fechas (solo eventos) */}
      {filters.type === "eventos" && (
        <div style={{
          marginTop: '0.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.8 }}>
              {t('from')}
            </div>
            <input
              type="date"
              style={{
                width: '100%',
                background: 'rgb(38, 38, 38)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem'
              }}
              defaultValue={filters.dateFrom}
              onBlur={(e) => set({ dateFrom: e.target.value || undefined })}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.8 }}>
              {t('to')}
            </div>
            <input
              type="date"
              style={{
                width: '100%',
                background: 'rgb(38, 38, 38)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem'
              }}
              defaultValue={filters.dateTo}
              onBlur={(e) => set({ dateTo: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

