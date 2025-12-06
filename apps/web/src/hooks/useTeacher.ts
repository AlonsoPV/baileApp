import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getMediaBySlot } from '@/utils/mediaSlots';
import { useAuth } from '@/contexts/AuthProvider';

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
  // Configuración de WhatsApp para clases (número y template de mensaje)
  whatsapp_number?: string | null;
  whatsapp_message_template?: string | null;
  ubicaciones?: any[];
  cronograma?: any[];
  costos?: any[];
  promociones?: any[];
  media: { type: 'image'|'video'; url: string; slot?: string }[];
  faq?: { q: string; a: string }[];
  estado_aprobacion: 'borrador'|'en_revision'|'aprobado'|'rechazado';
  stripe_account_id?: string | null;
  stripe_onboarding_status?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

const TABLE = 'profiles_teacher';

function resolveTeacherAvatar(profile?: TeacherProfile | null): string | null {
  if (!profile) return null;
  const mediaList = Array.isArray(profile.media) ? profile.media : [];
  const preferredSlots = ['p1','avatar','cover'] as const;
  for (const slot of preferredSlots) {
    const item = getMediaBySlot(mediaList as any, slot);
    if (item?.url) return item.url;
  }
  const firstMedia = mediaList.find((m) => m?.url);
  if (firstMedia?.url) return firstMedia.url;
  return profile.avatar_url || profile.portada_url || null;
}

function normalizeTeacherProfile(profile: TeacherProfile | null): TeacherProfile | null {
  if (!profile) return null;
  const resolvedAvatar = resolveTeacherAvatar(profile);
  return {
    ...profile,
    media: Array.isArray(profile.media) ? profile.media : [],
    avatar_url: resolvedAvatar || profile.avatar_url || null,
  };
}

export function useTeacherMy() {
  const { user, loading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ['teacher','mine'],
    enabled: !authLoading && !!user?.id && typeof user.id === 'string' && user.id.length > 0,
    queryFn: async (): Promise<TeacherProfile|null> => {
      if (!user?.id || typeof user.id !== 'string') {
        console.warn('[useTeacherMy] Usuario sin ID válido');
        return null;
      }
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        // PGRST116 = No rows found (esperado cuando no hay perfil)
        if (error.code === 'PGRST116') {
          return null;
        }
        // Error 406 = Not Acceptable (posible problema de RLS o tabla no existe)
        const errAny = error as any;
        if (error.code === '406' || errAny.status === 406) {
          console.warn('[useTeacherMy] Error 406 al cargar perfil (posible problema de RLS):', error);
          return null;
        }
        // Para otros errores, lanzar para que React Query los maneje
        console.error('[useTeacherMy] Error inesperado al cargar perfil:', error);
        throw error;
      }
      return normalizeTeacherProfile(data as TeacherProfile | null);
    },
    staleTime: 0, // Siempre considerar los datos como obsoletos para forzar refetch cuando se invalida
    refetchOnWindowFocus: true, // Refrescar cuando vuelves a la ventana para detectar aprobaciones
    refetchInterval: 30000, // Refrescar cada 30 segundos para detectar cambios de aprobación
    retry: (failureCount, error: any) => {
      // No reintentar si es error 406 o PGRST116
      const errAny = error as any;
      if (error?.code === '406' || error?.code === 'PGRST116' || errAny?.status === 406) {
        return false;
      }
      // Reintentar hasta 2 veces para otros errores
      return failureCount < 2;
    },
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
      return normalizeTeacherProfile(data as TeacherProfile | null);
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
      
      // Filtrar claves no existentes en la tabla (evita PGRST204 con columnas como "estilos")
      const allowed = new Set([
        'user_id','nombre_publico','bio','avatar_url','portada_url',
        'ritmos','ritmos_seleccionados','zonas',
        'redes_sociales','ubicaciones','cronograma','costos','promociones','faq',
        'whatsapp_number','whatsapp_message_template',
        'estado_aprobacion','updated_at','created_at'
      ]);
      const filtered: any = {};
      for (const k of Object.keys(base)) {
        if (allowed.has(k) && base[k] !== undefined) filtered[k] = base[k];
      }
      
      // Intentar UPSERT por user_id; si falla, usar fallback con INSERT/UPDATE
      let { data, error } = await supabase
        .from(TABLE)
        .upsert(filtered, { onConflict: 'user_id', ignoreDuplicates: false })
        .select('*')
        .single();
      
      if (error) {
        // Error 400 puede ser por falta de constraint único o datos inválidos
        // Intentar fallback: primero verificar si existe el registro
        const { data: existing } = await supabase
          .from(TABLE)
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existing) {
          // Existe: hacer UPDATE
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
          return normalizeTeacherProfile(refetch as TeacherProfile) as TeacherProfile;
        } else {
          // No existe: hacer INSERT
          // Asegurar que nombre_publico existe (campo requerido)
          if (!filtered.nombre_publico) {
            filtered.nombre_publico = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Maestro';
          }
          const { data: inserted, error: insError } = await supabase
            .from(TABLE)
            .insert(filtered)
            .select('*')
            .single();
          if (insError) {
            console.error('❌ [useTeacher] Error en INSERT:', insError);
            throw insError;
          }
          return normalizeTeacherProfile(inserted as TeacherProfile) as TeacherProfile;
        }
      }
      return normalizeTeacherProfile(data as TeacherProfile) as TeacherProfile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher','mine'] });
    }
  });
}


