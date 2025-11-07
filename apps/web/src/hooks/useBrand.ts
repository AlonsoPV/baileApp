import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { BrandProfile } from '../types/brand';

const TABLE = 'profiles_brand';

export function useMyBrand() {
  return useQuery({
    queryKey: ['brand','mine'],
    queryFn: async (): Promise<BrandProfile|null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BrandProfile | null;
    }
  });
}

export function useBrandPublic(id: number) {
  return useQuery({
    queryKey: ['brand','public', id],
    queryFn: async (): Promise<BrandProfile | null> => {
      const { data, error } = await supabase
        .from('v_brands_public')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as BrandProfile | null;
    }
  });
}

export function useUpsertBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BrandProfile>): Promise<BrandProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No session');
      // ✅ Payload primero, luego defaults (para que payload tenga prioridad)
      const base = { user_id: user.id, ...payload } as any;
      
      console.log('🔍 [useBrand] Payload recibido:', payload);
      console.log('📦 [useBrand] Base con user_id:', base);
      console.log('✅ [useBrand] Estado de aprobación en base:', base.estado_aprobacion);
      
      // Intento robusto sin depender de unique constraints
      // 1) ¿Existe ya la marca del usuario?
      const { data: existing, error: selErr } = await supabase
        .from(TABLE)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing?.id) {
        // Remover 'id' del payload para UPDATE (GENERATED ALWAYS)
        const { id, ...updatePayload } = base;
        console.log('🔄 [useBrand] UPDATE payload:', updatePayload);
        const { data, error } = await supabase
          .from(TABLE)
          .update(updatePayload)
          .eq('id', existing.id)
          .select('*')
          .single();
        if (error) {
          console.error('❌ [useBrand] Error en UPDATE:', error);
          throw error;
        }
        console.log('✅ [useBrand] UPDATE exitoso:', data);
        return data as BrandProfile;
      } else {
        console.log('➕ [useBrand] INSERT payload:', base);
        const { data, error } = await supabase
          .from(TABLE)
          .insert(base)
          .select('*')
          .single();
        if (error) {
          console.error('❌ [useBrand] Error en INSERT:', error);
          throw error;
        }
        console.log('✅ [useBrand] INSERT exitoso:', data);
        return data as BrandProfile;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 [useBrand] onSuccess, invalidando queries. Data:', data);
      qc.invalidateQueries({ queryKey: ['brand','mine'] });
    }
  });
}

export function useSubmitBrandForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ estado_aprobacion: 'en_revision' })
        .eq('id', id)
        .select('id,estado_aprobacion')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand','mine'] });
    }
  });
}
