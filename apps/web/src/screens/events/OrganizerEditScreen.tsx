import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyOrganizer } from '../../hooks/useOrganizer';
import { useToast } from '../../components/Toast';
import { theme } from '@theme/colors';
import { required } from '../../utils/forms';

export function OrganizerEditScreen() {
  const { organizer, upsert, isUpserting, submitForReview, isSubmittingForReview } = useMyOrganizer();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [nombrePublico, setNombrePublico] = useState('');
  const [bio, setBio] = useState('');
  const [mediaUrls, setMediaUrls] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (organizer) {
      setNombrePublico(organizer.nombre_publico || '');
      setBio(organizer.bio || '');
      setMediaUrls(organizer.media?.join('\n') || '');
    }
  }, [organizer]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const nameError = required(nombrePublico);
    if (nameError) {
      setError(nameError);
      showToast(nameError, 'error');
      return;
    }

    try {
      const mediaArray = mediaUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      await upsert({
        nombre_publico: nombrePublico,
        bio: bio || null,
        media: mediaArray,
      });
      
      showToast('Organizador guardado exitosamente ✅', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast('Error al guardar el organizador', 'error');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await submitForReview();
      showToast('Organizador enviado a revisión ✅', 'success');
    } catch (err: any) {
      showToast('Error al enviar a revisión', 'error');
    }
  };

  const getEstadoBadge = () => {
    if (!organizer) return null;
    
    const badgeStyles: Record<string, any> = {
      borrador: { bg: '#94A3B8', color: '#fff' },
      en_revision: { bg: '#F59E0B', color: '#fff' },
      aprobado: { bg: '#10B981', color: '#fff' },
      rechazado: { bg: '#EF4444', color: '#fff' },
    };

    const style = badgeStyles[organizer.estado_aprobacion] || badgeStyles.borrador;

    return (
      <span style={{
        padding: '0.5rem 1rem',
        borderRadius: theme.radius.md,
        fontSize: '0.875rem',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
      }}>
        {organizer.estado_aprobacion}
      </span>
    );
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      color: theme.text.primary,
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Mi Organizador
      </h1>

      {organizer && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          background: theme.bg.surface,
          borderRadius: theme.radius.lg,
        }}>
          <div style={{ flex: 1 }}>
            <strong>Estado:</strong> {getEstadoBadge()}
          </div>
          
          {organizer.estado_aprobacion === 'borrador' && (
            <button
              onClick={handleSubmitForReview}
              disabled={isSubmittingForReview}
              style={{
                background: theme.brand.secondary,
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: theme.radius.md,
                cursor: isSubmittingForReview ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              {isSubmittingForReview ? 'Enviando...' : 'Enviar a Revisión'}
            </button>
          )}

          {organizer.estado_aprobacion === 'aprobado' && (
            <button
              onClick={() => navigate(`/organizer/${organizer.id}`)}
              style={{
                background: theme.brand.primary,
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              Ver Público
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: theme.text.primary,
          }}>
            Nombre Público *
          </label>
          <input
            type="text"
            value={nombrePublico}
            onChange={(e) => setNombrePublico(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${theme.bg.border}`,
              borderRadius: theme.radius.md,
              fontSize: '1rem',
              background: theme.bg.surface,
              color: theme.text.primary,
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: theme.text.primary,
          }}>
            Biografía
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Cuéntanos sobre ti como organizador..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${theme.bg.border}`,
              borderRadius: theme.radius.md,
              fontSize: '1rem',
              resize: 'vertical',
              background: theme.bg.surface,
              color: theme.text.primary,
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: theme.text.primary,
          }}>
            Media URLs (una por línea)
          </label>
          <textarea
            value={mediaUrls}
            onChange={(e) => setMediaUrls(e.target.value)}
            rows={3}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${theme.bg.border}`,
              borderRadius: theme.radius.md,
              fontSize: '1rem',
              resize: 'vertical',
              background: theme.bg.surface,
              color: theme.text.primary,
              fontFamily: 'monospace',
            }}
          />
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            background: '#FEE2E2', 
            color: '#991B1B',
            borderRadius: theme.radius.md,
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isUpserting}
          style={{
            background: isUpserting ? theme.bg.border : theme.brand.primary,
            color: '#fff',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: theme.radius.md,
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isUpserting ? 'not-allowed' : 'pointer',
          }}
        >
          {isUpserting ? 'Guardando...' : 'Guardar Organizador'}
        </button>
      </form>

      {organizer && organizer.estado_aprobacion === 'aprobado' && (
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: theme.bg.surface,
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.bg.border}`,
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            📅 Mis Eventos
          </h2>
          <p style={{ color: theme.text.secondary, marginBottom: '1rem' }}>
            Gestiona los eventos que organizas
          </p>
          <button
            onClick={() => navigate('/events/parent/new')}
            style={{
              background: theme.brand.secondary,
              color: '#fff',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: theme.radius.md,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Crear Nuevo Evento
          </button>
        </div>
      )}
    </div>
  );
}