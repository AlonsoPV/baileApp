import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { useCreateRoleRequest, useRolesCatalog, useMyRoleRequests } from '@/hooks/useRoles';
import type { RoleSlug, RoleRequestStatus } from '@/types/roles';
import { useAuth } from '@/contexts/AuthProvider';
// Estilos compartidos (botones/vidrio)
import '@/styles/event-public.css';

export default function RequestRoleScreen() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: catalog = [] } = useRolesCatalog();
  const { data: myReqs = [] } = useMyRoleRequests();
  const createReq = useCreateRoleRequest();

  const initialRole = (sp.get('role') as RoleSlug) || 'organizador';
  const [role, setRole] = useState<RoleSlug>(initialRole);
  // Limitar el selector al rol que llega por query (si aplica)
  const roleFromQuery = sp.get('role') as RoleSlug | null;
  const enforceSingleRole = !!roleFromQuery && ['organizador','academia','maestro','marca'].includes(roleFromQuery);
  const rolesToShow = enforceSingleRole
    ? catalog.filter(r => r.slug === roleFromQuery)
    : catalog.filter(r => r.slug !== 'usuario');
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
      setOkMsg('Solicitud enviada exitosamente. Te notificaremos cuando sea revisada.');
      setFullName(''); setEmail(user?.email ?? ''); setPhone('');
      setSocials({ instagram: '', tiktok: '', youtube: '', facebook: '', whatsapp: '' });
      // NO redirigir, quedarse en la pantalla para ver el estado
    } catch (e: any) {
      console.error('[RequestRoleScreen] Insert error:', e);
      setErrorMsg(e?.message || 'No se pudo enviar la solicitud');
    }
  };

  // Obtener la solicitud actual para este rol (si existe)
  const currentRequest = myReqs.find((r: any) =>
    (r.role_slug === role || r.role === role)
  );

  // Normalizar el status que viene de la base (puede venir en español o en inglés)
  const normalizedStatus: RoleRequestStatus | undefined = React.useMemo(() => {
    const raw = (currentRequest as any)?.status;
    if (!raw) return undefined;
    const value = String(raw).toLowerCase();
    if (value === 'pendiente') return 'pending';
    if (value === 'aprobado') return 'approved';
    if (value === 'rechazado') return 'rejected';
    if (value === 'pending' || value === 'approved' || value === 'rejected' || value === 'needs_review') {
      return value as RoleRequestStatus;
    }
    return undefined;
  }, [currentRequest]);

  // Determinar el paso actual según el estado de la solicitud
  const getCurrentStep = () => {
    if (!currentRequest) return 1; // Sin solicitud = Paso 1 (Datos)
    if (!normalizedStatus) return 1;
    if (normalizedStatus === 'pending' || normalizedStatus === 'needs_review') return 2; // En revisión
    if (normalizedStatus === 'approved') return 3; // Aprobado
    if (normalizedStatus === 'rejected') return 1; // Rechazado, puede volver a aplicar
    return 1;
  };

  const currentStep = getCurrentStep();

  const getStepColor = (step: number) => {
    if (step < currentStep) return 'rgba(76, 175, 80, 0.3)'; // Completado (verde)
    if (step === currentStep) return 'rgba(229, 57, 53, 0.3)'; // Actual (naranja-rojo)
    return 'rgba(255, 255, 255, 0.1)'; // Pendiente (gris)
  };

  const getStepBorderColor = (step: number) => {
    if (step < currentStep) return 'rgba(76, 175, 80, 0.6)';
    if (step === currentStep) return 'rgba(229, 57, 53, 0.6)';
    return 'rgba(255, 255, 255, 0.2)';
  };

  return (
    <div className="cc-page" style={{ padding: '24px 16px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
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
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎫</div>
          <h1 style={{
            margin: 0,
            fontSize: '1.875rem',
            fontWeight: 800,
            background: 'linear-gradient(90deg,#f093fb,#FFD166)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Solicitar rol</h1>
          <p style={{ opacity: 0.85, marginTop: 8 }}>
            {currentStep === 1 && 'Completa tus datos para que un admin revise tu solicitud.'}
            {currentStep === 2 && 'Tu solicitud está en revisión. Te notificaremos pronto.'}
            {currentStep === 3 && '¡Felicidades! Tu solicitud ha sido aprobada.'}
          </p>
          <div style={{ display:'flex', gap: 12, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Paso 1: Datos */}
            <div style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: getStepColor(1),
              border: `2px solid ${getStepBorderColor(1)}`,
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s'
            }}>
              {currentStep > 1 ? '✅' : '1️⃣'} Datos
            </div>

            {/* Paso 2: Revisión */}
            <div style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: getStepColor(2),
              border: `2px solid ${getStepBorderColor(2)}`,
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s'
            }}>
              {currentStep > 2 ? '✅' : currentStep === 2 ? '⏳' : '2️⃣'} Revisión
            </div>

            {/* Paso 3: Aprobación */}
            <div style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: getStepColor(3),
              border: `2px solid ${getStepBorderColor(3)}`,
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s'
            }}>
              {currentStep === 3 ? '🎉' : '3️⃣'} Aprobación
            </div>
          </div>
        </div>

        {/* Grid layout: form + aside */}
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', alignItems: 'start' }}>
          <style>{`
            @media (min-width: 860px) {
              .rr-grid { grid-template-columns: 1.2fr 0.8fr !important; }
              .rr-actions { display: flex; justify-content: flex-end; }
            }
            .rr-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.35); backdrop-filter: blur(10px); }
            .rr-input { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #e5e7eb; outline: none; }
            .rr-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }
            .rr-label { display:block; font-size: 0.9rem; margin-bottom: 6px; opacity: .85 }
            .rr-legend { padding: 0 8px; opacity: .8 }
            .rr-chip { border:1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.25); border-radius: 999px; padding: 6px 10px; font-size: .8rem }
            .rr-note { font-size:.9rem; opacity:.85; }
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
                  <label className="rr-label">Rol al que aplicas</label>
                  {enforceSingleRole ? (
                    // Mostrar rol de manera visual y no editable
                    <div style={{
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.15) 0%, rgba(251, 140, 0, 0.15) 100%)',
                      border: '2px solid rgba(229, 57, 53, 0.3)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Icono según el rol */}
                      <span style={{ fontSize: '2rem' }}>
                        {role === 'organizador' && '🎤'}
                        {role === 'academia' && '🎓'}
                        {role === 'maestro' && '👨‍🏫'}
                        {role === 'marca' && '🏷️'}
                      </span>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '700',
                          color: '#fff',
                          marginBottom: '4px'
                        }}>
                          {rolesToShow[0]?.name || role}
                        </div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          opacity: 0.8,
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          Este es el rol que estás solicitando
                        </div>
                      </div>

                      {/* Badge decorativo */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%'
                      }} />
                    </div>
                  ) : (
                    // Select normal si no viene de query
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as RoleSlug)}
                      className="rr-input"
                    >
                      {rolesToShow.map(r => (
                        <option key={r.slug} value={r.slug}>{r.name}</option>
                      ))}
                    </select>
                  )}
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
                  <button 
                    onClick={submit} 
                    disabled={
                      createReq.isPending || 
                      normalizedStatus === 'pending' ||
                      normalizedStatus === 'needs_review' ||
                      normalizedStatus === 'approved'
                    }
                    className="cc-btn cc-btn--primary" 
                    style={{ 
                      minWidth: 200, 
                      fontWeight: 800,
                      background: currentStep === 3 
                        ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
                        : currentStep === 2 
                        ? 'linear-gradient(135deg, #FFA726, #FB8C00)' 
                        : 'linear-gradient(135deg, #E53935, #FB8C00)',
                      opacity: (
                        createReq.isPending || 
                        normalizedStatus === 'pending' ||
                        normalizedStatus === 'needs_review' ||
                        normalizedStatus === 'approved'
                      ) ? 0.6 : 1,
                      cursor: (
                        createReq.isPending || 
                        normalizedStatus === 'pending' ||
                        normalizedStatus === 'needs_review' ||
                        normalizedStatus === 'approved'
                      ) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {createReq.isPending ? '⏳ Enviando…' : 
                     currentStep === 3 ? '✅ Solicitud Aprobada' :
                     currentStep === 2 ? '⏳ En Revisión' :
                     normalizedStatus === 'rejected' ? '🔄 Volver a Solicitar' :
                     '📤 Enviar Solicitud'}
                  </button>
                </div>
                <div className="rr-note" style={{ marginTop: 6 }}>
                  {currentStep === 1 && 'Tiempo estimado de revisión: 24–48h hábiles.'}
                  {currentStep === 2 && 'Tu solicitud está siendo revisada por nuestro equipo.'}
                  {currentStep === 3 && 'Ya puedes acceder a las funcionalidades de este rol.'}
                  {normalizedStatus === 'rejected' && '❌ Tu solicitud fue rechazada. Puedes volver a intentarlo.'}
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
              <div style={{ marginTop: 12, opacity: .85, fontSize: '.9rem' }}>
                ¿Dudas? Escríbenos a <a href="mailto:soporte@baile.app" className="cc-soft-link">soporte@baile.app</a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}


