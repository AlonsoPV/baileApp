// File: src/pages/challenges/ChallengesList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChallengesList } from '../../hooks/useChallenges';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

// ⬇️ Estilos compartidos aplicados
import '../../styles/event-public.css';
import RitmosChips from '../../components/RitmosChips';

export default function ChallengesList() {
  const formatDateTime = React.useCallback((value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }, []);

  const nav = useNavigate();
  const { data, isLoading, error } = useChallengesList();
  const { showToast } = useToast();
  const [canCreate, setCanCreate] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCanCreate(false); return; }
      const { data: roles, error: rerr } = await supabase
        .from('user_roles')
        .select('role_slug')
        .eq('user_id', user.id);
      if (rerr) { showToast('No se pudieron cargar roles', 'error'); return; }
      const slugs = (roles || []).map((r: any) => r.role_slug);
      setCanCreate(slugs.includes('usuario') || slugs.includes('superadmin'));
    })();
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="cc-page" style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at top, #0f1419, #050608)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(240,147,251,0.2)',
            borderTop: '4px solid #f093fb',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cargando challenges...</div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cc-page" style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at top, #0f1419, #050608)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#fff'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '20px',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>Error al cargar</div>
          <div style={{ fontSize: '0.95rem', opacity: 0.8 }}>{(error as any)?.message || 'Ocurrió un error inesperado'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-page" style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top, #0f1419, #050608)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      /* Safe areas support */
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(240,147,251,0.12), transparent)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(245,87,108,0.1), transparent)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(30,136,229,0.08), transparent)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <style>{`
        .challenges-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin-bottom: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
        }
        
        .challenges-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          opacity: 0.9;
        }
        
        .challenges-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 40%, #FFD166 80%, #fff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }
        
        .challenges-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: rgba(255,255,255,0.85);
          margin: 0 0 1.5rem;
          line-height: 1.6;
          font-weight: 400;
        }
        
        .challenge-card {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .challenge-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.3) 50%, rgba(0,0,0,.9) 100%);
          z-index: 1;
          transition: opacity 0.3s;
        }
        
        .challenge-card:hover::before {
          opacity: 0.95;
        }
        
        .challenge-card-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .cc-page { padding-top: 64px; }
          .challenges-hero { 
            padding: 2rem 1.5rem !important; 
            border-radius: 24px !important;
          }
          .challenges-title { font-size: 2.25rem !important; }
          .challenges-subtitle { font-size: 1rem !important; }
          .challenge-card { border-radius: 20px !important; }
        }
        
        @media (max-width: 480px) {
          .challenges-hero { 
            padding: 1.5rem 1rem !important; 
            border-radius: 20px !important;
          }
          .challenges-title { font-size: 1.875rem !important; }
          .challenges-subtitle { font-size: 0.95rem !important; }
          .challenge-card { border-radius: 16px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>
        {/* Hero de bienvenida mejorado */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="challenges-hero"
        >
          {/* Efectos decorativos */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(240,147,251,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(30,136,229,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ 
                width: 96, 
                height: 96, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                margin: '0 auto 1.5rem',
                boxShadow: '0 16px 40px rgba(240,147,251,0.4)',
                border: '3px solid rgba(240,147,251,0.3)'
              }}
            >
              🏆
            </motion.div>
            
            <h1 className="challenges-title">Challenges</h1>
            <p className="challenges-subtitle">
              Participa con tu video, compite y vota por tus favoritos. 
              <br />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Demuestra tu talento y gana reconocimiento en la comunidad.</span>
            </p>
            
            {canCreate && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav('/challenges/new')} 
                style={{
                  padding: '1rem 2rem',
                  borderRadius: 999,
                  border: '2px solid rgba(240,147,251,0.4)',
                  background: 'linear-gradient(135deg, rgba(240,147,251,.95), rgba(245,87,108,.95))',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 12px 32px rgba(240,147,251,.4), 0 4px 16px rgba(0,0,0,.3)',
                  transition: 'all 0.3s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>➕</span>
                <span>Crear Challenge</span>
              </motion.button>
            )}
          </div>
        </motion.section>

        {/* Lista de challenges */}
        {!data || data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: 32,
              padding: '4rem 2rem',
              textAlign: 'center',
              border: '2px dashed rgba(255,255,255,0.15)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #f093fb, #f5576c)',
              opacity: 0.9
            }} />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              style={{ fontSize: '5rem', marginBottom: '1.5rem', display: 'inline-block' }}
            >
              🚀
            </motion.div>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
              Aún no hay retos publicados
            </div>
            <div style={{ fontSize: '1rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)' }}>
              Sé el primero en crear un challenge y anima a la comunidad a participar
            </div>
            {canCreate && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav('/challenges/new')} 
                style={{
                  padding: '1rem 2rem',
                  borderRadius: 999,
                  border: '2px solid rgba(240,147,251,0.4)',
                  background: 'linear-gradient(135deg, rgba(240,147,251,.95), rgba(245,87,108,.95))',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 10px 28px rgba(240,147,251,.35)',
                  transition: 'all 0.3s'
                }}
              >
                Crear el primero
              </motion.button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Header de la lista */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  margin: '0 0 0.5rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span>📋</span>
                  <span>Todos los Challenges</span>
                </h2>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  margin: 0
                }}>
                  {data.length} {data.length === 1 ? 'challenge disponible' : 'challenges disponibles'}
                </p>
              </div>
            </motion.div>

            {/* Grid de challenges */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {data.map((c, index) => (
                <motion.article
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="challenge-card"
                  style={{
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 16px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(240,147,251,.1) inset',
                    backgroundImage: c.cover_image_url
                      ? `linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,.6) 70%, rgba(0,0,0,.85) 100%), url(${c.cover_image_url})`
                      : 'linear-gradient(135deg, rgba(240,147,251,.2), rgba(245,87,108,.2), rgba(30,136,229,.2))',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#fff',
                  }}
                  onClick={() => nav(`/challenges/${c.id}`)}
                >
                  {/* Status badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 3,
                    padding: '0.5rem 1rem',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background:
                      c.status === 'open'
                        ? 'rgba(16,185,129,.35)'
                        : c.status === 'draft'
                        ? 'rgba(255,255,255,.2)'
                        : 'rgba(59,130,246,.3)',
                    border: `1px solid ${
                      c.status === 'open'
                        ? 'rgba(16,185,129,.5)'
                        : c.status === 'draft'
                        ? 'rgba(255,255,255,.3)'
                        : 'rgba(59,130,246,.5)'
                    }`,
                    boxShadow: '0 4px 12px rgba(0,0,0,.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {c.status === 'open' ? '🟢 Abierto' : c.status === 'draft' ? '📝 Borrador' : '🔵 Cerrado'}
                  </div>

                  <div className="challenge-card-content">
                    {c.ritmo_slug && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <RitmosChips selected={[String(c.ritmo_slug)]} onChange={() => {}} readOnly />
                      </div>
                    )}
                    
                    <h3 style={{ 
                      fontWeight: 900, 
                      fontSize: '1.5rem',
                      lineHeight: 1.2,
                      marginBottom: '0.75rem',
                      textShadow: '0 2px 8px rgba(0,0,0,.6), 0 4px 16px rgba(0,0,0,.4)',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))'
                    }}>
                      {c.title}
                    </h3>
                    
                    {c.description && (
                      <p className="cc-two-lines" style={{ 
                        opacity: .92, 
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                        marginBottom: '1rem',
                        textShadow: '0 1px 4px rgba(0,0,0,.6)'
                      }}>
                        {c.description}
                      </p>
                    )}

                    {/* Fechas */}
                    {(formatDateTime(c.submission_deadline) || formatDateTime(c.voting_deadline)) && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                        {formatDateTime(c.submission_deadline) && (
                          <div style={{
                            padding: '0.5rem 0.875rem',
                            borderRadius: 12,
                            background: 'rgba(59,130,246,.24)',
                            border: '1px solid rgba(59,130,246,.4)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <span>📮</span>
                            <span>Envíos: {formatDateTime(c.submission_deadline)}</span>
                          </div>
                        )}
                        {formatDateTime(c.voting_deadline) && (
                          <div style={{
                            padding: '0.5rem 0.875rem',
                            borderRadius: 12,
                            background: 'rgba(245,158,11,.24)',
                            border: '1px solid rgba(245,158,11,.4)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <span>🗳️</span>
                            <span>Votos: {formatDateTime(c.voting_deadline)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botón de acción */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        nav(`/challenges/${c.id}`);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 999,
                        border: '2px solid rgba(240,147,251,0.5)',
                        background: 'linear-gradient(135deg, rgba(240,147,251,.9), rgba(245,87,108,.9))',
                        color: '#fff',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(240,147,251,.4)',
                        transition: 'all 0.2s',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>Ver Challenge</span>
                      <span>→</span>
                    </motion.button>
                  </div>
                </motion.article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
