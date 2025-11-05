import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTrending,
  getTrendingRitmos,
  getTrendingCandidates,
  leaderboard,
  voteTrending,
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

  React.useEffect(() => {
    (async () => {
      try {
        const [tr, rs, cs, lb] = await Promise.all([
          getTrending(trendingId),
          getTrendingRitmos(trendingId),
          getTrendingCandidates(trendingId),
          leaderboard(trendingId),
        ]);
        setT(tr);
        setRitmos(rs);
        setCandidatos(cs);
        setBoard(lb);
        setActiveRitmo(rs?.[0]?.ritmo_slug ?? null);
        // precompute myVotes map from current leaderboard if needed (not exact, but UI toggle will update)
      } finally {
        setLoading(false);
      }
    })();
  }, [trendingId]);

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

  const canVoteByTime = isWithinWindow(t?.starts_at, t?.ends_at);
  const canVote = t?.status === "open" && canVoteByTime;

  const doVote = async (candidateId: number) => {
    if (!user) {
      alert("Inicia sesión para votar");
      return;
    }
    if (!canVote) return;
    try {
      // Toggle vote
      await voteTrending(trendingId, candidateId);
      // Refetch leaderboard to get updated counts
      const lb = await leaderboard(trendingId);
      setBoard(lb);
      // Update local myVotes state for UI toggle
      setMyVotes(prev => {
        const next = new Map(prev);
        const wasVoted = prev.get(candidateId);
        next.set(candidateId, !wasVoted);
        return next;
      });
    } catch (e: any) {
      alert(e.message ?? "No se pudo votar");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!t) return <div style={{ padding: 24 }}>Trending no encontrado</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {/* Botón Volver */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate('/trending')} className="cc-btn cc-btn--ghost">
          ← Volver a Trending
        </button>
      </div>
      {t.cover_url && (
        <div style={{
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          marginBottom: 12,
          maxHeight: 220
        }}>
          <img src={t.cover_url} alt={t.title} style={{ width: '100%', height: '220px', display: 'block', objectFit: 'cover' }} />
        </div>
      )}
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontWeight: 900, marginBottom: 6 }}>{t.title}</h1>
        {t.description && <p style={{ opacity: 0.9, margin: 0 }}>{t.description}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <span className="cc-chip">Estado: <b style={{ textTransform:'uppercase' }}>{t.status}</b></span>
          {t.starts_at && <span className="cc-soft-chip">🟢 {new Date(t.starts_at).toLocaleString()}</span>}
          {t.ends_at && <span className="cc-soft-chip">🔴 {new Date(t.ends_at).toLocaleString()}</span>}
        </div>
      </header>

      {/* Tabs de ritmos */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {ritmos.map((r) => {
          const active = activeRitmo === r.ritmo_slug;
          return (
            <button
              key={r.id}
              onClick={() => setActiveRitmo(r.ritmo_slug)}
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

      {/* Listas de candidatos (agrupadas por list_name) */}
      <div style={{ display: 'grid', gap: 16 }}>
        {groupByList.map(([listName, items]) => (
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
                        disabled={!canVote}
                        onClick={() => doVote(c.id)}
                        style={{
                          width: '100%',
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.25)",
                          background: canVote ? "linear-gradient(135deg, rgba(30,136,229,.95), rgba(0,188,212,.95))" : "rgba(255,255,255,0.08)",
                          color: "#fff",
                          fontWeight: 900,
                          cursor: canVote ? "pointer" : "not-allowed",
                          boxShadow: canVote ? '0 6px 18px rgba(0,188,212,0.35)' : 'none'
                        }}
                      >
                        {t.status !== "open" ? "Cerrado" : (canVoteByTime ? (myVotes.get(c.id) ? "Quitar voto" : "❤️ Votar") : "Fuera de ventana")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {isSA ? (
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
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap: 8 }}>
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
                            <span style={{ fontWeight: 900 }}>❤️ {x.votes}</span>
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
      ) : (
        t.status === 'closed' && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontWeight: 900, marginBottom: 8 }}>🏆 Ganadores por lista</h2>
            {winnersByList.length === 0 ? (
              <div>Sin datos</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {winnersByList.map((w: any) => (
                  <div key={`${w.list_name || 'General'}-${w.ritmo_slug}-${w.candidate_id}`} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 10, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {w.display_name} <span style={{ opacity:.8, fontSize:12 }}>({labelFromSlug(w.ritmo_slug)}{w.list_name ? ` • ${w.list_name}` : ''})</span>
                      </div>
                      <span style={{ fontWeight: 900 }}>❤️ {w.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      )}
    </div>
  );
}


