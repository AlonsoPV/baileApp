import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTrending,
  getTrendingRitmos,
  getTrendingCandidates,
  leaderboard,
  voteTrending,
  voteTrendingRound,
  getRoundCandidates,
  getTrendingRounds,
  adminCloseRound,
  adminActivatePendingCandidates,
  debugTrendingCandidates,
  getRoundResults,
  getFinalWinners,
} from "@/lib/trending";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabase";
import { urls } from "@/lib/urls";
import "@/styles/event-public.css";

function isWithinWindow(starts_at?: string | null, ends_at?: string | null) {
  const now = Date.now();
  const startOk = !starts_at || now >= new Date(starts_at).getTime();
  const endOk = !ends_at || now <= new Date(ends_at).getTime();
  return startOk && endOk;
}

function labelFromSlug(slug?: string | null) {
  if (!slug) return '';
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function TrendingDetail() {
  const { id } = useParams<{ id: string }>();
  const trendingId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [t, setT] = React.useState<any>(null);
  const [ritmos, setRitmos] = React.useState<any[]>([]);
  const [candidatos, setCandidatos] = React.useState<any[]>([]);
  const [board, setBoard] = React.useState<any[]>([]);
  const [activeRitmo, setActiveRitmo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSA, setIsSA] = React.useState(false);
  const [myVotes, setMyVotes] = React.useState<Map<number, boolean>>(new Map());
  const [userMeta, setUserMeta] = React.useState<Record<string, { name?: string; avatar?: string }>>({});
  // Estado para rondas
  const [rounds, setRounds] = React.useState<any[]>([]);
  const [currentRoundCandidates, setCurrentRoundCandidates] = React.useState<any[]>([]);
  const [useRoundsMode, setUseRoundsMode] = React.useState(false);
  const [roundResults, setRoundResults] = React.useState<Map<number, any[]>>(new Map());
  const [finalWinners, setFinalWinners] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const [tr, rs, cs, lb, roundsData] = await Promise.all([
          getTrending(trendingId),
          getTrendingRitmos(trendingId),
          getTrendingCandidates(trendingId),
          leaderboard(trendingId),
          getTrendingRounds(trendingId).catch(() => []),
        ]);
        setT(tr);
        setRitmos(rs);
        setCandidatos(cs);
        setBoard(lb);
        setRounds(roundsData);
        setActiveRitmo(rs?.[0]?.ritmo_slug ?? null);
        
        // Verificar si usa sistema de rondas
        const hasRounds = tr?.rounds_config && (tr?.current_round_number > 0 || roundsData.length > 0);
        setUseRoundsMode(hasRounds);
        
        // Si usa rondas, cargar candidatos de la ronda actual
        if (hasRounds) {
          const roundNum = tr.current_round_number || (roundsData.find(r => r.status === 'active')?.round_number) || 1;
          if (roundNum) {
            try {
              const roundCandidates = await getRoundCandidates(trendingId, roundNum);
              setCurrentRoundCandidates(roundCandidates);
              console.log('[TrendingDetail] Candidatos de ronda', roundNum, roundCandidates);
              
              // Si no hay candidatos pero hay participants_lists, intentar activar candidatos
              if (roundCandidates.length === 0 && tr.participants_lists) {
                console.log('[TrendingDetail] No hay candidatos en ronda, pero hay participants_lists. Intentando activar...');
                // Esto se manejará con el botón de activar candidatos o automáticamente
              }
            } catch (e) {
              console.error('[TrendingDetail] Error cargando candidatos de ronda', e);
              setCurrentRoundCandidates([]);
            }
          }
          
          // Cargar resultados de rondas cerradas
          const closedRounds = roundsData.filter(r => r.status === 'closed' || r.status === 'completed');
          const resultsMap = new Map<number, any[]>();
          for (const round of closedRounds) {
            try {
              const results = await getRoundResults(trendingId, round.round_number);
              resultsMap.set(round.round_number, results);
            } catch (e) {
              console.error(`[TrendingDetail] Error cargando resultados de ronda ${round.round_number}`, e);
            }
          }
          setRoundResults(resultsMap);
        }
        
        // Si el trending está cerrado, cargar ganadores finales (independientemente de si usa rondas)
        if (tr.status === 'closed') {
          try {
            const winners = await getFinalWinners(trendingId);
            console.log('[TrendingDetail] Ganadores finales cargados:', winners);
            setFinalWinners(winners);
          } catch (e) {
            console.error('[TrendingDetail] Error cargando ganadores finales', e);
            // Si hay error, intentar con el leaderboard tradicional como fallback
            setFinalWinners([]);
          }
        } else {
          // Limpiar ganadores si el trending no está cerrado
          setFinalWinners([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [trendingId]);

  // Recargar candidatos cuando cambie la ronda activa
  React.useEffect(() => {
    if (!useRoundsMode || !t) return;
    
    const loadRoundCandidates = async () => {
      const roundNum = t.current_round_number || (rounds.find(r => r.status === 'active')?.round_number);
      if (roundNum) {
        try {
          // Primero intentar activar candidatos pendientes
          if (isSA) {
            try {
              const { adminActivatePendingCandidates } = await import('@/lib/trending');
              await adminActivatePendingCandidates(trendingId);
            } catch (e) {
              // Si no es admin o hay error, continuar
              console.log('[TrendingDetail] No se pudieron activar candidatos pendientes', e);
            }
          }
          
          const roundCandidates = await getRoundCandidates(trendingId, roundNum);
          setCurrentRoundCandidates(roundCandidates);
          console.log('[TrendingDetail] Candidatos recargados para ronda', roundNum, roundCandidates.length);
        } catch (e) {
          console.error('[TrendingDetail] Error recargando candidatos', e);
        }
      }
    };

    loadRoundCandidates();
  }, [useRoundsMode, t?.current_round_number, rounds, trendingId, isSA]);

  React.useEffect(() => {
    (async () => {
      if (!user) { setIsSA(false); return; }
      const { data } = await supabase.from('user_roles').select('role_slug').eq('user_id', user.id);
      setIsSA(Boolean((data || []).some((r:any)=> r.role_slug === 'superadmin')));
    })();
  }, [user?.id]);

  // Load avatar/name fallback for candidates
  React.useEffect(() => {
    (async () => {
      const ids = Array.from(new Set((candidatos || []).map((c:any) => c.user_id).filter(Boolean)));
      if (!ids.length) return;
      const { data, error } = await supabase
        .from('profiles_user')
        .select('user_id, display_name, avatar_url')
        .in('user_id', ids);
      if (!error && Array.isArray(data)) {
        const map: Record<string, { name?: string; avatar?: string }> = {};
        data.forEach((u:any) => { map[u.user_id] = { name: u.display_name || undefined, avatar: u.avatar_url || undefined }; });
        setUserMeta(map);
      }
    })();
  }, [candidatos]);

  const byRitmo = React.useMemo(() => {
    const map = new Map<string, any[]>();
    candidatos.forEach((c) => {
      if (!map.has(c.ritmo_slug)) map.set(c.ritmo_slug, []);
      map.get(c.ritmo_slug)!.push(c);
    });
    return map;
  }, [candidatos]);

  const groupByList = React.useMemo(() => {
    const current = (activeRitmo ? byRitmo.get(activeRitmo) ?? [] : candidatos);
    const m = new Map<string, any[]>();
    current.forEach((c:any) => {
      const key = c.list_name || 'General';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(c);
    });
    return Array.from(m.entries());
  }, [activeRitmo, byRitmo, candidatos]);

  const votesByCandidate = React.useMemo(() => {
    const m = new Map<number, number>();
    board.forEach((b) => m.set(b.candidate_id, Number(b.votes)));
    return m;
  }, [board]);

  // Ganadores finales efectivos:
  // - Si el backend retorna ganadores (finalWinners), usamos esos.
  // - Si viene vacío pero hay leaderboard, usamos top 3 por lista del leaderboard como fallback.
  const effectiveFinalWinners = React.useMemo(() => {
    if (finalWinners.length > 0) return finalWinners;
    if (!board.length) return [];

    const byList = new Map<string, any[]>();
    board.forEach((row: any) => {
      const key = row.list_name || 'General';
      if (!byList.has(key)) byList.set(key, []);
      byList.get(key)!.push(row);
    });

    const result: any[] = [];
    byList.forEach((items) => {
      const sorted = [...items].sort(
        (a: any, b: any) => (b.votes || 0) - (a.votes || 0)
      );
      sorted.slice(0, 3).forEach((item: any, idx: number) => {
        result.push({
          candidate_id: item.candidate_id,
          user_id: item.user_id,
          display_name: item.display_name,
          avatar_url: item.avatar_url,
          bio_short: item.bio_short ?? null,
          list_name: item.list_name,
          ritmo_slug: item.ritmo_slug,
          final_round_number: null,
          final_votes: item.votes || 0,
          position: idx + 1,
        });
      });
    });

    return result;
  }, [finalWinners, board]);

  const winnersByList = React.useMemo(() => {
    const best = new Map<string, any>();
    board.forEach(row => {
      const key = (row.list_name || 'General') + '::' + (row.ritmo_slug || '');
      const prev = best.get(key);
      if (!prev || Number(row.votes) > Number(prev.votes)) {
        best.set(key, row);
      }
    });
    return Array.from(best.values());
  }, [board]);

  const doVote = async (candidateId: number) => {
    if (!user) {
      alert("Inicia sesión para votar");
      return;
    }
    try {
      if (useRoundsMode && t?.current_round_number) {
        // Validar que la ronda actual esté activa y dentro de su ventana de tiempo
        const currentRound = rounds.find(r => r.round_number === t.current_round_number);
        const canVoteRound =
          currentRound?.status === 'active' &&
          (!currentRound.ends_at || new Date(currentRound.ends_at) > new Date());
        if (!canVoteRound) {
          alert('La ronda no está activa para votar.');
          return;
        }

        // Votar en ronda específica
        await voteTrendingRound(trendingId, candidateId, t.current_round_number);
        // Refetch round candidates
        const roundCandidates = await getRoundCandidates(trendingId, t.current_round_number);
        setCurrentRoundCandidates(roundCandidates);
      } else {
        // Modo tradicional: validar ventana de tiempo global del trending
        const canVoteByTime = isWithinWindow(t?.starts_at, t?.ends_at);
        const canVote = t?.status === "open" && canVoteByTime;
        if (!canVote) {
          alert('El trending no está abierto para votación.');
          return;
        }

        // Votar modo tradicional
        await voteTrending(trendingId, candidateId);
        const lb = await leaderboard(trendingId);
        setBoard(lb);
      }
      // Update local myVotes state for UI toggle
      setMyVotes(prev => {
        const next = new Map(prev);
        const wasVoted = prev.get(candidateId);
        next.set(candidateId, !wasVoted);
        return next;
      });
    } catch (e: any) {
      const errorMsg = e?.message || '';
      if (errorMsg.includes('auth_required') || errorMsg.includes('autenticado')) {
        alert('Inicia sesión para votar ❤️');
      } else {
        alert(errorMsg || 'No se pudo votar');
      }
    }
  };

  const doCloseRound = async (roundNumber: number) => {
    if (!isSA) return;
    if (!confirm(`¿Cerrar ronda ${roundNumber}? Los ganadores avanzarán automáticamente.`)) return;
    try {
      await adminCloseRound(trendingId, roundNumber);
      // Recargar datos
      const [tr, roundsData] = await Promise.all([
        getTrending(trendingId),
        getTrendingRounds(trendingId),
      ]);
      setT(tr);
      setRounds(roundsData);
      if (tr.current_round_number) {
        const roundCandidates = await getRoundCandidates(trendingId, tr.current_round_number);
        setCurrentRoundCandidates(roundCandidates);
      }
      
      // Recargar resultados de rondas cerradas (incluyendo la que acabamos de cerrar)
      const closedRounds = roundsData.filter(r => r.status === 'closed' || r.status === 'completed');
      const resultsMap = new Map(roundResults);
      for (const round of closedRounds) {
        try {
          const results = await getRoundResults(trendingId, round.round_number);
          resultsMap.set(round.round_number, results);
        } catch (e) {
          console.error(`[TrendingDetail] Error cargando resultados de ronda ${round.round_number}`, e);
        }
      }
      setRoundResults(resultsMap);
      
      // Si el trending está cerrado, cargar ganadores finales
      if (tr.status === 'closed') {
        try {
          const winners = await getFinalWinners(trendingId);
          setFinalWinners(winners);
        } catch (e) {
          console.error('[TrendingDetail] Error cargando ganadores finales', e);
        }
      }
      
      alert('Ronda cerrada exitosamente');
    } catch (e: any) {
      alert(e?.message || 'No se pudo cerrar la ronda');
    }
  };

  if (loading) return <div style={{ padding: 'clamp(1rem, 3vw, 24px)' }}>Cargando...</div>;
  if (!t) return <div style={{ padding: 'clamp(1rem, 3vw, 24px)' }}>Trending no encontrado</div>;

  return (
    <>
      <style>{`
        .trending-detail-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: clamp(1rem, 3vw, 24px);
        }
        
        .trending-detail-header h1 {
          font-size: clamp(1.75rem, 5vw, 2.5rem);
          margin-bottom: 6px;
        }
        
        .trending-detail-cover {
          width: 100%;
          border-radius: clamp(12px, 2vw, 16px);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          margin-bottom: 12px;
          max-height: clamp(150px, 30vw, 220px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
        }
        
        .trending-detail-cover img {
          width: 100%;
          height: clamp(150px, 30vw, 220px);
          display: block;
          object-fit: contain;
        }
        
        .trending-participants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 200px));
          gap: 12px;
        }
        
        .trending-candidates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 450px));
          gap: 12px;
          justify-content: center;
        }
        
        .trending-leaderboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 8px;
        }
        
        @media (max-width: 768px) {
          .trending-detail-container {
            padding: 1rem;
          }
          .trending-participants-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
          }
          .trending-candidates-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .trending-leaderboard-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .trending-detail-container {
            padding: 0.75rem;
          }
          .trending-participants-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="trending-detail-container">
      {/* Botón Volver */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate('/trending')} className="cc-btn cc-btn--ghost">
          ← Volver a Trending
        </button>
      </div>
      {t.cover_url && (
        <div className="trending-detail-cover">
          <img src={t.cover_url} alt={t.title} />
        </div>
      )}
      <header className="trending-detail-header" style={{ marginBottom: 12 }}>
        <h1 style={{ fontWeight: 900, marginBottom: 6 }}>{t.title}</h1>
        {t.description && <p style={{ opacity: 0.9, margin: 0 }}>{t.description}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <span className="cc-chip">Estado: <b style={{ textTransform:'uppercase' }}>{t.status}</b></span>
          {t.starts_at && <span className="cc-soft-chip">🟢 {new Date(t.starts_at).toLocaleString()}</span>}
          {t.ends_at && <span className="cc-soft-chip">🔴 {new Date(t.ends_at).toLocaleString()}</span>}
        </div>
      </header>

      {/* Mostrar participantes desde participants_lists si existe (solo mientras el trending NO está cerrado) */}
      {t.status !== 'closed' && t.participants_lists && (() => {
        let participantsData: any = null;
        try {
          if (typeof t.participants_lists === 'string') {
            participantsData = JSON.parse(t.participants_lists);
          } else {
            participantsData = t.participants_lists;
          }
        } catch (e) {
          console.error('Error parsing participants_lists', e);
        }
        
        if (participantsData && participantsData.lists && participantsData.lists.length > 0) {
          return (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: 16, fontSize: '1.5rem', fontWeight: 900 }}>Participantes</h2>
              <div style={{ display: 'grid', gap: 20 }}>
                {participantsData.lists.map((list: any) => (
                  <div key={list.name} style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontWeight: 900, fontSize: '1.1rem' }}>
                      {list.name} <span style={{ opacity: 0.7, fontSize: '0.9rem', fontWeight: 400 }}>({list.participants?.length || 0})</span>
                    </h3>
                    <div className="trending-participants-grid">
                      {list.participants?.map((p: any) => (
                        <div key={p.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: 8,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <img
                            src={p.avatar || 'https://placehold.co/40x40?text=User'}
                            alt={p.name}
                            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Información de rondas (solo mientras el trending NO está cerrado) */}
      {t.status !== 'closed' && useRoundsMode && t.current_round_number > 0 && (
        <div style={{ 
          padding: 16, 
          borderRadius: 12, 
          background: 'rgba(0,188,212,0.1)', 
          border: '1px solid rgba(0,188,212,0.3)',
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                Ronda {t.current_round_number} de {t.total_rounds || rounds.length}
              </h2>
              {rounds.find(r => r.round_number === t.current_round_number) && (
                <div style={{ marginTop: 8, opacity: 0.9 }}>
                  {(() => {
                    const currentRound = rounds.find(r => r.round_number === t.current_round_number);
                    if (!currentRound) return null;
                    if (currentRound.status === 'active') {
                      if (currentRound.ends_at) {
                        const endsAt = new Date(currentRound.ends_at);
                        const now = new Date();
                        const diff = endsAt.getTime() - now.getTime();
                        if (diff > 0) {
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return <span>⏰ Termina en: {hours}h {minutes}m</span>;
                        }
                      }
                      return <span>🟢 Ronda activa</span>;
                    }
                    return <span>🔴 Ronda cerrada</span>;
                  })()}
                </div>
              )}
            </div>
            {isSA && rounds.find(r => r.round_number === t.current_round_number)?.status === 'active' && (
              <>
                <button 
                  className="cc-btn" 
                  onClick={async () => {
                    try {
                      // Debug: ver estado de candidatos
                      const debug = await debugTrendingCandidates(trendingId);
                      console.log('[TrendingDetail] Debug candidatos antes de activar:', debug);
                      
                      const result = await adminActivatePendingCandidates(trendingId);
                      console.log('[TrendingDetail] Resultado de activación:', result);
                      
                      // Recargar candidatos
                      const roundCandidates = await getRoundCandidates(trendingId, t.current_round_number);
                      setCurrentRoundCandidates(roundCandidates);
                      console.log('[TrendingDetail] Candidatos después de activar:', roundCandidates);
                      
                      alert(`Candidatos activados: ${result.activated_count} de ${result.total_candidates} (Ronda ${result.current_round || 'N/A'}). Total en ronda: ${roundCandidates.length}`);
                    } catch (e: any) {
                      console.error('[TrendingDetail] Error activando candidatos', e);
                      alert(e?.message || 'Error al activar candidatos');
                    }
                  }}
                  style={{ background: 'rgba(0,188,212,0.3)', border: '1px solid rgba(0,188,212,0.5)' }}
                >
                  Activar Candidatos
                </button>
                <button 
                  className="cc-btn" 
                  onClick={() => doCloseRound(t.current_round_number)}
                  style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}
                >
                  Cerrar Ronda
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resultados finales de rondas cerradas (solo mientras el trending NO está cerrado) */}
      {t.status !== 'closed' && useRoundsMode && roundResults.size > 0 && (() => {
        const closedRounds = rounds.filter(r => r.status === 'closed' || r.status === 'completed').sort((a, b) => a.round_number - b.round_number);
        if (closedRounds.length === 0) return null;
        
        return (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16, fontSize: '1.5rem', fontWeight: 900 }}>Resultados Finales por Ronda</h2>
            {closedRounds.map((round) => {
              const results = roundResults.get(round.round_number) || [];
              if (results.length === 0) return null;
              
              // Agrupar resultados por lista
              const byList = new Map<string, any[]>();
              results.forEach((r: any) => {
                const key = r.list_name || 'General';
                if (!byList.has(key)) byList.set(key, []);
                byList.get(key)!.push(r);
              });
              
              return (
                <div key={round.round_number} style={{
                  marginBottom: 24,
                  padding: 20,
                  borderRadius: 16,
                  background: 'rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.15)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                      Ronda {round.round_number} - Finalizada
                    </h3>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: 'rgba(239,68,68,0.2)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      {round.status === 'completed' ? '✅ Completada' : '🔴 Cerrada'}
                    </span>
                  </div>
                  
                  {Array.from(byList.entries()).map(([listName, items]) => (
                    <div key={listName} style={{ marginBottom: 20 }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 800, opacity: 0.9 }}>
                        {listName} <span style={{ opacity: 0.7, fontSize: '0.9rem', fontWeight: 400 }}>({items.length} participantes)</span>
                      </h4>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {items
                          .sort((a, b) => b.votes - a.votes) // Ordenar por votos descendente
                          .map((r: any, idx: number) => {
                            const m = userMeta[r.user_id] || {};
                            const avatarSrc = r.avatar_url || m.avatar || "https://placehold.co/48x48?text=User";
                            const displayName = r.display_name || m.name || "Sin nombre";
                            const userHref = urls.userLive(r.user_id);
                            const isTop3 = idx < 3;
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                            
                            return (
                              <div
                                key={r.candidate_id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: isTop3 ? 16 : 12,
                                  borderRadius: 12,
                                  background: isTop3
                                    ? 'linear-gradient(135deg, rgba(255,215,0,0.16), rgba(255,255,255,0.04))'
                                    : r.advanced
                                    ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))'
                                    : 'rgba(255,255,255,0.05)',
                                  border: isTop3
                                    ? '2px solid rgba(255,215,0,0.6)'
                                    : r.advanced
                                    ? '2px solid rgba(34,197,94,0.4)'
                                    : '1px solid rgba(255,255,255,0.1)',
                                  boxShadow: isTop3
                                    ? '0 8px 24px rgba(255,215,0,0.28)'
                                    : 'none',
                                  position: 'relative'
                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    background: isTop3
                                      ? 'rgba(0,0,0,0.55)'
                                      : r.advanced
                                      ? 'rgba(34,197,94,0.3)'
                                      : 'rgba(0,0,0,0.4)',
                                    border: `1px solid ${
                                      isTop3
                                        ? 'rgba(255,215,0,0.7)'
                                        : r.advanced
                                        ? 'rgba(34,197,94,0.5)'
                                        : 'rgba(255,255,255,0.2)'
                                    }`,
                                    fontSize: '0.8rem',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}
                                >
                                  {medal && <span>{medal}</span>}
                                  <span>{idx + 1}° Lugar</span>
                                </div>
                                <a href={userHref} title={displayName} style={{ display: 'inline-block' }}>
                                  <img
                                    src={avatarSrc}
                                    alt={displayName}
                                    style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                                  />
                                </a>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <a href={userHref} title={displayName} style={{ color: '#fff', textDecoration: 'none', fontWeight: 800, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {displayName}
                                  </a>
                                  {r.bio_short && (
                                    <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {r.bio_short}
                                    </div>
                                  )}
                                </div>
                                {/* Votos ocultos para público */}
                                {r.advanced && (
                                  <div style={{
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(34,197,94,0.2)',
                                    border: '1px solid rgba(34,197,94,0.4)',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    ✅ Avanzó
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Ganadores Finales - Solo cuando el trending está cerrado */}
      {t && t.status === 'closed' && (
        <div style={{ 
          marginBottom: 48,
          position: 'relative',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,193,7,0.05))',
          borderRadius: 24,
          border: '4px solid rgba(255,215,0,0.3)',
          boxShadow: '0 12px 48px rgba(255,215,0,0.25)'
        }}>
          {/* Título Principal con Efecto */}
          <div style={{
            textAlign: 'center',
            marginBottom: 40,
            position: 'relative'
          }}>
            <div style={{
              fontSize: '3.5rem',
              lineHeight: 1,
              marginBottom: 12,
              filter: 'drop-shadow(0 4px 8px rgba(255,215,0,0.5))'
            }}>
              🏆
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '2.5rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 30px rgba(255,215,0,0.5)',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              🎉 Ganadores Finales 🎉
            </h1>
            <div style={{
              marginTop: 8,
              fontSize: '1.1rem',
              opacity: 0.9,
              fontWeight: 600,
              color: '#FFD700'
            }}>
              ¡Felicitaciones a todos los participantes!
            </div>
          </div>

          {effectiveFinalWinners.length > 0 ? (() => {
            // Agrupar ganadores por lista
            const byList = new Map<string, any[]>();
            effectiveFinalWinners.forEach((w: any) => {
              const key = w.list_name || 'General';
              if (!byList.has(key)) byList.set(key, []);
              byList.get(key)!.push(w);
            });
            
            return Array.from(byList.entries()).map(([listName, winners]) => {
              // Ordenar por posición y tomar solo los primeros 3
              const sortedWinners = winners.sort((a, b) => a.position - b.position).slice(0, 3);
              
              return (
                <div key={listName} className="winners-list-container" style={{
                  marginBottom: 48,
                  padding: 32,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,193,7,0.08))',
                  border: '3px solid rgba(255,215,0,0.5)',
                  boxShadow: '0 8px 32px rgba(255,215,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Efecto de fondo decorativo */}
                  <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,215,0,0.15), transparent)',
                    pointerEvents: 'none'
                  }} />
                  
                  <h2 className="winners-list-title" style={{ 
                    margin: '0 0 32px 0', 
                    fontSize: '2rem', 
                    fontWeight: 900,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 2px 10px rgba(255,215,0,0.3)',
                    letterSpacing: '1px'
                  }}>
                    {listName}
                  </h2>
                  
                  <div className="winners-grid" style={{ display: 'grid', gap: 20, position: 'relative', zIndex: 1 }}>
                    {sortedWinners.map((w: any) => {
                      const m = userMeta[w.user_id] || {};
                      const avatarSrc = w.avatar_url || m.avatar || "https://placehold.co/80x80?text=User";
                      const displayName = w.display_name || m.name || "Sin nombre";
                      const userHref = urls.userLive(w.user_id);
                      
                      // Colores y estilos según posición
                      let medal = '🏅';
                      let medalSize = '4rem';
                      let positionColor = '#FFD700';
                      let positionBg = 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,193,7,0.15))';
                      let positionBorder = '3px solid rgba(255,215,0,0.6)';
                      let positionText = '';
                      let glowEffect = '0 0 20px rgba(255,215,0,0.4)';
                      
                      if (w.position === 1) {
                        medal = '🥇';
                        medalSize = '5rem';
                        positionColor = '#FFD700';
                        positionBg = 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,193,7,0.2))';
                        positionBorder = '4px solid #FFD700';
                        positionText = 'CAMPEÓN';
                        glowEffect = '0 0 30px rgba(255,215,0,0.6)';
                      } else if (w.position === 2) {
                        medal = '🥈';
                        medalSize = '4.5rem';
                        positionColor = '#C0C0C0';
                        positionBg = 'linear-gradient(135deg, rgba(192,192,192,0.25), rgba(169,169,169,0.15))';
                        positionBorder = '3px solid #C0C0C0';
                        positionText = 'SUBCAMPEÓN';
                        glowEffect = '0 0 25px rgba(192,192,192,0.5)';
                      } else if (w.position === 3) {
                        medal = '🥉';
                        medalSize = '4.5rem';
                        positionColor = '#CD7F32';
                        positionBg = 'linear-gradient(135deg, rgba(205,127,50,0.25), rgba(184,115,51,0.15))';
                        positionBorder = '3px solid #CD7F32';
                        positionText = 'TERCER LUGAR';
                        glowEffect = '0 0 25px rgba(205,127,50,0.5)';
                      }
                      
                      return (
                        <div key={w.candidate_id} className="winner-card" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 24,
                          padding: 28,
                          borderRadius: 20,
                          background: positionBg,
                          border: positionBorder,
                          position: 'relative',
                          boxShadow: glowEffect,
                          transform: w.position === 1 ? 'scale(1.02)' : 'scale(1)',
                          transition: 'transform 0.3s ease'
                        }}>
                          {/* Medalla Grande */}
                          <div className="winner-medal" style={{
                            fontSize: medalSize,
                            lineHeight: 1,
                            minWidth: 80,
                            textAlign: 'center',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                            animation: w.position === 1 ? 'pulse 2s infinite' : 'none'
                          }}>
                            {medal}
                          </div>
                          
                          {/* Avatar con borde especial */}
                          <a href={userHref} title={displayName} className="winner-avatar-link" style={{ display: 'inline-block' }}>
                            <div className="winner-avatar" style={{
                              width: 80,
                              height: 80,
                              borderRadius: 16,
                              padding: 3,
                              background: positionBg,
                              border: `3px solid ${positionColor}`,
                              boxShadow: `0 0 15px ${positionColor}40`
                            }}>
                              <img
                                src={avatarSrc}
                                alt={displayName}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  borderRadius: 12, 
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                              />
                            </div>
                          </a>
                          
                          {/* Información del ganador */}
                          <div className="winner-info" style={{ flex: 1, minWidth: 0 }}>
                            {positionText && (
                              <div className="winner-position-text" style={{
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: positionColor,
                                marginBottom: 6,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textShadow: `0 0 10px ${positionColor}60`
                              }}>
                                {positionText}
                              </div>
                            )}
                            <div className="winner-position" style={{
                              fontSize: '1rem',
                              opacity: 0.9,
                              marginBottom: 8,
                              fontWeight: 700,
                              color: positionColor
                            }}>
                              {w.position}° Lugar
                            </div>
                            <a href={userHref} title={displayName} className="winner-name" style={{ 
                              color: '#fff', 
                              textDecoration: 'none', 
                              fontWeight: 900, 
                              fontSize: '1.5rem',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                            }}>
                              {displayName}
                            </a>
                            {w.bio_short && (
                              <div className="winner-bio" style={{ 
                                opacity: 0.9, 
                                fontSize: '1rem', 
                                marginTop: 8,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontStyle: 'italic'
                              }}>
                                {w.bio_short}
                              </div>
                            )}
                          </div>
                          
                          {/* Contador de votos destacado */}
                          {/* Votos ocultos para público */}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })() : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              opacity: 0.8
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                Los ganadores se mostrarán aquí una vez que el trending finalice.
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: 8 }}>
                Asegúrate de que todas las rondas estén cerradas y que el trending tenga el estado "closed".
              </p>
            </div>
          )}
          
          {/* Estilos de animación y responsivos */}
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            
            /* Estilos responsivos para ganadores */
            .winner-card {
              flex-wrap: wrap;
            }
            
            .winners-list-container {
              width: 100%;
            }
            
            @media (max-width: 768px) {
              .winners-list-container {
                padding: 20px !important;
                margin-bottom: 32px !important;
                border-radius: 20px !important;
              }
              
              .winners-list-title {
                font-size: 1.5rem !important;
                margin-bottom: 24px !important;
              }
              
              .winners-grid {
                gap: 16px !important;
              }
              
              .winner-card {
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 20px !important;
                gap: 16px !important;
              }
              
              .winner-medal {
                min-width: auto !important;
                font-size: 3rem !important;
              }
              
              .winner-avatar {
                width: 70px !important;
                height: 70px !important;
              }
              
              .winner-info {
                width: 100%;
                text-align: center;
              }
              
              .winner-name {
                font-size: 1.25rem !important;
                white-space: normal !important;
                word-break: break-word;
                overflow: visible !important;
                text-overflow: unset !important;
              }
              
              .winner-bio {
                white-space: normal !important;
                overflow: visible !important;
                text-overflow: unset !important;
                font-size: 0.9rem !important;
              }
              
              .winner-position-text {
                font-size: 0.8rem !important;
              }
              
              .winner-position {
                font-size: 0.9rem !important;
              }
            }
            
            @media (max-width: 480px) {
              .winners-list-container {
                padding: 16px !important;
                margin-bottom: 24px !important;
                border-radius: 16px !important;
              }
              
              .winners-list-title {
                font-size: 1.25rem !important;
                margin-bottom: 20px !important;
                letter-spacing: 0.5px !important;
              }
              
              .winners-grid {
                gap: 12px !important;
              }
              
              .winner-card {
                padding: 16px !important;
                gap: 12px !important;
                border-radius: 16px !important;
              }
              
              .winner-medal {
                font-size: 2.5rem !important;
              }
              
              .winner-avatar {
                width: 60px !important;
                height: 60px !important;
                border-radius: 12px !important;
              }
              
              .winner-name {
                font-size: 1.1rem !important;
              }
              
              .winner-bio {
                font-size: 0.85rem !important;
              }
              
              .winner-position-text {
                font-size: 0.75rem !important;
                letter-spacing: 0.5px !important;
              }
              
              .winner-position {
                font-size: 0.85rem !important;
              }
            }
          `}</style>
        </div>
      )}

      {/* Participantes del Trend - Solo cuando el trending está cerrado */}
      {t && t.status === 'closed' && (() => {
        // Preferimos participants_lists para mostrar TODOS los participantes por lista
        let participantsData: any = null;
        try {
          if (t.participants_lists) {
            if (typeof t.participants_lists === 'string') {
              participantsData = JSON.parse(t.participants_lists);
            } else {
              participantsData = t.participants_lists;
            }
          }
        } catch (e) {
          console.error('Error parsing participants_lists en sección "Participantes del Trend"', e);
        }

        const lists = participantsData?.lists || [];
        if (!lists.length) {
          return null;
        }

        return (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ 
              marginBottom: 24, 
              fontSize: '2rem', 
              fontWeight: 900, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.8))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              👥 Participantes del Trend
            </h2>
            
            {lists.map((list: any) => (
              <div key={list.name} style={{
                marginBottom: 32,
                padding: 24,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '1.5rem', 
                  fontWeight: 800,
                  textAlign: 'center',
                  color: '#fff'
                }}>
                  {list.name} <span style={{ opacity: 0.7, fontSize: '1rem', fontWeight: 400 }}>({list.participants?.length || 0} participantes)</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {list.participants?.map((p: any) => (
                    <div key={p.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 16,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.2s ease'
                    }}>
                      <a href={urls.userLive(p.id)} title={p.name} style={{ display: 'inline-block' }}>
                        <img
                          src={p.avatar || "https://placehold.co/60x60?text=User"}
                          alt={p.name}
                          style={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: 10, 
                            objectFit: 'cover',
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={urls.userLive(p.id)} title={p.name} style={{ 
                          color: '#fff', 
                          textDecoration: 'none', 
                          fontWeight: 700, 
                          fontSize: '1rem',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {p.name}
                        </a>
                      </div>
                      {/* Votos ocultos para público */}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Leaderboard - Solo cuando el trending está cerrado y es admin */}
      {t && t.status === 'closed' && board.length > 0 && isSA && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ 
            marginBottom: 24, 
            fontSize: '2rem', 
            fontWeight: 900, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.8))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📊 Leaderboard General
          </h2>
          
          <div style={{
            padding: 24,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            {(() => {
              // Agrupar por lista
              const boardByList = new Map<string, any[]>();
              board.forEach((b: any) => {
                const key = b.list_name || 'General';
                if (!boardByList.has(key)) boardByList.set(key, []);
                boardByList.get(key)!.push(b);
              });
              
              return Array.from(boardByList.entries()).map(([listName, items]) => {
                const sortedItems = items.sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0));
                
                return (
                  <div key={listName} style={{ marginBottom: 32 }}>
                    <h3 style={{ 
                      margin: '0 0 20px 0', 
                      fontSize: '1.3rem', 
                      fontWeight: 800,
                      color: '#fff'
                    }}>
                      {listName}
                    </h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {sortedItems.map((item: any, idx: number) => {
                        const m = userMeta[item.user_id] || {};
                        const avatarSrc = item.avatar_url || m.avatar || "https://placehold.co/48x48?text=User";
                        const displayName = item.display_name || m.name || "Sin nombre";
                        const userHref = urls.userLive(item.user_id);
                        const votes = item.votes || 0;
                        
                        return (
                          <div key={item.id || item.candidate_id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: 16,
                            borderRadius: 12,
                            background: idx < 3 
                              ? 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,193,7,0.05))'
                              : 'rgba(255,255,255,0.03)',
                            border: idx < 3 
                              ? '2px solid rgba(255,215,0,0.3)'
                              : '1px solid rgba(255,255,255,0.1)'
                          }}>
                            <div style={{
                              fontSize: '1.2rem',
                              fontWeight: 900,
                              minWidth: 40,
                              textAlign: 'center',
                              color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.6)'
                            }}>
                              {idx + 1}°
                            </div>
                            <a href={userHref} title={displayName} style={{ display: 'inline-block' }}>
                              <img
                                src={avatarSrc}
                                alt={displayName}
                                style={{ 
                                  width: 48, 
                                  height: 48, 
                                  borderRadius: 10, 
                                  objectFit: 'cover',
                                  border: '2px solid rgba(255,255,255,0.2)'
                                }}
                              />
                            </a>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <a href={userHref} title={displayName} style={{ 
                                color: '#fff', 
                                textDecoration: 'none', 
                                fontWeight: 700, 
                                fontSize: '1.1rem',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {displayName}
                              </a>
                              {item.bio_short && (
                                <div style={{ 
                                  opacity: 0.8, 
                                  fontSize: '0.85rem', 
                                  marginTop: 4,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {item.bio_short}
                                </div>
                              )}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '10px 16px',
                              borderRadius: 10,
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              minWidth: 100
                            }}>
                              <span style={{ fontSize: '1.5rem' }}>❤️</span>
                              <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{votes}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Tabs de ritmos (para filtrar candidatos) - solo cuando el trending NO está cerrado */}
      {t.status !== 'closed' && ritmos.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {ritmos.map((r) => {
            const active = activeRitmo === r.ritmo_slug;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRitmo(active ? null : r.ritmo_slug)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "rgba(0,188,212,0.8)" : "rgba(255,255,255,0.2)"}`,
                  background: active ? "rgba(0,188,212,0.15)" : "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {labelFromSlug(r.ritmo_slug)}
              </button>
            );
          })}
        </div>
      )}

      {/* Listas de candidatos (solo cuando el trending NO está cerrado) */}
      {t.status !== 'closed' && (
      <div style={{ display: 'grid', gap: 16 }}>
        {useRoundsMode ? (
          currentRoundCandidates.length > 0 ? (
          // Modo rondas: mostrar candidatos de la ronda actual agrupados por lista,
          // filtrando por ritmo si hay uno activo
          (() => {
            const filtered = activeRitmo
              ? currentRoundCandidates.filter((c: any) => c.ritmo_slug === activeRitmo)
              : currentRoundCandidates;
            const byList = new Map<string, any[]>();
            filtered.forEach((c: any) => {
              const key = c.list_name || 'General';
              if (!byList.has(key)) byList.set(key, []);
              byList.get(key)!.push(c);
            });
            return Array.from(byList.entries()).map(([listName, items]) => (
              <section key={listName} style={{ display: 'grid', gap: 10 }}>
                <h3 style={{ margin: 0, fontWeight: 900 }}>
                  {listName} <span style={{ opacity: .75, fontSize: 12 }}>({items.length})</span>
                </h3>
                <div className="trending-candidates-grid">
                  {items.map((c: any) => {
                    const m = userMeta[c.user_id] || {};
                    const avatarSrc = c.avatar_url || m.avatar || "https://placehold.co/96x96?text=User";
                    const displayName = c.display_name || m.name || "Sin nombre";
                    const userHref = urls.userLive(c.user_id);
                    const currentRound = rounds.find(r => r.round_number === t.current_round_number);
                    const canVoteRound = currentRound?.status === 'active' && (!currentRound.ends_at || new Date(currentRound.ends_at) > new Date());
                    return (
                      <div key={c.candidate_id} style={{
                        position: 'relative',
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: 16,
                        padding: 12,
                        background: "linear-gradient(135deg, rgba(0,188,212,.10), rgba(30,136,229,.06))",
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        maxWidth: 450
                      }}>
                        <div style={{ position:'absolute', top:8, right:8, padding:'6px 10px', borderRadius:999, background:'rgba(0,0,0,0.45)', border:'1px solid rgba(255,255,255,0.2)', fontWeight:900 }}>
                          {isSA ? <>❤️ {c.votes}</> : (myVotes.get(c.candidate_id) ? 'Mi voto' : '')}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, alignItems: "center" }}>
                          <a href={userHref} title={displayName} style={{ display:'inline-block' }}>
                            <img
                              src={avatarSrc}
                              alt={displayName}
                              style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border:'1px solid rgba(255,255,255,0.2)' }}
                            />
                          </a>
                          <div style={{ minWidth: 0 }}>
                            <a href={userHref} title={displayName} style={{ color:'#fff', textDecoration:'none', fontWeight: 900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {displayName}
                            </a>
                            <div style={{ opacity: 0.85, fontSize: 12 }}>{c.list_name || 'General'}</div>
                          </div>
                        </div>
                        {c.bio_short && <p style={{ opacity: 0.92, marginTop: 10, lineHeight: 1.35 }}>{c.bio_short}</p>}
                        <div style={{ marginTop: 10 }}>
                          <button
                            disabled={!canVoteRound}
                            onClick={() => doVote(c.candidate_id)}
                            style={{
                              width: '100%',
                              padding: "10px 14px",
                              borderRadius: 10,
                              border: "1px solid rgba(255,255,255,0.25)",
                              background: canVoteRound ? "linear-gradient(135deg, rgba(30,136,229,.95), rgba(0,188,212,.95))" : "rgba(255,255,255,0.08)",
                              color: "#fff",
                              fontWeight: 900,
                              cursor: canVoteRound ? "pointer" : "not-allowed",
                              boxShadow: canVoteRound ? '0 6px 18px rgba(0,188,212,0.35)' : 'none'
                            }}
                          >
                            {!canVoteRound ? "Ronda cerrada" : (myVotes.get(c.candidate_id) ? "Quitar voto" : "❤️ Votar")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ));
          })()
          ) : (
            <div style={{ 
              padding: 24, 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 12, 
              border: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <p style={{ opacity: 0.8 }}>No hay candidatos activos en esta ronda.</p>
              {isSA && (
                <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                  Verifica que los candidatos estén asignados a la ronda {t.current_round_number}
                </p>
              )}
            </div>
          )
        ) : (
          // Modo tradicional: mostrar candidatos agrupados por lista y ritmo
          groupByList.map(([listName, items]) => (
          <section key={listName} style={{ display: 'grid', gap: 10 }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>
              {listName} <span style={{ opacity: .75, fontSize: 12 }}>({items.length})</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,450px))", gap: 12, justifyContent:'center' }}>
              {items.map((c:any) => {
                const votes = votesByCandidate.get(c.id) ?? 0;
                const m = userMeta[c.user_id] || {};
                const avatarSrc = c.avatar_url || m.avatar || "https://placehold.co/96x96?text=User";
                const displayName = c.display_name || m.name || "Sin nombre";
                const userHref = urls.userLive(c.user_id);
                return (
                  <div key={c.id} style={{
                    position: 'relative',
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 16,
                    padding: 12,
                    background: "linear-gradient(135deg, rgba(0,188,212,.10), rgba(30,136,229,.06))",
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    maxWidth: 450
                  }}>
                    <div style={{ position:'absolute', top:8, right:8, padding:'6px 10px', borderRadius:999, background:'rgba(0,0,0,0.45)', border:'1px solid rgba(255,255,255,0.2)', fontWeight:900 }}>
                      {isSA ? <>❤️ {votes}</> : (myVotes.get(c.id) ? 'Mi voto' : '')}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, alignItems: "center" }}>
                      <a href={userHref} title={displayName} style={{ display:'inline-block' }}>
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border:'1px solid rgba(255,255,255,0.2)' }}
                        />
                      </a>
                      <div style={{ minWidth: 0 }}>
                        <a href={userHref} title={displayName} style={{ color:'#fff', textDecoration:'none', fontWeight: 900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {displayName}
                        </a>
                        <div style={{ opacity: 0.85, fontSize: 12 }}>{labelFromSlug(c.ritmo_slug)}{c.list_name ? ` • ${c.list_name}` : ''}</div>
                      </div>
                    </div>
                    {c.bio_short && <p style={{ opacity: 0.92, marginTop: 10, lineHeight: 1.35 }}>{c.bio_short}</p>}
                    <div style={{ marginTop: 10 }}>
                      <button
                        onClick={() => doVote(c.id)}
                        style={{
                          width: '100%',
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.25)",
                          background: "linear-gradient(135deg, rgba(30,136,229,.95), rgba(0,188,212,.95))",
                          color: "#fff",
                          fontWeight: 900,
                          cursor: "pointer",
                          boxShadow: '0 6px 18px rgba(0,188,212,0.35)'
                        }}
                      >
                        {myVotes.get(c.id) ? "Quitar voto" : "❤️ Votar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
        )}
      </div>
      )}

      {/* Sección de favoritos/leaderboard rápido solo para admins y solo mientras el trending NO está cerrado */}
      {t.status !== 'closed' && isSA && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontWeight: 900, marginBottom: 8 }}>🏆 Favoritos (Admin)</h2>
          {ritmos.map((r) => {
            const rows = board.filter((x) => x.ritmo_slug === r.ritmo_slug);
            if (!rows.length) return null;
            const byList = rows.reduce((acc:any, it:any) => {
              const k = it.list_name || 'General';
              acc[k] = acc[k] || [];
              acc[k].push(it);
              return acc;
            }, {} as Record<string, any[]>);
            return (
              <div key={r.id} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{labelFromSlug(r.ritmo_slug)}</div>
                <div style={{ display:'grid', gap: 8 }}>
                  {Object.entries(byList).map(([lname, items]: any) => (
                    <div key={lname} style={{ border:'1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 8 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, opacity: .9 }}>{lname}</div>
                      <div className="trending-leaderboard-grid">
                        {items.slice(0,5).map((x:any, i:number) => (
                          <div key={x.candidate_id} style={{ display:'flex', alignItems:'center', gap: 10, border:'1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 8, background:'rgba(255,255,255,0.04)' }}>
                            <div style={{ width: 30, textAlign:'center' }}>{i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : i+1}</div>
                            <a href={urls.userLive(x.user_id)} title={x.display_name || 'Usuario'} style={{ display:'inline-block' }}>
                              <img src={x.avatar_url || 'https://placehold.co/48x48'} alt={x.display_name || 'Usuario'} style={{ width: 40, height: 40, borderRadius: 8, objectFit:'cover' }} />
                            </a>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <a href={urls.userLive(x.user_id)} style={{ color:'#fff', textDecoration:'none', fontWeight: 800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{x.display_name || 'Usuario'}</a>
                              <div style={{ fontSize: 12, opacity: .8 }}>{labelFromSlug(x.ritmo_slug)}{x.list_name ? ` • ${x.list_name}` : ''}</div>
                            </div>
                            {/* Votos ocultos para público */}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
      </div>
    </>
  );
}


