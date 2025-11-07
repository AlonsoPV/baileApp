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
import RitmosChips from '../../components/RitmosChips';

// ⬇️ Estilos compartidos aplicados
import '../../styles/event-public.css';

export default function ChallengeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { data: challenge, isLoading: challengeLoading, error: challengeError } = useChallenge(id);
  const { data: subs, isLoading: subsLoading } = useChallengeSubmissions(id);
  const { data: leaderboard, isLoading: leaderboardLoading } = useChallengeLeaderboard(id);
  const publish = useChallengePublish();
  const submit = useChallengeSubmit();
  const approve = useSubmissionApprove();
  const reject = useSubmissionReject();
  const vote = useToggleVote();

  // Logs de debugging
  React.useEffect(() => {
    console.log('🏆 ChallengeDetail - Estado:', {
      id,
      challengeLoading,
      challengeError,
      hasChallenge: !!challenge,
      challenge: challenge
    });
  }, [id, challengeLoading, challengeError, challenge]);

  const [canModerate, setCanModerate] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState('');
  const ownerFileRef = React.useRef<HTMLInputElement | null>(null);
  const coverFileRef = React.useRef<HTMLInputElement | null>(null);
  const userFileRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadingOwner, setUploadingOwner] = React.useState(false);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [uploadingUser, setUploadingUser] = React.useState(false);
  const [pendingCoverFile, setPendingCoverFile] = React.useState<File | null>(null);
  const [pendingOwnerVideo, setPendingOwnerVideo] = React.useState<File | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    cover_image_url: '',
    submission_deadline: '',
    voting_deadline: ''
  });
  const [userMeta, setUserMeta] = React.useState<Record<string, { name: string; bio?: string; route?: string }>>({});
  const [ritmosSelected, setRitmosSelected] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [confirmState, setConfirmState] = React.useState<{ open: boolean; title: string; message: string; onConfirm: () => Promise<void> | void }>(
    { open: false, title: '', message: '', onConfirm: async () => { } }
  );
  // Edición de submissions
  const [editingSubmissionId, setEditingSubmissionId] = React.useState<string | null>(null);
  const [editCaption, setEditCaption] = React.useState<string>('');
  const [pendingEditFile, setPendingEditFile] = React.useState<File | null>(null);
  const editFileRef = React.useRef<HTMLInputElement | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const startEditSubmission = (s: any) => {
    setEditingSubmissionId(s.id);
    setEditCaption(s.caption || '');
    setPendingEditFile(null);
  };
  const cancelEditSubmission = () => {
    setEditingSubmissionId(null);
    setEditCaption('');
    setPendingEditFile(null);
  };
  const saveEditSubmission = async (s: any) => {
    if (!id) return;
    try {
      setSavingEdit(true);
      let videoUrl = s.video_url as string;
      if (pendingEditFile && currentUserId) {
        const ext = pendingEditFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const path = `challenges/${id}/submissions/${currentUserId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, pendingEditFile, {
          upsert: true,
          cacheControl: '3600',
          contentType: pendingEditFile.type || undefined
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
        videoUrl = pub.publicUrl as string;
      }
      const { error } = await supabase
        .from('challenge_submissions')
        .update({ video_url: videoUrl, caption: editCaption })
        .eq('id', s.id);
      if (error) throw error;
      showToast('Envío actualizado', 'success');
      setEditingSubmissionId(null);
      setEditCaption('');
      setPendingEditFile(null);
      qc.invalidateQueries({ queryKey: ['challenges', 'submissions', id] });
      qc.invalidateQueries({ queryKey: ['challenges', 'leaderboard', id] });
    } catch (e: any) {
      showToast(e?.message || 'No se pudo actualizar el envío', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const uploadToChallengeBucket = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('media').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || undefined
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
    return pub.publicUrl as string;
  };

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
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
      const slug = (challenge as any).ritmo_slug as string | null;
      if (slug) setRitmosSelected([slug]);
    }
  }, [challenge]);

  // Fetch uploader display_name, bio and a safe public route (when available)
  React.useEffect(() => {
    (async () => {
      const ids = new Set<string>();
      (subs || []).forEach((s) => s?.user_id && ids.add(s.user_id));
      (leaderboard || []).forEach((r) => r?.user_id && ids.add(r.user_id));
      if (ids.size === 0) return;
      const arr = Array.from(ids);
      const [{ data, error }, { data: rolesData }] = await Promise.all([
        supabase
          .from('profiles_user')
          .select('user_id, display_name, email, bio')
          .in('user_id', arr),
        supabase
          .from('user_roles')
          .select('user_id, role_slug')
          .in('user_id', arr)
      ]);
      if (error) return;
      const roleByUser = new Map<string, string>();
      (rolesData || []).forEach((r: any) => {
        if (r?.user_id && r?.role_slug) roleByUser.set(r.user_id, r.role_slug);
      });
      const map: Record<string, { name: string; bio?: string; route?: string }> = {};
      (data || []).forEach((p: any) => {
        const name = p.display_name || p.email || p.user_id;
        const role = roleByUser.get(p.user_id);
        let route: string | undefined = undefined;
        if (role === 'organizador') route = `/organizer/${p.user_id}`;
        if (role === 'maestro') route = `/maestro/${p.user_id}`;
        map[p.user_id] = { name, bio: p.bio, route };
      });
      setUserMeta(map);
    })();
  }, [subs, leaderboard]);

  const subById = React.useMemo(() => {
    const m = new Map<string, any>();
    (subs || []).forEach((s: any) => { if (s?.id) m.set(String(s.id), s); });
    return m;
  }, [subs]);

  if (!id) {
    console.error('❌ No hay ID de challenge en la URL');
    return <div className="cc-page" style={{ padding: '1rem' }}>Sin ID de challenge</div>;
  }
  
  if (challengeError) {
    console.error('❌ Error cargando challenge:', challengeError);
    return (
      <div className="cc-page" style={{ padding: '1rem' }}>
        <div className="cc-glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Error al cargar el challenge</h2>
          <p style={{ opacity: 0.85, marginBottom: '1rem' }}>
            {(challengeError as any)?.message || 'No se pudo cargar el challenge'}
          </p>
          <button onClick={() => nav('/challenges')} className="cc-btn cc-btn--primary">
            ← Volver a challenges
          </button>
        </div>
      </div>
    );
  }
  
  if (challengeLoading) {
    console.log('⏳ Cargando challenge...');
    return (
      <div className="cc-page" style={{ padding: '1rem' }}>
        <div className="cc-glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2>Cargando challenge...</h2>
        </div>
      </div>
    );
  }
  
  if (!challenge) {
    console.error('❌ Challenge no encontrado después de cargar');
    return (
      <div className="cc-page" style={{ padding: '1rem' }}>
        <div className="cc-glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Challenge no encontrado</h2>
          <p style={{ opacity: 0.85, marginBottom: '1rem' }}>
            El challenge que buscas no existe o no tienes permisos para verlo.
          </p>
          <button onClick={() => nav('/challenges')} className="cc-btn cc-btn--primary">
            ← Volver a challenges
          </button>
        </div>
      </div>
    );
  }
  
  console.log('✅ Challenge cargado correctamente:', challenge);

  const pending = (subs || []).filter((s) => s.status === 'pending');
  const approved = (subs || []).filter((s) => s.status === 'approved');
  const mySubmission = (subs || []).find((s:any) => s.user_id === currentUserId);

  const getStoragePathFromPublicUrl = (url?: string | null) => {
    if (!url) return null;
    try {
      const idx = url.indexOf('/challenge-media/');
      if (idx === -1) return null;
      return url.substring(idx + '/challenge-media/'.length);
    } catch { return null; }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      let coverUrl = editForm.cover_image_url as string | null;
      let ownerVideoUrl = (challenge as any)?.owner_video_url as string | null;

      // Subidas pendientes
      if (pendingCoverFile) {
        const ext = pendingCoverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        coverUrl = await uploadToChallengeBucket(pendingCoverFile, `challenges/${id}/cover-${Date.now()}.${ext}`);
      }
      if (pendingOwnerVideo) {
        const ext = pendingOwnerVideo.name.split('.').pop()?.toLowerCase() || 'mp4';
        ownerVideoUrl = await uploadToChallengeBucket(pendingOwnerVideo, `challenges/${id}/owner-${Date.now()}.${ext}`);
      }

      const { error } = await supabase
        .from('challenges')
        .update({
          title: editForm.title,
          description: editForm.description,
          cover_image_url: coverUrl,
          submission_deadline: editForm.submission_deadline || null,
          voting_deadline: editForm.voting_deadline || null,
          ritmo_slug: ritmosSelected[0] || null,
          owner_video_url: ownerVideoUrl
        })
        .eq('id', id);
      if (error) throw error;
      showToast('Cambios guardados', 'success');
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ['challenges', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['challenges', 'list'] });
      setPendingCoverFile(null);
      setPendingOwnerVideo(null);
    } catch (e: any) {
      showToast(e?.message || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cc-page">
      <style>{`
        @media (max-width: 768px) {
          .cc-page { padding-top: 64px; }
          .chd-header > div { grid-template-columns: 1fr !important; gap: .5rem !important; text-align: center; }
          .chd-combined { grid-template-columns: 1fr !important; }
          .chd-video-box, .chd-cover-box { max-width: 100% !important; }
          .appr-slider { padding: .75rem !important; }
          .appr-card { max-width: 100% !important; width: 100% !important; }
          .appr-media video { width: 100% !important; }
        }
      `}</style>
      {/* Contenedor principal (layout simple) */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem', display: 'grid', gap: '1rem' }}>
        {/* Header / Toolbar */}
        <header className="cc-glass chd-header" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '0.9rem' }}>
            <div>
              <button onClick={() => nav('/challenges')} className="cc-btn cc-btn--ghost">← Volver</button>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', background: 'linear-gradient(135deg,#1E88E5,#00BCD4,#FF3D57)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1, letterSpacing: '-.015em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                🏆 {challenge.title}
              </div>
              {(challenge as any)?.description && (
                <div style={{ opacity: .85, fontSize: '.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{(challenge as any).description}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span className={`cc-status-chip ${challenge.status ? ('is-' + String(challenge.status)) : ''}`}>{challenge.status}</span>
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
              {canModerate && editOpen && (
                <button onClick={handleSave} className="cc-btn cc-btn--primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Encabezado combinado: Col 1 (portada + info + ritmos) | Col 2 (video) */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem', alignItems: 'start' }}>
            <div>
              {(challenge as any).cover_image_url && (
                <div style={{ display: 'grid', placeItems: 'center', marginBottom: '.75rem' }}>
                  <img src={(challenge as any).cover_image_url} alt="cover" style={{ width: 350, maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block' }} />
                </div>
              )}
              {canModerate && (
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setPendingCoverFile(f);
                      if (coverFileRef.current) coverFileRef.current.value = '';
                    }}
                  />
                  <button onClick={() => coverFileRef.current?.click()} disabled={uploadingCover} className="cc-btn cc-btn--primary">
                    Seleccionar portada
                  </button>
                  {pendingCoverFile && (<span className="cc-chip">Archivo listo: {pendingCoverFile.name}</span>)}
                  {(challenge as any).cover_image_url && (
                    <button
                      onClick={async () => {
                        setConfirmState({
                          open: true,
                          title: 'Eliminar portada',
                          message: '¿Eliminar la portada actual? Esta acción no se puede deshacer.',
                          onConfirm: async () => {
                            try {
                              const path = getStoragePathFromPublicUrl((challenge as any).cover_image_url);
                              if (path) await supabase.storage.from('media').remove([path]);
                              const { error } = await supabase.from('challenges').update({ cover_image_url: null }).eq('id', id as string);
                              if (error) throw error;
                              showToast('Portada eliminada', 'success');
                              qc.invalidateQueries({ queryKey: ['challenges', 'detail', id] });
                            } catch (e: any) { showToast(e?.message || 'No se pudo eliminar', 'error'); }
                          }
                        });
                      }}
                      className="cc-btn cc-btn--ghost"
                    >Eliminar portada</button>
                  )}
                </div>
              )}
             {/*  <div style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: 6 }}>{challenge.title}</div>
              {(challenge as any).description && (
                <div className="cc-two-lines" style={{ opacity: .92, marginBottom: 8 }}>{(challenge as any).description}</div>
              )} */}
             {/*  {(challenge as any).ritmo_slug && (
                <RitmosChips selected={[String((challenge as any).ritmo_slug)]} onChange={() => { }} readOnly />
              )} */}
            </div>
            <div>
              {(challenge as any).owner_video_url ? (
                <video controls style={{ width: 350, maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block', margin: '0 auto' }} src={(challenge as any).owner_video_url} />
              ) : (
                <div style={{ opacity: .85 }}>Aún no hay video de referencia.</div>
              )}
              {canModerate && (
                <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <input
                    ref={ownerFileRef}
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setPendingOwnerVideo(f);
                      if (ownerFileRef.current) ownerFileRef.current.value = '';
                    }}
                  />
                  <button onClick={() => ownerFileRef.current?.click()} disabled={uploadingOwner} className="cc-btn cc-btn--primary">Seleccionar video</button>
                  {pendingOwnerVideo && (<span className="cc-chip">Archivo listo: {pendingOwnerVideo.name}</span>)}
                  {(challenge as any).owner_video_url && (
                    <button
                      onClick={async () => {
                        setConfirmState({
                          open: true,
                          title: 'Eliminar video de referencia',
                          message: '¿Eliminar el video? Esta acción no se puede deshacer.',
                          onConfirm: async () => {
                            try {
                              const path = getStoragePathFromPublicUrl((challenge as any).owner_video_url);
                              if (path) await supabase.storage.from('media').remove([path]);
                              const { error } = await supabase.from('challenges').update({ owner_video_url: null }).eq('id', id as string);
                              if (error) throw error;
                              showToast('Video eliminado', 'success');
                              qc.invalidateQueries({ queryKey: ['challenges', 'detail', id] });
                            } catch (e: any) { showToast(e?.message || 'No se pudo eliminar', 'error'); }
                          }
                        });
                      }}
                      className="cc-btn cc-btn--ghost"
                    >Eliminar video</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

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
                <label style={{ display: 'block', marginBottom: 4 }}>Ritmos</label>
                <RitmosChips selected={ritmosSelected} onChange={setRitmosSelected} />
                <div style={{ opacity: .7, fontSize: '.85rem', marginTop: 6 }}>Se guardará el primer ritmo como principal.</div>
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
                <button className="cc-btn cc-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Ritmos (live) */}
        {(challenge as any).ritmo_slug && (
          <section className="cc-glass" style={{ padding: '1rem' }}>
            <h3 className="cc-section__title cc-section__title--blue cc-mb-0">Ritmo</h3>
            <div style={{ marginTop: 8 }}>
              <RitmosChips selected={[String((challenge as any).ritmo_slug)]} onChange={() => { }} readOnly />
            </div>
          </section>
        )}

        {/* Owner video */}
        {/*    {canModerate && (
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
        )} */}

        {/* User submission: solo si está loggeado */}
        {currentUserId && challenge.status === 'open' && !mySubmission && (
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

        {currentUserId && challenge.status === 'open' && mySubmission && (
          <section className="cc-glass" style={{ padding: '1rem' }}>
            <h3 className="cc-section__title cc-section__title--blue cc-mb-0">Mi envío</h3>
            <div style={{ display:'grid', gap:'.5rem' }}>
              <div className="cc-soft-chip"><span className="cc-ellipsis">Ya enviaste un video para este challenge.</span></div>
              <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                <a className="cc-btn cc-btn--ghost" href={mySubmission.video_url} target="_blank" rel="noopener noreferrer">Ver mi video</a>
                <button className="cc-btn cc-btn--primary" onClick={()=>startEditSubmission(mySubmission)}>Editar mi envío</button>
              </div>
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
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', alignItems:'center', justifyContent:'space-between' }}>
                        {userMeta[s.user_id]?.route ? (
                          <a
                            href={userMeta[s.user_id]?.route}
                            className="cc-soft-chip"
                            title={userMeta[s.user_id]?.name || 'Usuario'}
                          >
                            <span className="cc-ellipsis">{userMeta[s.user_id]?.name || 'Usuario'}</span>
                          </a>
                        ) : (
                          <span className="cc-soft-chip" title={userMeta[s.user_id]?.name || 'Usuario'}>
                            <span className="cc-ellipsis">{userMeta[s.user_id]?.name || 'Usuario'}</span>
                          </span>
                        )}
                        {s.created_at && (
                          <span className="cc-soft-chip" title={String(s.created_at)}>
                            {new Date(s.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
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
        {/* Sustituye tu sección por esta versión mejorada */}
        <section className="cc-glass" style={{ padding: '1rem' }}>
          {/* CSS específico solo para esta sección */}
          <style>{`
    .appr-slider { gap: 1rem; }
    .appr-card {
      width: min-content; flex: 0 0 auto;
      border-radius: 18px; overflow: hidden; padding: 0; box-sizing: border-box;
      position: relative; display: block; transition: transform .18s ease, box-shadow .18s ease;
    }
    .appr-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,.35); }
    .appr-media { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; border-radius: 18px 18px 0 0; }
    .appr-media > video {
      width: 100%; height: 100%; display: block; object-fit: cover; border-bottom: 1px solid rgba(255,255,255,.12);
    }
 /* Scope de la sección/cards aprobados */
.appr {
  /* Por qué: tuning rápido sin tocar CSS global */
  --appr-gap: .9rem;
  --appr-pad: 1.1rem;
  --appr-fz-title: clamp(1.02rem, 1.2vw + .8rem, 1.12rem);
  --appr-fz-desc: clamp(.95rem, .6vw + .84rem, 1rem);
}

.appr-body {
  padding: var(--appr-pad);
  display: grid;
  gap: var(--appr-gap);
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.04));
  border: 1px solid rgba(255,255,255,.12);
  border-top: 0;
  border-radius: 0 0 18px 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  backdrop-filter: blur(8px);
  overflow: hidden;
  box-sizing: border-box;
}

.appr-title {
  font-weight: 900;
  font-size: var(--appr-fz-title);
  letter-spacing: -.01em;
  line-height: 1.25;
  margin: 0;
  text-shadow: 0 1px 6px rgba(0,0,0,.25);
  word-break: break-word;
}

.appr-desc {
  opacity: .95;
  font-size: var(--appr-fz-desc);
  line-height: 1.5;
  word-break: break-word;
}
.appr-body :where(.cc-soft-chip) {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  padding: .35rem .6rem;
  border-radius: 10px;
}

/* Reglas compartidas para filas de meta y acciones */
.appr :where(.appr-meta, .appr-actions) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--appr-gap);
}

.appr-author {
  font-weight: 800;
  min-width: 0;            /* evita overflow con ellipsis */
}
.appr-author .cc-soft-chip {
  background: rgba(30,136,229,.12);
  border: 1px solid rgba(30,136,229,.25);
}

.appr-actions {
  margin-top: .6rem;
  padding-top: .6rem;
  border-top: 1px dashed rgba(255,255,255,.12);
  flex-wrap: wrap;
}

/* Responsive: compactar y evitar encimarse */
@media (max-width: 480px) {
  .appr { --appr-gap: .7rem; --appr-pad: .9rem; }
  .appr :where(.appr-meta, .appr-actions) { flex-wrap: wrap; }
}

    .appr-actions__left { display: flex; gap: .7rem; align-items: center; }
    /* Utilidades de truncado si aún no existen en tu CSS global */
    .cc-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cc-two-lines {
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .appr-card { width: 100%; min-width: 100%; max-width: 100%; }
    }
  `}</style>

          <h3 className="cc-section__title cc-section__title--orange cc-mb-0">Aprobados</h3>

          {approved.length === 0 ? (
            <div>No hay envíos aprobados</div>
          ) : (() => {
            const vmap = new Map<string, number>((leaderboard || []).map((r) => [r.submission_id, r.votes]));
            return (
              <div className="appr-slider">
                <HorizontalSlider
                  items={approved}
                  autoColumns={null}
                  renderItem={(s: any) => (
                    <div key={s.id} className="cc-glass appr-card appr" role="article" aria-label={`Envío aprobado por ${userMeta[s.user_id]?.name || s.user_id}`}>
                      {/* Media */}
                      <div className="appr-media">
                        <video
                          controls
                          src={s.video_url}
                          title={`Video de ${userMeta[s.user_id]?.name || s.user_id}`}
                          aria-label={`Video de ${userMeta[s.user_id]?.name || s.user_id}`}
                        />
                      </div>

                      {/* Body */}
                      <div className="appr-body">
                        {/* Título del challenge */}
                        <div className="appr-title cc-ellipsis" title={challenge.title}>
                          {challenge.title}
                        </div>

              {/* Descripción del challenge (chip) */}
              {(challenge as any)?.description && (
                <div className="appr-desc">
                  <span className="cc-soft-chip"><span className="cc-ellipsis">{(challenge as any).description}</span></span>
                </div>
              )}

                        {/* Autor + votos */}
                         <div className="appr-meta">
                           <div className="appr-author" title={userMeta[s.user_id]?.name || 'Usuario'}>
                             <span className="cc-soft-chip"><span className="cc-ellipsis">{(userMeta[s.user_id]?.name && userMeta[s.user_id]?.name !== s.user_id) ? userMeta[s.user_id]?.name : 'Usuario'}</span></span>
                           </div>
                          <button
                            className="cc-btn cc-btn--primary"
                            title={`${vmap.get(s.id) || 0} votos`}
                            aria-label={`Votos: ${vmap.get(s.id) || 0}`}
                            onClick={async () => { try { await vote.mutateAsync(s.id); } catch (e: any) { showToast(e?.message || 'Error', 'error'); } }}
                          >
                            ❤️ {vmap.get(s.id) || 0}
                          </button>
                        </div>

                        {/* Caption / edición */}
                        {editingSubmissionId === s.id ? (
                          <div style={{ display: 'grid', gap: '.5rem' }}>
                            <input
                              value={editCaption}
                              onChange={(e) => setEditCaption(e.target.value)}
                              placeholder="Título / caption"
                              style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff' }}
                            />
                            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <input ref={editFileRef} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setPendingEditFile(f); if (editFileRef.current) editFileRef.current.value = ''; }} />
                              <button className="cc-btn cc-btn--ghost" onClick={() => editFileRef.current?.click()}>Seleccionar nuevo video</button>
                              {pendingEditFile && <span className="cc-chip">Archivo listo: {pendingEditFile.name}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                              <button className="cc-btn cc-btn--ghost" onClick={cancelEditSubmission}>Cancelar</button>
                              <button className="cc-btn cc-btn--primary" onClick={() => saveEditSubmission(s)} disabled={savingEdit}>{savingEdit ? 'Guardando…' : 'Guardar'}</button>
                            </div>
                          </div>
                        ) : (
                          s.caption && (
                            <div style={{ opacity: 0.85 }}>
                              {s.caption}
                            </div>
                          )
                        )}

                        {/* Acciones */}
                        <div className="appr-actions">
                          <div className="appr-actions__left">
                            {/* Botón de votar duplicado eliminado; usamos el chip de la barra superior */}
                            {(canModerate || currentUserId === s.user_id) && (
                              <button className="cc-btn cc-btn--ghost" onClick={() => startEditSubmission(s)}>Editar</button>
                            )}
                            <a
                              href={s.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cc-btn cc-btn--ghost"
                              aria-label="Abrir video en nueva pestaña"
                              title="Ver video"
                            >
                              Ver video
                            </a>
                          </div>

                          <button
                            onClick={() => {
                              // Navega al detalle del challenge (mantén tu routing si quieres ir a una página del submission)
                              // nav(`/challenges/${challenge.id}`)  // <- si necesitas deep link, reemplázalo
                              try {
                                navigator.clipboard?.writeText(window.location.origin + `/challenges/${challenge.id}`);
                                showToast('Enlace copiado', 'success');
                              } catch {
                                showToast('No se pudo copiar el enlace', 'error');
                              }
                            }}
                            className="cc-btn cc-btn--ghost"
                            aria-label="Copiar enlace del challenge"
                            title="Copiar enlace"
                          >
                            Copiar enlace
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
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
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center',
                    gap: '.6rem',
                    padding: '.6rem'
                  }}
                >
                  <span className="cc-round-ico" style={{ width: 34, height: 34, fontSize: 16 }}>🏅</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userMeta[row.user_id]?.name || row.user_id}
                    </div>
                    {userMeta[row.user_id]?.bio && (
                      <div style={{ fontSize: '.85rem', opacity: 0.85 }} className="cc-two-lines">{userMeta[row.user_id]?.bio}</div>
                    )}
                  </div>
                  {(() => { const url = subById.get(String(row.submission_id))?.video_url as string | undefined; return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="cc-btn cc-btn--ghost" title="Ver video">Ver video</a>
                  ) : null; })()}
                  <span className="cc-chip">❤️ {row.votes}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {/* Modal de confirmación */}
      {confirmState.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'grid', placeItems: 'center', zIndex: 70 }}>
          <div className="cc-glass" style={{ padding: '1rem', width: 'min(520px, 92vw)' }}>
            <h3 className="cc-section__title cc-mb-0" style={{ marginBottom: '.25rem' }}>{confirmState.title}</h3>
            <p style={{ opacity: .9, margin: '0 0 .75rem 0' }}>{confirmState.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem' }}>
              <button className="cc-btn cc-btn--ghost" onClick={() => setConfirmState(s => ({ ...s, open: false }))}>Cancelar</button>
              <button className="cc-btn cc-btn--primary" onClick={async () => { const fn = confirmState.onConfirm; setConfirmState(s => ({ ...s, open: false })); await fn(); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
