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
    <div className="cc-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)' }}>
      <style>{`
        .trending-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(11,13,16,.98) 0%, 
            rgba(18,22,27,.95) 50%, 
            rgba(30,20,40,.96) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin-bottom: 2rem;
          border: 2px solid rgba(229,57,53,.15);
          box-shadow: 
            0 20px 60px rgba(0,0,0,.6),
            0 0 0 1px rgba(229,57,53,.1) inset,
            0 4px 20px rgba(229,57,53,.15);
          backdrop-filter: blur(20px);
        }
        
        .trending-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #E53935, #FB8C00, #FFD166, #FF6B9D);
          opacity: 0.9;
        }
        
        .trending-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 40%, #FFD166 80%, #fff 100%);
          -webkit-background-clip: text;
          margin: 0 0 1rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          text-shadow: 
            0 4px 30px rgba(229,57,53,.5),
            0 2px 15px rgba(251,140,0,.4),
            0 0 40px rgba(255,209,102,.3);
          filter: drop-shadow(0 2px 8px rgba(0,0,0,.4));
        }
        
        .trending-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: rgba(255,255,255,.88);
          margin: 0;
          line-height: 1.6;
          font-weight: 400;
        }
        
        @media (max-width: 768px) {
          .cc-page { padding-top: 64px; }
          .trending-hero { padding: 2rem 1.5rem !important; }
          .trending-title { font-size: 2rem !important; }
        }
        
        @media (max-width: 480px) {
          .trending-hero { padding: 1.5rem 1rem !important; }
          .trending-title { font-size: 1.75rem !important; }
          .trending-subtitle { font-size: 0.95rem !important; }
        }
        .trending-card {
          position: relative;
          aspect-ratio: 1 / 1;
          width: 100%;
          max-width: 450px;
          margin: 0 auto;
          border-radius: 24px;
          overflow: hidden;
          border: 2px solid rgba(229,57,53,.2);
          box-shadow: 0 16px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(229,57,53,.1) inset;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: radial-gradient(circle at center, rgba(229,57,53,.12), rgba(18,22,27,.8));
        }
        
        .trending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 450px));
          gap: 1.5rem;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .trending-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 0 1rem;
          }
          .trending-card {
            max-width: 100%;
            border-radius: 20px;
          }
          .trending-card__body {
            padding: 1.25rem !important;
            gap: 0.5rem !important;
          }
          .trending-card__body > div:first-child > div:first-child {
            font-size: 1.25rem !important;
          }
          .trending-card__placeholder {
            width: 50% !important;
            height: 50% !important;
            font-size: 2.5rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .trending-grid {
            gap: 0.75rem;
            padding: 0 0.5rem;
          }
          .trending-card {
            border-radius: 16px;
          }
          .trending-card__body {
            padding: 1rem !important;
            gap: 0.5rem !important;
          }
          .trending-card__body > div:first-child > div:first-child {
            font-size: 1.1rem !important;
          }
          .trending-card__body button {
            padding: 0.6rem 1.25rem !important;
            font-size: 0.875rem !important;
          }
          .trending-card__placeholder {
            width: 45% !important;
            height: 45% !important;
            font-size: 2rem !important;
          }
        }

        .trending-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 0 0 2px rgba(229,57,53,.3) inset;
        }

        .trending-card__media {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at center, rgba(229,57,53,.12), rgba(0,0,0,.85));
        }

        .trending-card__media img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          pointer-events: none;
          filter: saturate(1.05) contrast(1.05);
        }

        .trending-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,.65) 65%, rgba(0,0,0,.88) 100%);
        }

        .trending-card__body {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1.5rem;
          gap: 0.75rem;
          z-index: 2;
        }

        .trending-card__placeholder {
          width: 60%;
          height: 60%;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(229,57,53,.35), rgba(251,140,0,.25));
          display: grid;
          place-items: center;
          font-size: 3rem;
          color: rgba(255,255,255,.65);
          border: 2px dashed rgba(255,255,255,.25);
        }
      `}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        {/* Hero mejorado */}
        <section className="trending-hero">
          {/* Efectos decorativos */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(229,57,53,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251,140,0,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ 
              width: 'clamp(60px, 10vw, 80px)', 
              height: 'clamp(60px, 10vw, 80px)', 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E53935, #FB8C00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(2rem, 5vw, 2.5rem)',
              margin: '0 auto 1.5rem',
              boxShadow: '0 16px 40px rgba(229,57,53,.4)',
              border: '3px solid rgba(229,57,53,.3)'
            }}>
              📈
            </div>
            
            <h1 className="trending-title">Trending</h1>
            <p className="trending-subtitle">
              Vota por tus favoritos en las categorías activas
            </p>
          </div>
        </section>

        {/* Lista de trendings */}
        {loading ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(11,13,16,.95), rgba(18,22,27,.92))',
            borderRadius: 'clamp(16px, 4vw, 24px)',
            padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2rem)',
            textAlign: 'center',
            boxShadow: '0 16px 48px rgba(0,0,0,.5)'
          }}>
            <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '1rem' }}>⏳</div>
            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'rgba(255,255,255,.85)' }}>Cargando...</div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(11,13,16,.95), rgba(18,22,27,.92))',
            borderRadius: 'clamp(16px, 4vw, 24px)',
            padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2rem)',
            textAlign: 'center',
            border: '2px dashed rgba(255,255,255,.15)',
            boxShadow: '0 16px 48px rgba(0,0,0,.5)'
          }}>
            <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '1rem' }}>🎯</div>
            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'rgba(255,255,255,.85)' }}>
              No hay trendings activos en este momento
            </div>
          </div>
        ) : (
          <div className="trending-grid">
            {rows.map((r) => (
              <article
                key={r.id}
                className="trending-card"
                onClick={() => navigate(`/trending/${r.id}`)}
              >
                <div className="trending-card__media">
                  {r.cover_url ? (
                    <img src={r.cover_url} alt={r.title} loading="lazy" />
                  ) : (
                    <div className="trending-card__placeholder">📈</div>
                  )}
                </div>
                <div className="trending-card__overlay" />
                <div className="trending-card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ 
                      fontWeight: 900, 
                      fontSize: '1.5rem',
                      lineHeight: 1.2,
                      color: '#fff', 
                      textShadow: '0 2px 8px rgba(0,0,0,.6), 0 4px 16px rgba(0,0,0,.4)',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))',
                      flex: 1
                    }}>
                      {r.title}
                    </div>
                    <span style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: 999,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: r.status === 'open'
                        ? 'rgba(16,185,129,.35)'
                        : 'rgba(59,130,246,.3)',
                      border: `1px solid ${r.status === 'open'
                        ? 'rgba(16,185,129,.5)'
                        : 'rgba(59,130,246,.5)'}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,.3)',
                      color: '#fff'
                    }}>
                      {r.status}
                    </span>
                  </div>
                  
                  {r.description && (
                    <div className="cc-two-lines" style={{ 
                      opacity: .92, 
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      color: '#fff',
                      textShadow: '0 1px 4px rgba(0,0,0,.6)'
                    }}>
                      {r.description}
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    flexWrap: 'wrap', 
                    fontSize: '0.85rem', 
                    opacity: .9, 
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,.5)'
                  }}>
                    {r.starts_at && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        padding: '0.3rem 0.7rem',
                        borderRadius: 999,
                        background: 'rgba(16,185,129,.2)',
                        border: '1px solid rgba(16,185,129,.3)'
                      }}>
                        🟢 {new Date(r.starts_at).toLocaleDateString()}
                      </span>
                    )}
                    {r.ends_at && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        padding: '0.3rem 0.7rem',
                        borderRadius: 999,
                        background: 'rgba(239,68,68,.2)',
                        border: '1px solid rgba(239,68,68,.3)'
                      }}>
                        🔴 {new Date(r.ends_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trending/${r.id}`);
                    }}
                    style={{
                      marginTop: 8,
                      padding: '0.7rem 1.5rem',
                      borderRadius: 999,
                      border: '2px solid rgba(229,57,53,0.5)',
                      background: 'linear-gradient(135deg, rgba(229,57,53,.9), rgba(251,140,0,.9))',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(229,57,53,.4)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(229,57,53,.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(229,57,53,.4)';
                    }}
                  >
                    {r.status === 'closed' ? 'Ver →' : 'Ver y Votar →'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

