// File: src/pages/challenges/ChallengesList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengesList } from '../../hooks/useChallenges';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

// ⬇️ Estilos compartidos aplicados
import '../../styles/event-public.css';

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
                <article key={c.id} className="cc-glass" style={{ padding: 0, overflow: 'hidden' }}>
                  {c.cover_image_url && (
                    <img
                      src={c.cover_image_url}
                      alt="cover"
                      style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '.75rem', display: 'grid', gap: '.45rem' }}>
                    <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                    {c.description && (
                      <div style={{ opacity: .85, fontSize: '.9rem', height: 36, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span
                        className="cc-chip"
                        /* Por qué: color condicional de estado sin añadir variantes al CSS global */
                        style={{
                          background:
                            c.status === 'open'
                              ? 'rgba(16,185,129,.16)'
                              : c.status === 'draft'
                              ? 'rgba(255,255,255,.06)'
                              : 'rgba(59,130,246,.12)'
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
