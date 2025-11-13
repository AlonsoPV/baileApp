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
  ritmos_seleccionados?: string[]; // IDs de catálogo (RITMOS_CATALOG)
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
    enabled: typeof id === 'number' && !Number.isNaN(id) && id > 0,
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
      // ✅ Payload primero, luego defaults (para que payload.estado_aprobacion tenga prioridad)
      const base = { user_id: user.id, ...payload, estado_aprobacion: payload.estado_aprobacion || 'borrador' } as any;
      
      console.log('🔍 [useTeacher] Payload recibido:', payload);
      console.log('📦 [useTeacher] Base con user_id:', base);
      console.log('✅ [useTeacher] Estado de aprobación en base:', base.estado_aprobacion);
      
      // Filtrar claves no existentes en la tabla (evita PGRST204 con columnas como "estilos")
      const allowed = new Set([
        'user_id','nombre_publico','bio','avatar_url','portada_url',
        'ritmos','ritmos_seleccionados','zonas',
        'redes_sociales','ubicaciones','cronograma','costos','faq',
        'estado_aprobacion','updated_at','created_at'
      ]);
      const filtered: any = {};
      for (const k of Object.keys(base)) {
        if (allowed.has(k) && base[k] !== undefined) filtered[k] = base[k];
      }
      
      console.log('🔄 [useTeacher] Filtered payload:', filtered);
      
      // Intentar UPSERT por user_id; si falla por conflicto, hacer UPDATE
      let { data, error } = await supabase
        .from(TABLE)
        .upsert(filtered, { onConflict: 'user_id', ignoreDuplicates: false })
        .select('*')
        .single();
      if (error) {
        console.log('⚠️ [useTeacher] UPSERT falló, intentando UPDATE directo');
        // Fallback: update directo por user_id
        const { error: updError } = await supabase
          .from(TABLE)
          .update(filtered)
          .eq('user_id', user.id);
        if (updError) {
          console.error('❌ [useTeacher] Error en UPDATE:', updError);
          throw updError;
        }
        const { data: refetch, error: refErr } = await supabase
          .from(TABLE)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (refErr) throw refErr;
        console.log('✅ [useTeacher] UPDATE exitoso (fallback):', refetch);
        return refetch as TeacherProfile;
      }
      console.log('✅ [useTeacher] UPSERT exitoso:', data);
      return data as TeacherProfile;
    },
    onSuccess: (data) => {
      console.log('🎉 [useTeacher] onSuccess, invalidando queries. Data:', data);
      qc.invalidateQueries({ queryKey: ['teacher','mine'] });
    }
  });
}


