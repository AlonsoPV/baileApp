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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h1 style={{ margin:0 }}>Challenges</h1>
        {canCreate && (
          <button
            onClick={() => nav('/challenges/new')}
            style={{ padding:'.6rem 1rem', borderRadius:12, border:'1px solid rgba(255,255,255,.2)', background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))', color:'#fff', fontWeight:900 }}
          >
            ➕ Nuevo Challenge
          </button>
        )}
      </div>

      {!data || data.length === 0 ? (
        <div style={{ opacity:.85 }}>Aún no hay retos.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'0.75rem' }}>
          {data.map((c) => (
            <article key={c.id} style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:14, overflow:'hidden', background:'rgba(255,255,255,.06)' }}>
              {c.cover_image_url && (
                <img src={c.cover_image_url} alt="cover" style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
              )}
              <div style={{ padding:'.75rem' }}>
                <div style={{ fontWeight:900 }}>{c.title}</div>
                <div style={{ opacity:.85, fontSize:'.9rem', marginTop:4 }}>{c.status}</div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                  <button onClick={()=>nav(`/challenges/${c.id}`)} style={{ padding:'.4rem .7rem', borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'transparent', color:'#fff', fontWeight:800 }}>Ver</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


