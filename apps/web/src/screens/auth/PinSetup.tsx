import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { hashPin, setNeedsPinVerify, clearPinVerified } from '@/lib/pin';
import { supabase } from '@/lib/supabase';

export default function PinSetup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const disabled = saving;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [loading, user, navigate]);

  const onSave = async () => {
    setError(null);
    if (!user?.id) { setError('No auth'); return; }
    if (!/^\d{4}$/.test(pin)) { setError('El PIN debe tener 4 dígitos'); return; }
    if (pin !== confirm) { setError('Los PIN no coinciden'); return; }
    try {
      setSaving(true);
      const hash = await hashPin(pin);
      const { error } = await supabase
        .from('profiles_user')
        .update({ pin_hash: hash })
        .eq('user_id', user.id);
      if (error) throw error;
      // Obligar verificación inmediata del nuevo PIN
      setNeedsPinVerify(user.id);
      clearPinVerified(user.id);
      navigate('/auth/pin', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Error al guardar PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0d10', color: '#e5e7eb' }}>
      <div style={{ width: 360, padding: 24, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}>
        <h1 style={{ margin: 0, marginBottom: 16 }}>Configurar PIN</h1>
        <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 16 }}>Crea un PIN de 4 dígitos para proteger tu sesión.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (!disabled) { onSave(); } }} autoComplete="off" noValidate>
          <label htmlFor="pin-setup" style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>PIN</label>
          <input
            id="pin-setup"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\\d{4}"
            placeholder="PIN (4 dígitos)"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            autoComplete="one-time-code"
            autoFocus
            style={{ width: '100%', padding: 12, borderRadius: 10, background: '#111418', border: '1px solid #222', color: '#e5e7eb', marginBottom: 12 }}
          />
          <label htmlFor="pin-confirm" style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>Confirmar PIN</label>
          <input
            id="pin-confirm"
            name="pinConfirm"
            type="password"
            inputMode="numeric"
            pattern="\\d{4}"
            placeholder="Confirmar PIN"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            autoComplete="off"
            style={{ width: '100%', padding: 12, borderRadius: 10, background: '#111418', border: '1px solid #222', color: '#e5e7eb', marginBottom: 12 }}
          />
          {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={disabled} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: disabled ? '#374151' : '#2563EB', color: '#fff', fontWeight: 700 }}>
            {saving ? 'Guardando…' : 'Guardar PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}


