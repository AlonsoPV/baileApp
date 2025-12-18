import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AcademyProfile } from '../types/academy';
import { useAuth } from '@/contexts/AuthProvider';

const TABLE = 'profiles_academy';

export function useAcademyMy() {
  const { user, loading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ['academy','mine'],
    enabled: !authLoading && !!user?.id, // Solo ejecutar cuando hay usuario autenticado
    queryFn: async (): Promise<AcademyProfile|null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AcademyProfile | null;
    },
    staleTime: 0, // Siempre considerar los datos como obsoletos para forzar refetch cuando se invalida
  });
}

export function useAcademyPublic(id: number) {
  return useQuery({
    queryKey: ['academy','public', id],
    enabled: typeof id === 'number' && !Number.isNaN(id) && id > 0,
    queryFn: async (): Promise<AcademyProfile|null> => {
      const { data, error } = await supabase
        .from('v_academies_public')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      let result: any = { ...data };
      
      // Obtener promociones si no están en la vista
      if (typeof result.promociones === 'undefined') {
        const { data: promosData, error: promosError } = await supabase
          .from('profiles_academy')
          .select('promociones')
          .eq('id', id)
          .maybeSingle();
        if (!promosError && promosData && typeof promosData.promociones !== 'undefined') {
          result.promociones = promosData.promociones;
        }
      }
      
      // Obtener extras (respuestas, WhatsApp, Stripe) si no están en la vista
      const needsRespuestas = typeof result.respuestas === 'undefined';
      const needsWhatsapp =
        typeof result.whatsapp_number === 'undefined' ||
        typeof result.whatsapp_message_template === 'undefined';
      const needsStripe =
        typeof (result as any).stripe_account_id === 'undefined' ||
        typeof (result as any).stripe_onboarding_status === 'undefined' ||
        typeof (result as any).stripe_charges_enabled === 'undefined' ||
        typeof (result as any).stripe_payouts_enabled === 'undefined';

      if (needsRespuestas || needsWhatsapp || needsStripe) {
        const { data: extraData, error: extraError } = await supabase
          .from('profiles_academy')
          .select('respuestas, whatsapp_number, whatsapp_message_template, stripe_account_id, stripe_onboarding_status, stripe_charges_enabled, stripe_payouts_enabled')
          .eq('id', id)
          .maybeSingle();

        if (!extraError && extraData) {
          if (needsRespuestas && typeof extraData.respuestas !== 'undefined') {
            result.respuestas = extraData.respuestas;
          }
          if (needsWhatsapp) {
            if (typeof extraData.whatsapp_number !== 'undefined') {
              result.whatsapp_number = extraData.whatsapp_number;
            }
            if (typeof extraData.whatsapp_message_template !== 'undefined') {
              result.whatsapp_message_template = extraData.whatsapp_message_template;
            }
          }
          if (needsStripe) {
            if (typeof extraData.stripe_account_id !== 'undefined') {
              (result as any).stripe_account_id = extraData.stripe_account_id;
            }
            if (typeof extraData.stripe_onboarding_status !== 'undefined') {
              (result as any).stripe_onboarding_status = extraData.stripe_onboarding_status;
            }
            if (typeof extraData.stripe_charges_enabled !== 'undefined') {
              (result as any).stripe_charges_enabled = extraData.stripe_charges_enabled;
            }
            if (typeof extraData.stripe_payouts_enabled !== 'undefined') {
              (result as any).stripe_payouts_enabled = extraData.stripe_payouts_enabled;
            }
          }
        }
      }

      return result as AcademyProfile;
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
        // Evitar duplicados si el onboarding/flujo corre dos veces:
        // buscar si ya existe un registro para este user_id
        const { data: existingByUser, error: findErr } = await supabase
          .from(TABLE)
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (findErr) throw findErr;

        const insertData: any = { user_id: user.id, ...payload };
        // Asegurar NOT NULL: nombre_publico
        if (!insertData.nombre_publico || String(insertData.nombre_publico).trim() === '') {
          insertData.nombre_publico = 'Mi Academia';
        }
        delete insertData.id; // asegurar no enviar id en insert/update

        if (existingByUser?.id) {
          // Ya existe -> hacer update para evitar duplicados
          const { data, error } = await supabase
            .from(TABLE)
            .update(insertData)
            .eq('id', existingByUser.id)
            .select('*')
            .single();
          if (error) throw error;
          return data as AcademyProfile;
        } else {
          // No existe -> insertar
          const { data, error } = await supabase
            .from(TABLE)
            .insert(insertData)
            .select('*')
            .single();
          if (error) throw error;
          return data as AcademyProfile;
        }
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