import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Chip } from '@ui/index';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { useTags } from '../../hooks/useTags';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { routes } from '@/routes/registry';
import { mergeProfile } from '../../utils/mergeProfile';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export function PickZonas() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: zonas, isLoading: loadingTags } = useTags('zona');
  const { profile, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Mutación para marcar onboarding como completo
  const finishOnboarding = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles_user")
        .update({ onboarding_complete: true })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      // 🔁 Asegura que el guard vea el cambio
      qc.setQueryData(["onboarding-status", user?.id], { onboarding_complete: true });
      await qc.invalidateQueries({ queryKey: ["onboarding-status", user?.id] });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
      navigate(routes.app.profile, { replace: true });
    }
  });

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
      const updates = mergeProfile(profile as any, {
        zonas: selectedIds,
      });
      
      await updateProfileFields(updates);
      showToast('Zonas guardadas exitosamente 📍', 'success');
      
      // Redirigir a configurar PIN (paso 4)
      navigate('/auth/pin/setup', { replace: true });
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.gradients.dark,
        padding: spacing[2],
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: colors.glass.strong,
          borderRadius: borderRadius.xl,
          padding: spacing[4],
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: spacing[1] }}>
            Paso 3: Zonas 📍
          </h1>
          <p style={{ color: colors.gray[400] }}>
            ¿En qué zonas bailas? (selecciona todas las que quieras)
          </p>
        </div>

        {loadingTags ? (
          <div style={{ textAlign: 'center', padding: spacing[4], color: colors.gray[400] }}>
            Cargando zonas...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing[4], display: 'flex', flexWrap: 'wrap', gap: spacing[1] }}>
              {zonas?.map((zona) => (
                <div key={zona.id} onClick={() => toggleZona(zona.id)} style={{ cursor: 'pointer' }}>
                  <Chip
                    label={zona.nombre}
                    active={selectedIds.includes(zona.id)}
                  />
                </div>
              ))}
            </div>

            <div style={{ color: colors.gray[500], fontSize: '0.875rem', marginBottom: spacing[3] }}>
              {selectedIds.length} zona(s) seleccionada(s)
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

            <Button
              type="submit"
              disabled={isLoading || selectedIds.length === 0}
              style={{
                width: '100%',
                opacity: isLoading || selectedIds.length === 0 ? 0.5 : 1,
              }}
            >
              {isLoading ? 'Guardando...' : 'Finalizar ✨'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

