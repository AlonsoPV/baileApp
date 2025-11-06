import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { verifyPin, setPinVerified, hashPin } from '@/lib/pin';
import { supabase } from '@/lib/supabase';

// Cambia esto según tu proyecto
const USE_PASSWORD_LOGIN = true;           // true: email+password | false: OTP (passwordless)
const OTP_REDIRECT = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/pin`
  : undefined;

type Mode = 'login' | 'reset';

export default function PinLogin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('login');

  // --- LOGIN CON PIN ---
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // --- RESET: si NO está logueado ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // para login con password
  const [otpSent, setOtpSent] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  // --- RESET: si SÍ está logueado (o tras login/OTP) ---
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [resetErr, setResetErr] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Si volvemos de un magic link, Supabase ya habrá autenticado, así que
  // mostramos directamente la sección de "definir nuevo PIN".
  useEffect(() => {
    if (!authLoading && user && mode === 'reset') {
      // Si vienes de OTP, aquí ya estarías autenticado.
      setOtpSent(false);
      setAuthMsg(null);
    }
  }, [authLoading, user, mode]);

  const onVerifyPin = async () => {
    setPinError(null);
    if (!user?.id) { setPinError('Primero inicia sesión.'); return; }
    if (!/^\d{4}$/.test(pin)) { setPinError('El PIN debe tener 4 dígitos.'); return; }
    try {
      setPinLoading(true);
      const { data, error } = await supabase
        .from('profiles_user')
        .select('pin_hash')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      const hash = data?.pin_hash as string | undefined;
      if (!hash) { setPinError('Aún no has configurado un PIN. Usa Restablecer.'); return; }
      const ok = await verifyPin(pin, hash);
      if (!ok) { setPinError('PIN incorrecto'); return; }
      setPinVerified(user.id);
      
      // Redirigir a explore después de verificar PIN
      navigate('/explore', { replace: true });
    } catch (e: any) {
      setPinError(e?.message || 'Error verificando PIN');
    } finally {
      setPinLoading(false);
    }
  };

  // --- Autenticación para reset (si no hay sesión) ---
  const handlePasswordLogin = async () => {
    setAuthErr(null); setAuthMsg(null);
    if (!email) { setAuthErr('Ingresa tu correo.'); return; }
    if (USE_PASSWORD_LOGIN && !password) { setAuthErr('Ingresa tu contraseña.'); return; }
    try {
      setAuthBusy(true);
      if (USE_PASSWORD_LOGIN) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthMsg('Autenticado. Ahora define tu nuevo PIN abajo.');
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: OTP_REDIRECT }
        });
        if (error) throw error;
        setOtpSent(true);
        setAuthMsg('Te enviamos un enlace. Regrésate desde tu correo y aquí podrás crear tu nuevo PIN.');
      }
    } catch (e: any) {
      setAuthErr(e?.message || 'No se pudo autenticar');
    } finally {
      setAuthBusy(false);
    }
  };

  // --- Guardar nuevo PIN (logueado) ---
  const onSaveNewPin = async () => {
    setResetErr(null); setResetMsg(null);
    if (!user?.id) { setResetErr('Inicia sesión para continuar.'); return; }
    if (!/^\d{4}$/.test(newPin)) { setResetErr('El PIN debe tener 4 dígitos.'); return; }
    if (newPin !== confirmPin) { setResetErr('Los PIN no coinciden.'); return; }
    try {
      setResetBusy(true);
      const hash = await hashPin(newPin);
      const { error } = await supabase
        .from('profiles_user')
        .update({ pin_hash: hash })
        .eq('user_id', user.id);
      if (error) throw error;
      setPinVerified(user.id);
      setResetMsg('PIN actualizado.');
      // Limpia campos
      setNewPin(''); setConfirmPin('');
      // Redirige a la app
      navigate('/app/profile', { replace: true });
    } catch (e: any) {
      setResetErr(e?.message || 'Error al guardar PIN');
    } finally {
      setResetBusy(false);
    }
  };

  const container: React.CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0d10', color: '#e5e7eb' };
  const card: React.CSSProperties = { width: 380, maxWidth: '92vw', padding: 24, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, background: '#0f1318' };
  const input: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 10, background: '#111418', border: '1px solid #222', color: '#e5e7eb' };
  const btn: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' };
  const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', border: '1px solid #2a2f36', color: '#93c5fd' };
  const tabsWrap: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 };
  const tab = (active: boolean): React.CSSProperties => ({
    padding: '10px 12px', borderRadius: 10, border: '1px solid',
    borderColor: active ? '#2563EB' : '#2a2f36',
    background: active ? '#1e293b' : 'transparent',
    color: active ? '#dbeafe' : '#cbd5e1', cursor: 'pointer', textAlign: 'center', fontWeight: 700
  });

  return (
    <div style={container}>
      <div style={card}>
        <div style={tabsWrap}>
          <button style={tab(mode === 'login')} onClick={() => setMode('login')}>Ingresar con PIN</button>
          <button style={tab(mode === 'reset')} onClick={() => setMode('reset')}>Restablecer PIN</button>
        </div>

        {mode === 'login' && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (!pinLoading) onVerifyPin(); }}
            autoComplete="off"
            noValidate
          >
            <h1 style={{ margin: 0, marginBottom: 8 }}>Ingresar</h1>
            <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 16 }}>Introduce tu PIN de 4 dígitos para continuar.</p>
            <input
              id="pin-input"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\\d{4}"
              placeholder="PIN de 4 dígitos"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              autoComplete="one-time-code"
              autoFocus
              style={{ ...input, marginBottom: 12 }}
            />
            {pinError && <div style={{ color: '#ef4444', marginBottom: 12 }}>{pinError}</div>}
            <button type="submit" disabled={pinLoading || authLoading || !user} style={{ ...btn, background: pinLoading ? '#374151' : '#2563EB' }}>
              {pinLoading ? 'Verificando…' : 'Continuar'}
            </button>
            {!user && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14, opacity: 0.8 }}>
                Debes iniciar sesión o usar “Restablecer PIN” para autenticarse.
              </div>
            )}
          </form>
        )}

        {mode === 'reset' && (
          <>
            <h1 style={{ margin: 0, marginBottom: 8 }}>Restablecer PIN</h1>
            {!user && (
              <>
                <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 12 }}>
                  Autentícate para poder crear un nuevo PIN.
                </p>
                <input
                  type="email"
                  placeholder="Correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...input, marginBottom: 10 }}
                />
                {USE_PASSWORD_LOGIN && (
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...input, marginBottom: 10 }}
                  />
                )}
                {authErr && <div style={{ color: '#ef4444', marginBottom: 10 }}>{authErr}</div>}
                {authMsg && <div style={{ color: '#93c5fd', marginBottom: 10 }}>{authMsg}</div>}
                <button
                  onClick={handlePasswordLogin}
                  disabled={authBusy || (!email || (USE_PASSWORD_LOGIN && !password))}
                  style={{ ...btn, background: authBusy ? '#374151' : '#2563EB', marginBottom: 16 }}
                >
                  {USE_PASSWORD_LOGIN ? 'Iniciar sesión' : (otpSent ? 'Enlace enviado' : 'Enviar enlace (OTP)')}
                </button>
              </>
            )}

            {/* Sección para crear nuevo PIN (cuando ya hay sesión) */}
            {user && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (!resetBusy) onSaveNewPin(); }}
                autoComplete="off"
                noValidate
              >
                <p style={{ opacity: 0.8, marginTop: 0, marginBottom: 12 }}>
                  Define tu nuevo PIN (4 dígitos).
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  placeholder="Nuevo PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  style={{ ...input, marginBottom: 10 }}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  placeholder="Confirmar PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  style={{ ...input, marginBottom: 10 }}
                />
                {resetErr && <div style={{ color: '#ef4444', marginBottom: 10 }}>{resetErr}</div>}
                {resetMsg && <div style={{ color: '#10B981', marginBottom: 10 }}>{resetMsg}</div>}
                <button
                  type="submit"
                  disabled={resetBusy || !(newPin.length === 4 && confirmPin.length === 4)}
                  style={{ ...btn, background: resetBusy ? '#374151' : '#2563EB' }}
                >
                  {resetBusy ? 'Guardando…' : 'Guardar nuevo PIN'}
                </button>
              </form>
            )}
          </>
        )}

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'reset' : 'login')}
            style={{ ...btnGhost, width: 'auto', padding: '8px 10px' }}
          >
            {mode === 'login' ? '¿Olvidaste tu NIP? Restablecer' : '← Volver a Ingresar con PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
