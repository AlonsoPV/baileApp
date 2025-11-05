import React from "react";
import { useParams } from "react-router-dom";
import {
  getTrending,
  getTrendingRitmos,
  getTrendingCandidates,
  leaderboard,
  voteTrending,
} from "@/lib/trending";
import { useAuth } from "@/contexts/AuthProvider";

function isWithinWindow(starts_at?: string | null, ends_at?: string | null) {
  const now = Date.now();
  const startOk = !starts_at || now >= new Date(starts_at).getTime();
  const endOk = !ends_at || now <= new Date(ends_at).getTime();
  return startOk && endOk;
}

export default function TrendingDetail() {
  const { id } = useParams<{ id: string }>();
  const trendingId = Number(id);
  const { user } = useAuth();

  const [t, setT] = React.useState<any>(null);
  const [ritmos, setRitmos] = React.useState<any[]>([]);
  const [candidatos, setCandidatos] = React.useState<any[]>([]);
  const [board, setBoard] = React.useState<any[]>([]);
  const [activeRitmo, setActiveRitmo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
      } finally {
        setLoading(false);
      }
    })();
  }, [trendingId]);

  const byRitmo = React.useMemo(() => {
    const map = new Map<string, any[]>();
    candidatos.forEach((c) => {
      if (!map.has(c.ritmo_slug)) map.set(c.ritmo_slug, []);
      map.get(c.ritmo_slug)!.push(c);
    });
    return map;
  }, [candidatos]);

  const votesByCandidate = React.useMemo(() => {
    const m = new Map<number, number>();
    board.forEach((b) => m.set(b.candidate_id, Number(b.votes)));
    return m;
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
      await voteTrending(trendingId, candidateId);
      const lb = await leaderboard(trendingId);
      setBoard(lb);
    } catch (e: any) {
      alert(e.message ?? "No se pudo votar");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!t) return <div style={{ padding: 24 }}>Trending no encontrado</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {t.cover_url && (
        <div style={{
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          marginBottom: 16,
        }}>
          <img src={t.cover_url} alt={t.title} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
        </div>
      )}
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontWeight: 900, marginBottom: 8 }}>{t.title}</h1>
        {t.description && <p style={{ opacity: 0.9 }}>{t.description}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>Estado: <b>{t.status}</b></span>
          {t.starts_at && <span>Inicia: {new Date(t.starts_at).toLocaleString()}</span>}
          {t.ends_at && <span>Cierra: {new Date(t.ends_at).toLocaleString()}</span>}
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
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
              {r.ritmo_slug}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {(activeRitmo ? byRitmo.get(activeRitmo) ?? [] : candidatos).map((c) => {
          const votes = votesByCandidate.get(c.id) ?? 0;
          return (
            <div key={c.id} style={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: 16,
              background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 12, alignItems: "center" }}>
                <img
                  src={c.avatar_url ?? "https://placehold.co/128x128?text=User"}
                  alt={c.display_name ?? "Candidato"}
                  style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>{c.display_name ?? "Sin nombre"}</div>
                  <div style={{ opacity: 0.8, fontSize: 12 }}>{c.ritmo_slug}</div>
                </div>
              </div>
              {c.bio_short && <p style={{ opacity: 0.9, marginTop: 8 }}>{c.bio_short}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ fontWeight: 800 }}>🗳️ {votes} votos</div>
                <button
                  disabled={!canVote}
                  onClick={() => doVote(c.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: canVote ? "linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))" : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: canVote ? "pointer" : "not-allowed"
                  }}
                >
                  {t.status !== "open" ? "Cerrado" : (canVoteByTime ? "Votar" : "Fuera de ventana")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontWeight: 900, marginBottom: 12 }}>🏆 Favoritos</h2>
        {ritmos.map((r) => {
          const rows = board.filter((x) => x.ritmo_slug === r.ritmo_slug);
          if (!rows.length) return null;
          return (
            <div key={r.id} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{r.ritmo_slug}</div>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {rows.slice(0, 5).map((x: any, i: number) => (
                  <li key={x.candidate_id} style={{ marginBottom: 4 }}>
                    {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}{x.display_name} — {x.votes}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </section>
    </div>
  );
}


