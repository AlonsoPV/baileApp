import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { mergeProfile } from '../../utils/mergeProfile';
import RitmosChips from '../../components/RitmosChips';

export function PickRitmos() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { profile, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.ritmos_seleccionados?.length) {
      setSelectedSlugs(profile.ritmos_seleccionados as string[]);
    }
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updates = mergeProfile(profile as any, {
        ritmos_seleccionados: selectedSlugs,
      });
      
      await updateProfileFields(updates);
      showToast('Ritmos guardados exitosamente 🎵', 'success');
      
      // Navegar inmediatamente sin esperar
      navigate('/onboarding/zonas');
    } catch (err: any) {
      setError(err.message);
      showToast('Error al guardar ritmos', 'error');
      setIsLoading(false);
    }
  };

  // Removed handleSkip - users must click "Continuar" to proceed

  const highlightCards = [
    {
      title: 'Personaliza tu feed',
      detail: 'Mostraremos eventos y clases compatibles con tus ritmos favoritos.',
      icon: '🌈',
    },
    {
      title: 'Conecta con tu tribu',
      detail: 'Generamos recomendaciones de personas y academias que aman lo mismo que tú.',
      icon: '🤝',
    },
    {
      title: 'Explora nuevos estilos',
      detail: 'Siempre puedes editar tu selección y descubrir ritmos emergentes.',
      icon: '🧭',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(249, 115, 22, 0.3), transparent 45%),
          radial-gradient(circle at 85% 10%, rgba(14, 165, 233, 0.25), transparent 55%),
          linear-gradient(140deg, ${colors.dark[600]} 0%, ${colors.dark[300]} 100%)
        `,
        padding: 'clamp(1.5rem, 4vw, 4rem)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
        }}
      >
        <section
          style={{
            background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.85), rgba(21, 30, 53, 0.9))',
            borderRadius: borderRadius['2xl'],
            padding: 'clamp(1.5rem, 3vw, 2.75rem)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header style={{ marginBottom: spacing[3] }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)', fontWeight: 800, marginBottom: spacing[1] }}>
              Selecciona tus ritmos 🎵
            </h2>
            <p style={{ color: colors.gray[400], fontSize: '0.95rem' }}>
              Puedes elegir tantos ritmos como quieras. Usa los grupos para desplegar las opciones.
            </p>
          </header>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], flex: 1 }}>
            <div style={{ flex: 1 }}>
              <RitmosChips
                selected={selectedSlugs}
                onChange={setSelectedSlugs}
                readOnly={false}
              />
            </div>

            <div style={{ color: colors.gray[400], fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>{selectedSlugs.length} ritmo(s) seleccionado(s)</span>
              <span style={{ color: colors.gray[500] }}>Puedes editar esto después desde tu perfil</span>
            </div>

            {error && (
              <div
                style={{
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => navigate('/onboarding/basics')}
                style={{
                  width: '100%',
                  padding: spacing[2],
                  borderRadius: borderRadius.lg,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.5 : 1,
                }}
                disabled={isLoading}
              >
                ← Volver a Datos Básicos
              </button>
              <Button
                type="submit"
                disabled={isLoading || selectedSlugs.length === 0}
                style={{
                  width: '100%',
                  opacity: isLoading || selectedSlugs.length === 0 ? 0.7 : 1,
                  background: 'linear-gradient(120deg, #38bdf8, #c084fc)',
                }}
              >
                {isLoading ? 'Guardando...' : 'Continuar →'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

