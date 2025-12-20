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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const [trending, setTrending] = React.useState<any>(null);
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
        setTrending(tr);
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
            } catch (e: any) {
              // Solo mostrar error si no es porque la función no existe
              if (e?.code !== 'PGRST202') {
                console.error(`[TrendingDetail] Error cargando resultados de ronda ${round.round_number}`, e);
              }
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
          } catch (e: any) {
            // Solo mostrar error si no es porque la función no existe
            if (e?.code !== 'PGRST202') {
              console.error('[TrendingDetail] Error cargando ganadores finales', e);
            }
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
    if (!useRoundsMode || !trending) return;
    
    const loadRoundCandidates = async () => {
      const roundNum = trending.current_round_number || (rounds.find(r => r.status === 'active')?.round_number);
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
  }, [useRoundsMode, trending?.current_round_number, rounds, trendingId, isSA]);

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
      alert(t('login_to_vote'));
      return;
    }
    try {
      if (useRoundsMode && trending?.current_round_number) {
        // Validar que la ronda actual esté activa y dentro de su ventana de tiempo
        const currentRound = rounds.find(r => r.round_number === trending.current_round_number);
        const canVoteRound =
          currentRound?.status === 'active' &&
          (!currentRound.ends_at || new Date(currentRound.ends_at) > new Date());
        if (!canVoteRound) {
          alert(t('round_not_active'));
          return;
        }

        // Votar en ronda específica
        await voteTrendingRound(trendingId, candidateId, trending.current_round_number);
        // Refetch round candidates
        const roundCandidates = await getRoundCandidates(trendingId, trending.current_round_number);
        setCurrentRoundCandidates(roundCandidates);
      } else {
        // Modo tradicional: validar ventana de tiempo global del trending
        const canVoteByTime = isWithinWindow(trending?.starts_at, trending?.ends_at);
        const canVote = trending?.status === "open" && canVoteByTime;
        if (!canVote) {
          alert(t('trending_not_open'));
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
        alert(t('login_to_vote') + ' ❤️');
      } else {
        alert(errorMsg || t('could_not_vote'));
      }
    }
  };

  const doCloseRound = async (roundNumber: number) => {
    if (!isSA) return;
    if (!confirm(t('close_round_confirm', { roundNumber }))) return;
    try {
      await adminCloseRound(trendingId, roundNumber);
      // Recargar datos
      const [tr, roundsData] = await Promise.all([
        getTrending(trendingId),
        getTrendingRounds(trendingId),
      ]);
      setTrending(tr);
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
        } catch (e: any) {
          // Solo mostrar error si no es porque la función no existe
          if (e?.code !== 'PGRST202') {
            console.error(`[TrendingDetail] Error cargando resultados de ronda ${round.round_number}`, e);
          }
        }
      }
      setRoundResults(resultsMap);
      
      // Si el trending está cerrado, cargar ganadores finales
      if (tr.status === 'closed') {
        try {
          const winners = await getFinalWinners(trendingId);
          setFinalWinners(winners);
        } catch (e: any) {
          // Solo mostrar error si no es porque la función no existe
          if (e?.code !== 'PGRST202') {
            console.error('[TrendingDetail] Error cargando ganadores finales', e);
          }
        }
      }
      
      alert(t('close_round_success'));
    } catch (e: any) {
      alert(e?.message || t('could_not_close_round'));
    }
  };

  if (loading) return <div style={{ padding: 'clamp(1rem, 3vw, 24px)' }}>{t('loading')}</div>;
  if (!trending) return <div style={{ padding: 'clamp(1rem, 3vw, 24px)' }}>{t('trending_not_found')}</div>;

  return (
    <>
      <style>{`
        .trending-detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a2a 100%);
        }
        
        .trending-detail-hero {
          position: relative;
          width: 100%;
          min-height: clamp(300px, 50vh, 500px);
          max-height: 600px;
          display: flex;
          align-items: flex-end;
          padding: clamp(1.5rem, 4vw, 4rem);
          margin-bottom: 2rem;
          overflow: hidden;
          border-radius: 0 0 clamp(24px, 4vw, 32px) clamp(24px, 4vw, 32px);
          background: linear-gradient(135deg, rgba(10,10,10,0.9), rgba(26,26,26,0.8));
        }
        
        .trending-detail-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, 
            rgba(0,0,0,0.2) 0%, 
            rgba(0,0,0,0.4) 40%,
            rgba(0,0,0,0.6) 70%,
            rgba(0,0,0,0.9) 100%);
          z-index: 1;
        }
        
        .trending-detail-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 30%, rgba(229,57,53,0.2) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 70%, rgba(251,140,0,0.2) 0%, transparent 60%);
          z-index: 1;
          pointer-events: none;
        }
        
        .trending-detail-cover {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.5;
          z-index: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .trending-detail-hero:hover .trending-detail-cover {
          opacity: 0.6;
          transform: scale(1.02);
        }
        
        .trending-detail-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: clamp(1rem, 2vw, 1.5rem);
        }
        
        .trending-detail-header h1 {
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 900;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 40%, #FFD166 80%, #fff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 4px 30px rgba(229,57,53,0.5);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        
        .trending-detail-header p {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: rgba(255,255,255,0.9);
          margin: 0 0 1.5rem 0;
          line-height: 1.6;
        }
        
        .trending-detail-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        
        .trending-detail-cover-standalone {
          width: 100%;
          border-radius: 24px;
          overflow: hidden;
          border: 2px solid rgba(229,57,53,0.2);
          margin-bottom: 2rem;
          max-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .trending-detail-cover-standalone img {
          width: 100%;
          height: 300px;
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
          .trending-detail-hero {
            min-height: 300px;
            padding: 2rem 1.5rem;
            border-radius: 0 0 24px 24px;
          }
          
          .trending-detail-header h1 {
            font-size: 2rem !important;
          }
          
          .trending-detail-header p {
            font-size: 1rem !important;
          }
          
          .trending-detail-meta {
            gap: 8px;
          }
          
          .trending-detail-meta span {
            font-size: 0.8rem !important;
            padding: 6px 12px !important;
          }
          
          .trending-participants-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }
          
          .trending-candidates-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .trending-leaderboard-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .trending-detail-hero {
            min-height: 250px;
            padding: 1.5rem 1rem;
            border-radius: 0 0 20px 20px;
          }
          
          .trending-detail-header h1 {
            font-size: 1.75rem !important;
          }
          
          .trending-detail-header p {
            font-size: 0.95rem !important;
          }
          
          .trending-detail-meta {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .trending-participants-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
        
        /* Estilos responsive para Leaderboard */
        @media (max-width: 768px) {
          .leaderboard-section h2 {
            margin-bottom: 24px !important;
          }
          
          .leaderboard-container {
            padding: 20px !important;
          }
          
          .leaderboard-list h3 {
            margin-bottom: 16px !important;
            padding: 10px 16px !important;
          }
          
          .leaderboard-item {
            flex-wrap: wrap;
            gap: 12px !important;
            padding: 16px !important;
          }
          
          .leaderboard-position {
            min-width: 40px !important;
            font-size: 1.1rem !important;
          }
          
          .leaderboard-position span:first-child {
            font-size: 1.5rem !important;
          }
          
          .leaderboard-avatar {
            width: 48px !important;
            height: 48px !important;
          }
          
          .leaderboard-info {
            width: 100%;
            order: 3;
          }
          
          .leaderboard-name {
            white-space: normal !important;
            word-break: break-word;
            overflow: visible !important;
            text-overflow: unset !important;
          }
          
          .leaderboard-bio {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
          }
          
          .leaderboard-votes {
            order: 2;
            min-width: auto !important;
            padding: 8px 14px !important;
          }
        }
        
        @media (max-width: 480px) {
          .leaderboard-section h2 {
            margin-bottom: 20px !important;
            font-size: 1.75rem !important;
          }
          
          .leaderboard-container {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          
          .leaderboard-list {
            margin-bottom: 24px !important;
          }
          
          .leaderboard-list h3 {
            font-size: 1.25rem !important;
            padding: 10px 14px !important;
            margin-bottom: 12px !important;
          }
          
          .leaderboard-items {
            gap: 12px !important;
          }
          
          .leaderboard-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 16px 12px !important;
            gap: 12px !important;
          }
          
          .leaderboard-position {
            min-width: auto !important;
            font-size: 1rem !important;
          }
          
          .leaderboard-position span:first-child {
            font-size: 1.5rem !important;
          }
          
          .leaderboard-avatar {
            width: 56px !important;
            height: 56px !important;
          }
          
          .leaderboard-info {
            width: 100%;
            text-align: center;
          }
          
          .leaderboard-name {
            font-size: 1rem !important;
            margin-bottom: 4px !important;
          }
          
          .leaderboard-votes {
            width: 100%;
            justify-content: center;
            padding: 10px 16px !important;
          }
        }
        
        /* Estilos responsive para Participantes */
        @media (max-width: 768px) {
          .participants-section h2 {
            margin-bottom: 24px !important;
          }
          
          .participants-list-container {
            padding: 20px !important;
            margin-bottom: 24px !important;
          }
          
          .participants-list-container h3 {
            margin-bottom: 16px !important;
            padding: 10px 16px !important;
          }
          
          .participants-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)) !important;
            gap: 12px !important;
          }
          
          .participant-card {
            padding: 14px !important;
            gap: 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          .participants-section h2 {
            margin-bottom: 20px !important;
            font-size: 1.75rem !important;
          }
          
          .participants-list-container {
            padding: 16px !important;
            border-radius: 16px !important;
            margin-bottom: 20px !important;
          }
          
          .participants-list-container h3 {
            font-size: 1.25rem !important;
            padding: 10px 14px !important;
            margin-bottom: 12px !important;
          }
          
          .participants-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          
          .participant-card {
            padding: 12px !important;
            gap: 10px !important;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .participant-card img {
            width: 64px !important;
            height: 64px !important;
          }
          
          .participant-card > div {
            width: 100%;
            text-align: center;
          }
          
          .participant-card a {
            white-space: normal !important;
            word-break: break-word;
            overflow: visible !important;
            text-overflow: unset !important;
          }
        }
      `}</style>
      <div className="trending-detail-container">
      {/* Hero Section con Cover */}
      {trending.cover_url ? (
        <div className="trending-detail-hero">
          <img src={trending.cover_url} alt={trending.title} className="trending-detail-cover" />
          <div className="trending-detail-hero-content">
            {/* Botón Volver */}
            <button 
              onClick={() => navigate('/trending')} 
              style={{
                marginBottom: '1.5rem',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              {t('back_to_trending')}
            </button>
            <header className="trending-detail-header">
              <h1>{trending.title}</h1>
              {trending.description && <p>{trending.description}</p>}
              <div className="trending-detail-meta">
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: trending.status === 'open' 
                    ? 'rgba(16,185,129,0.2)' 
                    : trending.status === 'closed'
                    ? 'rgba(59,130,246,0.2)'
                    : 'rgba(156,163,175,0.2)',
                  border: `1.5px solid ${trending.status === 'open' 
                    ? 'rgba(16,185,129,0.5)' 
                    : trending.status === 'closed'
                    ? 'rgba(59,130,246,0.5)'
                    : 'rgba(156,163,175,0.5)'}`,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#fff'
                }}>
                  {trending.status === 'open' ? `🟢 ${t('open')}` : trending.status === 'closed' ? `🔴 ${t('closed')}` : `⚪ ${trending.status}`}
                </span>
                {trending.starts_at && (
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#fff'
                  }}>
                    🟢 {t('start_time')}: {new Date(trending.starts_at).toLocaleDateString()}
                  </span>
                )}
                {trending.ends_at && (
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1.5px solid rgba(239,68,68,0.3)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#fff'
                  }}>
                    🔴 {t('end_time')}: {new Date(trending.ends_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </header>
          </div>
        </div>
      ) : (
        <div style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
          {/* Botón Volver */}
          <button 
            onClick={() => navigate('/trending')} 
            style={{
              marginBottom: '1.5rem',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.95rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            {t('back_to_trending')}
          </button>
          <header className="trending-detail-header" style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>{trending.title}</h1>
            {trending.description && <p>{trending.description}</p>}
            <div className="trending-detail-meta">
              <span style={{
                padding: '8px 16px',
                borderRadius: '999px',
                background: trending.status === 'open' 
                  ? 'rgba(16,185,129,0.2)' 
                  : trending.status === 'closed'
                  ? 'rgba(59,130,246,0.2)'
                  : 'rgba(156,163,175,0.2)',
                border: `1.5px solid ${trending.status === 'open' 
                    ? 'rgba(16,185,129,0.5)' 
                    : trending.status === 'closed'
                  ? 'rgba(59,130,246,0.5)'
                  : 'rgba(156,163,175,0.5)'}`,
                fontSize: '0.9rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#fff'
              }}>
                {trending.status === 'open' ? `🟢 ${t('open')}` : trending.status === 'closed' ? `🔴 ${t('closed')}` : `⚪ ${trending.status}`}
              </span>
              {trending.starts_at && (
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1.5px solid rgba(16,185,129,0.3)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  🟢 {t('start_time')}: {new Date(trending.starts_at).toLocaleDateString()}
                </span>
              )}
              {trending.ends_at && (
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1.5px solid rgba(239,68,68,0.3)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  🔴 {t('end_time')}: {new Date(trending.ends_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </header>
        </div>
      )}
      
      <div style={{ padding: '0 clamp(1.5rem, 4vw, 3rem) clamp(3rem, 6vw, 4rem)' }}>

      {/* Mostrar participantes desde participants_lists si existe (solo mientras el trending NO está cerrado) */}
      {trending.status !== 'closed' && trending.participants_lists && (() => {
        let participantsData: any = null;
        try {
          if (typeof trending.participants_lists === 'string') {
            participantsData = JSON.parse(trending.participants_lists);
          } else {
            participantsData = trending.participants_lists;
          }
        } catch (e) {
          console.error('Error parsing participants_lists', e);
        }
        
        if (participantsData && participantsData.lists && participantsData.lists.length > 0) {
          return (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ 
                marginBottom: 24, 
                fontSize: '2rem', 
                fontWeight: 900,
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 50%, #FFD166 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                👥 {t('participants')}
              </h2>
              <div style={{ display: 'grid', gap: 24 }}>
                {participantsData.lists.map((list: any) => (
                  <div key={list.name} style={{
                    padding: 24,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: '2px solid rgba(229,57,53,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 20px 0', 
                      fontWeight: 900, 
                      fontSize: '1.5rem',
                      color: '#fff'
                    }}>
                      {list.name} <span style={{ opacity: 0.7, fontSize: '1rem', fontWeight: 400 }}>({list.participants?.length || 0})</span>
                    </h3>
                    <div className="trending-participants-grid">
                      {list.participants?.map((p: any) => (
                        <a 
                          key={p.id} 
                          href={urls.userLive(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(229,57,53,0.4)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <img
                            src={p.avatar || 'https://placehold.co/48x48?text=User'}
                            alt={p.name}
                            style={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: 12, 
                              objectFit: 'cover',
                              border: '2px solid rgba(255,255,255,0.2)'
                            }}
                          />
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: '0.95rem',
                            color: '#fff'
                          }}>
                            {p.name}
                          </span>
                        </a>
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
      {trending.status !== 'closed' && useRoundsMode && trending.current_round_number > 0 && (
        <div style={{ 
          padding: 24, 
          borderRadius: 20, 
          background: 'linear-gradient(135deg, rgba(0,188,212,0.15), rgba(30,136,229,0.1))', 
          border: '2px solid rgba(0,188,212,0.4)',
          marginBottom: 32,
          boxShadow: '0 8px 32px rgba(0,188,212,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.75rem', 
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00BCD4, #1E88E5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🎯 {t('round')} {trending.current_round_number} {t('of')} {trending.total_rounds || rounds.length}
              </h2>
              {rounds.find(r => r.round_number === trending.current_round_number) && (
                <div style={{ marginTop: 8, opacity: 0.9 }}>
                  {(() => {
                    const currentRound = rounds.find(r => r.round_number === trending.current_round_number);
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
            {isSA && rounds.find(r => r.round_number === trending.current_round_number)?.status === 'active' && (
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
                      const roundCandidates = await getRoundCandidates(trendingId, trending.current_round_number);
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
                  onClick={() => doCloseRound(trending.current_round_number)}
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
      {trending.status !== 'closed' && useRoundsMode && roundResults.size > 0 && (() => {
        const closedRounds = rounds.filter(r => r.status === 'closed' || r.status === 'completed').sort((a, b) => a.round_number - b.round_number);
        if (closedRounds.length === 0) return null;
        
        return (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ 
              marginBottom: 32, 
              fontSize: '2rem', 
              fontWeight: 900,
              background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 50%, #FFD166 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📊 Resultados Finales por Ronda
            </h2>
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
                  marginBottom: 32,
                  padding: 28,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.2))',
                  border: '2px solid rgba(229,57,53,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 24,
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1.75rem', 
                      fontWeight: 900,
                      color: '#fff'
                    }}>
                      🎯 Ronda {round.round_number} - Finalizada
                    </h3>
                    <span style={{
                      padding: '10px 18px',
                      borderRadius: 999,
                      background: round.status === 'completed' 
                        ? 'rgba(16,185,129,0.2)' 
                        : 'rgba(239,68,68,0.2)',
                      border: `1.5px solid ${round.status === 'completed' 
                        ? 'rgba(16,185,129,0.5)' 
                        : 'rgba(239,68,68,0.5)'}`,
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#fff'
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
      {trending && trending.status === 'closed' && (
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
              const sortedWinners = winners.sort((a, b) => a.final_position - b.final_position).slice(0, 3);
              
              return (
                <div key={listName} className="winners-list-container" style={{
                  marginBottom: 56,
                  padding: 48,
                  borderRadius: 32,
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,193,7,0.12))',
                  border: '4px solid rgba(255,215,0,0.7)',
                  boxShadow: 
                    '0 20px 60px rgba(255,215,0,0.5), ' +
                    '0 0 0 1px rgba(255,215,0,0.3) inset, ' +
                    '0 8px 32px rgba(255,215,0,0.3), ' +
                    'inset 0 0 60px rgba(255,215,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(16px)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  {/* Efecto de fondo decorativo mejorado */}
                  <div style={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,215,0,0.25), transparent 70%)',
                    pointerEvents: 'none',
                    filter: 'blur(30px)',
                    animation: 'float 6s ease-in-out infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: -80,
                    left: -80,
                    width: 350,
                    height: 350,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,193,7,0.2), transparent 70%)',
                    pointerEvents: 'none',
                    filter: 'blur(30px)',
                    animation: 'float 8s ease-in-out infinite reverse'
                  }} />
                  
                  {/* Línea superior decorativa */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
                    opacity: 0.9
                  }} />
                  
                  <h2 className="winners-list-title" style={{ 
                    margin: '0 0 48px 0', 
                    fontSize: 'clamp(2rem, 5vw, 3rem)', 
                    fontWeight: 900,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 4px 20px rgba(255,215,0,0.4)',
                    letterSpacing: '2px',
                    position: 'relative',
                    zIndex: 1,
                    filter: 'drop-shadow(0 2px 8px rgba(255,215,0,0.3))'
                  }}>
                    🏆 {listName}
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
                      
                      if (w.final_position === 1) {
                        medal = '🥇';
                        medalSize = '5rem';
                        positionColor = '#FFD700';
                        positionBg = 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,193,7,0.2))';
                        positionBorder = '4px solid #FFD700';
                        positionText = 'CAMPEÓN';
                        glowEffect = '0 0 30px rgba(255,215,0,0.6)';
                      } else if (w.final_position === 2) {
                        medal = '🥈';
                        medalSize = '4.5rem';
                        positionColor = '#C0C0C0';
                        positionBg = 'linear-gradient(135deg, rgba(192,192,192,0.25), rgba(169,169,169,0.15))';
                        positionBorder = '3px solid #C0C0C0';
                        positionText = 'SUBCAMPEÓN';
                        glowEffect = '0 0 25px rgba(192,192,192,0.5)';
                      } else if (w.final_position === 3) {
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
                          display: 'grid',
                          gridTemplateColumns: 'auto auto 1fr',
                          gridTemplateRows: 'auto auto',
                          gap: 'clamp(16px, 3vw, 28px)',
                          padding: 'clamp(24px, 4vw, 40px)',
                          borderRadius: 'clamp(20px, 3vw, 28px)',
                          background: positionBg,
                          border: positionBorder,
                          position: 'relative',
                          boxShadow: glowEffect,
                          transform: w.final_position === 1 ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          overflow: 'hidden',
                          backdropFilter: 'blur(12px)',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (w.final_position !== 1) {
                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                            e.currentTarget.style.boxShadow = glowEffect.replace('0 0', '0 0 40px');
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (w.final_position !== 1) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = glowEffect;
                          }
                        }}
                        >
                          {/* Efecto de brillo para el primer lugar */}
                          {w.final_position === 1 && (
                            <div style={{
                              position: 'absolute',
                              top: -50,
                              right: -50,
                              width: 200,
                              height: 200,
                              borderRadius: '50%',
                              background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent)',
                              pointerEvents: 'none',
                              filter: 'blur(20px)',
                              animation: 'pulse 3s ease-in-out infinite'
                            }} />
                          )}
                          
                          {/* Medalla - Primera columna, ocupa ambas filas */}
                          <div className="winner-medal" style={{
                            fontSize: medalSize,
                            lineHeight: 1,
                            gridRow: '1 / -1',
                            textAlign: 'center',
                            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
                            animation: w.final_position === 1 ? 'pulse 2s infinite' : 'none',
                            position: 'relative',
                            zIndex: 1,
                            alignSelf: 'center',
                            minWidth: 'clamp(80px, 12vw, 120px)'
                          }}>
                            {medal}
                          </div>
                          
                          {/* Avatar - Segunda columna, primera fila */}
                          <a href={userHref} title={displayName} className="winner-avatar-link" style={{ 
                            display: 'inline-block',
                            position: 'relative',
                            zIndex: 1,
                            transition: 'transform 0.3s ease',
                            gridRow: '1 / 2',
                            alignSelf: 'start'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          >
                            <div className="winner-avatar" style={{
                              width: 'clamp(80px, 12vw, 112px)',
                              height: 'clamp(80px, 12vw, 112px)',
                              borderRadius: 'clamp(16px, 2.5vw, 24px)',
                              padding: 'clamp(3px, 0.5vw, 5px)',
                              background: positionBg,
                              border: `clamp(3px, 0.5vw, 5px) solid ${positionColor}`,
                              boxShadow: `0 0 25px ${positionColor}60, 0 8px 24px rgba(0,0,0,0.4)`,
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(135deg, ${positionColor}20, transparent)`,
                                zIndex: 1,
                                borderRadius: 'inherit'
                              }} />
                              <img
                                src={avatarSrc}
                                alt={displayName}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  borderRadius: 'calc(clamp(16px, 2.5vw, 24px) - clamp(3px, 0.5vw, 5px))', 
                                  objectFit: 'cover',
                                  display: 'block',
                                  position: 'relative',
                                  zIndex: 2
                                }}
                              />
                            </div>
                          </a>
                          
                          {/* Información del ganador - Tercera columna, ocupa ambas filas */}
                          <div className="winner-info" style={{ 
                            flex: 1, 
                            minWidth: 0, 
                            position: 'relative', 
                            zIndex: 1,
                            gridRow: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 'clamp(8px, 1.5vw, 12px)'
                          }}>
                            {positionText && (
                              <div className="winner-position-text" style={{
                                fontSize: 'clamp(0.85rem, 1.8vw, 1.1rem)',
                                fontWeight: 900,
                                color: positionColor,
                                textTransform: 'uppercase',
                                letterSpacing: 'clamp(1px, 0.3vw, 2px)',
                                textShadow: `0 0 15px ${positionColor}80, 0 2px 8px rgba(0,0,0,0.5)`,
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                                lineHeight: 1.2
                              }}>
                                {positionText}
                              </div>
                            )}
                            <div className="winner-position" style={{
                              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                              opacity: 0.95,
                              fontWeight: 800,
                              color: positionColor,
                              textShadow: `0 0 10px ${positionColor}50`,
                              lineHeight: 1.3
                            }}>
                              {w.final_position}° Lugar
                            </div>
                            <a href={userHref} title={displayName} className="winner-name" style={{ 
                              color: '#fff', 
                              textDecoration: 'none', 
                              fontWeight: 900, 
                              fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textShadow: '0 4px 12px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)',
                              transition: 'color 0.2s ease',
                              lineHeight: 1.2
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = positionColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#fff';
                            }}
                            >
                              {displayName}
                            </a>
                            {w.bio_short && (
                              <div className="winner-bio" style={{ 
                                opacity: 0.92, 
                                fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', 
                                fontStyle: 'italic',
                                color: 'rgba(255,255,255,0.9)',
                                textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.4
                              }}>
                                {w.bio_short}
                              </div>
                            )}
                          </div>
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
            
            @keyframes float {
              0%, 100% { transform: translateY(0) translateX(0); }
              50% { transform: translateY(-20px) translateX(10px); }
            }
            
            /* Estilos responsivos para ganadores */
            .winners-list-container {
              width: 100%;
            }
            
            .winner-card {
              grid-template-columns: auto auto 1fr;
            }
            
            @media (max-width: 768px) {
              .winners-list-container {
                padding: clamp(20px, 4vw, 32px) !important;
                margin-bottom: 32px !important;
                border-radius: clamp(20px, 3vw, 28px) !important;
              }
              
              .winners-list-title {
                font-size: clamp(1.5rem, 4vw, 2rem) !important;
                margin-bottom: 24px !important;
              }
              
              .winners-grid {
                gap: clamp(16px, 3vw, 24px) !important;
              }
              
              .winner-card {
                grid-template-columns: auto 1fr;
                grid-template-rows: auto auto auto;
                padding: clamp(20px, 3vw, 28px) !important;
                gap: clamp(12px, 2vw, 20px) !important;
                text-align: center;
              }
              
              .winner-medal {
                grid-row: 1 / 2;
                grid-column: 1 / 2;
                min-width: auto !important;
                font-size: clamp(3rem, 6vw, 4rem) !important;
                justify-self: center;
              }
              
              .winner-avatar-link {
                grid-row: 2 / 3;
                grid-column: 1 / -1;
                justify-self: center;
              }
              
              .winner-avatar {
                width: clamp(80px, 15vw, 100px) !important;
                height: clamp(80px, 15vw, 100px) !important;
              }
              
              .winner-info {
                grid-row: 3 / 4;
                grid-column: 1 / -1;
                width: 100%;
                text-align: center;
                align-items: center;
              }
              
              .winner-name {
                font-size: clamp(1.25rem, 3vw, 1.5rem) !important;
                white-space: normal !important;
                word-break: break-word;
                overflow: visible !important;
                text-overflow: unset !important;
                text-align: center;
              }
              
              .winner-bio {
                white-space: normal !important;
                overflow: visible !important;
                text-overflow: unset !important;
                font-size: clamp(0.9rem, 2vw, 1rem) !important;
                text-align: center;
              }
              
              .winner-position-text {
                font-size: clamp(0.8rem, 1.8vw, 1rem) !important;
              }
              
              .winner-position {
                font-size: clamp(0.9rem, 2vw, 1.1rem) !important;
              }
            }
            
            @media (max-width: 480px) {
              .winners-list-container {
                padding: clamp(16px, 3vw, 24px) !important;
                margin-bottom: 24px !important;
                border-radius: clamp(16px, 2.5vw, 24px) !important;
              }
              
              .winners-list-title {
                font-size: clamp(1.25rem, 4vw, 1.5rem) !important;
                margin-bottom: 20px !important;
                letter-spacing: 0.5px !important;
              }
              
              .winners-grid {
                gap: clamp(12px, 2.5vw, 20px) !important;
              }
              
              .winner-card {
                padding: clamp(16px, 3vw, 24px) !important;
                gap: clamp(12px, 2vw, 16px) !important;
                border-radius: clamp(16px, 2.5vw, 24px) !important;
              }
              
              .winner-medal {
                font-size: clamp(2.5rem, 6vw, 3.5rem) !important;
              }
              
              .winner-avatar {
                width: clamp(70px, 18vw, 90px) !important;
                height: clamp(70px, 18vw, 90px) !important;
                border-radius: clamp(12px, 2vw, 18px) !important;
              }
              
              .winner-name {
                font-size: clamp(1.1rem, 3vw, 1.3rem) !important;
              }
              
              .winner-bio {
                font-size: clamp(0.85rem, 2vw, 0.95rem) !important;
              }
              
              .winner-position-text {
                font-size: clamp(0.75rem, 1.8vw, 0.9rem) !important;
                letter-spacing: 0.5px !important;
              }
              
              .winner-position {
                font-size: clamp(0.85rem, 2vw, 1rem) !important;
              }
            }
          `}</style>
        </div>
      )}

      {/* Participantes del Trend - Solo cuando el trending está cerrado */}
      {trending && trending.status === 'closed' && (() => {
        // Preferimos participants_lists para mostrar TODOS los participantes por lista
        let participantsData: any = null;
        try {
          if (trending.participants_lists) {
            if (typeof trending.participants_lists === 'string') {
              participantsData = JSON.parse(trending.participants_lists);
            } else {
              participantsData = trending.participants_lists;
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
          <div className="participants-section" style={{ marginBottom: 48 }}>
            <h2 style={{ 
              marginBottom: 32, 
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', 
              fontWeight: 900, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 50%, #FFD166 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              👥 Participantes del Trend
            </h2>
            
            {lists.map((list: any) => (
              <div key={list.name} className="participants-list-container" style={{
                marginBottom: 32,
                padding: 'clamp(20px, 4vw, 32px)',
                borderRadius: 'clamp(16px, 3vw, 24px)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                border: '2px solid rgba(229,57,53,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ 
                  margin: '0 0 24px 0', 
                  fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', 
                  fontWeight: 900,
                  textAlign: 'center',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'rgba(229,57,53,0.15)',
                  border: '1px solid rgba(229,57,53,0.3)'
                }}>
                  {list.name} <span style={{ opacity: 0.7, fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 400 }}>({list.participants?.length || 0} participantes)</span>
                </h3>
                
                <div className="participants-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', 
                  gap: 'clamp(12px, 2vw, 20px)'
                }}>
                  {list.participants?.map((p: any) => (
                    <div key={p.id} className="participant-card" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(10px, 2vw, 16px)',
                      padding: 'clamp(12px, 2.5vw, 20px)',
                      borderRadius: 'clamp(12px, 2vw, 16px)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(229,57,53,0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <a href={urls.userLive(p.id)} title={p.name} style={{ 
                        display: 'inline-block',
                        flexShrink: 0,
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      >
                        <img
                          src={p.avatar || "https://placehold.co/60x60?text=User"}
                          alt={p.name}
                          style={{ 
                            width: 'clamp(48px, 8vw, 64px)', 
                            height: 'clamp(48px, 8vw, 64px)', 
                            borderRadius: 'clamp(10px, 2vw, 14px)', 
                            objectFit: 'cover',
                            border: '2px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                        />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={urls.userLive(p.id)} title={p.name} style={{ 
                          color: '#fff', 
                          textDecoration: 'none', 
                          fontWeight: 800, 
                          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#FFD166';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#fff';
                        }}
                        >
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
      {trending && trending.status === 'closed' && board.length > 0 && isSA && (
        <div className="leaderboard-section" style={{ marginBottom: 48 }}>
          <h2 style={{ 
            marginBottom: 40, 
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', 
            fontWeight: 900, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 50%, #FFD166 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '1px'
          }}>
            📊 Leaderboard General
          </h2>
          
          <div className="leaderboard-container" style={{
            padding: 'clamp(20px, 4vw, 32px)',
            borderRadius: 'clamp(20px, 3vw, 28px)',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.3))',
            border: '2px solid rgba(229,57,53,0.3)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.4), inset 0 0 40px rgba(229,57,53,0.05)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Efecto de fondo decorativo */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(229,57,53,0.15), transparent)',
              pointerEvents: 'none',
              filter: 'blur(30px)'
            }} />
            
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
                  <div key={listName} className="leaderboard-list" style={{ 
                    marginBottom: 40,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <h3 style={{ 
                      margin: '0 0 24px 0', 
                      fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', 
                      fontWeight: 900,
                      color: '#fff',
                      background: 'linear-gradient(135deg, rgba(229,57,53,0.3), rgba(251,140,0,0.2))',
                      padding: 'clamp(12px, 2vw, 14px) clamp(16px, 3vw, 24px)',
                      borderRadius: 'clamp(12px, 2vw, 16px)',
                      border: '2px solid rgba(229,57,53,0.4)',
                      textAlign: 'center'
                    }}>
                      {listName}
                    </h3>
                    <div className="leaderboard-items" style={{ display: 'grid', gap: 'clamp(12px, 2vw, 16px)' }}>
                      {sortedItems.map((item: any, idx: number) => {
                        const m = userMeta[item.user_id] || {};
                        const avatarSrc = item.avatar_url || m.avatar || "https://placehold.co/56x56?text=User";
                        const displayName = item.display_name || m.name || "Sin nombre";
                        const userHref = urls.userLive(item.user_id);
                        const votes = item.votes || 0;
                        const isTop3 = idx < 3;
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                        
                        return (
                          <div 
                            key={item.id || item.candidate_id}
                            className="leaderboard-item"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'clamp(12px, 2vw, 20px)',
                              padding: 'clamp(16px, 2.5vw, 20px)',
                              borderRadius: 'clamp(14px, 2vw, 18px)',
                              background: isTop3 
                                ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,193,7,0.08))'
                                : 'rgba(255,255,255,0.05)',
                              border: isTop3 
                                ? '2px solid rgba(255,215,0,0.5)'
                                : '1px solid rgba(255,255,255,0.15)',
                              boxShadow: isTop3 
                                ? '0 8px 24px rgba(255,215,0,0.3)'
                                : '0 4px 12px rgba(0,0,0,0.2)',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                              backdropFilter: 'blur(8px)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)';
                              e.currentTarget.style.borderColor = isTop3 ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.borderColor = isTop3 ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.15)';
                            }}
                          >
                            {/* Indicador de posición */}
                            <div className="leaderboard-position" style={{
                              fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                              fontWeight: 900,
                              minWidth: 'clamp(40px, 6vw, 50px)',
                              textAlign: 'center',
                              color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.7)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 4,
                              flexShrink: 0
                            }}>
                              {medal && <span style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{medal}</span>}
                              <span style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1rem)' }}>{idx + 1}°</span>
                            </div>
                            
                            {/* Avatar */}
                            <a href={userHref} title={displayName} className="leaderboard-avatar-link" style={{ 
                              display: 'inline-block',
                              transition: 'transform 0.3s ease',
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                              <img
                                src={avatarSrc}
                                alt={displayName}
                                className="leaderboard-avatar"
                                style={{ 
                                  width: 'clamp(48px, 8vw, 56px)', 
                                  height: 'clamp(48px, 8vw, 56px)', 
                                  borderRadius: 'clamp(12px, 2vw, 14px)', 
                                  objectFit: 'cover',
                                  border: `2px solid ${isTop3 ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.3)'}`,
                                  boxShadow: isTop3 ? '0 4px 12px rgba(255,215,0,0.3)' : '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                              />
                            </a>
                            
                            {/* Información */}
                            <div className="leaderboard-info" style={{ flex: 1, minWidth: 0 }}>
                              <a href={userHref} title={displayName} className="leaderboard-name" style={{ 
                                color: '#fff', 
                                textDecoration: 'none', 
                                fontWeight: 900, 
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                                marginBottom: 6,
                                transition: 'color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = isTop3 ? '#FFD700' : '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#fff';
                              }}
                              >
                                {displayName}
                              </a>
                              {item.bio_short ? (
                                <div className="leaderboard-bio" style={{ 
                                  opacity: 0.85, 
                                  fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
                                  color: 'rgba(255,255,255,0.8)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {item.bio_short}
                                </div>
                              ) : (
                                <div style={{ 
                                  opacity: 0.8, 
                                  fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)',
                                  color: 'rgba(255,255,255,0.7)'
                                }}>
                                  {labelFromSlug(item.ritmo_slug)}{item.list_name ? ` • ${item.list_name}` : ''}
                                </div>
                              )}
                            </div>
                            
                            {/* Votos */}
                            <div className="leaderboard-votes" style={{
                              padding: 'clamp(8px, 1.5vw, 10px) clamp(14px, 2.5vw, 18px)',
                              borderRadius: 999,
                              background: isTop3 
                                ? 'rgba(255,215,0,0.2)'
                                : 'rgba(0,0,0,0.4)',
                              border: `1.5px solid ${isTop3 ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)'}`,
                              fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                              fontWeight: 900,
                              color: '#fff',
                              minWidth: 'clamp(60px, 10vw, 70px)',
                              textAlign: 'center',
                              backdropFilter: 'blur(8px)',
                              boxShadow: isTop3 ? '0 4px 12px rgba(255,215,0,0.3)' : 'none',
                              flexShrink: 0
                            }}>
                              ❤️ {votes}
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
      {trending.status !== 'closed' && ritmos.length > 0 && (
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
      {trending.status !== 'closed' && (
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
              <section key={listName} style={{ marginBottom: 32 }}>
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  color: '#fff',
                  background: 'linear-gradient(135deg, rgba(229,57,53,0.3), rgba(251,140,0,0.2))',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(229,57,53,0.3)'
                }}>
                  {listName} <span style={{ opacity: .75, fontSize: '1rem', fontWeight: 400 }}>({items.length})</span>
                </h3>
                <div className="trending-candidates-grid">
                  {items.map((c: any) => {
                    const m = userMeta[c.user_id] || {};
                    const avatarSrc = c.avatar_url || m.avatar || "https://placehold.co/96x96?text=User";
                    const displayName = c.display_name || m.name || "Sin nombre";
                    const userHref = urls.userLive(c.user_id);
                    const currentRound = rounds.find(r => r.round_number === trending.current_round_number);
                    const canVoteRound = currentRound?.status === 'active' && (!currentRound.ends_at || new Date(currentRound.ends_at) > new Date());
                      return (
                      <div key={c.candidate_id} style={{
                        position: 'relative',
                        border: "2px solid rgba(229,57,53,0.2)",
                        borderRadius: 20,
                        padding: 20,
                        background: "linear-gradient(135deg, rgba(229,57,53,0.08), rgba(251,140,0,0.05))",
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        maxWidth: 450,
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'rgba(229,57,53,0.4)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(229,57,53,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(229,57,53,0.2)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                      }}
                      >
                        <div style={{ 
                          position:'absolute', 
                          top:12, 
                          right:12, 
                          padding:'8px 14px', 
                          borderRadius:999, 
                          background:'rgba(0,0,0,0.5)', 
                          border:'1.5px solid rgba(255,255,255,0.3)', 
                          fontWeight:900,
                          fontSize: '0.85rem',
                          color: '#fff',
                          backdropFilter: 'blur(8px)'
                        }}>
                          {isSA ? <>❤️ {c.votes}</> : (myVotes.get(c.candidate_id) ? '✓ Mi voto' : '')}
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                          <a href={userHref} title={displayName} style={{ display:'inline-block' }}>
                            <img
                              src={avatarSrc}
                              alt={displayName}
                              style={{ 
                                width: 64, 
                                height: 64, 
                                borderRadius: 16, 
                                objectFit: "cover", 
                                border:'2px solid rgba(229,57,53,0.3)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                              }}
                            />
                          </a>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <a href={userHref} title={displayName} style={{ 
                              color:'#fff', 
                              textDecoration:'none', 
                              fontWeight: 900, 
                              fontSize: '1.1rem',
                              overflow:'hidden', 
                              textOverflow:'ellipsis', 
                              whiteSpace:'nowrap',
                              display: 'block',
                              marginBottom: 4
                            }}>
                              {displayName}
                            </a>
                            <div style={{ 
                              opacity: 0.85, 
                              fontSize: '0.85rem',
                              color: 'rgba(255,255,255,0.8)'
                            }}>
                              {c.list_name || 'General'}
                            </div>
                          </div>
                        </div>
                        {c.bio_short && (
                          <p style={{ 
                            opacity: 0.9, 
                            marginTop: 12, 
                            marginBottom: 16,
                            lineHeight: 1.5,
                            fontSize: '0.95rem',
                            color: 'rgba(255,255,255,0.9)'
                          }}>
                            {c.bio_short}
                          </p>
                        )}
                        <div style={{ marginTop: 16 }}>
                          <button
                            disabled={!canVoteRound}
                            onClick={() => doVote(c.candidate_id)}
                            style={{
                              width: '100%',
                              padding: "14px 20px",
                              borderRadius: 12,
                              border: canVoteRound ? "2px solid rgba(229,57,53,0.5)" : "1px solid rgba(255,255,255,0.2)",
                              background: canVoteRound 
                                ? "linear-gradient(135deg, rgba(229,57,53,0.9), rgba(251,140,0,0.9))" 
                                : "rgba(255,255,255,0.08)",
                              color: "#fff",
                              fontWeight: 900,
                              fontSize: '1rem',
                              cursor: canVoteRound ? "pointer" : "not-allowed",
                              boxShadow: canVoteRound ? '0 8px 24px rgba(229,57,53,0.4)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (canVoteRound) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(229,57,53,0.5)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (canVoteRound) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(229,57,53,0.4)';
                              }
                            }}
                          >
                            {!canVoteRound ? "🔒 Ronda cerrada" : (myVotes.get(c.candidate_id) ? "❌ Quitar voto" : "❤️ Votar")}
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
                  {t('verify_candidates_assigned_round', { roundNumber: trending.current_round_number })}
                </p>
              )}
            </div>
          )
        ) : (
          // Modo tradicional: mostrar candidatos agrupados por lista y ritmo
          groupByList.map(([listName, items]) => (
          <section key={listName} style={{ marginBottom: 32 }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontWeight: 900,
              fontSize: '1.5rem',
              color: '#fff',
              background: 'linear-gradient(135deg, rgba(229,57,53,0.3), rgba(251,140,0,0.2))',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(229,57,53,0.3)'
            }}>
              {listName} <span style={{ opacity: .75, fontSize: '1rem', fontWeight: 400 }}>({items.length})</span>
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
                    border: "2px solid rgba(229,57,53,0.2)",
                    borderRadius: 20,
                    padding: 20,
                    background: "linear-gradient(135deg, rgba(229,57,53,0.08), rgba(251,140,0,0.05))",
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    maxWidth: 450,
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(229,57,53,0.4)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(229,57,53,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(229,57,53,0.2)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                  }}
                  >
                    <div style={{ 
                      position:'absolute', 
                      top:12, 
                      right:12, 
                      padding:'8px 14px', 
                      borderRadius:999, 
                      background:'rgba(0,0,0,0.5)', 
                      border:'1.5px solid rgba(255,255,255,0.3)', 
                      fontWeight:900,
                      fontSize: '0.85rem',
                      color: '#fff',
                      backdropFilter: 'blur(8px)'
                    }}>
                      {isSA ? <>❤️ {votes}</> : (myVotes.get(c.id) ? '✓ Mi voto' : '')}
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                      <a href={userHref} title={displayName} style={{ display:'inline-block' }}>
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          style={{ 
                            width: 64, 
                            height: 64, 
                            borderRadius: 16, 
                            objectFit: "cover", 
                            border:'2px solid rgba(229,57,53,0.3)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                        />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={userHref} title={displayName} style={{ 
                          color:'#fff', 
                          textDecoration:'none', 
                          fontWeight: 900, 
                          fontSize: '1.1rem',
                          overflow:'hidden', 
                          textOverflow:'ellipsis', 
                          whiteSpace:'nowrap',
                          display: 'block',
                          marginBottom: 4
                        }}>
                          {displayName}
                        </a>
                        <div style={{ 
                          opacity: 0.85, 
                          fontSize: '0.85rem',
                          color: 'rgba(255,255,255,0.8)'
                        }}>
                          {labelFromSlug(c.ritmo_slug)}{c.list_name ? ` • ${c.list_name}` : ''}
                        </div>
                      </div>
                    </div>
                    {c.bio_short && (
                      <p style={{ 
                        opacity: 0.9, 
                        marginTop: 12, 
                        marginBottom: 16,
                        lineHeight: 1.5,
                        fontSize: '0.95rem',
                        color: 'rgba(255,255,255,0.9)'
                      }}>
                        {c.bio_short}
                      </p>
                    )}
                    <div style={{ marginTop: 16 }}>
                      <button
                        onClick={() => doVote(c.id)}
                        style={{
                          width: '100%',
                          padding: "14px 20px",
                          borderRadius: 12,
                          border: "2px solid rgba(229,57,53,0.5)",
                          background: "linear-gradient(135deg, rgba(229,57,53,0.9), rgba(251,140,0,0.9))",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: '1rem',
                          cursor: "pointer",
                          boxShadow: '0 8px 24px rgba(229,57,53,0.4)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(229,57,53,0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(229,57,53,0.4)';
                        }}
                      >
                        {myVotes.get(c.id) ? "❌ Quitar voto" : "❤️ Votar"}
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
      {trending.status !== 'closed' && isSA && (
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
      </div>
    </>
  );
}


