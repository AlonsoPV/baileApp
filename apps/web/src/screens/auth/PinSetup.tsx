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
        .update({ 
          pin_hash: hash,
          onboarding_complete: true // Marcar onboarding completo al configurar PIN
        })
        .eq('user_id', user.id);
      if (error) throw error;
      
      // Marcar PIN como verificado (recién creado, no necesita verificación inmediata)
      // En lugar de setNeedsPinVerify, marcamos como ya verificado
      const { setPinVerified } = await import('@/lib/pin');
      setPinVerified(user.id);
      
      // Redirigir directo a explore (onboarding completo)
      navigate('/explore', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Error al guardar PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#e5e7eb' }}>
      <div style={{ width: '100%', maxWidth: 460, padding: 32, border: '2px solid rgba(240, 147, 251, 0.3)', borderRadius: 20, background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
          <h1 style={{ margin: 0, marginBottom: 8, fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Paso 4: Configura tu PIN</h1>
          <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 0, fontSize: '0.95rem' }}>Crea un PIN de 4 dígitos para proteger tu sesión</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (!disabled) { onSave(); } }} autoComplete="off" noValidate>
          <label htmlFor="pin-setup" style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>PIN</label>
          <label htmlFor="pin-setup" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem' }}>Nuevo PIN</label>
          <input
            id="pin-setup"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\\d{4}"
            placeholder="●●●●"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            autoComplete="one-time-code"
            autoFocus
            style={{ width: '100%', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(240, 147, 251, 0.3)', color: '#e5e7eb', marginBottom: 16, fontSize: '1.1rem', textAlign: 'center', letterSpacing: 8 }}
          />
          
          <label htmlFor="pin-confirm" style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem' }}>Confirmar PIN</label>
          <input
            id="pin-confirm"
            name="pinConfirm"
            type="password"
            inputMode="numeric"
            pattern="\\d{4}"
            placeholder="●●●●"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            autoComplete="off"
            style={{ width: '100%', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(240, 147, 251, 0.3)', color: '#e5e7eb', marginBottom: 16, fontSize: '1.1rem', textAlign: 'center', letterSpacing: 8 }}
          />
          
          {error && <div style={{ color: '#ef4444', marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/onboarding/zonas')}
              disabled={disabled}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              ← Volver a Zonas
            </button>
            <button type="submit" disabled={disabled} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f093fb, #f5576c)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: disabled ? 'none' : '0 4px 16px rgba(240, 147, 251, 0.4)' }}>
              {saving ? '🔄 Guardando…' : '✅ Completar Setup'}
            </button>
          </div>
          
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem', opacity: 0.7 }}>
            Última configuración del perfil ✨
          </div>
        </form>
      </div>
    </div>
  );
}


