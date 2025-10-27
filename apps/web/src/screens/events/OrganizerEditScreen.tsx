import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyOrganizer } from '../../hooks/useOrganizer';
import { useToast } from '../../components/Toast';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { required } from '../../utils/forms';

import { useUpsertMyOrganizer, useSubmitOrganizerForReview } from '../../hooks/useOrganizer';

export function OrganizerEditScreen() {
  const organizerQuery = useMyOrganizer();
  const { data: organizer } = organizerQuery;
  const upsertMutation = useUpsertMyOrganizer();
  const { mutateAsync: upsert, isPending: isUpserting } = upsertMutation;
  const submitForReviewMutation = useSubmitOrganizerForReview();
  const { mutateAsync: submitForReview, isPending: isSubmittingForReview } = submitForReviewMutation;
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
      setMediaUrls(Array.isArray(organizer.media) ? organizer.media.join('\n') : '');
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
      } as any);
      
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
        borderRadius: borderRadius.md,
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
      color: colors.light,
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
          background: colors.glass.strong,
          borderRadius: borderRadius.lg,
        }}>
          <div style={{ flex: 1 }}>
            <strong>Estado:</strong> {getEstadoBadge()}
          </div>
          
          {organizer.estado_aprobacion === 'borrador' && (
            <button
              onClick={handleSubmitForReview}
              disabled={isSubmittingForReview}
              style={{
                background: colors.secondary[500],
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: borderRadius.md,
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
                background: colors.primary[500],
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: borderRadius.md,
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
            color: colors.light,
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
              border: `1px solid ${colors.glass.medium}`,
              borderRadius: borderRadius.md,
              fontSize: '1rem',
              background: colors.glass.strong,
              color: colors.light,
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: colors.light,
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
              border: `1px solid ${colors.glass.medium}`,
              borderRadius: borderRadius.md,
              fontSize: '1rem',
              resize: 'vertical',
              background: colors.glass.strong,
              color: colors.light,
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: colors.light,
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
              border: `1px solid ${colors.glass.medium}`,
              borderRadius: borderRadius.md,
              fontSize: '1rem',
              resize: 'vertical',
              background: colors.glass.strong,
              color: colors.light,
              fontFamily: 'monospace',
            }}
          />
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            background: '#FEE2E2', 
            color: '#991B1B',
            borderRadius: borderRadius.md,
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isUpserting}
          style={{
            background: isUpserting ? colors.glass.medium : colors.primary[500],
            color: '#fff',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: borderRadius.md,
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
          background: colors.glass.strong,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.glass.medium}`,
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            📅 Mis Eventos
          </h2>
          <p style={{ color: colors.gray[400], marginBottom: '1rem' }}>
            Gestiona los eventos que organizas
          </p>
          <button
            onClick={() => navigate('/social/new')}
            style={{
              background: colors.secondary[500],
              color: '#fff',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: borderRadius.md,
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