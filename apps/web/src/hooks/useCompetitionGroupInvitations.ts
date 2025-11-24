import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import type { CompetitionGroupInvitation, CompetitionGroupInvitationStatus } from '@/types/competitionGroup';

// Hook para obtener invitaciones enviadas por un grupo
export function useGroupInvitations(groupId?: string) {
  return useQuery({
    queryKey: ['competition-group-invitations', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('competition_group_invitations')
        .select(`
          *,
          competition_groups!group_id (
            name,
            cover_image_url
          ),
          inviter:profiles_user!inviter_id (
            user_id,
            display_name
          ),
          invitee:profiles_user!invitee_id (
            user_id,
            display_name
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enriquecer datos
      return (data || []).map((inv: any) => ({
        ...inv,
        group_name: inv.competition_groups?.name,
        group_cover_image_url: inv.competition_groups?.cover_image_url,
        inviter_display_name: inv.inviter?.display_name,
        invitee_display_name: inv.invitee?.display_name,
      })) as CompetitionGroupInvitation[];
    },
  });
}

// Hook para obtener invitaciones recibidas por el usuario actual
export function useMyCompetitionGroupInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-competition-group-invitations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('competition_group_invitations')
        .select(`
          *,
          competition_groups!group_id (
            id,
            name,
            description,
            training_schedule,
            training_location,
            cost_type,
            cost_amount,
            cover_image_url,
            promo_video_url
          ),
          inviter:profiles_user!inviter_id (
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((inv: any) => ({
        ...inv,
        group_name: inv.competition_groups?.name,
        group_cover_image_url: inv.competition_groups?.cover_image_url,
        inviter_display_name: inv.inviter?.display_name,
      })) as CompetitionGroupInvitation[];
    },
  });
}

// Hook para buscar usuarios disponibles para invitar
export function useAvailableUsersForInvitation(groupId?: string, searchTerm?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-users-invitation', groupId, searchTerm],
    enabled: !!user && (!!groupId || !!searchTerm), // Habilitar si hay searchTerm aunque no haya groupId
    queryFn: async () => {
      if (!user) return [];

      let memberUserIds = new Set<string>();
      let invitedUserIds = new Set<string>();

      // Si hay groupId, obtener miembros e invitaciones existentes
      if (groupId) {
        const { data: currentMembers, error: membersError } = await supabase
          .from('competition_group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('is_active', true);

        if (membersError) throw membersError;
        memberUserIds = new Set((currentMembers || []).map((m: any) => m.user_id));

        const { data: existingInvitations, error: invError } = await supabase
          .from('competition_group_invitations')
          .select('invitee_id, status')
          .eq('group_id', groupId)
          .in('status', ['pending', 'accepted']);

        if (invError) throw invError;
        invitedUserIds = new Set((existingInvitations || []).map((inv: any) => inv.invitee_id));
      }

      // Buscar usuarios usando función RPC (más confiable que consulta directa)
      // Esto evita problemas de RLS y exposición de tablas
      const { data: users, error: usersError } = await supabase
        .rpc('search_users_for_invitation', {
          p_search_term: searchTerm || null,
          p_exclude_user_id: user.id,
          p_limit_count: 50
        });

      if (usersError) {
        console.error('[useAvailableUsersForInvitation] Error en RPC:', usersError);
        throw usersError;
      }

      // Filtrar usuarios que ya son miembros o están invitados (solo si hay groupId)
      if (groupId) {
        return (users || []).filter(
          (u: any) => !memberUserIds.has(u.user_id) && !invitedUserIds.has(u.user_id)
        );
      }

      return users || [];
    },
  });
}

// Hook para buscar maestros disponibles para invitar
export function useAvailableTeachersForInvitation(groupId?: string, searchTerm?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-teachers-invitation', groupId, searchTerm],
    enabled: !!user && (!!groupId || !!searchTerm), // Habilitar si hay searchTerm aunque no haya groupId
    queryFn: async () => {
      if (!user) return [];

      let memberUserIds = new Set<string>();
      let invitedUserIds = new Set<string>();

      // Si hay groupId, obtener miembros e invitaciones existentes
      if (groupId) {
        const { data: currentMembers, error: membersError } = await supabase
          .from('competition_group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('is_active', true);

        if (membersError) throw membersError;
        memberUserIds = new Set((currentMembers || []).map((m: any) => m.user_id));

        const { data: existingInvitations, error: invError } = await supabase
          .from('competition_group_invitations')
          .select('invitee_id, status')
          .eq('group_id', groupId)
          .in('status', ['pending', 'accepted']);

        if (invError) throw invError;
        invitedUserIds = new Set((existingInvitations || []).map((inv: any) => inv.invitee_id));
      }

      // Buscar maestros aprobados
      let query = supabase
        .from('profiles_teacher')
        .select('user_id, nombre_publico, avatar_url')
        .eq('estado_aprobacion', 'aprobado')
        .neq('user_id', user.id) // Excluir al usuario actual
        .limit(50);

      if (searchTerm) {
        query = query.ilike('nombre_publico', `%${searchTerm}%`);
      }

      const { data: teachers, error: teachersError } = await query;

      if (teachersError) throw teachersError;

      // Filtrar maestros que ya son miembros o están invitados (solo si hay groupId)
      if (groupId) {
        return (teachers || []).filter(
          (t: any) => !memberUserIds.has(t.user_id) && !invitedUserIds.has(t.user_id)
        );
      }

      return teachers || [];
    },
  });
}

// Hook para enviar invitación
export function useSendCompetitionGroupInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      inviteeId, 
      message 
    }: { 
      groupId: string; 
      inviteeId: string; 
      message?: string 
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
        throw new Error('Solo el dueño del grupo puede enviar invitaciones');
      }

      // Verificar si ya existe una invitación
      const { data: existing, error: existingError } = await supabase
        .from('competition_group_invitations')
        .select('id, status')
        .eq('group_id', groupId)
        .eq('invitee_id', inviteeId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, que es OK
        throw existingError;
      }

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('Ya existe una invitación pendiente para este usuario');
        }
        if (existing.status === 'accepted') {
          throw new Error('Este usuario ya es miembro del grupo');
        }
        // Si fue rechazada o cancelada, actualizar
        const { data: updated, error: updateError } = await supabase
          .from('competition_group_invitations')
          .update({
            status: 'pending',
            inviter_id: user.id,
            message: message || null,
            responded_at: null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated as CompetitionGroupInvitation;
      }

      // Crear nueva invitación
      const { data, error } = await supabase
        .from('competition_group_invitations')
        .insert({
          group_id: groupId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          status: 'pending',
          message: message || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CompetitionGroupInvitation;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-group-invitations', variables.groupId] });
      qc.invalidateQueries({ queryKey: ['available-users-invitation', variables.groupId] });
      qc.invalidateQueries({ queryKey: ['my-competition-group-invitations'] });
    },
  });
}

// Hook para responder a una invitación (aceptar/rechazar)
export function useRespondToCompetitionGroupInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      invitationId, 
      status 
    }: { 
      invitationId: string; 
      status: 'accepted' | 'rejected' 
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es el invitado
      const { data: invitation, error: invError } = await supabase
        .from('competition_group_invitations')
        .select('invitee_id, status')
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) throw new Error('Invitación no encontrada');
      if (invitation.invitee_id !== user.id) {
        throw new Error('No tienes permiso para responder esta invitación');
      }
      if (invitation.status !== 'pending') {
        throw new Error('Esta invitación ya fue respondida');
      }

      const { data, error } = await supabase
        .from('competition_group_invitations')
        .update({ 
          status, 
          responded_at: new Date().toISOString() 
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;

      // Si fue aceptada, el trigger automáticamente crea el registro en competition_group_members
      // Pero invalidamos las queries para refrescar

      return data as CompetitionGroupInvitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-competition-group-invitations'] });
      qc.invalidateQueries({ queryKey: ['competition-group-invitations'] });
      qc.invalidateQueries({ queryKey: ['competition-group-members'] });
      qc.invalidateQueries({ queryKey: ['my-competition-groups'] });
    },
  });
}

// Hook para cancelar una invitación (solo el dueño del grupo)
export function useCancelCompetitionGroupInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, invitationId }: { groupId: string; invitationId: string }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario es dueño del grupo
      const { data: group, error: checkError } = await supabase
        .from('competition_groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (checkError) throw checkError;
      if (group.owner_id !== user.id) {
        throw new Error('Solo el dueño del grupo puede cancelar invitaciones');
      }

      const { data, error } = await supabase
        .from('competition_group_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data as CompetitionGroupInvitation;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['competition-group-invitations', variables.groupId] });
      qc.invalidateQueries({ queryKey: ['available-users-invitation', variables.groupId] });
    },
  });
}

