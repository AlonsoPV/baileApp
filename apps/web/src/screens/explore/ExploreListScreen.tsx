import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useExploreFilters } from '../../state/exploreFilters';
import { useExploreQuery } from '../../hooks/useExploreQuery';
import { useTags } from '../../hooks/useTags';
import { Breadcrumbs } from '../../components/Breadcrumbs';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function ExploreListScreen() {
  const navigate = useNavigate();
  const { filters, set } = useExploreFilters();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useExploreQuery(filters);
  const { ritmos } = useTags('ritmo');
  const { zonas } = useTags('zona');

  const [showFilters, setShowFilters] = useState(false);

  const allItems = data?.pages.flatMap(p => p.data) || [];
  const totalCount = data?.pages[0]?.count || 0;

  const typeLabels: Record<string, string> = {
    eventos: 'Eventos',
    organizadores: 'Organizadores',
    usuarios: 'Bailarines',
    maestros: 'Maestros',
    academias: 'Academias',
    marcas: 'Marcas',
  };

  const handleRitmoToggle = (id: number) => {
    const exists = filters.ritmos.includes(id);
    set({ ritmos: exists ? filters.ritmos.filter(r => r !== id) : [...filters.ritmos, id] });
  };

  const handleZonaToggle = (id: number) => {
    const exists = filters.zonas.includes(id);
    set({ zonas: exists ? filters.zonas.filter(z => z !== id) : [...filters.zonas, id] });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      paddingBottom: '2rem'
    }}>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Explorar', href: '/explore', icon: '🔍' },
            { label: typeLabels[filters.type] || 'Resultados', icon: '📋' },
          ]}
        />
      </div>

      {/* Header */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {typeLabels[filters.type]}
            </h1>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              {totalCount} resultados encontrados
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '25px',
              border: 'none',
              background: showFilters ? colors.coral : colors.blue,
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {showFilters ? '✕' : '🎛️'} Filtros
          </button>
        </div>

        {/* Filtros Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(23, 23, 23, 0.8)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Búsqueda de texto */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                🔍 Buscar
              </label>
              <input
                type="text"
                value={filters.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Escribe para buscar..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(38, 38, 38, 1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filtros de fecha (solo para eventos) */}
            {filters.type === 'eventos' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                    📅 Desde
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => set({ dateFrom: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(38, 38, 38, 1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                    📅 Hasta
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => set({ dateTo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(38, 38, 38, 1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Filtro de Ritmos */}
            {ritmos.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                  🎵 Estilos
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ritmos.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRitmoToggle(r.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: filters.ritmos.includes(r.id) ? `2px solid ${colors.coral}` : '1px solid rgba(255, 255, 255, 0.3)',
                        background: filters.ritmos.includes(r.id) ? 'rgba(255, 61, 87, 0.2)' : 'rgba(38, 38, 38, 0.6)',
                        color: 'white',
                        fontSize: '0.85rem',
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

            {/* Filtro de Zonas */}
            {zonas.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                  📍 Zonas
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {zonas.map(z => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => handleZonaToggle(z.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: filters.zonas.includes(z.id) ? `2px solid ${colors.blue}` : '1px solid rgba(255, 255, 255, 0.3)',
                        background: filters.zonas.includes(z.id) ? 'rgba(30, 136, 229, 0.2)' : 'rgba(38, 38, 38, 0.6)',
                        color: 'white',
                        fontSize: '0.85rem',
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
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              borderTop: '3px solid #FF3D57',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <div>Cargando resultados...</div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && allItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {allItems.map((item: any, index) => (
              <ResultCard key={item.id || index} item={item} type={filters.type} navigate={navigate} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allItems.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            opacity: 0.7
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No se encontraron resultados</h3>
            <p style={{ fontSize: '0.9rem' }}>Intenta ajustar los filtros</p>
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{
                padding: '1rem 2rem',
                borderRadius: '25px',
                border: 'none',
                background: isFetchingNextPage ? 'rgba(255, 255, 255, 0.2)' : colors.blue,
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isFetchingNextPage ? 'not-allowed' : 'pointer'
              }}
            >
              {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para cada resultado
function ResultCard({ item, type, navigate }: any) {
  const handleClick = () => {
    if (type === 'eventos') {
      navigate(`/events/date/${item.id}`);
    } else if (type === 'organizadores') {
      navigate(`/organizer/${item.id}`);
    } else if (type === 'usuarios') {
      navigate(`/u/${item.user_id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      style={{
        background: 'rgba(23, 23, 23, 0.8)',
        borderRadius: '1rem',
        padding: '1.5rem',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {type === 'eventos' && (
        <>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: colors.coral }}>
            📅 {item.fecha}
          </div>
          {item.hora_inicio && (
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>
              🕒 {item.hora_inicio}{item.hora_fin ? ` – ${item.hora_fin}` : ''}
            </div>
          )}
          {item.lugar && (
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              📍 {item.lugar}
            </div>
          )}
        </>
      )}

      {type === 'organizadores' && (
        <>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            🎤 {item.nombre_publico}
          </div>
          {item.bio && (
            <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: '1.5' }}>
              {item.bio.slice(0, 100)}{item.bio.length > 100 && '...'}
            </p>
          )}
        </>
      )}

      {type === 'usuarios' && (
        <>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            💃 {item.display_name || 'Usuario'}
          </div>
          {item.bio && (
            <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: '1.5' }}>
              {item.bio.slice(0, 100)}{item.bio.length > 100 && '...'}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

