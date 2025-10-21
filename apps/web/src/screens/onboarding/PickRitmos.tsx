import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip } from '@ui/index';
import { theme } from '@theme/colors';
import { useTags } from '../../hooks/useTags';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { mergeProfile } from '../../utils/mergeProfile';

export function PickRitmos() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: ritmos, isLoading: loadingTags } = useTags('ritmo');
  const { profile, upsert } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const toggleRitmo = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updates = mergeProfile(profile, {
        ritmos: selectedIds,
      });
      
      await upsert(updates);
      showToast('Ritmos guardados exitosamente 🎵', 'success');
      navigate('/onboarding/zonas');
    } catch (err: any) {
      setError(err.message);
      showToast('Error al guardar ritmos', 'error');
      setIsLoading(false);
    }
  };

  // Skip if already has ritmos
  const handleSkip = () => {
    if (profile?.ritmos && profile.ritmos.length > 0) {
      navigate('/onboarding/zonas');
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
            Paso 2: Ritmos 🎵
          </h1>
          <p style={{ color: theme.text.secondary }}>
            ¿Qué ritmos te gustan? (selecciona todos los que quieras)
          </p>
        </div>

        {loadingTags ? (
          <div style={{ textAlign: 'center', padding: theme.spacing(4), color: theme.text.secondary }}>
            Cargando ritmos...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: theme.spacing(4), display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1) }}>
              {ritmos?.map((ritmo) => (
                <div key={ritmo.id} onClick={() => toggleRitmo(ritmo.id)} style={{ cursor: 'pointer' }}>
                  <Chip
                    label={ritmo.nombre}
                    active={selectedIds.includes(ritmo.id)}
                  />
                </div>
              ))}
            </div>

            <div style={{ color: theme.text.muted, fontSize: '0.875rem', marginBottom: theme.spacing(3) }}>
              {selectedIds.length} ritmo(s) seleccionado(s)
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
              {profile?.ritmos && profile.ritmos.length > 0 && (
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
                {isLoading ? 'Guardando...' : 'Continuar →'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

