// File: src/pages/challenges/ChallengeNew.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeCreate } from '../../hooks/useChallenges';
import { useToast } from '../../components/Toast';
import RitmosChips from '../../components/RitmosChips';

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
    submission_deadline: '',
    voting_deadline: '',
  });
  const [ritmosSelected, setRitmosSelected] = React.useState<string[]>([]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await create.mutateAsync({
        title: form.title,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        ritmo_slug: ritmosSelected[0] || null,
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
              <label style={{ display: 'block', marginBottom: 4 }}>Imagen de portada (URL)</label>
              <input
                value={form.cover_image_url}
                onChange={(e) => setForm((s) => ({ ...s, cover_image_url: e.target.value }))}
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
                {create.isPending ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
