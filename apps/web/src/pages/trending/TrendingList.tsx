import React from "react";
import { useNavigate } from "react-router-dom";
import { listTrendings } from "@/lib/trending";
import "@/styles/event-public.css";

export default function TrendingList() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await listTrendings();
        // Mostrar solo open y closed (públicos)
        setRows(all.filter(t => t.status === 'open' || t.status === 'closed'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="cc-page" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
        {/* Hero */}
        <section className="cc-glass" style={{ padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>📈</div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #E53935, #FB8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Trending
          </h1>
          <p style={{ opacity: .85, marginTop: '.5rem' }}>
            Vota por tus favoritos en las categorías activas
          </p>
        </section>

        {/* Lista de trendings */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: .75 }}>No hay trendings activos en este momento.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {rows.map((r) => (
                <div key={r.id} style={{
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/trending/${r.id}`)}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: r.cover_url
                      ? `url(${r.cover_url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))'
                  }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12, gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 900, color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.36))', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                      <span className="cc-chip" style={{ textTransform: 'uppercase' }}>{r.status}</span>
                    </div>
                    {r.description && <div className="cc-two-lines" style={{ opacity: .92, color:'#fff' }}>{r.description}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, opacity: .92, color:'#fff' }}>
                      {r.starts_at && <span>🟢 {new Date(r.starts_at).toLocaleString()}</span>}
                      {r.ends_at && <span>🔴 {new Date(r.ends_at).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

