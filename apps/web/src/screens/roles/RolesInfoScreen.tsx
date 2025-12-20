import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from 'react-i18next';

export default function RolesInfoScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const roles = [
    {
      id: 'usuario',
      name: t('role_user_dancer'),
      icon: '👤',
      tag: t('role_user_tag'),
      highlight: false,
      isFree: true,
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
      bgGradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))',
      features: [
        t('role_user_feature_1'),
        t('role_user_feature_2'),
        t('role_user_feature_3'),
        t('role_user_feature_4')
      ]
    },
    {
      id: 'teacher',
      name: t('teacher'),
      icon: '👨‍🏫',
      tag: t('role_teacher_tag'),
      highlight: true,
      color: '#fb7185',
      gradient: 'linear-gradient(135deg, #fb7185, #f43f5e)',
      bgGradient: 'linear-gradient(135deg, rgba(251,113,133,0.15), rgba(244,63,94,0.08))',
      features: [
        t('role_teacher_feature_1'),
        t('role_teacher_feature_2'),
        t('role_teacher_feature_3'),
        t('role_teacher_feature_4'),
        t('role_teacher_feature_5')
      ]
    },
    {
      id: 'academy',
      name: t('academy'),
      icon: '🏛️',
      tag: t('role_academy_tag'),
      highlight: true,
      color: '#38bdf8',
      gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
      bgGradient: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(14,165,233,0.08))',
      features: [
        t('role_academy_feature_1'),
        t('role_academy_feature_2'),
        t('role_academy_feature_3'),
        t('role_academy_feature_4'),
        t('role_academy_feature_5')
      ]
    },
    {
      id: 'brand',
      name: t('brand'),
      icon: '🏷️',
      tag: t('role_brand_tag'),
      highlight: false,
      color: '#facc15',
      gradient: 'linear-gradient(135deg, #facc15, #eab308)',
      bgGradient: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(234,179,8,0.08))',
      features: [
        t('role_brand_feature_1'),
        t('role_brand_feature_2'),
        t('role_brand_feature_3')
      ]
    },
    {
      id: 'organizer',
      name: t('organizer'),
      icon: '🎪',
      tag: t('role_organizer_tag'),
      highlight: true,
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
      bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(147,51,234,0.08))',
      features: [
        t('role_organizer_feature_1'),
        t('role_organizer_feature_2'),
        t('role_organizer_feature_3'),
        t('role_organizer_feature_4')
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #0f1419, #050608)',
      color: '#fff',
      padding: '0.5rem 1rem 2rem 1rem',
      paddingTop: '0.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(240,147,251,0.15), transparent)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />

      <style>{`
        @media (max-width: 768px) {
          .roles-wrapper {
            padding: 1.5rem !important;
            border-radius: 20px !important;
            margin-top: 0.25rem !important;
          }
          .roles-title {
            font-size: 2rem !important;
          }
          .roles-subtitle {
            font-size: 1rem !important;
          }
          .role-card {
            padding: 1.5rem !important;
            border-radius: 20px !important;
          }
          .role-icon-container {
            width: 64px !important;
            height: 64px !important;
            font-size: 2rem !important;
          }
          .role-title {
            font-size: 1.25rem !important;
          }
        }
        @media (max-width: 480px) {
          .roles-wrapper {
            padding: 1.25rem !important;
            border-radius: 16px !important;
            margin-top: 0.25rem !important;
          }
          .roles-title {
            font-size: 1.75rem !important;
          }
          .role-card {
            padding: 1.25rem !important;
            border-radius: 16px !important;
          }
          .role-icon-container {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.75rem !important;
          }
        }
        /* Reducir espacio en móviles (Android/iOS) */
        @media (max-width: 768px) {
          body > div > div {
            padding-top: 0.25rem !important;
          }
        }
      `}</style>

      <main className="roles-wrapper" style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        borderRadius: '32px',
        padding: '3rem 2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="roles-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)'
              }}>
                🎭
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  marginBottom: '2px'
                }}>
                  {t('where_dance')}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 500
                }}>
                  {t('roles_system')}
                </div>
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(240, 147, 251, 0.3)',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(240, 147, 251, 0.2)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f5576c',
                boxShadow: '0 0 8px rgba(245, 87, 108, 0.8)',
                animation: 'pulse 2s infinite'
              }}></span>
              {t('roles_in_community')}
            </div>
          </motion.div>

          {/* Title and Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: '2rem' }}
          >
            <h1 className="roles-title" style={{
              margin: '0 0 1rem',
              fontSize: '3rem',
              letterSpacing: '-0.02em',
              color: '#fff',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #f093fb, #f5576c, #FFD166)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2
            }}>
              {t('join_community_title')}
            </h1>
            <p className="roles-subtitle" style={{
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '700px',
              fontSize: '1.1rem',
              marginBottom: '1.5rem',
              lineHeight: 1.7
            }}>
              {t('join_community_description_part1')} <span style={{ color: '#f5576c', fontWeight: '700' }}>{t('join_community_description_part2')}</span> {t('join_community_description_part3')}
            </p>
          </motion.div>

          {/* Promo Note */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '0.95rem',
              color: '#fff',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '1rem 1.5rem',
              marginBottom: '2.5rem',
              border: '1px solid rgba(251,191,36,0.3)',
              boxShadow: '0 8px 24px rgba(251,191,36,0.2)'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(251,191,36,0.4)'
            }}>
              🚀
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(239,68,68,0.2)',
                color: '#fecaca',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                display: 'inline-block',
                marginBottom: '6px',
                border: '1px solid rgba(239,68,68,0.4)'
              }}>
                {t('launch')}
              </div>
              <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '8px' }}>
                {t('launch_promo_text')}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#22c55e', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>💚</span>
                <span>{t('free_role_always_free')}</span>
              </div>
            </div>
          </motion.div>

          {/* Section Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '1.5rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{
              height: '2px',
              flex: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
            }} />
            <span>{t('available_roles')}</span>
            <div style={{
              height: '2px',
              flex: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
            }} />
          </motion.div>

          {/* Role Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            {roles.map((role, index) => (
              <motion.section
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="role-card"
                style={{
                  background: role.bgGradient,
                  borderRadius: '24px',
                  border: `1px solid rgba(255, 255, 255, 0.15)`,
                  padding: '2rem',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `rgba(255, 255, 255, 0.3)`;
                  e.currentTarget.style.boxShadow = `0 16px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px ${role.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                }}
              >
                {/* Decorative gradient line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: role.gradient,
                  opacity: 0.9
                }} />

                {/* Icon and Title */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '1rem'
                }}>
                  <div className="role-icon-container" style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    background: role.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    boxShadow: `0 8px 24px ${role.color}40`,
                    flexShrink: 0
                  }}>
                    {role.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="role-title" style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#fff',
                      marginBottom: '4px',
                      lineHeight: 1.2
                    }}>
                      {role.name}
                    </div>
                    {role.highlight && (
                      <div style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(251,191,36,0.4)',
                        color: '#fbbf24',
                        background: 'rgba(251,191,36,0.15)',
                        display: 'inline-block',
                        fontWeight: 600,
                        marginTop: '4px'
                      }}>
                        ⭐ {t('featured')}
                      </div>
                    )}
                    {(role as any).isFree && (
                      <div style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(34,197,94,0.5)',
                        color: '#22c55e',
                        background: 'rgba(34,197,94,0.2)',
                        display: 'inline-block',
                        fontWeight: 700,
                        marginTop: '4px',
                        marginLeft: role.highlight ? '6px' : '0',
                        boxShadow: '0 0 12px rgba(34,197,94,0.3)'
                      }}>
                        💚 {t('always_free')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tag */}
                <div style={{
                  fontSize: '13px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  background: 'rgba(255,255,255,0.05)',
                  marginBottom: '1.25rem',
                  fontWeight: 500,
                  lineHeight: 1.5
                }}>
                  {role.tag}
                </div>

                {/* Features */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: role.color,
                    boxShadow: `0 0 8px ${role.color}`
                  }}></span>
                  {t('you_can')}:
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {role.features.map((feature, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 + idx * 0.05 }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        lineHeight: 1.6
                      }}
                    >
                      <span style={{
                        fontSize: '10px',
                        lineHeight: '1.6',
                        color: role.color,
                        marginTop: '4px',
                        fontWeight: 700
                      }}>✓</span>
                      <span style={{ flex: 1 }}>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Botones según estado de autenticación */}
                {user && role.id !== 'usuario' && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/roles/request?role=${role.id}`);
                    }}
                    style={{
                      width: '100%',
                      marginTop: '1.5rem',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: role.gradient,
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: `0 6px 20px ${role.color}40`,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${role.color}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 6px 20px ${role.color}40`;
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>📝</span>
                    <span>{t('request')}</span>
                  </motion.button>
                )}

                {!user && role.id === 'usuario' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '1.5rem'
                  }}>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/auth/login');
                      }}
                      style={{
                        padding: '0.875rem 1.5rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: role.gradient,
                        color: '#ffffff',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: `0 6px 20px ${role.color}40`,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${role.color}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 6px 20px ${role.color}40`;
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>🚀</span>
                    <span>{t('join')}</span>
                  </motion.button>
                  </div>
                )}
              </motion.section>
            ))}
          </div>

          {/* CTA Banner - Solo visible si el usuario NO está logueado */}
          {!user && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              style={{
                marginTop: '2rem',
                padding: '2rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
                border: '1px solid rgba(59,130,246,0.3)',
                boxShadow: '0 12px 40px rgba(59,130,246,0.2)',
                backdropFilter: 'blur(10px)',
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
                background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                opacity: 0.9
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
                  flexShrink: 0
                }}>
                  🎉
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    margin: '0 0 0.5rem',
                    lineHeight: 1.2
                  }}>
                    {t('would_you_like_to_join_community')}
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    {t('we_can_help_create_profile')}
                  </p>
                </div>
              </div>
              <Link
                to="/app/roles/request"
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f5576c, #f093fb)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(245, 87, 108, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 87, 108, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 87, 108, 0.4)';
                }}
              >
                <span>🚀</span>
                <span>{t('join_community')}</span>
              </Link>
            </motion.section>
          )}

          {/* Contact Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              margin: 0,
              lineHeight: 1.6
            }}>
              {t('have_questions_about_role')}
              <a
                href="mailto:alpeva96@gmail.com?subject=Contacto%20Donde%20Bailar%20MX"
                style={{
                  color: '#f5576c',
                  fontWeight: 700,
                  textDecoration: 'none',
                  borderBottom: '2px solid rgba(245, 87, 108, 0.4)',
                  marginLeft: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = '#f5576c';
                  e.currentTarget.style.color = '#fb7185';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(245, 87, 108, 0.4)';
                  e.currentTarget.style.color = '#f5576c';
                }}
              >
                {t('write_us_we_help')}
              </a>
            </p>

            {/* WhatsApp Support */}
            <a
              href="https://wa.me/525511981149"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                color: '#22c55e',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                transition: 'all 0.2s',
                alignSelf: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.15)';
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.1)';
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="#22c55e" aria-hidden="true">
                <path d="M16.04 4C9.4 4 4 9.36 4 15.92c0 2.8.92 5.28 2.52 7.32L4 28l4.92-2.48A11.83 11.83 0 0 0 16.04 28C22.68 28 28 22.64 28 16.08 28 9.36 22.68 4 16.04 4zm6.84 16.76c-.28.8-1.64 1.52-2.3 1.6-.6.12-1.38.16-2.24-.14-.52-.18-1.18-.38-2.04-.82-3.6-1.94-5.92-5.3-6.1-5.54-.18-.24-1.46-1.94-1.46-3.7 0-1.76.92-2.62 1.24-2.98.32-.34.7-.44.94-.44h.68c.22 0 .52-.08.82.62.3.74 1.04 2.54 1.12 2.72.08.18.12.4.02.64-.1.22-.16.36-.3.56-.16.18-.34.4-.48.54-.16.16-.32.34-.14.64.18.3.8 1.3 1.7 2.12 1.18 1.06 2.16 1.4 2.5 1.56.34.16.54.14.74-.08.22-.24.84-.94 1.06-1.26.22-.32.46-.26.78-.16.32.12 2.02.96 2.36 1.14.34.18.56.26.64.4.08.12.08.78-.2 1.58z"/>
              </svg>
              <span>55 11 98 11 49</span>
            </a>
          </motion.div>

          {/* Back Button */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '0.875rem 2rem',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.95 }}
            >
              ← {t('back')}
            </motion.button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
