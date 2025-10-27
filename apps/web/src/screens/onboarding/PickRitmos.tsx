import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { useTags } from '../../hooks/useTags';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { mergeProfile } from '../../utils/mergeProfile';

export function PickRitmos() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: ritmos, isLoading: loadingTags } = useTags('ritmo');
  const { profile, updateProfileFields } = useUserProfile();
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
      const updates = mergeProfile(profile as any, {
        ritmos: selectedIds,
      });
      
      await updateProfileFields(updates);
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
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        padding: spacing[2],
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: colors.glass.light,
          borderRadius: borderRadius['2xl'],
          padding: spacing[4],
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: spacing[1] }}>
            Paso 2: Ritmos 🎵
          </h1>
          <p style={{ color: colors.gray[400] }}>
            ¿Qué ritmos te gustan? (selecciona todos los que quieras)
          </p>
        </div>

        {loadingTags ? (
          <div style={{ textAlign: 'center', padding: spacing[4], color: colors.gray[400] }}>
            Cargando ritmos...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing[4], display: 'flex', flexWrap: 'wrap', gap: spacing[1] }}>
              {ritmos?.map((ritmo) => (
                <div key={ritmo.id} onClick={() => toggleRitmo(ritmo.id)} style={{ cursor: 'pointer' }}>
                  <Chip
                    label={ritmo.nombre}
                    active={selectedIds.includes(ritmo.id)}
                  />
                </div>
              ))}
            </div>

            <div style={{ color: colors.gray[500], fontSize: '0.875rem', marginBottom: spacing[3] }}>
              {selectedIds.length} ritmo(s) seleccionado(s)
            </div>

            {error && (
              <div
                style={{
                  marginBottom: spacing[3],
                  padding: spacing[2],
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: borderRadius.md,
                  color: '#ef4444',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: spacing[2] }}>
              {profile?.ritmos && profile.ritmos.length > 0 && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: spacing[2],
                    background: 'transparent',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: borderRadius.md,
                    color: colors.gray[400],
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

