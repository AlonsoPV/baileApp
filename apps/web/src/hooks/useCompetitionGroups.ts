import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import type { CompetitionGroup, CompetitionGroupFormData } from '@/types/competitionGroup';

// Hook para obtener todos los grupos del usuario (como dueño o miembro)
export function useMyCompetitionGroups() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-competition-groups', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return [];

      // Obtener grupos donde el usuario es dueño o miembro
      const { data, error } = await supabase
        .from('competition_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CompetitionGroup[];
    },
  });
}

// Hook para obtener un grupo específico
export function useCompetitionGroup(groupId?: string) {
  return useQuery({
    queryKey: ['competition-group', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      if (!groupId) return null;

      const { data, error } = await supabase
        .from('competition_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data as CompetitionGroup;
    },
  });
}

// Hook para crear un grupo
export function useCreateCompetitionGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: CompetitionGroupFormData) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Sin restricciones: cualquier usuario autenticado puede crear grupos
      const { data, error } = await supabase
        .from('competition_groups')
        .insert({
          owner_id: user.id,
          name: formData.name,
          description: formData.description || null,
          training_schedule: formData.training_schedule || null,
          training_location: formData.training_location,
          cost_type: formData.cost_type,
          cost_amount: formData.cost_amount,
          cover_image_url: formData.cover_image_url || null,
          promo_video_url: formData.promo_video_url || null,
          academy_id: formData.academy_id || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Verificar si el usuario tiene perfil de maestro aprobado
      let memberRole: 'teacher' | 'student' = 'student';
      const { data: teacherProfile } = await supabase
        .from('profiles_teacher')
        .select('id, estado_aprobacion')
        .eq('user_id', user.id)
        .eq('estado_aprobacion', 'aprobado')
        .maybeSingle();

      // Solo asignar rol 'teacher' si tiene perfil de maestro aprobado
      if (teacherProfile) {
        memberRole = 'teacher';
      }

      // Agregar al creador como miembro
      await supabase
        .from('competition_group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: memberRole,
          is_active: true,
        });

      return data as CompetitionGroup;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-competition-groups'] });
      qc.invalidateQueries({ queryKey: ['competition-groups'] });
      if (data.academy_id) {
        qc.invalidateQueries({ queryKey: ['competition-groups-by-academy', data.academy_id] });
      }
      qc.invalidateQueries({ queryKey: ['competition-groups-by-teacher', data.owner_id] });
    },
  });
}

// Hook para actualizar un grupo
export function useUpdateCompetitionGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, formData }: { groupId: string; formData: Partial<CompetitionGroupFormData> }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño del grupo
      const { data: group, error: checkError } = await supabase
        .from('competition_groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (checkError) throw checkError;
      if (group.owner_id !== user.id) {
        throw new Error('No tienes permiso para editar este grupo');
      }

      const updateData: any = {};
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description || null;
      if (formData.training_schedule !== undefined) updateData.training_schedule = formData.training_schedule || null;
      if (formData.training_location !== undefined) updateData.training_location = formData.training_location;
      if (formData.cost_type !== undefined) updateData.cost_type = formData.cost_type;
      if (formData.cost_amount !== undefined) updateData.cost_amount = formData.cost_amount;
      if (formData.cover_image_url !== undefined) updateData.cover_image_url = formData.cover_image_url || null;
      if (formData.promo_video_url !== undefined) updateData.promo_video_url = formData.promo_video_url || null;
      if (formData.academy_id !== undefined) updateData.academy_id = formData.academy_id || null;

      const { data, error } = await supabase
        .from('competition_groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data as CompetitionGroup;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-group', variables.groupId] });
      qc.invalidateQueries({ queryKey: ['my-competition-groups'] });
      if (data.academy_id) {
        qc.invalidateQueries({ queryKey: ['competition-groups-by-academy', data.academy_id] });
      }
      qc.invalidateQueries({ queryKey: ['competition-groups-by-teacher', data.owner_id] });
    },
  });
}

// Hook para eliminar un grupo
export function useDeleteCompetitionGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño del grupo
      const { data: group, error: checkError } = await supabase
        .from('competition_groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (checkError) throw checkError;
      if (group.owner_id !== user.id) {
        throw new Error('No tienes permiso para eliminar este grupo');
      }

      const { error } = await supabase
        .from('competition_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: async (_, groupId) => {
      // Obtener el grupo antes de eliminarlo para invalidar las queries correctas
      const { data: group } = await supabase
        .from('competition_groups')
        .select('academy_id, owner_id')
        .eq('id', groupId)
        .single();
      
      qc.invalidateQueries({ queryKey: ['my-competition-groups'] });
      qc.invalidateQueries({ queryKey: ['competition-groups'] });
      if (group?.academy_id) {
        qc.invalidateQueries({ queryKey: ['competition-groups-by-academy', group.academy_id] });
      }
      if (group?.owner_id) {
        qc.invalidateQueries({ queryKey: ['competition-groups-by-teacher', group.owner_id] });
      }
    },
  });
}

// Hook para obtener grupos de competencia por academia
export function useCompetitionGroupsByAcademy(academyId?: number) {
  return useQuery({
    queryKey: ['competition-groups-by-academy', academyId],
    enabled: !!academyId,
    staleTime: 1000 * 60 * 2, // 2 minutos - grupos cambian poco
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      if (!academyId) return [];

      const { data, error } = await supabase
        .from('competition_groups')
        .select('*')
        .eq('academy_id', academyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enriquecer con datos del dueño (teacher) y academia
      const enrichedGroups = await Promise.all((data || []).map(async (group) => {
        let ownerName: string | null = null;
        let ownerType: 'academy' | 'teacher' | null = null;
        let ownerRitmos: number[] = [];
        let ownerRitmosSeleccionados: string[] = [];
        let ownerCoverUrl: string | null = null;

        // Si hay academy_id, el grupo pertenece a la academia
        if (group.academy_id) {
          const { data: academy } = await supabase
            .from('profiles_academy')
            .select('nombre_publico, portada_url, ritmos, ritmos_seleccionados')
            .eq('id', group.academy_id)
            .single();
          
          if (academy) {
            ownerName = academy.nombre_publico;
            ownerType = 'academy';
            ownerRitmos = academy.ritmos || [];
            ownerRitmosSeleccionados = academy.ritmos_seleccionados || [];
            ownerCoverUrl = academy.portada_url || null;
          }
        }

        // También obtener datos del teacher owner
        if (group.owner_id) {
          const { data: teacher } = await supabase
            .from('profiles_teacher')
            .select('nombre_publico, portada_url, ritmos, ritmos_seleccionados')
            .eq('user_id', group.owner_id)
            .maybeSingle();
          
          if (teacher && !ownerName) {
            ownerName = teacher.nombre_publico;
            ownerType = 'teacher';
            ownerRitmos = teacher.ritmos || [];
            ownerRitmosSeleccionados = teacher.ritmos_seleccionados || [];
            ownerCoverUrl = teacher.portada_url || null;
          }
        }

        return {
          ...group,
          owner_name: ownerName,
          owner_type: ownerType,
          owner_ritmos: ownerRitmos,
          owner_ritmos_seleccionados: ownerRitmosSeleccionados,
          owner_cover_url: ownerCoverUrl,
        };
      }));

      return enrichedGroups as CompetitionGroup[];
    },
  });
}

// Hook para obtener grupos de competencia por maestro (owner_id)
export function useCompetitionGroupsByTeacher(teacherUserId?: string) {
  return useQuery({
    queryKey: ['competition-groups-by-teacher', teacherUserId],
    enabled: !!teacherUserId,
    staleTime: 1000 * 60 * 2, // 2 minutos - grupos cambian poco
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      if (!teacherUserId) return [];

      const { data, error } = await supabase
        .from('competition_groups')
        .select('*')
        .eq('owner_id', teacherUserId)
        .is('academy_id', null) // Solo grupos que NO están asociados a una academia
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enriquecer con datos del teacher owner
      const enrichedGroups = await Promise.all((data || []).map(async (group) => {
        let ownerName: string | null = null;
        let ownerType: 'academy' | 'teacher' | null = null;
        let ownerRitmos: number[] = [];
        let ownerRitmosSeleccionados: string[] = [];
        let ownerCoverUrl: string | null = null;

        if (group.owner_id) {
          const { data: teacher } = await supabase
            .from('profiles_teacher')
            .select('nombre_publico, portada_url, ritmos, ritmos_seleccionados')
            .eq('user_id', group.owner_id)
            .maybeSingle();
          
          if (teacher) {
            ownerName = teacher.nombre_publico;
            ownerType = 'teacher';
            ownerRitmos = teacher.ritmos || [];
            ownerRitmosSeleccionados = teacher.ritmos_seleccionados || [];
            ownerCoverUrl = teacher.portada_url || null;
          }
        }

        return {
          ...group,
          owner_name: ownerName,
          owner_type: ownerType,
          owner_ritmos: ownerRitmos,
          owner_ritmos_seleccionados: ownerRitmosSeleccionados,
          owner_cover_url: ownerCoverUrl,
        };
      }));

      return enrichedGroups as CompetitionGroup[];
    },
  });
}

