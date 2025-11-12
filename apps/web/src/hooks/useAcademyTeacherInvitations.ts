import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type AcademyTeacherInvitation = {
  id: number;
  academy_id: number;
  teacher_id: number;
  status: InvitationStatus;
  invited_by: string;
  invited_at: string;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AcceptedTeacher = {
  academy_id: number;
  teacher_id: number;
  teacher_profile_id: number;
  teacher_user_id: string;
  teacher_name: string;
  teacher_bio?: string | null;
  teacher_avatar?: string | null;
  teacher_ritmos: number[];
  teacher_zonas: number[];
  teacher_redes_sociales?: any;
  invited_at: string;
  responded_at?: string | null;
  created_at: string;
};

export type TeacherAcademy = {
  teacher_id: number;
  academy_id: number;
  academy_profile_id: number;
  academy_user_id: string;
  academy_name: string;
  academy_bio?: string | null;
  academy_avatar?: string | null;
  academy_portada?: string | null;
  academy_ritmos: number[];
  academy_zonas: number[];
  invited_at: string;
  responded_at?: string | null;
  created_at: string;
};

// Hook para obtener maestros disponibles (aprobados, que no estén ya invitados o aceptados)
export function useAvailableTeachers(academyId?: number) {
  return useQuery({
    queryKey: ['available-teachers', academyId],
    enabled: !!academyId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !academyId) return [];

      // Obtener todos los maestros aprobados
      const { data: allTeachers, error: teachersError } = await supabase
        .from('profiles_teacher')
        .select('id, user_id, nombre_publico, bio, avatar_url, ritmos, zonas, redes_sociales')
        .eq('estado_aprobacion', 'aprobado');

      if (teachersError) throw teachersError;
      if (!allTeachers || allTeachers.length === 0) return [];

      // Obtener invitaciones existentes para esta academia
      const { data: existingInvitations, error: invError } = await supabase
        .from('academy_teacher_invitations')
        .select('teacher_id, status')
        .eq('academy_id', academyId)
        .in('status', ['pending', 'accepted']);

      if (invError) throw invError;

      // Filtrar maestros que ya tienen invitación pendiente o aceptada
      const excludedTeacherIds = new Set(
        (existingInvitations || []).map((inv: any) => inv.teacher_id)
      );

      return allTeachers.filter((teacher: any) => !excludedTeacherIds.has(teacher.id));
    },
  });
}

// Hook para obtener maestros aceptados de una academia
export function useAcceptedTeachers(academyId?: number) {
  return useQuery({
    queryKey: ['accepted-teachers', academyId],
    enabled: !!academyId,
    queryFn: async (): Promise<AcceptedTeacher[]> => {
      if (!academyId) return [];

      const { data, error } = await supabase
        .from('v_academy_accepted_teachers')
        .select('*')
        .eq('academy_id', academyId)
        .order('responded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AcceptedTeacher[];
    },
  });
}

// Hook para obtener invitaciones recibidas por un maestro
export function useTeacherInvitations(teacherId?: number) {
  return useQuery({
    queryKey: ['teacher-invitations', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      if (!teacherId) return [];

      const { data, error } = await supabase
        .from('academy_teacher_invitations')
        .select(`
          *,
          profiles_academy!academy_id (
            id,
            nombre_publico,
            bio,
            avatar_url,
            portada_url,
            ritmos,
            zonas
          )
        `)
        .eq('teacher_id', teacherId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      // Mapear profiles_academy a academy para mantener compatibilidad
      return (data || []).map((inv: any) => ({
        ...inv,
        academy: inv.profiles_academy
      }));
    },
  });
}

// Hook para obtener academias donde un maestro enseña
export function useTeacherAcademies(teacherId?: number) {
  return useQuery({
    queryKey: ['teacher-academies', teacherId],
    enabled: !!teacherId,
    queryFn: async (): Promise<TeacherAcademy[]> => {
      if (!teacherId) return [];

      const { data, error } = await supabase
        .from('v_teacher_academies')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('responded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TeacherAcademy[];
    },
  });
}

// Hook para enviar invitación
export function useSendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ academyId, teacherId }: { academyId: number; teacherId: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño de la academia
      const { data: academy, error: academyError } = await supabase
        .from('profiles_academy')
        .select('id, user_id')
        .eq('id', academyId)
        .eq('user_id', user.id)
        .single();

      if (academyError || !academy) {
        throw new Error('No tienes permiso para enviar invitaciones desde esta academia');
      }

      // Verificar que no existe una invitación previa
      const { data: existing, error: checkError } = await supabase
        .from('academy_teacher_invitations')
        .select('id, status')
        .eq('academy_id', academyId)
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('Ya existe una invitación pendiente para este maestro');
        }
        if (existing.status === 'accepted') {
          throw new Error('Este maestro ya colabora con tu academia');
        }
        // Si fue rechazada o cancelada, podemos crear una nueva
      }

      const { data, error } = await supabase
        .from('academy_teacher_invitations')
        .insert({
          academy_id: academyId,
          teacher_id: teacherId,
          status: 'pending',
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AcademyTeacherInvitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['available-teachers'] });
      qc.invalidateQueries({ queryKey: ['teacher-invitations'] });
    },
  });
}

// Hook para aceptar/rechazar invitación
export function useRespondToInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: number; status: 'accepted' | 'rejected' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño del perfil de maestro
      const { data: invitation, error: invError } = await supabase
        .from('academy_teacher_invitations')
        .select(`
          *,
          teacher:profiles_teacher!teacher_id (user_id)
        `)
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) throw new Error('Invitación no encontrada');

      const teacherUserId = (invitation as any).teacher?.user_id;
      if (teacherUserId !== user.id) {
        throw new Error('No tienes permiso para responder esta invitación');
      }

      const { data, error } = await supabase
        .from('academy_teacher_invitations')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data as AcademyTeacherInvitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-invitations'] });
      qc.invalidateQueries({ queryKey: ['accepted-teachers'] });
      qc.invalidateQueries({ queryKey: ['teacher-academies'] });
    },
  });
}

// Hook para cancelar invitación (solo el dueño de la academia)
export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño de la academia
      const { data: invitation, error: invError } = await supabase
        .from('academy_teacher_invitations')
        .select(`
          *,
          academy:profiles_academy!academy_id (user_id)
        `)
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) throw new Error('Invitación no encontrada');

      const academyUserId = (invitation as any).academy?.user_id;
      if (academyUserId !== user.id) {
        throw new Error('No tienes permiso para cancelar esta invitación');
      }

      const { data, error } = await supabase
        .from('academy_teacher_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data as AcademyTeacherInvitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['available-teachers'] });
      qc.invalidateQueries({ queryKey: ['teacher-invitations'] });
    },
  });
}

