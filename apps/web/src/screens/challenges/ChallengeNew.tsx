// File: src/pages/challenges/ChallengeNew.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeCreate } from '../../hooks/useChallenges';
import { useToast } from '../../components/Toast';
import RitmosChips from '../../components/RitmosChips';
import { supabase } from '../../lib/supabase';

// ⬇️ Estilos compartidos
import '../../styles/event-public.css';

export default function ChallengeNew() {
  const nav = useNavigate();
  const create = useChallengeCreate();
  const { showToast } = useToast();
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    cover_image_url: '',
    owner_video_url: '',
    submission_deadline: '',
    voting_deadline: '',
  });
  const [ritmosSelected, setRitmosSelected] = React.useState<string[]>([]);
  const [requirements, setRequirements] = React.useState<string[]>([]);
  const [requirementDraft, setRequirementDraft] = React.useState('');
  const coverFileRef = React.useRef<HTMLInputElement|null>(null);
  const videoFileRef = React.useRef<HTMLInputElement|null>(null);
  const [pendingCoverFile, setPendingCoverFile] = React.useState<File|null>(null);
  const [pendingVideoFile, setPendingVideoFile] = React.useState<File|null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🏆 Iniciando creación de challenge...');
    console.log('📝 Datos del formulario:', {
      title: form.title,
      description: form.description,
      ritmo_slug: ritmosSelected[0],
      has_cover: !!pendingCoverFile,
      has_video: !!pendingVideoFile,
      submission_deadline: form.submission_deadline,
      voting_deadline: form.voting_deadline
    });
    
    try {
      // Paso 1: Crear el challenge
      console.log('📤 Llamando a challenge_create RPC...');
      const id = await create.mutateAsync({
        title: form.title,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        owner_video_url: form.owner_video_url || null,
        ritmo_slug: ritmosSelected[0] || null,
        submission_deadline: form.submission_deadline || null,
        voting_deadline: form.voting_deadline || null,
        requirements,
      });
      console.log('✅ Challenge creado con ID:', id);
      
      const updates: any = {};
      
      // Paso 2: Subir archivo de portada si existe
      if (pendingCoverFile) {
        console.log('📸 Subiendo imagen de portada...');
        const ext = pendingCoverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `challenges/${id}/cover-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, pendingCoverFile, {
          upsert: true,
          cacheControl: '3600',
          contentType: pendingCoverFile.type || undefined
        });
        if (upErr) {
          console.error('❌ Error subiendo portada:', upErr);
          throw upErr;
        }
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
        updates.cover_image_url = pub.publicUrl;
        console.log('✅ Portada subida:', pub.publicUrl);
      }
      
      // Paso 3: Subir video base si existe
      if (pendingVideoFile) {
        console.log('🎥 Subiendo video base...');
        const ext = pendingVideoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const path = `challenges/${id}/owner-video-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, pendingVideoFile, {
          upsert: true,
          cacheControl: '3600',
          contentType: pendingVideoFile.type || undefined
        });
        if (upErr) {
          console.error('❌ Error subiendo video:', upErr);
          throw upErr;
        }
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
        updates.owner_video_url = pub.publicUrl;
        console.log('✅ Video subido:', pub.publicUrl);
      }
      
      // Paso 4: Actualizar challenge con URLs de archivos
      if (Object.keys(updates).length > 0) {
        console.log('🔄 Actualizando challenge con URLs de archivos...');
        const { error: updateErr } = await supabase
          .from('challenges')
          .update(updates)
          .eq('id', id);
        
        if (updateErr) {
          console.error('❌ Error actualizando challenge:', updateErr);
          throw updateErr;
        }
        console.log('✅ Challenge actualizado con archivos');
      }
      
      console.log('🎉 Challenge creado exitosamente!');
      showToast('Challenge creado exitosamente', 'success');
      setRequirements([]);
      setRequirementDraft('');
      nav(`/challenges/${id}`);
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('📋 Detalles del error:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
      
      let errorMessage = 'No se pudo crear el challenge';
      
      if (err?.message) {
        if (err.message.includes('Not allowed')) {
          errorMessage = 'No tienes permisos para crear challenges. Necesitas el rol de usuario o superadmin.';
        } else if (err.message.includes('row-level security')) {
          errorMessage = 'Error de permisos. Por favor, contacta al administrador.';
        } else if (err.message.includes('function')) {
          errorMessage = 'Error en la base de datos. Asegúrate de ejecutar el script FIX_CHALLENGES_VIDEO_BASE.sql';
        } else {
          errorMessage = err.message;
        }
      }
      
      showToast(errorMessage, 'error');
    }
  };

  return (
    <div className="cc-page">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
        <div className="cc-glass" style={{ padding: '1rem', margin: '1rem 0', maxWidth: 720 }}>
          <h1
            className="cc-section__title cc-mb-0"
            style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '.6rem' }}
          >
            <span className="cc-round-ico" style={{ width: 40, height: 40, fontSize: 18 }}>🏆</span>
            Nuevo Challenge
          </h1>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Título</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '.5rem .75rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.18)',
                  background: 'rgba(255,255,255,.06)',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Descripción</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '.5rem .75rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.18)',
                  background: 'rgba(255,255,255,.06)',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Ritmos</label>
              <RitmosChips selected={ritmosSelected} onChange={setRitmosSelected} />
              <div style={{ opacity: .7, fontSize: '.85rem', marginTop: 6 }}>Se guardará el primer ritmo como principal.</div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>Requisitos del Challenge</label>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                <input
                  value={requirementDraft}
                  onChange={(e) => setRequirementDraft(e.target.value)}
                  placeholder="Agregar requisito (ej. Formato de video, duración, etc.)"
                  style={{
                    flex: '1 1 240px',
                    minWidth: 200,
                    padding: '.5rem .75rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,.18)',
                    background: 'rgba(255,255,255,.06)',
                    color: '#fff'
                  }}
                />
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() => {
                    const trimmed = requirementDraft.trim();
                    if (!trimmed) return;
                    setRequirements((prev) => Array.from(new Set([...prev, trimmed])));
                    setRequirementDraft('');
                  }}
                >
                  Añadir requisito
                </button>
              </div>
              {requirements.length > 0 ? (
                <ul style={{
                  listStyle: 'disc',
                  paddingLeft: '1.5rem',
                  display: 'grid',
                  gap: '.35rem'
                }}>
                  {requirements.map((req) => (
                    <li key={req} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ flex: 1 }}>{req}</span>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        onClick={() => setRequirements((prev) => prev.filter((r) => r !== req))}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="cc-soft-chip" style={{ opacity: .75 }}>Añade los requisitos que los participantes deben cumplir.</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>📸 Imagen de portada</label>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flexWrap:'wrap' }}>
                <input ref={coverFileRef} type="file" accept="image/*" hidden onChange={(e)=>{
                  const f = e.target.files?.[0];
                  if (!f) return; setPendingCoverFile(f); if (coverFileRef.current) coverFileRef.current.value='';
                }} />
                <button 
                  type="button" 
                  className="cc-btn cc-btn--primary" 
                  onClick={()=>coverFileRef.current?.click()}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(240,147,251,.15), rgba(245,87,108,.15))',
                    border: '1px solid rgba(240,147,251,.3)',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Seleccionar imagen
                </button>
                {pendingCoverFile && (
                  <span style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 999,
                    background: 'rgba(16,185,129,.2)',
                    border: '1px solid rgba(16,185,129,.3)',
                    fontSize: '0.85rem',
                    color: '#fff'
                  }}>
                    ✓ {pendingCoverFile.name}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>🎥 Video base (referencia para participantes)</label>
              <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flexWrap:'wrap' }}>
                <input ref={videoFileRef} type="file" accept="video/*" hidden onChange={(e)=>{
                  const f = e.target.files?.[0];
                  if (!f) return; setPendingVideoFile(f); if (videoFileRef.current) videoFileRef.current.value='';
                }} />
                <button 
                  type="button" 
                  className="cc-btn cc-btn--primary" 
                  onClick={()=>videoFileRef.current?.click()}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(30,136,229,.15), rgba(59,130,246,.15))',
                    border: '1px solid rgba(30,136,229,.3)',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Seleccionar video
                </button>
                {pendingVideoFile && (
                  <span style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 999,
                    background: 'rgba(16,185,129,.2)',
                    border: '1px solid rgba(16,185,129,.3)',
                    fontSize: '0.85rem',
                    color: '#fff'
                  }}>
                    ✓ {pendingVideoFile.name}
                  </span>
                )}
              </div>
              <div style={{ opacity: .7, fontSize: '.85rem', marginTop: 6 }}>
                Este video servirá como referencia para los participantes del challenge.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>Cierre de envíos</label>
                <input
                  type="datetime-local"
                  value={form.submission_deadline}
                  onChange={(e) => setForm((s) => ({ ...s, submission_deadline: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '.5rem .75rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,.18)',
                    background: 'rgba(255,255,255,.06)',
                    color: '#fff',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>Cierre de votos</label>
                <input
                  type="datetime-local"
                  value={form.voting_deadline}
                  onChange={(e) => setForm((s) => ({ ...s, voting_deadline: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '.5rem .75rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,.18)',
                    background: 'rgba(255,255,255,.06)',
                    color: '#fff',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="button" onClick={() => nav('/challenges')} className="cc-btn cc-btn--ghost">
                Cancelar
              </button>
              <button type="submit" disabled={create.isPending} className="cc-btn cc-btn--primary">
                {create.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
