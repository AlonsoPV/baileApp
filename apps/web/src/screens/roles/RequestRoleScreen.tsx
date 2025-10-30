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
    <div style={{ maxWidth: 560, margin: '24px auto', padding: 16 }}>
      <h1>Solicitar rol</h1>
      {errorMsg && (
        <div style={{ marginTop: 12, padding: 10, border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8 }}>
          ❌ {errorMsg}
        </div>
      )}
      {okMsg && (
        <div style={{ marginTop: 12, padding: 10, border: '1px solid #10B981', color: '#10B981', borderRadius: 8 }}>
          ✅ {okMsg}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value as RoleSlug)} style={{ width: '100%' }}>
            {catalog.filter(r => r.slug !== 'usuario').map(r => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </label>

        <label>Nombre completo<input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%' }} /></label>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} disabled /></label>
        <label>Celular<input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%' }} /></label>

        <fieldset style={{ border: '1px solid #333', padding: 12 }}>
          <legend>Redes sociales</legend>
          {(['instagram','tiktok','youtube','facebook','whatsapp'] as const).map(k => (
            <label key={k} style={{ display: 'block', marginBottom: 8 }}>
              {k}<input value={(socials as any)[k] || ''} onChange={(e) => setSocials(s => ({ ...s, [k]: e.target.value }))} style={{ width: '100%' }} />
            </label>
          ))}
        </fieldset>

        <Button onClick={submit} disabled={createReq.isPending}>{createReq.isPending ? 'Enviando…' : 'Enviar solicitud'}</Button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Mis solicitudes</h2>
        <ul>
          {myReqs.map(r => (
            <li key={r.id}>{r.role_slug} — {r.status} — {new Date(r.created_at).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


