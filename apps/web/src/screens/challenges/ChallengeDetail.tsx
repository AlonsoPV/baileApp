// File: src/pages/challenges/ChallengeDetail.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useChallenge,
  useChallengePublish,
  useChallengeSubmissions,
  useChallengeSubmit,
  useSubmissionApprove,
  useSubmissionReject,
  useToggleVote,
  useChallengeLeaderboard
} from '../../hooks/useChallenges';
import { useQueryClient } from '@tanstack/react-query';
import HorizontalSlider from '../../components/explore/HorizontalSlider';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

// ⬇️ Estilos compartidos aplicados
import '../../styles/event-public.css';

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

  const [canModerate, setCanModerate] = React.useState(false);
  const [caption, setCaption] = React.useState('');
  const ownerFileRef = React.useRef<HTMLInputElement | null>(null);
  const userFileRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadingOwner, setUploadingOwner] = React.useState(false);
  const [uploadingUser, setUploadingUser] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    cover_image_url: '',
    submission_deadline: '',
    voting_deadline: ''
  });
  const [userNames, setUserNames] = React.useState<Record<string, string>>({});

  const uploadToChallengeBucket = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('challenge-media').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || undefined
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('challenge-media').getPublicUrl(path);
    return pub.publicUrl as string;
  };

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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
        voting_deadline: (challenge as any).voting_deadline || ''
      });
    }
  }, [challenge]);

  // Fetch uploader names for approved subs and leaderboard
  React.useEffect(() => {
    (async () => {
      const ids = new Set<string>();
      (subs || []).forEach((s) => s?.user_id && ids.add(s.user_id));
      (leaderboard || []).forEach((r) => r?.user_id && ids.add(r.user_id));
      if (ids.size === 0) return;
      const arr = Array.from(ids);
      const { data, error } = await supabase
        .from('profiles_user')
        .select('user_id, nombre_publico, full_name, email')
        .in('user_id', arr);
      if (error) return;
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = p.nombre_publico || p.full_name || p.email || p.user_id;
      });
      setUserNames(map);
    })();
  }, [subs, leaderboard]);

  if (!id) return <div className="cc-page" style={{ padding: '1rem' }}>Sin id</div>;
  if (!challenge) return <div className="cc-page" style={{ padding: '1rem' }}>Cargando…</div>;

  const pending = (subs || []).filter((s) => s.status === 'pending');
  const approved = (subs || []).filter((s) => s.status === 'approved');

  return (
    <div className="cc-page">
      {/* Contenedor principal (layout simple) */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem', display: 'grid', gap: '1rem' }}>
        {/* Header / Toolbar */}
        <header className="cc-glass" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <button onClick={() => nav('/challenges')} className="cc-btn cc-btn--ghost">← Volver</button>
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {challenge.title}
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <span className="cc-chip">{challenge.status}</span>
              {canModerate && challenge.status !== 'open' && (
                <button
                  onClick={async () => {
                    try {
                      await publish.mutateAsync(challenge.id);
                    } catch (e: any) {
                      showToast(e?.message || 'No se pudo publicar', 'error');
                    }
                  }}
                  className="cc-btn cc-btn--primary"
                >
                  Publicar
                </button>
              )}
              {canModerate && (
                <button onClick={() => setEditOpen((v) => !v)} className="cc-btn cc-btn--ghost">
                  {editOpen ? 'Cerrar edición' : 'Editar'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Cover image */}
        {(challenge as any).cover_image_url && (
          <div className="cc-glass" style={{ padding: 0, overflow: 'hidden' }}>
            <img
              src={(challenge as any).cover_image_url}
              alt="cover"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        )}

        {/* Edit section */}
        {canModerate && editOpen && (
          <section className="cc-glass" style={{ padding: '1rem' }}>
            <h3 className="cc-section__title cc-mb-0">Editar reto</h3>
            <div style={{ display: 'grid', gap: '.6rem', maxWidth: 720 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>Título</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                  style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>Descripción</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                  style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>Imagen de portada (URL)</label>
                <input
                  value={editForm.cover_image_url}
                  onChange={(e) => setEditForm((s) => ({ ...s, cover_image_url: e.target.value }))}
                  style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Cierre envíos</label>
                  <input
                    type="datetime-local"
                    value={editForm.submission_deadline as any}
                    onChange={(e) => setEditForm((s) => ({ ...s, submission_deadline: e.target.value }))}
                    style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Cierre votos</label>
                  <input
                    type="datetime-local"
                    value={editForm.voting_deadline as any}
                    onChange={(e) => setEditForm((s) => ({ ...s, voting_deadline: e.target.value }))}
                    style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="cc-btn cc-btn--ghost" onClick={() => setEditOpen(false)}>Cancelar</button>
                <button
                  className="cc-btn cc-btn--primary"
                  onClick={async () => {
                    if (!id) return;
                    try {
                      const { error } = await supabase
                        .from('challenges')
                        .update({
                          title: editForm.title,
                          description: editForm.description,
                          cover_image_url: editForm.cover_image_url,
                          submission_deadline: editForm.submission_deadline || null,
                          voting_deadline: editForm.voting_deadline || null
                        })
                        .eq('id', id);
                      if (error) throw error;
                      showToast('Reto actualizado', 'success');
                      setEditOpen(false);
                      qc.invalidateQueries({ queryKey: ['challenges', 'detail', id] });
                    } catch (e: any) {
                      showToast(e?.message || 'No se pudo actualizar', 'error');
                    }
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Owner video */}
        {canModerate && (
          <section className="cc-glass" style={{ padding: '1rem' }}>
            <h3 className="cc-section__title cc-section__title--blue cc-mb-0">Video del Challenge (referencia)</h3>
            {(challenge as any).hero_video_url ? (
              <video
                controls
                style={{ width: 350, maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block', margin: '0 auto' }}
                src={(challenge as any).hero_video_url}
              />
            ) : (
              <div style={{ opacity: 0.85 }}>Aún no hay video de referencia.</div>
            )}
            <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <input
                ref={ownerFileRef}
                type="file"
                accept="video/*"
                hidden
                onChange={async (e) => {
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
                  } catch (e: any) {
                    showToast(e?.message || 'No se pudo subir video', 'error');
                  } finally {
                    setUploadingOwner(false);
                    if (ownerFileRef.current) ownerFileRef.current.value = '';
                  }
                }}
              />
              <button
                onClick={() => ownerFileRef.current?.click()}
                disabled={uploadingOwner}
                className="cc-btn cc-btn--primary"
              >
                {uploadingOwner ? 'Subiendo…' : 'Subir/Actualizar video'}
              </button>
            </div>
          </section>
        )}

        {/* User submission */}
        {challenge.status === 'open' && (
          <section className="cc-glass" style={{ padding: '1rem' }}>
            <h3 className="cc-section__title cc-section__title--blue cc-mb-0">Subir mi video</h3>
            <div style={{ display: 'grid', gap: '.5rem', maxWidth: 600 }}>
              <input
                placeholder="Escribe un título o una breve descripción (opcional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
              />
              <input
                ref={userFileRef}
                type="file"
                accept="video/*"
                hidden
                onChange={async (e) => {
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
                  } catch (e: any) {
                    showToast(e?.message || 'No se pudo enviar', 'error');
                  } finally {
                    setUploadingUser(false);
                    if (userFileRef.current) userFileRef.current.value = '';
                  }
                }}
              />
              <button
                onClick={() => userFileRef.current?.click()}
                disabled={uploadingUser}
                className="cc-btn cc-btn--primary"
                style={{ fontWeight: 900 }}
              >
                {uploadingUser ? 'Subiendo…' : 'Seleccionar video y enviar'}
              </button>
            </div>
          </section>
        )}

        {/* Moderation */}
        {canModerate && (
          <section className="cc-glass" style={{ padding: '1rem' }}>
            <h3 className="cc-section__title cc-mb-0">Moderación (pendientes)</h3>
            {pending.length === 0 ? (
              <div>Sin pendientes</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '.75rem' }}>
                {pending.map((s) => (
                  <article key={s.id} className="cc-glass" style={{ padding: 0 }}>
                    <div style={{ padding: '.6rem', display: 'grid', gap: '.5rem' }}>
                      <video
                        controls
                        style={{ width: 350, maxWidth: '100%', height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }}
                        src={s.video_url}
                      />
                      {s.caption && <div style={{ opacity: 0.9 }}>{s.caption}</div>}
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button
                          onClick={async () => {
                            try {
                              await approve.mutateAsync(s.id);
                            } catch (e: any) {
                              showToast(e?.message || 'Error', 'error');
                            }
                          }}
                          className="cc-btn cc-btn--ghost"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await reject.mutateAsync(s.id);
                            } catch (e: any) {
                              showToast(e?.message || 'Error', 'error');
                            }
                          }}
                          className="cc-btn cc-btn--ghost"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Approved */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          <h3 className="cc-section__title cc-section__title--orange cc-mb-0">Aprobados</h3>
          {approved.length === 0 ? (
            <div>No hay envíos aprobados</div>
          ) : (() => {
            const vmap = new Map<string, number>((leaderboard || []).map((r) => [r.submission_id, r.votes]));
            return (
              <HorizontalSlider
                items={approved}
                renderItem={(s: any) => (
                  <div
                    key={s.id}
                    className="cc-glass"
                    style={{ padding: 0 }}
                  >
                    <div style={{ padding: '.6rem', display: 'grid', gap: '.5rem' }}>
                      <video
                        controls
                        style={{ width: 350, maxWidth: '100%', height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }}
                        src={s.video_url}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {userNames[s.user_id] || s.user_id}
                        </div>
                        <span className="cc-chip">❤️ {vmap.get(s.id) || 0}</span>
                      </div>
                      {s.caption && <div style={{ opacity: 0.9 }}>{s.caption}</div>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={async () => {
                            try {
                              await vote.mutateAsync(s.id);
                            } catch (e: any) {
                              showToast(e?.message || 'Error', 'error');
                            }
                          }}
                          className="cc-btn cc-btn--ghost"
                        >
                          Votar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              />
            );
          })()}
        </section>

        {/* Leaderboard */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          <h3 className="cc-section__title cc-section__title--orange cc-mb-0">Leaderboard</h3>
          {!leaderboard || leaderboard.length === 0 ? (
            <div>Sin votos</div>
          ) : (
            <div style={{ display: 'grid', gap: '.5rem' }}>
              {leaderboard.map((row) => (
                <div
                  key={row.submission_id}
                  className="cc-glass"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: '.6rem',
                    padding: '.6rem'
                  }}
                >
                  <span className="cc-round-ico" style={{ width: 34, height: 34, fontSize: 16 }}>🏅</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userNames[row.user_id] || row.user_id}
                    </div>
                    <div style={{ fontSize: '.85rem', opacity: 0.8 }}>{row.submission_id}</div>
                  </div>
                  <span className="cc-chip">❤️ {row.votes}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
