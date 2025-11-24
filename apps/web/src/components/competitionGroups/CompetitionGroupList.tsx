import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useMyCompetitionGroups } from '@/hooks/useCompetitionGroups';
import { useMyApprovedRoles } from '@/hooks/useMyApprovedRoles';
import CompetitionGroupCard from '@/components/explore/cards/CompetitionGroupCard';

export default function CompetitionGroupList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups, isLoading, isError, error } = useMyCompetitionGroups();
  const { data: approvedRoles } = useMyApprovedRoles();

  const canCreate = approvedRoles?.approved?.includes('maestro') || approvedRoles?.approved?.includes('academia');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2.5rem', margin: 0 }}>Grupos de Competencia</h1>
        {canCreate && (
          <button onClick={() => navigate('/competition-groups/new')} className="cc-btn">
            ➕ Crear Grupo
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', opacity: 0.7 }}>Cargando grupos...</div>
      ) : isError ? (
        <div style={{ padding: 48, textAlign: 'center', opacity: 0.7 }}>
          <p>Error al cargar tus grupos</p>
          <p>{error?.message || 'Intenta recargar en unos segundos.'}</p>
        </div>
      ) : groups && groups.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {groups.map((group) => (
            <CompetitionGroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: 'center', opacity: 0.7 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎯</div>
          <h2 style={{ marginBottom: 8 }}>No hay grupos de competencia</h2>
          <p style={{ marginBottom: 24, opacity: 0.8 }}>
            {canCreate
              ? 'Crea tu primer grupo de competencia para comenzar a invitar miembros.'
              : 'Solo maestros o academias pueden crear grupos de competencia.'}
          </p>
          {canCreate && (
            <button onClick={() => navigate('/competition-groups/new')} className="cc-btn">
              ➕ Crear Grupo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

