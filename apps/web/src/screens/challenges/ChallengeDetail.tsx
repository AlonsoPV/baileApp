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
  const ownerFileRef = React.useRef<HTMLInputElement|null>(null);
  const userFileRef = React.useRef<HTMLInputElement|null>(null);
  const [uploadingOwner, setUploadingOwner] = React.useState(false);
  const [uploadingUser, setUploadingUser] = React.useState(false);

  const uploadToChallengeBucket = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('challenge-media').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('challenge-media').getPublicUrl(path);
    return pub.publicUrl as string;
  };

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

      {canModerate && (
        <section style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'1rem', background:'rgba(255,255,255,.06)' }}>
          <h3 style={{ marginTop:0 }}>Video del Challenge (referencia)</h3>
          {challenge.hero_video_url ? (
            <video controls style={{ width:'100%', maxWidth:960, borderRadius:12 }} src={(challenge as any).hero_video_url} />
          ) : (
            <div style={{ opacity:.85 }}>Aún no hay video de referencia.</div>
          )}
          <div style={{ marginTop:'.75rem', display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
            <input ref={ownerFileRef} type="file" accept="video/*" hidden onChange={async (e)=>{
              const f = e.target.files?.[0];
              if (!f) return;
              if (!id) return;
              try {
                setUploadingOwner(true);
                const ext = f.name.split('.').pop()?.toLowerCase() || 'mp4';
                const url = await uploadToChallengeBucket(f, `challenges/${id}/owner-${Date.now()}.${ext}`);
                const { error } = await supabase.from('challenges').update({ hero_video_url: url }).eq('id', id);
                if (error) throw error;
                showToast('Video actualizado', 'success');
              } catch(e:any){
                showToast(e?.message || 'No se pudo subir video', 'error');
              } finally {
                setUploadingOwner(false);
                if (ownerFileRef.current) ownerFileRef.current.value='';
              }
            }} />
            <button onClick={()=>ownerFileRef.current?.click()} disabled={uploadingOwner} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}>
              {uploadingOwner ? 'Subiendo…' : 'Subir/Actualizar video'}
            </button>
          </div>
        </section>
      )}

      {challenge.status === 'open' && (
        <section style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'1rem', background:'rgba(255,255,255,.06)' }}>
          <h3 style={{ marginTop:0 }}>Subir mi video</h3>
          <div style={{ display:'grid', gap:'.5rem', maxWidth:600 }}>
            <input placeholder="caption (opcional)" value={caption} onChange={e=>setCaption(e.target.value)} className="editor-input" />
            <input ref={userFileRef} type="file" accept="video/*" hidden onChange={async (e)=>{
              const f = e.target.files?.[0];
              if (!f || !id) return;
              try {
                setUploadingUser(true);
                const ext = f.name.split('.').pop()?.toLowerCase() || 'mp4';
                const { data: { user } } = await supabase.auth.getUser();
                const uid = user?.id || 'anon';
                const url = await uploadToChallengeBucket(f, `challenges/${id}/submissions/${uid}/${Date.now()}.${ext}`);
                await submit.mutateAsync({ challengeId: id, video_url: url, caption });
                setCaption('');
                showToast('Envío creado', 'success');
              } catch(e:any){ showToast(e?.message || 'No se pudo enviar','error'); }
              finally {
                setUploadingUser(false);
                if (userFileRef.current) userFileRef.current.value='';
              }
            }} />
            <button onClick={()=>userFileRef.current?.click()} disabled={uploadingUser} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}>
              {uploadingUser ? 'Subiendo…' : 'Seleccionar video y enviar'}
            </button>
          </div>
        </section>
      )}

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


