import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { useCreateRoleRequest, useRolesCatalog, useMyRoleRequests } from '@/hooks/useRoles';
import type { RoleSlug } from '@/types/roles';
import { useAuth } from '@/contexts/AuthProvider';

export default function RequestRoleScreen() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: catalog = [] } = useRolesCatalog();
  const { data: myReqs = [] } = useMyRoleRequests();
  const createReq = useCreateRoleRequest();

  const initialRole = (sp.get('role') as RoleSlug) || 'organizador';
  const [role, setRole] = useState<RoleSlug>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [socials, setSocials] = useState({ instagram: '', tiktok: '', youtube: '', facebook: '', whatsapp: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const submit = async () => {
    setErrorMsg(null); setOkMsg(null);
    try {
      if (!fullName.trim() || !phone.trim()) {
        setErrorMsg('Completa nombre completo y celular');
        return;
      }
      const payload = { role_slug: role, full_name: fullName, email, phone, socials };
      console.log('[RequestRoleScreen] payload', { ...payload, status: 'pending' });
      await createReq.mutateAsync(payload);
      setOkMsg('Solicitud enviada. Te avisaremos al ser revisada.');
      setFullName(''); setEmail(user?.email ?? ''); setPhone('');
      setTimeout(() => navigate('/app/profile'), 1000);
    } catch (e: any) {
      console.error('[RequestRoleScreen] Insert error:', e);
      setErrorMsg(e?.message || 'No se pudo enviar la solicitud');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #111827 60%, #0b1020 100%)',
      padding: '32px 16px',
      color: '#e5e7eb'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {okMsg && (
          <div style={{
            margin: '0 0 16px',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid rgba(16,185,129,.45)',
            background: 'rgba(16,185,129,.1)',
            color: '#10B981',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            Formulario enviado, en un plazo de máximo 24 horas tendrás respuesta de tu solicitud
          </div>
        )}
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.875rem',
            fontWeight: 800,
            background: 'linear-gradient(90deg,#f093fb,#FFD166)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Solicitar rol</h1>
          <p style={{ opacity: 0.8, marginTop: 8 }}>Completa tus datos para que un admin revise tu solicitud.</p>
        </div>

        {/* Grid layout: form + aside */}
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', alignItems: 'start' }}>
          <style>{`
            @media (min-width: 860px) {
              .rr-grid { grid-template-columns: 1.2fr 0.8fr !important; }
              .rr-actions { display: flex; justify-content: flex-end; }
            }
            .rr-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
            .rr-input { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #e5e7eb; outline: none; }
            .rr-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }
            .rr-label { display:block; font-size: 0.9rem; margin-bottom: 6px; opacity: .85 }
            .rr-legend { padding: 0 8px; opacity: .8 }
            .rr-chip { border:1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.25); border-radius: 999px; padding: 6px 10px; font-size: .8rem }
          `}</style>

          <div className="rr-grid" style={{ display: 'grid', gap: 16 }}>
            {/* Form card */}
            <div className="rr-card" style={{ padding: 20 }}>
              {errorMsg && (
                <div style={{ marginBottom: 12, padding: 10, border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8 }}>❌ {errorMsg}</div>
              )}
              {okMsg && (
                <div style={{ marginBottom: 12, padding: 10, border: '1px solid #10B981', color: '#10B981', borderRadius: 8 }}>✅ {okMsg}</div>
              )}

              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="rr-label">Rol</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as RoleSlug)} className="rr-input">
                    {catalog.filter(r => r.slug !== 'usuario').map(r => (
                      <option key={r.slug} value={r.slug}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', }}>
                  <div>
                    <label className="rr-label">Nombre completo</label>
                    <input className="rr-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej. Juan Pérez" />
                  </div>
                  <div>
                    <label className="rr-label">Correo (no editable)</label>
                    <input className="rr-input" value={email} disabled />
                  </div>
                  <div>
                    <label className="rr-label">Celular</label>
                    <input className="rr-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej. +52 55 1234 5678" />
                  </div>
                </div>

                <fieldset className="rr-card" style={{ padding: 12 }}>
                  <legend className="rr-legend">Redes sociales</legend>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr' }}>
                    {(['instagram','tiktok','youtube','facebook','whatsapp'] as const).map(k => (
                      <label key={k} style={{ display: 'block' }}>
                        <span className="rr-label" style={{ textTransform: 'capitalize' }}>{k}</span>
                        <input className="rr-input" value={(socials as any)[k] || ''} onChange={(e) => setSocials(s => ({ ...s, [k]: e.target.value }))} placeholder={`Enlace o usuario de ${k}`} />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="rr-actions" style={{ marginTop: 8 }}>
                  <Button onClick={submit} disabled={createReq.isPending} style={{ minWidth: 180 }}>
                    {createReq.isPending ? 'Enviando…' : 'Enviar solicitud'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Aside: estado */}
            <aside className="rr-card" style={{ padding: 16 }}>
              <div style={{ marginBottom: 10, fontWeight: 700, opacity: .9 }}>🗂️ Mis solicitudes</div>
              {myReqs.length === 0 ? (
                <div style={{ opacity: .8 }}>Aún no has enviado solicitudes.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {myReqs.map((r) => (
                    <div key={r.id} className="rr-card" style={{ padding: 10, borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span className="rr-chip">{(r as any).role_slug || (r as any).role}</span>
                        <span className="rr-chip" style={{
                          borderColor: 'rgba(16,185,129,.4)',
                          color: (r as any).status === 'aprobado' ? '#10B981' : (r as any).status === 'rechazado' ? '#ef4444' : '#eab308'
                        }}>{(r as any).status}</span>
                      </div>
                      <div style={{ fontSize: 12, opacity: .7, marginTop: 6 }}>{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}


