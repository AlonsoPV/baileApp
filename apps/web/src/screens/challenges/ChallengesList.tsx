// File: src/pages/challenges/ChallengesList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengesList } from '../../hooks/useChallenges';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

// ⬇️ Estilos compartidos aplicados
import '../../styles/event-public.css';
import RitmosChips from '../../components/RitmosChips';

export default function ChallengesList() {
  const nav = useNavigate();
  const { data, isLoading, error } = useChallengesList();
  const { showToast } = useToast();
  const [canCreate, setCanCreate] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCanCreate(false); return; }
      const { data: roles, error: rerr } = await supabase
        .from('user_roles')
        .select('role_slug')
        .eq('user_id', user.id);
      if (rerr) { showToast('No se pudieron cargar roles', 'error'); return; }
      const slugs = (roles || []).map((r: any) => r.role_slug);
      setCanCreate(slugs.includes('usuario') || slugs.includes('superadmin'));
    })();
  }, [showToast]);

  if (isLoading) return <div className="cc-page" style={{ padding: '1rem' }}>Cargando…</div>;
  if (error) return <div className="cc-page" style={{ padding: '1rem' }}>Error: {(error as any)?.message}</div>;

  return (
    <div className="cc-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)' }}>
      <style>{`
        .challenges-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(11,13,16,.98) 0%, 
            rgba(18,22,27,.95) 50%, 
            rgba(30,20,40,.96) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin-bottom: 2rem;
          border: 2px solid rgba(240,147,251,.15);
          box-shadow: 
            0 20px 60px rgba(0,0,0,.6),
            0 0 0 1px rgba(240,147,251,.1) inset,
            0 4px 20px rgba(240,147,251,.15);
          backdrop-filter: blur(20px);
        }
        
        .challenges-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          opacity: 0.9;
        }
        
        .challenges-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 40%, #FFD166 80%, #fff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 1rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          text-shadow: 
            0 4px 30px rgba(240,147,251,.5),
            0 2px 15px rgba(245,87,108,.4),
            0 0 40px rgba(255,209,102,.3);
          filter: drop-shadow(0 2px 8px rgba(0,0,0,.4));
        }
        
        .challenges-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: rgba(255,255,255,.88);
          margin: 0 0 1.5rem;
          line-height: 1.6;
          font-weight: 400;
        }
        
        @media (max-width: 768px) {
          .cc-page { padding-top: 64px; }
          .challenges-hero { padding: 2rem 1.5rem !important; }
          .challenges-title { font-size: 2rem !important; }
        }
        
        @media (max-width: 480px) {
          .challenges-hero { padding: 1.5rem 1rem !important; }
          .challenges-title { font-size: 1.75rem !important; }
          .challenges-subtitle { font-size: 0.95rem !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem' }}>
        {/* Hero de bienvenida mejorado */}
        <section className="challenges-hero">
          {/* Efectos decorativos */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(240,147,251,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(30,136,229,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1.5rem',
              boxShadow: '0 16px 40px rgba(240,147,251,.4)',
              border: '3px solid rgba(240,147,251,.3)'
            }}>
              🏆
            </div>
            
            <h1 className="challenges-title">Challenges</h1>
            <p className="challenges-subtitle">
              Participa con tu video, compite y vota por tus favoritos
            </p>
            
            {canCreate && (
              <button 
                onClick={() => nav('/challenges/new')} 
                style={{
                  padding: '1rem 2rem',
                  borderRadius: 999,
                  border: '2px solid rgba(240,147,251,0.4)',
                  background: 'linear-gradient(135deg, rgba(240,147,251,.95), rgba(245,87,108,.95))',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 12px 32px rgba(240,147,251,.4), 0 4px 16px rgba(0,0,0,.3)',
                  transition: 'all 0.3s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(240,147,251,.5), 0 8px 20px rgba(0,0,0,.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(240,147,251,.4), 0 4px 16px rgba(0,0,0,.3)';
                }}
              >
                ➕ Crear Challenge
              </button>
            )}
          </div>
        </section>

        {/* Lista */}
        {!data || data.length === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(11,13,16,.95), rgba(18,22,27,.92))',
            borderRadius: 24,
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '2px dashed rgba(255,255,255,.15)',
            boxShadow: '0 16px 48px rgba(0,0,0,.5)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
            <div style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'rgba(255,255,255,.85)' }}>
              Aún no hay retos publicados
            </div>
            {canCreate && (
              <button 
                onClick={() => nav('/challenges/new')} 
                style={{
                  padding: '0.9rem 1.8rem',
                  borderRadius: 999,
                  border: '2px solid rgba(240,147,251,0.4)',
                  background: 'linear-gradient(135deg, rgba(240,147,251,.95), rgba(245,87,108,.95))',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 10px 28px rgba(240,147,251,.35)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 14px 36px rgba(240,147,251,.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(240,147,251,.35)';
                }}
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {data.map((c) => (
              <article
                key={c.id}
                style={{
                  padding: 0,
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  maxWidth: 450,
                  width: '100%',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  borderRadius: 24,
                  border: '2px solid rgba(240,147,251,.2)',
                  boxShadow: '0 16px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(240,147,251,.1) inset',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundImage: c.cover_image_url
                    ? `linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,.6) 70%, rgba(0,0,0,.85) 100%), url(${c.cover_image_url})`
                    : 'linear-gradient(135deg, rgba(240,147,251,.2), rgba(245,87,108,.2), rgba(30,136,229,.2))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: '#fff',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => nav(`/challenges/${c.id}`)}
                onMouseEnter={(e) => { 
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px) scale(1.02)'; 
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 64px rgba(0,0,0,.6), 0 0 0 2px rgba(240,147,251,.3) inset'; 
                }}
                onMouseLeave={(e) => { 
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; 
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(240,147,251,.1) inset'; 
                }}
              >
                {/* Overlay gradient */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.3) 50%, rgba(0,0,0,.9) 100%)',
                  pointerEvents: 'none'
                }} />
                
                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                  {c.ritmo_slug && (
                    <div style={{ marginBottom: 4 }}>
                      <RitmosChips selected={[String(c.ritmo_slug)]} onChange={() => {}} readOnly />
                    </div>
                  )}
                  <div style={{ 
                    fontWeight: 900, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    textShadow: '0 2px 8px rgba(0,0,0,.6), 0 4px 16px rgba(0,0,0,.4)',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))'
                  }}>
                    {c.title}
                  </div>
                  {c.description && (
                    <div className="cc-two-lines" style={{ 
                      opacity: .92, 
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      textShadow: '0 1px 4px rgba(0,0,0,.6)'
                    }}>
                      {c.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: 999,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background:
                          c.status === 'open'
                            ? 'rgba(16,185,129,.35)'
                            : c.status === 'draft'
                            ? 'rgba(255,255,255,.2)'
                            : 'rgba(59,130,246,.3)',
                        border: `1px solid ${
                          c.status === 'open'
                            ? 'rgba(16,185,129,.5)'
                            : c.status === 'draft'
                            ? 'rgba(255,255,255,.3)'
                            : 'rgba(59,130,246,.5)'
                        }`,
                        boxShadow: '0 4px 12px rgba(0,0,0,.3)'
                      }}
                    >
                      {c.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nav(`/challenges/${c.id}`);
                      }}
                      style={{
                        padding: '0.6rem 1.4rem',
                        borderRadius: 999,
                        border: '2px solid rgba(240,147,251,0.5)',
                        background: 'linear-gradient(135deg, rgba(240,147,251,.9), rgba(245,87,108,.9))',
                        color: '#fff',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(240,147,251,.4)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(240,147,251,.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(240,147,251,.4)';
                      }}
                    >
                      Ver →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
