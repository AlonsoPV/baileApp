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
      const base = { user_id: user.id, ...payload };
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(base, { onConflict: 'id', ignoreDuplicates: false })
        .select('*')
        .single();
      if (error) throw error;
      return data as BrandProfile;
    },
    onSuccess: () => {
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
