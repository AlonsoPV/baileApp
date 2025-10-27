import { useMyBrand, useUpsertBrand } from './useBrand';
import { useAuth } from '@/contexts/AuthProvider';
import { useEffect } from 'react';

export function useBrandRole() {
  const { user } = useAuth();
  const { data: brand, isLoading } = useMyBrand();
  const upsert = useUpsertBrand();

  const createBrandIfNeeded = async () => {
    if (!user || brand || isLoading) return;
    
    try {
      console.log('🏷️ [useBrandRole] Creando marca automáticamente para usuario:', user.id);
      await upsert.mutateAsync({
        nombre_publico: `Marca de ${user.email?.split('@')[0] || 'Usuario'}`,
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
        media: [],
        productos: [],
        estado_aprobacion: 'borrador'
      });
      console.log('✅ [useBrandRole] Marca creada exitosamente');
    } catch (error) {
      console.error('❌ [useBrandRole] Error al crear marca:', error);
    }
  };

  return {
    brand,
    isLoading,
    createBrandIfNeeded
  };
}
