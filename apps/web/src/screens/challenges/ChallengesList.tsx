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
        {/* Header / Panel principal */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem', gap: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span className="cc-round-ico" style={{ width: 40, height: 40, fontSize: 18 }}>🏆</span>
              <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Challenges</h1>
            </div>
            {canCreate && (
              <button
                onClick={() => nav('/challenges/new')}
                className="cc-btn cc-btn--primary"
              >
                ➕ Nuevo Challenge
              </button>
            )}
          </div>

          {/* Lista */}
          {!data || data.length === 0 ? (
            <div style={{ opacity: .85 }}>Aún no hay retos.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '0.9rem' }}>
              {data.map((c) => (
                <article
                  key={c.id}
                  className="cc-glass"
                  style={{
                    padding: 0,
                    position: 'relative',
                    minHeight: 200,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    backgroundImage: c.cover_image_url
                      ? `linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 50%, rgba(0,0,0,.25) 100%), url(${c.cover_image_url})`
                      : 'linear-gradient(135deg, rgba(30,136,229,.25), rgba(255,61,87,.25))',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#fff',
                    overflow: 'hidden'
                  }}
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
