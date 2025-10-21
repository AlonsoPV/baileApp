import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip } from '@ui/index';
import { theme } from '@theme/colors';
import { useTags } from '../../hooks/useTags';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { mergeProfile } from '../../utils/mergeProfile';

export function PickZonas() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: zonas, isLoading: loadingTags } = useTags('zona');
  const { profile, upsert } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const toggleZona = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((zid) => zid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updates = mergeProfile(profile, {
        zonas: selectedIds,
      });
      
      await upsert(updates);
      showToast('Zonas guardadas exitosamente 📍', 'success');
      navigate('/app/profile');
    } catch (err: any) {
      setError(err.message);
      showToast('Error al guardar zonas', 'error');
      setIsLoading(false);
    }
  };

  // Skip if already has zonas
  const handleSkip = () => {
    if (profile?.zonas && profile.zonas.length > 0) {
      navigate('/app/profile');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg.app,
        padding: theme.spacing(2),
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: theme.bg.card,
          borderRadius: theme.radius.xl,
          padding: theme.spacing(4),
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: theme.spacing(4) }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: theme.spacing(1) }}>
            Paso 3: Zonas 📍
          </h1>
          <p style={{ color: theme.text.secondary }}>
            ¿En qué zonas bailas? (selecciona todas las que quieras)
          </p>
        </div>

        {loadingTags ? (
          <div style={{ textAlign: 'center', padding: theme.spacing(4), color: theme.text.secondary }}>
            Cargando zonas...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: theme.spacing(4), display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1) }}>
              {zonas?.map((zona) => (
                <div key={zona.id} onClick={() => toggleZona(zona.id)} style={{ cursor: 'pointer' }}>
                  <Chip
                    label={zona.nombre}
                    active={selectedIds.includes(zona.id)}
                  />
                </div>
              ))}
            </div>

            <div style={{ color: theme.text.muted, fontSize: '0.875rem', marginBottom: theme.spacing(3) }}>
              {selectedIds.length} zona(s) seleccionada(s)
            </div>

            {error && (
              <div
                style={{
                  marginBottom: theme.spacing(3),
                  padding: theme.spacing(2),
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: theme.radius.md,
                  color: '#ef4444',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: theme.spacing(2) }}>
              {profile?.zonas && profile.zonas.length > 0 && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: theme.spacing(2),
                    background: 'transparent',
                    border: `1px solid ${theme.palette.gray3}`,
                    borderRadius: theme.radius.md,
                    color: theme.text.secondary,
                    cursor: 'pointer',
                  }}
                >
                  Omitir
                </button>
              )}
              <Button
                type="submit"
                disabled={isLoading || selectedIds.length === 0}
                style={{
                  flex: 1,
                  opacity: isLoading || selectedIds.length === 0 ? 0.5 : 1,
                }}
              >
                {isLoading ? 'Guardando...' : 'Finalizar ✨'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

