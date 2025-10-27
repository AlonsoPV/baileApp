import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AcademyProfile } from '../types/academy';

const TABLE = 'profiles_academy';

export function useAcademyMy() {
  return useQuery({
    queryKey: ['academy','mine'],
    queryFn: async (): Promise<AcademyProfile|null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AcademyProfile | null;
    }
  });
}

export function useAcademyPublic(id: number) {
  return useQuery({
    queryKey: ['academy','public', id],
    queryFn: async (): Promise<AcademyProfile|null> => {
      const { data, error } = await supabase
        .from('v_academies_public')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as AcademyProfile | null;
    }
  });
}

export function useUpsertAcademy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AcademyProfile>): Promise<AcademyProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No session');
      // Evitar error de identidad al insertar: si no hay id -> insert, si hay id -> update
      if (payload.id) {
        const id = payload.id;
        const patch: any = { ...payload };
        delete patch.id;
        delete patch.user_id;
        const { data, error } = await supabase
          .from(TABLE)
          .update(patch)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return data as AcademyProfile;
      } else {
        const insertData: any = { user_id: user.id, ...payload };
        delete insertData.id; // asegurar no enviar id en insert
        const { data, error } = await supabase
          .from(TABLE)
          .insert(insertData)
          .select('*')
          .single();
        if (error) throw error;
        return data as AcademyProfile;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academy','mine'] });
    }
  });
}

export function useSubmitAcademyForReview() {
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
      qc.invalidateQueries({ queryKey: ['academy','mine'] });
    }
  });
}