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
    <div className="cc-page">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem' }}>
        {/* Hero de bienvenida */}
        <section className="cc-glass" style={{ padding: '1.25rem', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
              <span className="cc-round-ico" style={{ width: 48, height: 48, fontSize: 22 }}>🏆</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem' }}>Bienvenido a Challenges</h1>
                <p style={{ margin: 0, opacity: .85, fontSize: '.95rem' }}>Participa con tu video, compite y vota por tus favoritos.</p>
              </div>
            </div>
            {canCreate && (
              <button onClick={() => nav('/challenges/new')} className="cc-btn cc-btn--primary">➕ Crear Challenge</button>
            )}
          </div>
        </section>

        {/* Lista */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          {!data || data.length === 0 ? (
            <div style={{
              display: 'grid', placeItems: 'center', padding: '1.25rem',
              border: '1px dashed rgba(255,255,255,.18)', borderRadius: 12, opacity: .9
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🚀</div>
              <div style={{ marginBottom: 6 }}>Aún no hay retos publicados.</div>
              {canCreate && (
                <button onClick={() => nav('/challenges/new')} className="cc-btn cc-btn--primary">Crear el primero</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
              {data.map((c) => (
                <article
                  key={c.id}
                  className="cc-glass"
                  style={{
                    padding: 0,
                    position: 'relative',
                    minHeight: 220,
                    aspectRatio: '1 / 1',
                    maxWidth: 350,
                    width: '100%',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,.12)',
                    boxShadow: '0 10px 28px rgba(0,0,0,.35)',
                    transition: 'transform .2s ease, box-shadow .2s ease',
                    backgroundImage: c.cover_image_url
                      ? `linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 50%, rgba(0,0,0,.25) 100%), url(${c.cover_image_url})`
                      : 'linear-gradient(135deg, rgba(30,136,229,.25), rgba(255,61,87,.25))',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#fff',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 36px rgba(0,0,0,.45)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,.35)'; }}
                >
                  <div style={{ padding: '.9rem', display: 'grid', gap: '.45rem' }}>
                    {c.ritmo_slug && (
                      <div style={{ marginBottom: 4 }}>
                        <RitmosChips selected={[String(c.ritmo_slug)]} onChange={() => {}} readOnly />
                      </div>
                    )}
                    <div className="cc-ellipsis" style={{ fontWeight: 900 }}>
                      {c.title}
                    </div>
                    {c.description && (
                      <div className="cc-two-lines" style={{ opacity: .95, fontSize: '.9rem' }}>
                        {c.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span
                        className="cc-chip"
                        style={{
                          background:
                            c.status === 'open'
                              ? 'rgba(16,185,129,.22)'
                              : c.status === 'draft'
                              ? 'rgba(255,255,255,.14)'
                              : 'rgba(59,130,246,.18)'
                        }}
                      >
                        {c.status}
                      </span>
                      <button
                        onClick={() => nav(`/challenges/${c.id}`)}
                        className="cc-btn cc-btn--primary"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
