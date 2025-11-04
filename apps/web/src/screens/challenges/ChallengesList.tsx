import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengesList } from '../../hooks/useChallenges';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ChallengesList() {
  const nav = useNavigate();
  const { data, isLoading, error } = useChallengesList();
  const { showToast } = useToast();
  const [canCreate, setCanCreate] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCanCreate(false); return; }
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role_slug')
        .eq('user_id', user.id);
      const slugs = (roles || []).map((r: any) => r.role_slug);
      setCanCreate(slugs.includes('usuario') || slugs.includes('superadmin'));
    })();
  }, []);

  if (isLoading) return <div style={{ color:'#fff', padding:'1rem' }}>Cargando…</div>;
  if (error) return <div style={{ color:'#fff', padding:'1rem' }}>Error: {(error as any)?.message}</div>;

  return (
    <div style={{ padding: '1rem', color:'#fff' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        margin: '1rem 0'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
            <span style={{ width:40, height:40, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.2)' }}>🏆</span>
            <h1 style={{ margin:0, fontSize:'1.3rem' }}>Challenges</h1>
          </div>
          {canCreate && (
            <button
              onClick={() => nav('/challenges/new')}
              className="editor-back-btn"
              style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}
            >
              ➕ Nuevo Challenge
            </button>
          )}
        </div>

        {!data || data.length === 0 ? (
          <div style={{ opacity:.85 }}>Aún no hay retos.</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'0.9rem' }}>
            {data.map((c) => (
              <article key={c.id} style={{ 
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}>
                {c.cover_image_url && (
                  <img src={c.cover_image_url} alt="cover" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
                )}
                <div style={{ padding:'.75rem', display:'grid', gap:'.4rem' }}>
                  <div style={{ fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                  <div style={{ opacity:.85, fontSize:'.9rem' }}>{c.status}</div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={()=>nav(`/challenges/${c.id}`)} className="editor-back-btn">Ver</button>
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


