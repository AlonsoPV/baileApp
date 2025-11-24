import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import type { CompetitionGroupMember, CompetitionGroupMemberRole } from '@/types/competitionGroup';

// Hook para obtener miembros de un grupo
export function useCompetitionGroupMembers(groupId?: string) {
  return useQuery({
    queryKey: ['competition-group-members', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      if (!groupId) return [];

      // 1. Obtener miembros del grupo
      const { data: members, error: membersError } = await supabase
        .from('competition_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // 2. Obtener perfiles de usuario usando los user_id
      const userIds = members.map((m: any) => m.user_id);
      
      // Consulta directa a profiles_user para obtener perfiles de los miembros
      // No filtramos por onboarding_complete porque queremos ver todos los miembros
      // incluso si no han completado el onboarding
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_user')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('[useCompetitionGroupMembers] Error obteniendo perfiles:', profilesError);
        // Continuar sin perfiles enriquecidos si hay error
      }

      // 3. Crear un mapa de user_id -> perfil
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // 4. Enriquecer miembros con datos del usuario
      return members.map((m: any) => {
        const profile = profileMap.get(m.user_id);
        return {
          ...m,
          user_display_name: profile?.display_name || null,
          user_avatar_url: profile?.avatar_url || null,
        };
      }) as CompetitionGroupMember[];
    },
  });
}

// Hook para actualizar el rol de un miembro (solo dueño del grupo)
export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      memberId, 
      role 
    }: { 
      groupId: string; 
      memberId: string; 
      role: CompetitionGroupMemberRole 
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño del grupo
      const { data: group, error: checkError } = await supabase
        .from('competition_groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (checkError) throw checkError;
      if (group.owner_id !== user.id) {
        throw new Error('Solo el dueño del grupo puede cambiar roles');
      }

      const { data, error } = await supabase
        .from('competition_group_members')
        .update({ role })
        .eq('id', memberId)
        .eq('group_id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data as CompetitionGroupMember;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-group-members', variables.groupId] });
    },
  });
}

// Hook para remover un miembro (solo dueño del grupo o el mismo usuario)
export function useRemoveMember() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener el miembro
      const { data: member, error: memberError } = await supabase
        .from('competition_group_members')
        .select('user_id, group_id')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Verificar permisos: dueño del grupo o el mismo usuario
      const { data: group, error: checkError } = await supabase
        .from('competition_groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (checkError) throw checkError;
      if (group.owner_id !== user.id && member.user_id !== user.id) {
        throw new Error('No tienes permiso para remover este miembro');
      }

      // Desactivar en lugar de eliminar
      const { error } = await supabase
        .from('competition_group_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-group-members', variables.groupId] });
    },
  });
}

