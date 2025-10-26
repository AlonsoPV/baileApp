import { useAcademyMy, useUpsertAcademy } from './useAcademy';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

export function useAcademyRole() {
  const { user } = useAuth();
  const { data: academy, isLoading } = useAcademyMy();
  const upsert = useUpsertAcademy();

  const createAcademyIfNeeded = useCallback(async () => {
    if (!user || academy || isLoading) return;
    
    try {
      console.log('🎓 [useAcademyRole] Creando academia automáticamente para usuario:', user.id);
      await upsert.mutateAsync({
        nombre_publico: `Academia de ${user.email?.split('@')[0] || 'Usuario'}`,
        bio: '',
        ritmos: [],
        zonas: [],
        redes_sociales: {
          instagram: '',
          tiktok: '',
          youtube: '',
          facebook: '',
          whatsapp: '',
          web: ''
        },
        ubicaciones: [],
        horarios: [],
        media: [],
        estado_aprobacion: 'borrador'
      });
      console.log('✅ [useAcademyRole] Academia creada exitosamente');
    } catch (error) {
      console.error('❌ [useAcademyRole] Error al crear academia:', error);
    }
  }, [user, academy, isLoading, upsert]);

  return {
    academy,
    isLoading,
    createAcademyIfNeeded
  };
}
