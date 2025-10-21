import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizerPublic } from '../../hooks/useOrganizer';
import { useParentsByOrganizer } from '../../hooks/useEvents';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '@theme/colors';
import { Link } from 'react-router-dom';

type TabType = 'info' | 'eventos' | 'media';

export function OrganizerPublicScreen() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: organizer, isLoading, error } = useOrganizerPublic(parseInt(id || '0'));
  const { data: eventos, isLoading: isLoadingEventos } = useParentsByOrganizer(parseInt(id || '0'));
  const [activeTab, setActiveTab] = useState<TabType>('info');

  if (isLoading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: theme.text.primary,
      }}>
        Cargando organizador...
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: theme.text.primary,
      }}>
        <h1>Organizador no encontrado</h1>
        <p style={{ color: theme.text.secondary }}>
          El organizador que buscas no existe o no está disponible.
        </p>
      </div>
    );
  }

  // Check if user is the owner
  const isOwner = user && organizer.user_id === user.id;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'media', label: 'Media' },
  ];

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      color: theme.text.primary,
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {organizer.nombre_publico}
        </h1>
        {isOwner && (
          <Link 
            to="/organizer/edit"
            style={{
              color: theme.brand.primary,
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ✏️ Editar mi organizador
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: `2px solid ${theme.bg.border}`,
        marginBottom: '2rem',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? theme.brand.primary : theme.text.secondary,
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? `3px solid ${theme.brand.primary}` : 'none',
              marginBottom: '-2px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div>
          {organizer.bio ? (
            <div style={{ 
              padding: '1.5rem',
              background: theme.bg.surface,
              borderRadius: theme.radius.lg,
              lineHeight: '1.6',
            }}>
              {organizer.bio}
            </div>
          ) : (
            <p style={{ color: theme.text.secondary }}>
              Sin biografía disponible
            </p>
          )}
        </div>
      )}

      {activeTab === 'eventos' && (
        <div>
          {isLoadingEventos ? (
            <p style={{ color: theme.text.secondary }}>Cargando eventos...</p>
          ) : eventos && eventos.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {eventos.map(evento => (
                <Link
                  key={evento.id}
                  to={`/events/parent/${evento.id}`}
                  style={{
                    display: 'block',
                    padding: '1.5rem',
                    background: theme.bg.surface,
                    borderRadius: theme.radius.lg,
                    border: `1px solid ${theme.bg.border}`,
                    textDecoration: 'none',
                    color: theme.text.primary,
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    {evento.nombre}
                  </h3>
                  {evento.descripcion && (
                    <p style={{ 
                      color: theme.text.secondary,
                      marginBottom: '0.5rem',
                    }}>
                      {evento.descripcion.slice(0, 150)}
                      {evento.descripcion.length > 150 && '...'}
                    </p>
                  )}
                  {evento.sede_general && (
                    <p style={{ color: theme.text.secondary, fontSize: '0.875rem' }}>
                      📍 {evento.sede_general}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: theme.text.secondary }}>
              No hay eventos disponibles
            </p>
          )}
        </div>
      )}

      {activeTab === 'media' && (
        <div>
          {organizer.media && organizer.media.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {organizer.media.map((url: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    aspectRatio: '1',
                    background: theme.bg.surface,
                    borderRadius: theme.radius.lg,
                    overflow: 'hidden',
                    border: `1px solid ${theme.bg.border}`,
                  }}
                >
                  <img
                    src={url}
                    alt={`Media ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: ${theme.text.secondary}">
                          🖼️ Error al cargar
                        </div>
                      `;
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: theme.text.secondary }}>
              No hay media disponible
            </p>
          )}
        </div>
      )}
    </div>
  );
}