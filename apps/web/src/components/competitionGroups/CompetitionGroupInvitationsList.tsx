import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyCompetitionGroupInvitations, useRespondToCompetitionGroupInvitation } from '@/hooks/useCompetitionGroupInvitations';
import { useToast } from '@/components/Toast';
import { urls } from '@/lib/urls';

export default function CompetitionGroupInvitationsList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: invitations, isLoading } = useMyCompetitionGroupInvitations();
  const respondToInvitation = useRespondToCompetitionGroupInvitation();

  const handleRespond = async (invitationId: string, status: 'accepted' | 'rejected') => {
    try {
      await respondToInvitation.mutateAsync({ invitationId, status });
      showToast(
        status === 'accepted' ? 'Invitación aceptada. ¡Bienvenido al grupo!' : 'Invitación rechazada',
        status === 'accepted' ? 'success' : 'info'
      );
      if (status === 'accepted') {
        // Navegar al grupo después de aceptar
        const invitation = invitations?.find(inv => inv.id === invitationId);
        if (invitation) {
          setTimeout(() => navigate(`/competition-groups/${invitation.group_id}`), 1000);
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Error al responder la invitación', 'error');
    }
  };

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>Cargando invitaciones...</div>;
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📬</div>
        <p>No tienes invitaciones pendientes de grupos de competencia.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {invitations.map((inv: any) => {
        const group = inv.competition_groups;
        const inviter = inv.inviter;

        return (
          <div
            key={inv.id}
            style={{
              padding: 20,
              borderRadius: 16,
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Avatar del grupo o inviter */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  background: group?.cover_image_url
                    ? `url(${group.cover_image_url}) center/cover`
                    : 'linear-gradient(135deg, #E53935, #FB8C00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {!group?.cover_image_url && '🎯'}
              </div>

              {/* Información */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 8px 0', fontWeight: 900, fontSize: '1.3rem' }}>
                  {group?.name || 'Grupo de Competencia'}
                </h3>
                <p style={{ margin: '0 0 8px 0', opacity: 0.8, fontSize: '0.95rem' }}>
                  <strong>{inviter?.display_name || 'Usuario'}</strong> te ha invitado a unirte a este grupo
                </p>

                {inv.message && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.2)',
                      marginBottom: 12,
                      fontSize: '0.9rem',
                      fontStyle: 'italic',
                      opacity: 0.9,
                    }}
                  >
                    "{inv.message}"
                  </div>
                )}

                {/* Detalles del grupo */}
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {group?.training_location && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      📍 <strong>Ubicación:</strong> {group.training_location}
                    </div>
                  )}
                  {group?.training_schedule && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      ⏰ <strong>Horarios:</strong> {group.training_schedule}
                    </div>
                  )}
                  {group?.cost_type && group?.cost_amount && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      💰 <strong>Costo:</strong> ${group.cost_amount.toFixed(2)} MXN ({group.cost_type === 'monthly' ? 'Mensual' : group.cost_type === 'per_session' ? 'Por Sesión' : 'Paquete'})
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleRespond(inv.id, 'accepted')}
                    disabled={respondToInvitation.isPending}
                    className="cc-btn"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))',
                      border: '1px solid rgba(34,197,94,0.5)',
                    }}
                  >
                    ✅ Aceptar
                  </button>
                  <button
                    onClick={() => handleRespond(inv.id, 'rejected')}
                    disabled={respondToInvitation.isPending}
                    className="cc-btn cc-btn--ghost"
                    style={{
                      border: '1px solid rgba(239,68,68,0.5)',
                      color: '#ef4444',
                    }}
                  >
                    ❌ Rechazar
                  </button>
                  <button
                    onClick={() => navigate(`/competition-groups/${inv.group_id}`)}
                    className="cc-btn cc-btn--ghost"
                  >
                    👁️ Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

