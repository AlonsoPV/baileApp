import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChallenge, useChallengePublish, useChallengeSubmissions, useChallengeSubmit, useSubmissionApprove, useSubmissionReject, useToggleVote, useChallengeLeaderboard } from '../../hooks/useChallenges';
import { useQueryClient } from '@tanstack/react-query';
import HorizontalSlider from '../../components/explore/HorizontalSlider';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ChallengeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
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
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ title:'', description:'', cover_image_url:'', submission_deadline:'', voting_deadline:'' });
  const [userNames, setUserNames] = React.useState<Record<string,string>>({});

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

  React.useEffect(() => {
    if (challenge) {
      setEditForm({
        title: challenge.title || '',
        description: (challenge as any).description || '',
        cover_image_url: (challenge as any).cover_image_url || '',
        submission_deadline: (challenge as any).submission_deadline || '',
        voting_deadline: (challenge as any).voting_deadline || '',
      });
    }
  }, [challenge]);

  // Fetch uploader names for approved subs and leaderboard
  React.useEffect(() => {
    (async () => {
      const ids = new Set<string>();
      (subs || []).forEach(s => s?.user_id && ids.add(s.user_id));
      (leaderboard || []).forEach(r => r?.user_id && ids.add(r.user_id));
      if (ids.size === 0) return;
      const arr = Array.from(ids);
      const { data, error } = await supabase
        .from('profiles_user')
        .select('user_id, nombre_publico, full_name, email')
        .in('user_id', arr);
      if (error) return;
      const map: Record<string,string> = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = p.nombre_publico || p.full_name || p.email || p.user_id;
      });
      setUserNames(map);
    })();
  }, [subs, leaderboard]);

  if (!id) return <div style={{ color:'#fff', padding:'1rem' }}>Sin id</div>;
  if (!challenge) return <div style={{ color:'#fff', padding:'1rem' }}>Cargando…</div>;

  const pending = (subs || []).filter(s => s.status === 'pending');
  const approved = (subs || []).filter(s => s.status === 'approved');

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #12171d 0%, #0e141a 100%)', color:'#fff' }}>
      <style>{`
        .chd-wrap { max-width: 1200px; margin: 0 auto; padding: 1rem; display:grid; gap:1rem; }
        .glass { border:1px solid rgba(255,255,255,.15); border-radius:16px; background:rgba(255,255,255,.06); box-shadow:0 8px 24px rgba(0,0,0,.24); }
        @media (max-width: 768px) { .chd-wrap { padding: .75rem; } }
      `}</style>
      <div className="chd-wrap">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={()=>nav('/challenges')} className="editor-back-btn">← Volver</button>
        <div style={{ fontWeight:900, fontSize:'1.15rem' }}>{challenge.title}</div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <span style={{ border:'1px solid rgba(255,255,255,.2)', borderRadius:999, padding:'.25rem .6rem' }}>{challenge.status}</span>
          {canModerate && challenge.status !== 'open' && (
            <button onClick={async ()=>{
              try { await publish.mutateAsync(challenge.id); } catch(e:any){ showToast(e?.message || 'No se pudo publicar','error'); }
            }} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}>
              Publicar
            </button>
          )}
          {canModerate && (
            <button onClick={()=>setEditOpen(v=>!v)} className="editor-back-btn">{editOpen ? 'Cerrar edición' : 'Editar'}</button>
          )}
        </div>
      </div>

      {challenge.cover_image_url && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          <img src={challenge.cover_image_url} alt="cover" style={{ width:'100%', height:'auto', display:'block' }} />
        </div>
      )}

      {canModerate && editOpen && (
        <section className="glass" style={{ padding:'1rem' }}>
          <h3 style={{ marginTop:0 }}>Editar reto</h3>
          <div style={{ display:'grid', gap:'.6rem', maxWidth:720 }}>
            <div>
              <label style={{ display:'block', marginBottom:4 }}>Título</label>
              <input className="editor-input" value={editForm.title} onChange={e=>setEditForm(s=>({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:4 }}>Descripción</label>
              <textarea className="editor-textarea" rows={4} value={editForm.description} onChange={e=>setEditForm(s=>({ ...s, description: e.target.value }))} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:4 }}>Imagen de portada (URL)</label>
              <input className="editor-input" value={editForm.cover_image_url} onChange={e=>setEditForm(s=>({ ...s, cover_image_url: e.target.value }))} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
              <div>
                <label style={{ display:'block', marginBottom:4 }}>Cierre envíos</label>
                <input type="datetime-local" className="editor-input" value={editForm.submission_deadline as any} onChange={e=>setEditForm(s=>({ ...s, submission_deadline: e.target.value }))} />
              </div>
              <div>
                <label style={{ display:'block', marginBottom:4 }}>Cierre votos</label>
                <input type="datetime-local" className="editor-input" value={editForm.voting_deadline as any} onChange={e=>setEditForm(s=>({ ...s, voting_deadline: e.target.value }))} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'.5rem' }}>
              <button className="editor-back-btn" onClick={()=>setEditOpen(false)}>Cancelar</button>
              <button className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }} onClick={async ()=>{
                if (!id) return;
                try {
                  const { error } = await supabase.from('challenges').update({
                    title: editForm.title,
                    description: editForm.description,
                    cover_image_url: editForm.cover_image_url,
                    submission_deadline: editForm.submission_deadline || null,
                    voting_deadline: editForm.voting_deadline || null,
                  }).eq('id', id);
                  if (error) throw error;
                  showToast('Reto actualizado', 'success');
                  setEditOpen(false);
                  qc.invalidateQueries({ queryKey: ['challenges','detail', id] });
                } catch(e:any) { showToast(e?.message || 'No se pudo actualizar','error'); }
              }}>Guardar</button>
            </div>
          </div>
        </section>
      )}

      {canModerate && (
        <section className="glass" style={{ padding:'1rem' }}>
          <h3 style={{ marginTop:0 }}>Video del Challenge (referencia)</h3>
          {challenge.hero_video_url ? (
            <video controls style={{ width:350, maxWidth:'100%', height:'auto', borderRadius:12, display:'block', margin:'0 auto' }} src={(challenge as any).hero_video_url} />
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
        <section className="glass" style={{ padding:'1rem' }}>
          <h3 style={{ marginTop:0 }}>Subir mi video</h3>
          <div style={{ display:'grid', gap:'.5rem', maxWidth:600 }}>
            <input placeholder="Escribe un título o una breve descripción (opcional)" value={caption} onChange={e=>setCaption(e.target.value)} className="editor-input" />
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
            <button onClick={()=>userFileRef.current?.click()} disabled={uploadingUser} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))', fontWeight:900 }}>
              {uploadingUser ? 'Subiendo…' : 'Seleccionar video y enviar'}
            </button>
          </div>
        </section>
      )}

      {canModerate && (
        <section className="glass" style={{ padding:'1rem' }}>
          <h3 style={{ marginTop:0 }}>Moderación (pendientes)</h3>
          {pending.length === 0 ? <div>Sin pendientes</div> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'.75rem' }}>
              {pending.map(s => (
                <article key={s.id} style={{ border:'1px solid rgba(255,255,255,.15)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'.6rem', display:'grid', gap:'.5rem' }}>
                    <video controls style={{ width:350, maxWidth:'100%', height:'auto', borderRadius:8, display:'block', margin:'0 auto' }} src={s.video_url} />
                    {s.caption && <div style={{ opacity:.9 }}>{s.caption}</div>}
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

      <section className="glass" style={{ padding:'1rem' }}>
        <h3 style={{ marginTop:0 }}>Aprobados</h3>
        {approved.length === 0 ? <div>No hay envíos aprobados</div> : (() => {
          const vmap = new Map<string, number>((leaderboard || []).map(r => [r.submission_id, r.votes]));
          return (
            <HorizontalSlider
              items={approved}
              renderItem={(s: any, idx: number) => (
                <div key={s.id} style={{ 
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 0,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ padding:'.6rem', display:'grid', gap:'.5rem' }}>
                    <video controls style={{ width:350, maxWidth:'100%', height:'auto', borderRadius:8, display:'block', margin:'0 auto' }} src={s.video_url} />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.5rem' }}>
                      <div style={{ fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userNames[s.user_id] || s.user_id}</div>
                      <span style={{ border:'1px solid rgba(255,255,255,.2)', borderRadius:999, padding:'.2rem .6rem' }}>❤️ {vmap.get(s.id) || 0}</span>
                    </div>
                    {s.caption && <div style={{ opacity:.9 }}>{s.caption}</div>}
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={async()=>{ try { await vote.mutateAsync(s.id); } catch(e:any){ showToast(e?.message || 'Error','error'); } }} className="editor-back-btn">Votar</button>
                    </div>
                  </div>
                </div>
              )}
            />
          );
        })()}
      </section>

      <section className="glass" style={{ padding:'1rem' }}>
        <h3 style={{ marginTop:0 }}>Leaderboard</h3>
        {!leaderboard || leaderboard.length === 0 ? <div>Sin votos</div> : (
          <div style={{ display:'grid', gap:'.5rem' }}>
            {leaderboard.map(row => (
              <div key={row.submission_id} style={{
                display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:'.6rem',
                border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'.6rem', background:'rgba(255,255,255,.04)'
              }}>
                <span style={{ width:34, height:34, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)' }}>🏅</span>
                <div style={{ overflow:'hidden' }}>
                  <div style={{ fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userNames[row.user_id] || row.user_id}</div>
                  <div style={{ fontSize:'.85rem', opacity:.8 }}>{row.submission_id}</div>
                </div>
                <span style={{ border:'1px solid rgba(255,255,255,.2)', borderRadius:999, padding:'.2rem .6rem' }}>❤️ {row.votes}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}


