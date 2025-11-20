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
  teacher_portada?: string | null;
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
      // Solo excluir maestros con invitaciones 'pending' o 'accepted'
      // Los maestros con invitaciones 'cancelled' o 'rejected' pueden volver a ser invitados
      const { data: existingInvitations, error: invError } = await supabase
        .from('academy_teacher_invitations')
        .select('teacher_id, status')
        .eq('academy_id', academyId)
        .in('status', ['pending', 'accepted']);

      if (invError) throw invError;

      // Filtrar maestros que ya tienen invitación pendiente o aceptada
      // NOTA: Los maestros con status 'cancelled' o 'rejected' NO se excluyen,
      // permitiendo que puedan volver a ser invitados
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

      console.log('[useAcceptedTeachers] Buscando maestros aceptados para academia:', academyId);
      const { data, error } = await supabase
        .from('v_academy_accepted_teachers')
        .select('*')
        .eq('academy_id', academyId)
        .order('responded_at', { ascending: false });

      if (error) {
        console.error('[useAcceptedTeachers] Error:', error);
        throw error;
      }
      console.log('[useAcceptedTeachers] Maestros encontrados:', data?.length || 0, data);
      
      if (!data || data.length === 0) return [];

      // Obtener los IDs de los maestros
      const teacherIds = data.map((t: any) => t.teacher_id);
      console.log('[useAcceptedTeachers] IDs de maestros a buscar:', teacherIds);
      
      // Hacer una consulta adicional para obtener los datos completos de los maestros
      let teacherProfiles: any[] | null = null;
      let teacherError: any = null;
      
      try {
        // Intentar obtener desde profiles_teacher (debe tener RLS que permita ver maestros aprobados)
        const { data: directData, error: directError } = await supabase
          .from('profiles_teacher')
          .select('id, avatar_url, portada_url, media')
          .in('id', teacherIds)
          .eq('estado_aprobacion', 'aprobado'); // Solo maestros aprobados
        
        if (directError) {
          teacherError = directError;
          console.error('[useAcceptedTeachers] Error al obtener perfiles de maestros:', directError);
        } else {
          teacherProfiles = directData;
          console.log('[useAcceptedTeachers] Perfiles de maestros obtenidos:', teacherProfiles);
        }
      } catch (err) {
        teacherError = err;
        console.error('[useAcceptedTeachers] Excepción al obtener perfiles:', err);
      }

      // Crear un mapa de teacher_id -> perfil completo
      const teacherMap = new Map();
      if (teacherProfiles) {
        teacherProfiles.forEach((profile: any) => {
          console.log('[useAcceptedTeachers] Mapeando perfil:', profile.id, 'avatar:', profile.avatar_url, 'portada:', profile.portada_url);
          teacherMap.set(profile.id, profile);
        });
      }

      // Combinar los datos de la vista con los datos completos del perfil
      const enrichedData = data.map((t: any) => {
        const fullProfile = teacherMap.get(t.teacher_id);
        
        // Intentar obtener avatar/portada del campo media si no están en las URLs directas
        let avatarFromMedia = null;
        let portadaFromMedia = null;
        if (fullProfile?.media && Array.isArray(fullProfile.media)) {
          // Buscar imagen de portada (cover, p1) o primera imagen
          const coverImage = fullProfile.media.find((m: any) => 
            m?.slot === 'cover' || m?.slot === 'p1' || m?.type === 'image'
          );
          if (coverImage?.url) {
            portadaFromMedia = coverImage.url;
          }
          // Buscar avatar
          const avatarImage = fullProfile.media.find((m: any) => 
            m?.slot === 'avatar' || (m?.type === 'image' && !coverImage)
          );
          if (avatarImage?.url) {
            avatarFromMedia = avatarImage.url;
          }
          // Si no hay portada pero hay una imagen, usarla como portada
          if (!portadaFromMedia && fullProfile.media[0]?.url) {
            portadaFromMedia = fullProfile.media[0].url;
          }
        }
        
        const enriched = {
          ...t,
          teacher_avatar: fullProfile?.avatar_url || avatarFromMedia || t.teacher_avatar || null,
          teacher_portada: fullProfile?.portada_url || portadaFromMedia || t.teacher_portada || null,
          teacher_media: fullProfile?.media || t.teacher_media || [],
        };
        console.log('[useAcceptedTeachers] Datos enriquecidos para teacher_id', t.teacher_id, ':', {
          teacher_avatar: enriched.teacher_avatar,
          teacher_portada: enriched.teacher_portada,
          teacher_media: enriched.teacher_media
        });
        return enriched;
      });

      if (enrichedData.length > 0) {
        console.log('[useAcceptedTeachers] Primer maestro enriquecido:', enrichedData[0]);
        console.log('[useAcceptedTeachers] teacher_avatar:', enrichedData[0].teacher_avatar);
        console.log('[useAcceptedTeachers] teacher_portada:', enrichedData[0].teacher_portada);
      }
      
      return enrichedData as AcceptedTeacher[];
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

      console.log('[useTeacherAcademies] Buscando academias para maestro:', teacherId);
      const { data, error } = await supabase
        .from('v_teacher_academies')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('responded_at', { ascending: false });

      if (error) {
        console.error('[useTeacherAcademies] Error:', error);
        throw error;
      }
      console.log('[useTeacherAcademies] Academias encontradas:', data?.length || 0, data);
      
      if (!data || data.length === 0) return [];

      // Obtener los IDs de las academias
      const academyIds = data.map((a: any) => a.academy_id);
      console.log('[useTeacherAcademies] IDs de academias a buscar:', academyIds);
      
      // Intentar obtener desde la vista pública primero (solo academias aprobadas)
      let academyProfiles: any[] | null = null;
      let academyError: any = null;
      
      try {
        const { data: publicData, error: publicError } = await supabase
          .from('v_academies_public')
          .select('id, avatar_url, portada_url, media')
          .in('id', academyIds);
        
        if (!publicError && publicData) {
          academyProfiles = publicData;
          console.log('[useTeacherAcademies] Perfiles obtenidos desde v_academies_public:', academyProfiles);
        } else {
          // Si falla la vista pública, intentar directamente desde profiles_academy
          console.log('[useTeacherAcademies] Intentando desde profiles_academy directamente...');
          const { data: directData, error: directError } = await supabase
            .from('profiles_academy')
            .select('id, avatar_url, portada_url, media')
            .in('id', academyIds);
          
          if (directError) {
            academyError = directError;
            console.error('[useTeacherAcademies] Error al obtener perfiles de academias:', directError);
          } else {
            academyProfiles = directData;
            console.log('[useTeacherAcademies] Perfiles obtenidos desde profiles_academy:', academyProfiles);
          }
        }
      } catch (err) {
        academyError = err;
        console.error('[useTeacherAcademies] Excepción al obtener perfiles:', err);
      }

      // Crear un mapa de academy_id -> perfil completo
      const academyMap = new Map();
      if (academyProfiles) {
        academyProfiles.forEach((profile: any) => {
          console.log('[useTeacherAcademies] Mapeando perfil:', profile.id, 'avatar:', profile.avatar_url, 'portada:', profile.portada_url);
          academyMap.set(profile.id, profile);
        });
      }

      // Combinar los datos de la vista con los datos completos del perfil
      const enrichedData = data.map((a: any) => {
        const fullProfile = academyMap.get(a.academy_id);
        
        // Intentar obtener avatar/portada del campo media si no están en las URLs directas
        let avatarFromMedia = null;
        let portadaFromMedia = null;
        if (fullProfile?.media && Array.isArray(fullProfile.media)) {
          // Buscar imagen de portada (cover, p1) o primera imagen
          const coverImage = fullProfile.media.find((m: any) => 
            m?.slot === 'cover' || m?.slot === 'p1' || m?.type === 'image'
          );
          if (coverImage?.url) {
            portadaFromMedia = coverImage.url;
          }
          // Buscar avatar
          const avatarImage = fullProfile.media.find((m: any) => 
            m?.slot === 'avatar' || (m?.type === 'image' && !coverImage)
          );
          if (avatarImage?.url) {
            avatarFromMedia = avatarImage.url;
          }
          // Si no hay portada pero hay una imagen, usarla como portada
          if (!portadaFromMedia && fullProfile.media[0]?.url) {
            portadaFromMedia = fullProfile.media[0].url;
          }
        }
        
        const enriched = {
          ...a,
          academy_avatar: fullProfile?.avatar_url || avatarFromMedia || a.academy_avatar || null,
          academy_portada: fullProfile?.portada_url || portadaFromMedia || a.academy_portada || null,
          academy_media: fullProfile?.media || a.academy_media || [],
        };
        console.log('[useTeacherAcademies] Datos enriquecidos para academy_id', a.academy_id, ':', {
          academy_avatar: enriched.academy_avatar,
          academy_portada: enriched.academy_portada,
          academy_media: enriched.academy_media
        });
        return enriched;
      });

      if (enrichedData.length > 0) {
        console.log('[useTeacherAcademies] Primera academia enriquecida:', enrichedData[0]);
        console.log('[useTeacherAcademies] academy_avatar:', enrichedData[0].academy_avatar);
        console.log('[useTeacherAcademies] academy_portada:', enrichedData[0].academy_portada);
      }
      
      return enrichedData as TeacherAcademy[];
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

      // Verificar si existe una invitación previa
      const { data: existing, error: checkError } = await supabase
        .from('academy_teacher_invitations')
        .select('id, status')
        .eq('academy_id', academyId)
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (checkError) throw checkError;

      let data;
      let error;

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('Ya existe una invitación pendiente para este maestro');
        }
        if (existing.status === 'accepted') {
          throw new Error('Este maestro ya colabora con tu academia');
        }
        // Si fue rechazada o cancelada, actualizar la invitación existente en lugar de crear una nueva
        // Esto evita el error 409 (Conflict) por la restricción UNIQUE(academy_id, teacher_id)
        const { data: updatedData, error: updateError } = await supabase
          .from('academy_teacher_invitations')
          .update({
            status: 'pending',
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            responded_at: null, // Limpiar la fecha de respuesta anterior
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        data = updatedData;
        error = updateError;
      } else {
        // No existe invitación previa, crear una nueva
        const { data: insertedData, error: insertError } = await supabase
          .from('academy_teacher_invitations')
          .insert({
            academy_id: academyId,
            teacher_id: teacherId,
            status: 'pending',
            invited_by: user.id,
          })
          .select()
          .single();
        
        data = insertedData;
        error = insertError;
      }

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
      qc.invalidateQueries({ queryKey: ['available-teachers'] });
      // Forzar refetch inmediato
      qc.refetchQueries({ queryKey: ['teacher-invitations'] });
      qc.refetchQueries({ queryKey: ['accepted-teachers'] });
      qc.refetchQueries({ queryKey: ['teacher-academies'] });
    },
  });
}

// Hook para cancelar invitación (solo el dueño de la academia)
export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: number): Promise<{ invitation: AcademyTeacherInvitation; academyId: number }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño de la academia
      const { data: invitation, error: invError } = await supabase
        .from('academy_teacher_invitations')
        .select(`
          *,
          academy:profiles_academy!academy_id (user_id, id)
        `)
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) throw new Error('Invitación no encontrada');

      const academyUserId = (invitation as any).academy?.user_id;
      const academyId = (invitation as any).academy?.id;
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
      return { invitation: data as AcademyTeacherInvitation, academyId };
    },
    onSuccess: (result) => {
      const academyId = result.academyId;
      // Invalidar todas las queries relacionadas con el academyId específico
      qc.invalidateQueries({ queryKey: ['available-teachers', academyId] });
      qc.invalidateQueries({ queryKey: ['accepted-teachers', academyId] });
      qc.invalidateQueries({ queryKey: ['teacher-invitations'] });
      qc.invalidateQueries({ queryKey: ['teacher-academies'] });
      // También invalidar sin academyId para cubrir todos los casos
      qc.invalidateQueries({ queryKey: ['available-teachers'] });
      qc.invalidateQueries({ queryKey: ['accepted-teachers'] });
      // Refetch inmediato para actualizar la UI
      qc.refetchQueries({ queryKey: ['accepted-teachers', academyId] });
      qc.refetchQueries({ queryKey: ['available-teachers', academyId] });
    },
  });
}

