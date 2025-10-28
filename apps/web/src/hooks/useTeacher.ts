import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type TeacherProfile = {
  id?: number;
  user_id: string;
  nombre_publico: string;
  bio?: string | null;
  avatar_url?: string | null;
  portada_url?: string | null;
  ritmos: number[];
  zonas: number[];
  redes_sociales?: { instagram?: string|null; tiktok?: string|null; youtube?: string|null; facebook?: string|null; whatsapp?: string|null };
  ubicaciones?: any[];
  cronograma?: any[];
  costos?: any[];
  media: { type: 'image'|'video'; url: string }[];
  faq?: { q: string; a: string }[];
  estado_aprobacion: 'borrador'|'en_revision'|'aprobado'|'rechazado';
  created_at?: string;
  updated_at?: string;
};

const TABLE = 'profiles_teacher';

export function useTeacherMy() {
  return useQuery({
    queryKey: ['teacher','mine'],
    queryFn: async (): Promise<TeacherProfile|null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TeacherProfile | null;
    }
  });
}

export function useTeacherPublic(id: number) {
  return useQuery({
    queryKey: ['teacher','public', id],
    queryFn: async (): Promise<TeacherProfile|null> => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as TeacherProfile | null;
    }
  });
}

export function useUpsertTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TeacherProfile>): Promise<TeacherProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No session');
      const base = { user_id: user.id, estado_aprobacion: 'borrador', ...payload };
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(base, { onConflict: 'id', ignoreDuplicates: false })
        .select('*')
        .single();
      if (error) throw error;
      return data as TeacherProfile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher','mine'] });
    }
  });
}


