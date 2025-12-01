import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Chip } from '@ui/index';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { useTags } from '../../hooks/useTags';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { routes } from '@/routes/registry';
import { mergeProfile } from '../../utils/mergeProfile';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import ZonaGroupedChips from '@/components/profile/ZonaGroupedChips';
import { useZonaCatalogGroups } from '@/hooks/useZonaCatalogGroups';

export function PickZonas() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: allTags, isLoading: loadingTags } = useTags();
  const { profile, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { groups: zonaGroups } = useZonaCatalogGroups(allTags);

  // Ya no necesitamos finishOnboarding separado, se hace en handleSubmit

  const toggleZona = (id: number) => {
    // Para usuarios con rol "usuario", solo permitir una zona
    if (selectedIds.includes(id)) {
      // Si ya está seleccionada, deseleccionarla
      setSelectedIds([]);
    } else {
      // Si hay otra zona seleccionada, reemplazarla con la nueva
      setSelectedIds([id]);
    }
  };

  useEffect(() => {
    if (profile?.zonas?.length) {
      setSelectedIds(profile.zonas as number[]);
    }
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Guardar zonas primero
      const updates = mergeProfile(profile as any, {
        zonas: selectedIds,
      });
      await updateProfileFields(updates);
      
      // 2. Marcar onboarding como completo (operación rápida y directa)
      if (user?.id) {
        const { error: completeError } = await supabase
          .from("profiles_user")
          .update({ onboarding_complete: true })
          .eq("user_id", user.id)
          .select()
          .single();
        
        if (completeError) {
          console.warn("[PickZonas] Error marking onboarding complete:", completeError);
          // No fallar si esto falla, las zonas ya se guardaron
        } else {
          // Actualizar cache local inmediatamente para mejor UX
          qc.setQueryData(["onboarding-status", user.id], { onboarding_complete: true });
          qc.invalidateQueries({ queryKey: ["profile", "me", user.id] });
        }
      }
      
      showToast('¡Onboarding completado! 🎉', 'success');

      // Navegar después de un breve delay para que el usuario vea el mensaje
      setTimeout(() => {
        navigate(routes.app.explore, { replace: true });
      }, 500);
    } catch (err: any) {
      setError(err.message);
      showToast('Error al guardar zonas', 'error');
      setIsLoading(false);
    }
  };

  // Removed handleSkip - users must click "Finalizar" to proceed

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.3), transparent 45%),
          radial-gradient(circle at 80% 10%, rgba(234, 179, 8, 0.28), transparent 55%),
          linear-gradient(145deg, ${colors.dark[600]} 0%, ${colors.dark[300]} 100%)
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
            background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.9), rgba(17, 24, 39, 0.92))',
            borderRadius: borderRadius['2xl'],
            padding: 'clamp(1.5rem, 3vw, 2.75rem)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
            color: '#fff',
          }}
        >
          <header style={{ marginBottom: spacing[3], textAlign: 'left' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#bbf7d0',
              marginBottom: spacing[2],
            }}>
              <span>3 / 3</span>
              <span>Zona donde vives</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 2vw, 2.1rem)', fontWeight: 800, marginBottom: spacing[1] }}>
              ¿Dónde vives? 📍
            </h2>
            <p style={{ color: colors.gray[400], fontSize: '0.95rem' }}>
              Elige una zona única de donde vives. Esto nos ayuda a personalizar tus recomendaciones y conectarte con eventos y clases cercanos a ti.
            </p>
            <div style={{
              marginTop: spacing[2],
              padding: spacing[2],
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: borderRadius.md,
              fontSize: '0.875rem',
              color: '#fde047',
            }}>
              ⚠️ Solo puedes elegir una zona. Puedes cambiarla después desde tu perfil.
            </div>
          </header>

          {loadingTags ? (
            <div style={{ textAlign: 'center', padding: spacing[4], color: colors.gray[400] }}>
              Cargando zonas...
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              <div style={{ flex: 1 }}>
                <ZonaGroupedChips
                  allTags={allTags}
                  selectedIds={selectedIds}
                  onToggle={toggleZona}
                  mode="edit"
                  singleSelect={true}
                />
              </div>

              <div style={{ color: colors.gray[400], fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span>{selectedIds.length > 0 ? '✅ Zona seleccionada' : '⚠️ Debes seleccionar una zona para continuar'}</span>
                <span style={{ color: colors.gray[500] }}>Puedes cambiarla después desde tu perfil</span>
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
                  onClick={() => navigate('/onboarding/ritmos')}
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
                  ← Volver a Ritmos
                </button>
                <Button
                  type="submit"
                  disabled={isLoading || selectedIds.length !== 1}
                  style={{
                    width: '100%',
                    opacity: isLoading || selectedIds.length !== 1 ? 0.6 : 1,
                    background: 'linear-gradient(120deg, #34d399, #fbbf24)',
                  }}
                >
                  {isLoading ? 'Guardando...' : 'Finalizar ✨'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

