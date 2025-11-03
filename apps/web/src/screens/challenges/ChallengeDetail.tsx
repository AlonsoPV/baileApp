import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChallenge, useChallengePublish, useChallengeSubmissions, useChallengeSubmit, useSubmissionApprove, useSubmissionReject, useToggleVote, useChallengeLeaderboard } from '../../hooks/useChallenges';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ChallengeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showToast } = useToast();
  const { data: challenge } = useChallenge(id);
  const { data: subs } = useChallengeSubmissions(id);
  const { data: leaderboard } = useChallengeLeaderboard(id);
  const publish = useChallengePublish();
  const submit = useChallengeSubmit();
  const approve = useSubmissionApprove();
  const reject = useSubmissionReject();
  const vote = useToggleVote();

  const [me, setMe] = React.useState<{ id: string } | null>(null);
  const [canModerate, setCanModerate] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');
  const [caption, setCaption] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe({ id: user.id });
      const { data: roles } = await supabase.from('user_roles').select('role_slug').eq('user_id', user.id);
      const isSA = (roles || []).some((r: any) => r.role_slug === 'superadmin');
      const amOwner = challenge?.owner_id === user.id;
      setCanModerate(Boolean(isSA || amOwner));
    })();
  }, [challenge?.owner_id]);

  if (!id) return <div style={{ color:'#fff', padding:'1rem' }}>Sin id</div>;
  if (!challenge) return <div style={{ color:'#fff', padding:'1rem' }}>Cargando…</div>;

  const pending = (subs || []).filter(s => s.status === 'pending');
  const approved = (subs || []).filter(s => s.status === 'approved');

  return (
    <div style={{ padding:'1rem', color:'#fff', display:'grid', gap:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={()=>nav('/challenges')} className="editor-back-btn">← Volver</button>
        <div style={{ fontWeight:900 }}>{challenge.title}</div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <span style={{ border:'1px solid rgba(255,255,255,.2)', borderRadius:999, padding:'.25rem .6rem' }}>{challenge.status}</span>
          {canModerate && challenge.status !== 'open' && (
            <button onClick={async ()=>{
              try { await publish.mutateAsync(challenge.id); } catch(e:any){ showToast(e?.message || 'No se pudo publicar','error'); }
            }} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}>
              Publicar
            </button>
          )}
        </div>
      </div>

      {challenge.cover_image_url && (
        <img src={challenge.cover_image_url} alt="cover" style={{ width:'100%', maxWidth:960, height:'auto', borderRadius:12 }} />
      )}

      <section style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'1rem', background:'rgba(255,255,255,.06)' }}>
        <h3 style={{ marginTop:0 }}>Subir mi video</h3>
        <div style={{ display:'grid', gap:'.5rem', maxWidth:600 }}>
          <input placeholder="https://..." value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} className="editor-input" />
          <input placeholder="caption (opcional)" value={caption} onChange={e=>setCaption(e.target.value)} className="editor-input" />
          <button onClick={async ()=>{
            if (!videoUrl) { showToast('Ingresa un URL', 'error'); return; }
            try {
              await submit.mutateAsync({ challengeId: id, video_url: videoUrl, caption });
              setVideoUrl(''); setCaption('');
              showToast('Envío creado', 'success');
            } catch(e:any){ showToast(e?.message || 'No se pudo enviar','error'); }
          }} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}>Enviar</button>
        </div>
      </section>

      {canModerate && (
        <section style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'1rem', background:'rgba(255,255,255,.06)' }}>
          <h3 style={{ marginTop:0 }}>Moderación (pendientes)</h3>
          {pending.length === 0 ? <div>Sin pendientes</div> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'.75rem' }}>
              {pending.map(s => (
                <article key={s.id} style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'.6rem' }}>
                    <div style={{ fontWeight:800, marginBottom:6 }}>{s.video_url}</div>
                    <div style={{ display:'flex', gap:'.5rem' }}>
                      <button onClick={async()=>{ try { await approve.mutateAsync(s.id); } catch(e:any){ showToast(e?.message || 'Error','error'); } }} className="editor-back-btn">Aprobar</button>
                      <button onClick={async()=>{ try { await reject.mutateAsync(s.id); } catch(e:any){ showToast(e?.message || 'Error','error'); } }} className="editor-back-btn">Rechazar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'1rem', background:'rgba(255,255,255,.06)' }}>
        <h3 style={{ marginTop:0 }}>Aprobados</h3>
        {approved.length === 0 ? <div>No hay envíos aprobados</div> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'.75rem' }}>
            {approved.map(s => (
              <article key={s.id} style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'.6rem' }}>
                  <div style={{ fontWeight:800, marginBottom:6 }}>{s.video_url}</div>
                  <button onClick={async()=>{ try { await vote.mutateAsync(s.id); } catch(e:any){ showToast(e?.message || 'Error','error'); } }} className="editor-back-btn">❤️ Votar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'1rem', background:'rgba(255,255,255,.06)' }}>
        <h3 style={{ marginTop:0 }}>Leaderboard</h3>
        {!leaderboard || leaderboard.length === 0 ? <div>Sin votos</div> : (
          <ul style={{ margin:0, paddingLeft:'1rem' }}>
            {leaderboard.map(row => (
              <li key={row.submission_id}>
                {row.submission_id} · votos: {row.votes}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


