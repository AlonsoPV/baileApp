import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { verifyPin, setPinVerified } from '@/lib/pin';
import { supabase } from '@/lib/supabase';

export default function PinLogin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const disabled = loading;

  const onVerify = async () => {
    setError(null);
    if (!user?.id) { setError('No auth'); return; }
    if (!/^\d{4}$/.test(pin)) { setError('El PIN debe tener 4 dígitos'); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles_user')
        .select('pin_hash')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      const hash = data?.pin_hash as string | undefined;
      if (!hash) { setError('Aún no has configurado un PIN'); return; }
      const ok = await verifyPin(pin, hash);
      if (!ok) { setError('PIN incorrecto'); return; }
      setPinVerified(user.id);
      navigate('/app/profile', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Error verificando PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0d10', color: '#e5e7eb' }}>
      <div style={{ width: 360, padding: 24, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}>
        <h1 style={{ margin: 0, marginBottom: 16 }}>Ingresar con PIN</h1>
        <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 16 }}>Introduce tu PIN de 4 dígitos para continuar.</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="\\d{4}"
          placeholder="PIN de 4 dígitos"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          onKeyDown={(e) => { if (e.key === 'Enter') onVerify(); }}
          style={{ width: '100%', padding: 12, borderRadius: 10, background: '#111418', border: '1px solid #222', color: '#e5e7eb', marginBottom: 12 }}
        />
        {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}
        <button onClick={onVerify} disabled={disabled} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: disabled ? '#374151' : '#2563EB', color: '#fff', fontWeight: 700 }}>
          {loading ? 'Verificando…' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}


