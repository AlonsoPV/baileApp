import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeCreate } from '../../hooks/useChallenges';
import { useToast } from '../../components/Toast';

export default function ChallengeNew() {
  const nav = useNavigate();
  const create = useChallengeCreate();
  const { showToast } = useToast();
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    cover_image_url: '',
    submission_deadline: '',
    voting_deadline: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await create.mutateAsync({
        title: form.title,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        submission_deadline: form.submission_deadline || null,
        voting_deadline: form.voting_deadline || null,
      });
      showToast('Challenge creado', 'success');
      nav(`/challenges/${id}`);
    } catch (err: any) {
      showToast(err?.message || 'No se pudo crear', 'error');
    }
  };

  return (
    <div style={{ padding:'1rem', color:'#fff' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        margin: '1rem 0',
        maxWidth: 720
      }}>
      <h1 style={{ margin:'0 0 1rem 0', fontSize:'1.3rem', display:'flex', alignItems:'center', gap:'.6rem' }}>
        <span style={{ width:40, height:40, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.2)' }}>🏆</span>
        Nuevo Challenge
      </h1>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:'.75rem' }}>
        <div>
          <label style={{ display:'block', marginBottom:4 }}>Título</label>
          <input value={form.title} onChange={e=>setForm(s=>({ ...s, title: e.target.value }))} required className="editor-input" style={{ width:'100%' }} />
        </div>
        <div>
          <label style={{ display:'block', marginBottom:4 }}>Descripción</label>
          <textarea value={form.description} onChange={e=>setForm(s=>({ ...s, description: e.target.value }))} className="editor-textarea" rows={4} style={{ width:'100%' }} />
        </div>
        <div>
          <label style={{ display:'block', marginBottom:4 }}>Imagen de portada (URL)</label>
          <input value={form.cover_image_url} onChange={e=>setForm(s=>({ ...s, cover_image_url: e.target.value }))} className="editor-input" style={{ width:'100%' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
          <div>
            <label style={{ display:'block', marginBottom:4 }}>Cierre de envíos</label>
            <input type="datetime-local" value={form.submission_deadline} onChange={e=>setForm(s=>({ ...s, submission_deadline: e.target.value }))} className="editor-input" style={{ width:'100%' }} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:4 }}>Cierre de votos</label>
            <input type="datetime-local" value={form.voting_deadline} onChange={e=>setForm(s=>({ ...s, voting_deadline: e.target.value }))} className="editor-input" style={{ width:'100%' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <button type="button" onClick={()=>nav('/challenges')} className="editor-back-btn">Cancelar</button>
          <button type="submit" disabled={create.isPending} className="editor-back-btn" style={{ background:'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))' }}>
            {create.isPending ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}


