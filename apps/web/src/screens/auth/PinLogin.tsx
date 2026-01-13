import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { verifyPin, setPinVerified, hashPin } from '@/lib/pin';
import { supabase } from '@/lib/supabase';
import { getRedirectUrl } from '@/utils/authRedirect';

// Cambia esto según tu proyecto
const USE_PASSWORD_LOGIN = true;           // true: email+password | false: OTP (passwordless)
const OTP_REDIRECT = typeof window !== 'undefined' ? getRedirectUrl('/auth/pin') : undefined;

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

  const container: React.CSSProperties = {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #1f2937 100%)',
    color: '#e5e7eb',
    padding: '1.5rem'
  };

  const card: React.CSSProperties = {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    padding: '2.25rem',
    border: '2px solid rgba(96, 165, 250, 0.22)',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.6)'
  };

  const headerBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.5rem',
    padding: '.5rem .9rem',
    borderRadius: 999,
    background: 'rgba(96,165,250,0.18)',
    border: '1px solid rgba(96,165,250,0.35)',
    color: '#bfdbfe',
    fontWeight: 600,
    fontSize: '.85rem'
  };

  const input: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(96,165,250,0.25)',
    color: '#e5e7eb',
    fontSize: '1rem',
    transition: 'all .2s'
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 14px 35px rgba(59,130,246,0.35)',
    transition: 'transform .2s, box-shadow .2s'
  };

  const btnGhost: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'transparent',
    color: '#cbd5f5',
    fontWeight: 600,
    cursor: 'pointer'
  };

  const tabsWrap: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 24
  };

  const tab = (active: boolean): React.CSSProperties => ({
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid',
    borderColor: active ? 'rgba(94, 234, 212, 0.55)' : 'rgba(148, 163, 184, 0.25)',
    background: active ? 'linear-gradient(135deg, rgba(94,234,212,0.25), rgba(45,212,191,0.35))' : 'rgba(15, 23, 42, 0.45)',
    color: active ? '#e0f2fe' : '#cbd5f5',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 700,
    transition: 'all .2s'
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    fontWeight: 600,
    fontSize: '.9rem',
    color: 'rgba(226,232,240,0.9)'
  };

  return (
    <div style={container}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={headerBadge}>
            <span style={{ fontSize: '1.1rem' }}>🔐</span>
            Acceso seguro con PIN
          </div>
          <h1
            style={{
              margin: '18px 0 6px',
              fontSize: '1.9rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #60a5fa, #38bdf8, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Verifica tu identidad
          </h1>
          <p style={{ margin: 0, opacity: 0.78, fontSize: '.95rem' }}>
            Usa tu PIN de 4 dígitos o restablécelo para mantener protegida tu sesión.
          </p>
        </div>

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
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: '1.22rem', fontWeight: 700 }}>Introduce tu PIN</h2>
            <p style={{ opacity: 0.75, marginTop: 0, marginBottom: 20 }}>
              Solo necesitas tu PIN de 4 dígitos para acceder a tu cuenta.
            </p>
            <input
              id="pin-input"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\\d{4}"
              placeholder="●●●●"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              autoComplete="one-time-code"
              autoFocus
              style={{
                ...input,
                marginBottom: 16,
                textAlign: 'center',
                letterSpacing: '0.65rem',
                fontSize: '1.3rem',
                fontWeight: 700
              }}
            />
            {pinError && (
              <div style={{
                color: '#fca5a5',
                marginBottom: 14,
                padding: '10px 12px',
                background: 'rgba(248,113,113,0.12)',
                borderRadius: 12,
                border: '1px solid rgba(248,113,113,0.28)'
              }}>
                {pinError}
              </div>
            )}
            <button
              type="submit"
              disabled={pinLoading || authLoading || !user}
              style={{
                ...btnPrimary,
                opacity: (pinLoading || authLoading || !user) ? 0.6 : 1,
                cursor: (pinLoading || authLoading || !user) ? 'not-allowed' : 'pointer',
                boxShadow: (pinLoading || authLoading || !user) ? 'none' : btnPrimary.boxShadow
              }}
            >
              {pinLoading ? 'Verificando…' : 'Ingresar ahora'}
            </button>
            {!user && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14, opacity: 0.75 }}>
                Debes iniciar sesión o usar “Restablecer PIN” para autenticarse.
              </div>
            )}
          </form>
        )}

        {mode === 'reset' && (
          <>
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: '1.22rem', fontWeight: 700 }}>Restablecer PIN</h2>
            {!user && (
              <>
                <p style={{ opacity: 0.75, marginTop: 0, marginBottom: 18 }}>
                  Autentícate para poder crear un nuevo PIN.
                </p>
                <label style={labelStyle} htmlFor="reset-email">Correo electrónico</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...input, marginBottom: 14 }}
                />
                {USE_PASSWORD_LOGIN && (
                  <>
                    <label style={labelStyle} htmlFor="reset-password">Contraseña</label>
                    <input
                      id="reset-password"
                      type="password"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...input, marginBottom: 14 }}
                    />
                  </>
                )}
                {authErr && (
                  <div style={{
                    color: '#fca5a5',
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: 'rgba(248,113,113,0.12)',
                    borderRadius: 12,
                    border: '1px solid rgba(248,113,113,0.28)'
                  }}>
                    {authErr}
                  </div>
                )}
                {authMsg && (
                  <div style={{
                    color: '#bae6fd',
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: 'rgba(59,130,246,0.18)',
                    borderRadius: 12,
                    border: '1px solid rgba(59,130,246,0.32)'
                  }}>
                    {authMsg}
                  </div>
                )}
                <button
                  onClick={handlePasswordLogin}
                  disabled={authBusy || (!email || (USE_PASSWORD_LOGIN && !password))}
                  style={{
                    ...btnPrimary,
                    opacity: authBusy ? 0.6 : 1,
                    cursor: authBusy ? 'not-allowed' : 'pointer'
                  }}
                >
                  {USE_PASSWORD_LOGIN ? 'Iniciar sesión' : (otpSent ? 'Enlace enviado' : 'Enviar enlace (OTP)')}
                </button>
              </>
            )}

            {user && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (!resetBusy) onSaveNewPin(); }}
                autoComplete="off"
                noValidate
              >
                <p style={{ opacity: 0.75, marginTop: 0, marginBottom: 18 }}>
                  Define tu nuevo PIN de 4 dígitos.
                </p>
                <label style={labelStyle} htmlFor="new-pin">Nuevo PIN</label>
                <input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  placeholder="●●●●"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  style={{
                    ...input,
                    marginBottom: 14,
                    textAlign: 'center',
                    letterSpacing: '0.6rem',
                    fontSize: '1.2rem',
                    fontWeight: 700
                  }}
                />
                <label style={labelStyle} htmlFor="confirm-pin">Confirmar PIN</label>
                <input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  placeholder="Confirmar PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  style={{
                    ...input,
                    marginBottom: 14,
                    textAlign: 'center',
                    letterSpacing: '0.6rem',
                    fontSize: '1.2rem',
                    fontWeight: 700
                  }}
                />
                {resetErr && (
                  <div style={{
                    color: '#fca5a5',
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: 'rgba(248,113,113,0.12)',
                    borderRadius: 12,
                    border: '1px solid rgba(248,113,113,0.28)'
                  }}>
                    {resetErr}
                  </div>
                )}
                {resetMsg && (
                  <div style={{
                    color: '#8ef5d1',
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: 'rgba(16,185,129,0.15)',
                    borderRadius: 12,
                    border: '1px solid rgba(16,185,129,0.32)'
                  }}>
                    {resetMsg}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resetBusy || !(newPin.length === 4 && confirmPin.length === 4)}
                  style={{
                    ...btnPrimary,
                    opacity: (resetBusy || !(newPin.length === 4 && confirmPin.length === 4)) ? 0.6 : 1,
                    cursor: (resetBusy || !(newPin.length === 4 && confirmPin.length === 4)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resetBusy ? 'Guardando…' : 'Guardar nuevo PIN'}
                </button>
              </form>
            )}
          </>
        )}

        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'reset' : 'login')}
            style={btnGhost}
          >
            {mode === 'login' ? '¿Olvidaste tu PIN? Restablecer' : '← Volver a Ingresar con PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
